import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200),
  description: z.string().max(1000).optional(),
  baseModelId: z.string().min(1, 'Base model ID is required'),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
});

// GET /api/projects
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;

    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        dataset: {
          select: { id: true, rowCount: true, formatted: true },
        },
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, type: true, status: true, progress: true, createdAt: true },
        },
        _count: { select: { jobs: true } },
      },
    });

    const projectsWithLatestJob = projects.map((p) => ({
      ...p,
      latestJob: p.jobs[0] || null,
      jobs: undefined,
    }));

    res.json({ projects: projectsWithLatestJob });
  } catch (err) {
    logger.error('List projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects
router.post('/', authenticate, validate(createProjectSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { name, description, baseModelId } = req.body;

    // Verify base model exists
    const baseModel = await prisma.baseModel.findUnique({ where: { id: baseModelId } });
    if (!baseModel) {
      res.status(400).json({ error: 'Invalid base model ID' });
      return;
    }

    const project = await prisma.project.create({
      data: {
        userId,
        name,
        description,
        baseModelId,
        status: 'draft',
      },
      include: {
        dataset: true,
        trainingConfig: true,
        _count: { select: { jobs: true } },
      },
    });

    logger.info(`Project created: ${project.id} by user ${userId}`);
    res.status(201).json({ project });
  } catch (err) {
    logger.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// GET /api/projects/:id
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        dataset: true,
        trainingConfig: true,
        jobs: { orderBy: { createdAt: 'desc' } },
        evaluation: true,
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (project.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Parse JSON fields
    const projectData = {
      ...project,
      dataset: project.dataset
        ? {
            ...project.dataset,
            rows: (() => {
              try { return JSON.parse(project.dataset!.rows); } catch { return []; }
            })(),
          }
        : null,
      evaluation: project.evaluation
        ? {
            ...project.evaluation,
            comparisons: (() => {
              try { return JSON.parse(project.evaluation!.comparisons); } catch { return []; }
            })(),
          }
        : null,
      jobs: project.jobs.map((j) => ({
        ...j,
        metrics: j.metrics ? (() => { try { return JSON.parse(j.metrics!); } catch { return null; } })() : null,
      })),
    };

    res.json({ project: projectData });
  } catch (err) {
    logger.error('Get project error:', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// PUT /api/projects/:id
router.put('/:id', authenticate, validate(updateProjectSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { id } = req.params;
    const { name, description } = req.body;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (project.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
      include: {
        dataset: { select: { id: true, rowCount: true, formatted: true } },
        trainingConfig: true,
        _count: { select: { jobs: true } },
      },
    });

    res.json({ project: updated });
  } catch (err) {
    logger.error('Update project error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { id } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (project.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.project.delete({ where: { id } });

    logger.info(`Project deleted: ${id} by user ${userId}`);
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (err) {
    logger.error('Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
