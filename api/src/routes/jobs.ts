import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { trainingQueue, exportQueue, evaluationQueue, deployQueue } from '../queue/bullmq';
import { storage } from '../lib/storage';
import { config } from '../config';

const router = Router({ mergeParams: true });

const trainingConfigSchema = z.object({
  epochs: z.number().int().min(1).max(100).default(3),
  learningRate: z.number().min(1e-6).max(0.1).default(0.0002),
  loraRank: z.number().int().min(1).max(256).default(16),
  loraAlpha: z.number().int().min(1).max(512).default(32),
  loraDropout: z.number().min(0).max(0.9).default(0.1),
  batchSize: z.number().int().min(1).max(64).default(4),
  warmupSteps: z.number().int().min(0).max(1000).default(10),
  maxSeqLength: z.number().int().min(64).max(8192).default(512),
  useQLoRA: z.boolean().default(true),
});

// Helper to get project and verify ownership
async function getAuthorizedProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { dataset: true, trainingConfig: true },
  });
  if (!project) throw { statusCode: 404, message: 'Project not found' };
  if (project.userId !== userId) throw { statusCode: 403, message: 'Forbidden' };
  return project;
}

// POST /api/projects/:id/train
router.post('/train', authenticate, validate(trainingConfigSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { id: projectId } = req.params;

    const project = await getAuthorizedProject(projectId, userId);

    if (!project.dataset || project.dataset.rowCount === 0) {
      res.status(400).json({ error: 'No dataset found. Upload and format a dataset first.' });
      return;
    }

    if (!project.dataset.formatted) {
      res.status(400).json({ error: 'Dataset is not formatted. Run /format endpoint first.' });
      return;
    }

    // Get base model info
    const baseModel = await prisma.baseModel.findUnique({ where: { id: project.baseModelId } });
    if (!baseModel) {
      res.status(400).json({ error: 'Base model not found' });
      return;
    }

    // Save/update training config
    const trainingConfigData = {
      epochs: req.body.epochs,
      learningRate: req.body.learningRate,
      loraRank: req.body.loraRank,
      loraAlpha: req.body.loraAlpha,
      loraDropout: req.body.loraDropout,
      batchSize: req.body.batchSize,
      warmupSteps: req.body.warmupSteps,
      maxSeqLength: req.body.maxSeqLength,
      useQLoRA: req.body.useQLoRA,
    };

    await prisma.trainingConfig.upsert({
      where: { projectId },
      update: trainingConfigData,
      create: { projectId, ...trainingConfigData },
    });

    // Create job record first (survives restarts)
    const job = await prisma.job.create({
      data: {
        projectId,
        type: 'training',
        status: 'pending',
        progress: 0,
      },
    });

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'training' },
    });

    // Enqueue BullMQ job
    const datasetPath = storage.getAbsolutePath(project.dataset.filePath || '');
    const outputDir = path.join(config.storage.modelsDir, projectId, job.id);

    const bullJob = await trainingQueue.add(
      'training',
      {
        jobId: job.id,
        projectId,
        userId,
        datasetPath,
        baseModelId: project.baseModelId,
        hfModelId: baseModel.hfModelId,
        outputDir,
        config: trainingConfigData,
        callbackUrl: `${config.api.baseUrl}/api/jobs/${job.id}/progress`,
        targetModules: JSON.parse(baseModel.targetModules),
      },
      {
        jobId: `training-${job.id}`,
        attempts: config.bullmq.attempts,
        backoff: config.bullmq.backoff,
        removeOnComplete: config.bullmq.removeOnComplete,
        removeOnFail: config.bullmq.removeOnFail,
      }
    );

    // Save bullJobId
    await prisma.job.update({
      where: { id: job.id },
      data: { bullJobId: bullJob.id },
    });

    logger.info(`Training job enqueued: ${job.id} (bullJobId: ${bullJob.id}) for project ${projectId}`);

    res.status(201).json({
      job: {
        id: job.id,
        projectId,
        type: 'training',
        status: 'pending',
        bullJobId: bullJob.id,
      },
      message: 'Training job enqueued successfully',
    });
  } catch (err: any) {
    logger.error('Start training error:', err);
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Failed to start training' });
  }
});

