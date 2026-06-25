import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { trainingQueue, exportQueue, evaluationQueue, deployQueue } from '../queue/bullmq';

const router = Router();

function getQueueByJobType(type: string) {
  switch (type) {
    case 'training': return trainingQueue;
    case 'export': return exportQueue;
    case 'evaluation': return evaluationQueue;
    case 'deploy': return deployQueue;
    default: return null;
  }
}

// GET /api/jobs/:jobId — job details
router.get('/:jobId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { jobId } = req.params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        project: { select: { userId: true, name: true, baseModelId: true } },
      },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    if (job.project.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json({
      job: {
        ...job,
        metrics: job.metrics ? (() => { try { return JSON.parse(job.metrics!); } catch { return null; } })() : null,
      },
    });
  } catch (err) {
    logger.error('Get job error:', err);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// POST /api/jobs/:jobId/cancel
router.post('/:jobId/cancel', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { jobId } = req.params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { project: { select: { userId: true } } },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    if (job.project.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
      res.status(400).json({ error: `Cannot cancel job in status: ${job.status}` });
      return;
    }

    // Attempt to cancel BullMQ job
    if (job.bullJobId) {
      try {
        const queue = getQueueByJobType(job.type);
        if (queue) {
          const bullJob = await queue.getJob(job.bullJobId);
          if (bullJob) {
            const state = await bullJob.getState();
            if (state === 'waiting' || state === 'delayed') {
              await bullJob.remove();
              logger.info(`BullMQ job ${job.bullJobId} removed from queue`);
            } else if (state === 'active') {
              // Can't directly kill active jobs in BullMQ, mark in DB
              logger.warn(`Job ${jobId} is active in BullMQ — cannot force cancel active worker`);
            }
          }
        }
      } catch (bullErr) {
        logger.warn(`Failed to remove BullMQ job ${job.bullJobId}:`, bullErr);
        // Continue to mark as cancelled in DB
      }
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
      },
    });

    // If training job, revert project status to draft
    if (job.type === 'training') {
      await prisma.project.update({
        where: { id: job.projectId },
        data: { status: 'draft' },
      });
    }

    logger.info(`Job cancelled: ${jobId}`);

    res.json({
      job: updatedJob,
      message: 'Job cancelled',
    });
  } catch (err) {
    logger.error('Cancel job error:', err);
    res.status(500).json({ error: 'Failed to cancel job' });
  }
});

// POST /api/jobs/:jobId/progress — INTERNAL webhook called by ML worker
// This is also exported from jobCallbacks.ts — kept here for direct registration
router.post('/:jobId/progress', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const { progress, status, metrics, errorMessage, outputPath, epoch, step, totalSteps, loss, evalLoss } = req.body;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { project: { select: { userId: true } } },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const updateData: any = {};

    if (progress !== undefined) updateData.progress = Math.min(100, Math.max(0, Number(progress)));
    if (status !== undefined) updateData.status = status;
    if (errorMessage !== undefined) updateData.errorMessage = errorMessage;
    if (outputPath !== undefined) updateData.outputPath = outputPath;

    if (metrics !== undefined) {
      updateData.metrics = typeof metrics === 'string' ? metrics : JSON.stringify(metrics);
    }

    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
    });

    // Update project status if training completed/failed
    if (job.type === 'training') {
      if (status === 'completed') {
        await prisma.project.update({
          where: { id: job.projectId },
          data: { status: 'completed' },
        });
      } else if (status === 'failed') {
        await prisma.project.update({
          where: { id: job.projectId },
          data: { status: 'failed' },
        });
      }
    }

    // Emit Socket.io events
    try {
      const { emitJobProgress, emitJobComplete, emitJobError } = await import('../lib/socket');
      const userId = job.project.userId;

      if (status === 'running' || (progress !== undefined && !['completed', 'failed'].includes(status))) {
        emitJobProgress(userId, {
          jobId,
          projectId: job.projectId,
          progress: updateData.progress ?? job.progress,
          loss,
          evalLoss,
          epoch,
          step,
          totalSteps,
        });
      }

      if (status === 'completed') {
        emitJobComplete(userId, {
          jobId,
          projectId: job.projectId,
          status: 'completed',
          outputPath,
        });
      }

      if (status === 'failed') {
        emitJobError(userId, {
          jobId,
          projectId: job.projectId,
          error: errorMessage || 'Job failed',
        });
      }
    } catch (socketErr) {
      logger.warn('Socket.io emit failed (may not be initialized):', socketErr);
    }

    res.json({ received: true, jobId });
  } catch (err) {
    logger.error('Job progress webhook error:', err);
    res.status(500).json({ error: 'Failed to update job progress' });
  }
});

export default router;
