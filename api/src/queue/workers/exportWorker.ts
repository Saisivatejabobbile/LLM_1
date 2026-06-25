import { Worker, Job } from 'bullmq';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { mlClient } from '../../services/mlClient';
import { emitJobComplete, emitJobError, emitExportReady } from '../../lib/socket';
import { config } from '../../config';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

interface ExportJobData {
  jobId: string;
  projectId: string;
  userId: string;
  adapterPath: string;
  outputDir: string;
  callbackUrl: string;
}

export const exportWorker = new Worker<ExportJobData>(
  'export',
  async (job: Job<ExportJobData>) => {
    const { jobId, projectId, userId } = job.data;

    logger.info(`Export worker started: jobId=${jobId}, projectId=${projectId}`);

    try {
      // Mark as running
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'running', progress: 10 },
      });

      // Call FastAPI ML worker export endpoint
      const exportResult = await mlClient.export({
        jobId: job.data.jobId,
        projectId: job.data.projectId,
        adapterPath: job.data.adapterPath,
        outputDir: job.data.outputDir,
      });

      logger.info(`ML Worker export response for ${jobId}:`, exportResult);

      const ggufPath = exportResult.ggufPath;

      // Update job with output path
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 100,
          outputPath: ggufPath,
          completedAt: new Date(),
        },
      });

      // Build download URL
      const downloadUrl = `${config.api.baseUrl}/api/projects/${projectId}/export/download`;

      // Emit Socket.io events
      try {
        emitJobComplete(userId, { jobId, projectId, status: 'completed', outputPath: ggufPath });
        emitExportReady(userId, { jobId, projectId, downloadUrl });
      } catch { /* socket may not be available */ }

      logger.info(`Export completed for project ${projectId}: ${ggufPath}`);

    } catch (err: any) {
      logger.error(`Export worker error for job ${jobId}:`, err);

      const errorMessage = err.message || 'Export failed';

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

exportWorker.on('completed', (job) => {
  logger.info(`Export job completed: ${job.data.jobId}`);
});

exportWorker.on('failed', (job, err) => {
  if (job) {
    logger.error(`Export job failed: ${job.data.jobId}`, err);
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      prisma.job.update({
        where: { id: job.data.jobId },
        data: { status: 'failed', errorMessage: err.message, completedAt: new Date() },
      }).catch(() => {});
    }
  }
});

exportWorker.on('error', (err) => {
  logger.error('Export worker error:', err);
});

logger.info('Export worker started');
