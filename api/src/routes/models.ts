import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const router = Router();

// GET /api/models
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const models = await prisma.baseModel.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const modelsWithParsedModules = models.map((m) => ({
      ...m,
      targetModules: (() => {
        try { return JSON.parse(m.targetModules); } catch { return []; }
      })(),
    }));

    res.json({ models: modelsWithParsedModules });
  } catch (err) {
    logger.error('List models error:', err);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// GET /api/models/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const model = await prisma.baseModel.findUnique({ where: { id } });

    if (!model) {
      res.status(404).json({ error: 'Model not found' });
      return;
    }

    res.json({
      model: {
        ...model,
        targetModules: (() => {
          try { return JSON.parse(model.targetModules); } catch { return []; }
        })(),
      },
    });
  } catch (err) {
    logger.error('Get model error:', err);
    res.status(500).json({ error: 'Failed to fetch model' });
  }
});

export default router;
