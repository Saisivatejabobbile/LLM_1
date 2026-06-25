import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;

export function createRedisClient(): Redis {
  const client = new Redis(config.redis.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 500, 5000);
      logger.warn(`Redis retry attempt ${times}, waiting ${delay}ms...`);
      return delay;
    },
    reconnectOnError(err) {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
      if (targetErrors.some((e) => err.message.includes(e))) {
        return true;
      }
      return false;
    },
  });

  client.on('connect', () => {
    logger.info('Redis connected');
  });

  client.on('ready', () => {
    logger.info('Redis ready');
  });

  client.on('error', (err) => {
    logger.error('Redis error:', err);
  });

  client.on('close', () => {
    logger.warn('Redis connection closed');
  });

  client.on('reconnecting', () => {
    logger.info('Redis reconnecting...');
  });

  return client;
}

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

export function getRedisSubscriber(): Redis {
  if (!redisSubscriber) {
    redisSubscriber = createRedisClient();
  }
  return redisSubscriber;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
  if (redisSubscriber) {
    await redisSubscriber.quit();
    redisSubscriber = null;
  }
}
