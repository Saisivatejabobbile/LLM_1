import { Worker, Job } from 'bullmq';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { mlClient } from '../../services/mlClient';
import { emitJobComplete, emitJobError } from '../../lib/socket';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

interface DeployJobData {
  jobId: string;
  projectId: string;
  userId: string;
  ggufPath: string;
  modelName: string;
  callbackUrl: string;
}

export const deployWorker = new Worker<DeployJobData>(
  'deploy',
  async (job: Job<DeployJobData>) => {
    const { jobId, projectId, userId } = job.data;

    logger.info(`Deploy worker started: jobId=${jobId}, projectId=${projectId}`);

    try {
      // Mark as running
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'running', progress: 10 },
      });

      // Call FastAPI ML worker deploy endpoint
      const deployResult = await mlClient.deploy({
        jobId: job.data.jobId,
        projectId: job.data.projectId,
        ggufPath: job.data.ggufPath,
        modelName: job.data.modelName,
      });

      logger.info(`ML Worker deploy response for ${jobId}:`, deployResult);

      // Update job
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
          outputPath: deployResult.endpoint || null,
        },
      });

      // Emit completion event
      try {
        emitJobComplete(userId, {
          jobId,
          projectId,
          status: 'completed',
          outputPath: deployResult.endpoint,
        });
      } catch { /* socket may not be available */ }

      logger.info(`Deploy completed for project ${projectId}: endpoint=${deployResult.endpoint}`);

    } catch (err: any) {
      logger.error(`Deploy worker error for job ${jobId}:`, err);

      const errorMessage = err.message || 'Deployment failed';

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
    concurrency: 2,
  }
);

deployWorker.on('completed', (job) => {
  logger.info(`Deploy job completed: ${job.data.jobId}`);
});

deployWorker.on('failed', (job, err) => {
  if (job) {
    logger.error(`Deploy job failed: ${job.data.jobId}`, err);
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      prisma.job.update({
        where: { id: job.data.jobId },
        data: { status: 'failed', errorMessage: err.message, completedAt: new Date() },
      }).catch(() => {});
    }
  }
});

deployWorker.on('error', (err) => {
  logger.error('Deploy worker error:', err);
});

logger.info('Deploy worker started');
