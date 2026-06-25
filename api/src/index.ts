import 'dotenv/config';
import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

import { config } from './config';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { getRedis, closeRedis } from './lib/redis';
import { initSocketIO } from './lib/socket';
import { closeQueues } from './queue/bullmq';

// Routes
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import datasetRoutes from './routes/datasets';
import jobsRoutes from './routes/jobs';
import jobsManagementRoutes from './routes/jobsManagement';
import modelsRoutes from './routes/models';
import healthRoutes from './routes/health';
import jobCallbackRouter from './queue/jobCallbacks';

// Workers (import to start them)
import './queue/workers/trainingWorker';
import './queue/workers/exportWorker';
import './queue/workers/evaluationWorker';
import './queue/workers/deployWorker';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Ensure log directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Ensure upload directories exist
const uploadDirs = [config.storage.uploadDir, config.storage.modelsDir, path.join(config.storage.uploadDir, 'tmp')];
for (const dir of uploadDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created directory: ${dir}`);
  }
}

const app = express();
const httpServer = http.createServer(app);

// ─── Core Middleware ────────────────────────────────────────────────────────

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
    skip: (req) => req.path === '/health', // Don't log health checks
  })
);

// Trust proxy (for Docker/nginx environments)
app.set('trust proxy', 1);

// ─── Initialize Socket.io ───────────────────────────────────────────────────
initSocketIO(httpServer);

// ─── Routes ─────────────────────────────────────────────────────────────────

// Health check (no auth)
app.use('/health', healthRoutes);

// Internal job progress webhook (called by ML worker — no auth)
app.use('/api/jobs', jobCallbackRouter);

// Auth routes
app.use('/api/auth', authRoutes);

// Models (public read)
app.use('/api/models', modelsRoutes);

// Project routes
app.use('/api/projects', projectRoutes);

// Dataset routes (nested under projects)
app.use('/api/projects/:id/dataset', datasetRoutes);

// Training, export, evaluation, deploy routes (nested under projects)
app.use('/api/projects', jobsRoutes);

// Job management routes (get single job, cancel)
app.use('/api/jobs', jobsManagementRoutes);

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Startup ─────────────────────────────────────────────────────────────────

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await prisma.$connect();
    logger.info('Database connected');

    // Connect to Redis
    const redis = getRedis();
    await redis.ping();
    logger.info('Redis connected');

    // Start HTTP server
    httpServer.listen(config.port, '0.0.0.0', () => {
      logger.info(`
╔════════════════════════════════════════╗
║         SLM Forge API Server          ║
╠════════════════════════════════════════╣
║  Port:     ${config.port}                        ║
║  Env:      ${config.nodeEnv.padEnd(28)} ║
║  DB:       SQLite                      ║
║  Redis:    ${config.redis.url.substring(0, 28)} ║
╚════════════════════════════════════════╝
      `);
    });

  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Close HTTP server (stop accepting new connections)
    await new Promise<void>((resolve, reject) => {
      httpServer.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    logger.info('HTTP server closed');

    // Close BullMQ queues
    await closeQueues();

    // Close Redis connections
    await closeRedis();

    // Disconnect from database
    await prisma.$disconnect();
    logger.info('Database disconnected');

    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

startServer();

export { app, httpServer };