// GET /api/projects/:id/jobs
router.get('/jobs', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { id: projectId } = req.params;

    await getAuthorizedProject(projectId, userId);

    const jobs = await prisma.job.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    const jobsWithParsedMetrics = jobs.map((j) => ({
      ...j,
      metrics: j.metrics ? (() => { try { return JSON.parse(j.metrics!); } catch { return null; } })() : null,
    }));

    res.json({ jobs: jobsWithParsedMetrics });
  } catch (err: any) {
    logger.error('List jobs error:', err);
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// POST /api/projects/:id/export
router.post('/export', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { id: projectId } = req.params;

    const project = await getAuthorizedProject(projectId, userId);

    // Find completed training job
    const completedTrainingJob = await prisma.job.findFirst({
      where: { projectId, type: 'training', status: 'completed' },
      orderBy: { completedAt: 'desc' },
    });

    if (!completedTrainingJob) {
      res.status(400).json({ error: 'No completed training job found. Train the model first.' });
      return;
    }

    const adapterPath = completedTrainingJob.outputPath;
    if (!adapterPath) {
      res.status(400).json({ error: 'Training job has no output path' });
      return;
    }

    const job = await prisma.job.create({
      data: {
        projectId,
        type: 'export',
        status: 'pending',
        progress: 0,
      },
    });

    const outputDir = path.join(config.storage.modelsDir, projectId, 'exports');

    const bullJob = await exportQueue.add(
      'export',
      {
        jobId: job.id,
        projectId,
        userId,
        adapterPath,
        outputDir,
        callbackUrl: `${config.api.baseUrl}/api/jobs/${job.id}/progress`,
      },
      {
        jobId: `export-${job.id}`,
        attempts: config.bullmq.attempts,
        backoff: config.bullmq.backoff,
        removeOnComplete: config.bullmq.removeOnComplete,
        removeOnFail: config.bullmq.removeOnFail,
      }
    );

    await prisma.job.update({
      where: { id: job.id },
      data: { bullJobId: bullJob.id },
    });

    logger.info(`Export job enqueued: ${job.id} for project ${projectId}`);

    res.status(201).json({
      job: { id: job.id, projectId, type: 'export', status: 'pending', bullJobId: bullJob.id },
      message: 'Export job enqueued',
    });
  } catch (err: any) {
    logger.error('Export error:', err);
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Failed to start export' });
  }
});

// GET /api/projects/:id/export/download
router.get('/export/download', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { id: projectId } = req.params;

    await getAuthorizedProject(projectId, userId);

    const exportJob = await prisma.job.findFirst({
      where: { projectId, type: 'export', status: 'completed' },
      orderBy: { completedAt: 'desc' },
    });

    if (!exportJob || !exportJob.outputPath) {
      res.status(404).json({ error: 'No completed export found. Run export first.' });
      return;
    }

    const ggufPath = exportJob.outputPath;
    const absPath = path.isAbsolute(ggufPath) ? ggufPath : storage.getAbsolutePath(ggufPath);

    if (!fs.existsSync(absPath)) {
      res.status(404).json({ error: 'GGUF file not found on disk' });
      return;
    }

    const filename = path.basename(absPath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', fs.statSync(absPath).size);

    const stream = fs.createReadStream(absPath);
    stream.pipe(res);
    stream.on('error', (err) => {
      logger.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream file' });
      }
    });
  } catch (err: any) {
    logger.error('Download export error:', err);
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Failed to download export' });
  }
});

