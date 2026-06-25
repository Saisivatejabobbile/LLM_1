import { Queue } from 'bullmq';
import { getRedis } from '../lib/redis';
import { logger } from '../lib/logger';

const connection = { 
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: { count: 10 },
  removeOnFail: { count: 20 },
};

export const trainingQueue = new Queue('training', {
  connection,
  defaultJobOptions,
});

export const exportQueue = new Queue('export', {
  connection,
  defaultJobOptions,
});

export const evaluationQueue = new Queue('evaluation', {
  connection,
  defaultJobOptions,
});

export const deployQueue = new Queue('deploy', {
  connection,
  defaultJobOptions,
});

export async function closeQueues(): Promise<void> {
  await Promise.all([
    trainingQueue.close(),
    exportQueue.close(),
    evaluationQueue.close(),
    deployQueue.close(),
  ]);
  logger.info('All BullMQ queues closed');
}

// Queue event logging
[trainingQueue, exportQueue, evaluationQueue, deployQueue].forEach((queue) => {
  queue.on('error', (err) => {
    logger.error(`Queue [${queue.name}] error:`, err);
  });
});

logger.info('BullMQ queues initialized: training, export, evaluation, deploy');
