import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { emitJobProgress, emitJobComplete, emitJobError } from '../lib/socket';

const router = Router();

/**
 * POST /api/jobs/:jobId/progress
 * Internal webhook called by ML worker to report training progress.
 * NOT protected by auth middleware — internal Docker network only.
 */
router.post('/:jobId/progress', async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params;

  try {
    const {
      progress,
      status,
      metrics,
      errorMessage,
      outputPath,
      epoch,
      step,
      totalSteps,
      loss,
      evalLoss,
    } = req.body;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        project: { select: { userId: true, id: true } },
      },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};

    if (progress !== undefined) {
      updateData.progress = Math.min(100, Math.max(0, Number(progress)));
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (errorMessage !== undefined) {
      updateData.errorMessage = errorMessage;
    }

    if (outputPath !== undefined) {
      updateData.outputPath = outputPath;
    }

    if (metrics !== undefined) {
      updateData.metrics = typeof metrics === 'string' ? metrics : JSON.stringify(metrics);
    }

    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
    }

    await prisma.job.update({
      where: { id: jobId },
      data: updateData,
    });

    // Update project status based on training job completion
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

    // Emit Socket.io events to the project owner
    const userId = job.project.userId;
    const projectId = job.project.id;

    try {
      if (status === 'failed') {
        emitJobError(userId, {
          jobId,
          projectId,
          error: errorMessage || 'Job failed',
        });
      } else if (status === 'completed') {
        emitJobComplete(userId, {
          jobId,
          projectId,
          status: 'completed',
          outputPath,
        });
      } else {
        // Progress update
        emitJobProgress(userId, {
          jobId,
          projectId,
          progress: updateData.progress as number ?? job.progress,
          loss: loss !== undefined ? Number(loss) : undefined,
          evalLoss: evalLoss !== undefined ? Number(evalLoss) : undefined,
          epoch: epoch !== undefined ? Number(epoch) : undefined,
          step: step !== undefined ? Number(step) : undefined,
          totalSteps: totalSteps !== undefined ? Number(totalSteps) : undefined,
        });
      }
    } catch (socketErr) {
      logger.warn(`Socket emit failed for job ${jobId}:`, socketErr);
    }

    logger.debug(`Job progress updated: ${jobId} → status=${status || 'unchanged'}, progress=${progress}`);

    res.json({ received: true, jobId });
  } catch (err) {
    logger.error(`Job callback error for ${jobId}:`, err);
    res.status(500).json({ error: 'Failed to process job callback' });
  }
});

export default router;
