import { Worker, Job } from 'bullmq';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { mlClient } from '../../services/mlClient';
import { emitJobComplete, emitJobError } from '../../lib/socket';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

interface EvaluationJobData {
  jobId: string;
  projectId: string;
  userId: string;
  datasetPath: string;
  baseModelId: string;
  hfModelId: string;
  adapterPath: string | null;
  callbackUrl: string;
}

export const evaluationWorker = new Worker<EvaluationJobData>(
  'evaluation',
  async (job: Job<EvaluationJobData>) => {
    const { jobId, projectId, userId } = job.data;

    logger.info(`Evaluation worker started: jobId=${jobId}, projectId=${projectId}`);

    try {
      // Mark as running
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'running', progress: 5 },
      });

      // Call FastAPI ML worker evaluation endpoint
      const evalResult = await mlClient.evaluate({
        jobId: job.data.jobId,
        projectId: job.data.projectId,
        datasetPath: job.data.datasetPath,
        baseModelId: job.data.baseModelId,
        hfModelId: job.data.hfModelId,
        adapterPath: job.data.adapterPath,
      });

      logger.info(`ML Worker evaluation response for ${jobId}: BLEU=${evalResult.bleuScore}, ROUGE-L=${evalResult.rougeL}`);

      // Save to Evaluation table (upsert in case re-running)
      await prisma.evaluation.upsert({
        where: { projectId },
        update: {
          bleuScore: evalResult.bleuScore,
          rougeL: evalResult.rougeL,
          rouge1: evalResult.rouge1,
          rouge2: evalResult.rouge2,
          comparisons: JSON.stringify(evalResult.comparisons),
        },
        create: {
          projectId,
          bleuScore: evalResult.bleuScore,
          rougeL: evalResult.rougeL,
          rouge1: evalResult.rouge1,
          rouge2: evalResult.rouge2,
          comparisons: JSON.stringify(evalResult.comparisons),
        },
      });

      // Update job
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
          metrics: JSON.stringify({
            bleuScore: evalResult.bleuScore,
            rougeL: evalResult.rougeL,
            rouge1: evalResult.rouge1,
            rouge2: evalResult.rouge2,
          }),
        },
      });

      // Emit completion event
      try {
        emitJobComplete(userId, { jobId, projectId, status: 'completed' });
      } catch { /* socket may not be available */ }

      logger.info(`Evaluation completed for project ${projectId}`);

    } catch (err: any) {
      logger.error(`Evaluation worker error for job ${jobId}:`, err);

      const errorMessage = err.message || 'Evaluation failed';

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          errorMessage,
          completedAt: new Date(),
        },
      }).catch(() => {});

      try {
        emitJobError(userId, { jobId, projectId, error: errorMessage });
      } catch { /* socket may not be available */ }

      throw err;
    }
  },
  {
    connection,
    concurrency: 1,
  }
);

evaluationWorker.on('completed', (job) => {
  logger.info(`Evaluation job completed: ${job.data.jobId}`);
});

evaluationWorker.on('failed', (job, err) => {
  if (job) {
    logger.error(`Evaluation job failed: ${job.data.jobId}`, err);
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      prisma.job.update({
        where: { id: job.data.jobId },
        data: { status: 'failed', errorMessage: err.message, completedAt: new Date() },
      }).catch(() => {});
    }
  }
});

evaluationWorker.on('error', (err) => {
  logger.error('Evaluation worker error:', err);
});

logger.info('Evaluation worker started');
