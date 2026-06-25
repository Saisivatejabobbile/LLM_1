import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getRedis } from '../lib/redis';
import { logger } from '../lib/logger';

const router = Router();

// GET /health
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const health: {
    status: string;
    timestamp: string;
    uptime: number;
    checks: Record<string, { status: string; latencyMs?: number; error?: string }>;
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {},
  };

  // Check database
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = { status: 'ok', latencyMs: Date.now() - dbStart };
  } catch (err: any) {
    health.checks.database = { status: 'error', error: err.message };
    health.status = 'degraded';
  }

  // Check Redis
  try {
    const redisStart = Date.now();
    const redis = getRedis();
    await redis.ping();
    health.checks.redis = { status: 'ok', latencyMs: Date.now() - redisStart };
  } catch (err: any) {
    health.checks.redis = { status: 'error', error: err.message };
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
