import { Worker, Job } from 'bullmq';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { mlClient } from '../../services/mlClient';
import { emitJobProgress, emitJobComplete, emitJobError } from '../../lib/socket';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

interface TrainingJobData {
  jobId: string;
  projectId: string;
  userId: string;
  datasetPath: string;
  baseModelId: string;
  hfModelId: string;
  outputDir: string;
  config: {
    epochs: number;
    learningRate: number;
    loraRank: number;
    loraAlpha: number;
    loraDropout: number;
    batchSize: number;
    warmupSteps: number;
    maxSeqLength: number;
    useQLoRA: boolean;
  };
  callbackUrl: string;
  targetModules: string[];
}

async function updateJobStatus(
  jobId: string,
  status: string,
  extra: {
    progress?: number;
    errorMessage?: string;
    outputPath?: string;
    metrics?: object;
  } = {}
): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status,
      ...(extra.progress !== undefined && { progress: extra.progress }),
      ...(extra.errorMessage !== undefined && { errorMessage: extra.errorMessage }),
      ...(extra.outputPath !== undefined && { outputPath: extra.outputPath }),
      ...(extra.metrics !== undefined && { metrics: JSON.stringify(extra.metrics) }),
      ...((['completed', 'failed', 'cancelled'].includes(status)) && { completedAt: new Date() }),
    },
  });
}

export const trainingWorker = new Worker<TrainingJobData>(
  'training',
  async (job: Job<TrainingJobData>) => {
    const { jobId, projectId, userId } = job.data;

    logger.info(`Training worker started: jobId=${jobId}, projectId=${projectId}`);

    try {
      // Mark job as running
      await updateJobStatus(jobId, 'running', { progress: 0 });
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'training' },
      });

      // Emit initial progress
      try {
        emitJobProgress(userId, { jobId, projectId, progress: 0, epoch: 0, step: 0 });
      } catch { /* socket may not be ready */ }

      // Call FastAPI ML worker
      const mlResponse = await mlClient.train({
        jobId: job.data.jobId,
        projectId: job.data.projectId,
        datasetPath: job.data.datasetPath,
        baseModelId: job.data.baseModelId,
        hfModelId: job.data.hfModelId,
        outputDir: job.data.outputDir,
        config: job.data.config,
        callbackUrl: job.data.callbackUrl,
        targetModules: job.data.targetModules,
      });

      logger.info(`ML Worker training response for ${jobId}:`, mlResponse);

      // The ML worker sends progress via callbackUrl webhooks (POST /api/jobs/:jobId/progress)
      // Final status is determined by those callbacks
      // However, if the ML worker returns a synchronous completed status, handle it here:
      if (mlResponse.status === 'completed') {
        const outputPath = job.data.outputDir;
        await updateJobStatus(jobId, 'completed', { progress: 100, outputPath });
        await prisma.project.update({
          where: { id: projectId },
          data: { status: 'completed' },
        });

        try {
          emitJobComplete(userId, { jobId, projectId, status: 'completed', outputPath });
        } catch { /* socket may not be available */ }
      }
      // If async, the ML worker will POST progress updates to callbackUrl

    } catch (err: any) {
      logger.error(`Training worker error for job ${jobId}:`, err);

      const errorMessage = err.message || 'Training failed';

      await updateJobStatus(jobId, 'failed', { errorMessage });
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'failed' },
      }).catch(() => {});

      try {
        emitJobError(userId, { jobId, projectId, error: errorMessage });
      } catch { /* socket may not be available */ }

      // Re-throw so BullMQ can handle retries
      throw err;
    }
  },
  {
    connection,
    concurrency: 1, // Only one training job at a time
    limiter: {
      max: 1,
      duration: 1000,
    },
  }
);

trainingWorker.on('completed', (job) => {
  logger.info(`Training job completed: ${job.data.jobId}`);
});

trainingWorker.on('failed', (job, err) => {
  if (job) {
    logger.error(`Training job failed: ${job.data.jobId}`, err);
    // Final failure after all retries exhausted
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      prisma.job.update({
        where: { id: job.data.jobId },
        data: { status: 'failed', errorMessage: err.message, completedAt: new Date() },
      }).catch(() => {});

      prisma.project.update({
        where: { id: job.data.projectId },
        data: { status: 'failed' },
      }).catch(() => {});
    }
  }
});

trainingWorker.on('error', (err) => {
  logger.error('Training worker error:', err);
});

logger.info('Training worker started');