// POST /api/projects/:id/evaluate
router.post('/evaluate', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { id: projectId } = req.params;

    const project = await getAuthorizedProject(projectId, userId);

    const completedTrainingJob = await prisma.job.findFirst({
      where: { projectId, type: 'training', status: 'completed' },
      orderBy: { completedAt: 'desc' },
    });

    if (!completedTrainingJob) {
      res.status(400).json({ error: 'No completed training job found. Train the model first.' });
      return;
    }

    if (!project.dataset || project.dataset.rowCount === 0) {
      res.status(400).json({ error: 'No dataset found for evaluation' });
      return;
    }

    const baseModel = await prisma.baseModel.findUnique({ where: { id: project.baseModelId } });
    if (!baseModel) {
      res.status(400).json({ error: 'Base model not found' });
      return;
    }

    const job = await prisma.job.create({
      data: { projectId, type: 'evaluation', status: 'pending', progress: 0 },
    });

    const datasetPath = storage.getAbsolutePath(project.dataset.filePath || '');

    const bullJob = await evaluationQueue.add(
      'evaluation',
      {
        jobId: job.id,
        projectId,
        userId,
        datasetPath,
        baseModelId: project.baseModelId,
        hfModelId: baseModel.hfModelId,
        adapterPath: completedTrainingJob.outputPath,
        callbackUrl: `${config.api.baseUrl}/api/jobs/${job.id}/progress`,
      },
      {
        jobId: `evaluation-${job.id}`,
        attempts: config.bullmq.attempts,
        backoff: config.bullmq.backoff,
        removeOnComplete: config.bullmq.removeOnComplete,
        removeOnFail: config.bullmq.removeOnFail,
      }
    );

    await prisma.job.update({
      where: { id: job.id },
      data: { bullJobId: bullJob.id },
    });

    logger.info(`Evaluation job enqueued: ${job.id} for project ${projectId}`);

    res.status(201).json({
      job: { id: job.id, projectId, type: 'evaluation', status: 'pending', bullJobId: bullJob.id },
      message: 'Evaluation job enqueued',
    });
  } catch (err: any) {
    logger.error('Evaluate error:', err);
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Failed to start evaluation' });
  }
});

// GET /api/projects/:id/evaluation
router.get('/evaluation', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { id: projectId } = req.params;

    await getAuthorizedProject(projectId, userId);

    const evaluation = await prisma.evaluation.findUnique({ where: { projectId } });

    if (!evaluation) {
      res.status(404).json({ error: 'No evaluation found for this project' });
      return;
    }

    res.json({
      evaluation: {
        ...evaluation,
        comparisons: (() => { try { return JSON.parse(evaluation.comparisons); } catch { return []; } })(),
      },
    });
  } catch (err: any) {
    logger.error('Get evaluation error:', err);
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch evaluation' });
  }
});

// POST /api/projects/:id/deploy
router.post('/deploy', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { id: projectId } = req.params;

    const project = await getAuthorizedProject(projectId, userId);

    // Find completed export job for GGUF file
    const exportJob = await prisma.job.findFirst({
      where: { projectId, type: 'export', status: 'completed' },
      orderBy: { completedAt: 'desc' },
    });

    if (!exportJob || !exportJob.outputPath) {
      res.status(400).json({ error: 'No completed export found. Export the model as GGUF first.' });
      return;
    }

    const job = await prisma.job.create({
      data: { projectId, type: 'deploy', status: 'pending', progress: 0 },
    });

    const bullJob = await deployQueue.add(
      'deploy',
      {
        jobId: job.id,
        projectId,
        userId,
        ggufPath: exportJob.outputPath,
        modelName: project.name,
        callbackUrl: `${config.api.baseUrl}/api/jobs/${job.id}/progress`,
      },
      {
        jobId: `deploy-${job.id}`,
        attempts: config.bullmq.attempts,
        backoff: config.bullmq.backoff,
        removeOnComplete: config.bullmq.removeOnComplete,
        removeOnFail: config.bullmq.removeOnFail,
      }
    );

    await prisma.job.update({
      where: { id: job.id },
      data: { bullJobId: bullJob.id },
    });

    logger.info(`Deploy job enqueued: ${job.id} for project ${projectId}`);

    res.status(201).json({
      job: { id: job.id, projectId, type: 'deploy', status: 'pending', bullJobId: bullJob.id },
      message: 'Deploy job enqueued',
    });
  } catch (err: any) {
    logger.error('Deploy error:', err);
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Failed to start deployment' });
  }
});

export default router;
