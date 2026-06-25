import dotenv from 'dotenv';
dotenv.config();

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: requireEnv('DATABASE_URL', 'file:/app/data/slm.db'),
  },

  jwt: {
    secret: requireEnv('JWT_SECRET', 'fallback-dev-secret-change-in-production'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  mlWorker: {
    url: process.env.ML_WORKER_URL || 'http://localhost:8000',
  },

  storage: {
    uploadDir: process.env.UPLOAD_DIR || '/app/uploads',
    modelsDir: process.env.MODELS_DIR || '/app/models',
  },

  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  upload: {
    maxFileSizeMB: 50,
    allowedMimeTypes: [
      'application/json',
      'application/x-ndjson',
      'text/plain',
      'application/pdf',
      'application/jsonl',
    ],
    allowedExtensions: ['.jsonl', '.json', '.txt', '.pdf'],
  },

  bullmq: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
    removeOnComplete: { count: 10 },
    removeOnFail: { count: 20 },
  },
} as const;

export type Config = typeof config;
