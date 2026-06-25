import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from './logger';

let io: SocketIOServer | null = null;

export interface JwtPayload {
  userId: string;
  email: string;
}

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // JWT authentication middleware for Socket.io
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      (socket as any).userId = decoded.userId;
      (socket as any).email = decoded.email;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    logger.info(`Socket connected: ${socket.id} (user: ${userId})`);

    // Each user joins their own room
    socket.join(`user:${userId}`);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (user: ${userId}) — ${reason}`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error (${socket.id}):`, err);
    });
  });

  logger.info('Socket.io initialized');
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocketIO() first.');
  }
  return io;
}

// Emit to a specific user's room
export function emitToUser(userId: string, event: string, data: unknown): void {
  const ioInstance = getIO();
  ioInstance.to(`user:${userId}`).emit(event, data);
}

// Job event emitters
export function emitJobProgress(userId: string, payload: {
  jobId: string;
  projectId: string;
  progress: number;
  loss?: number;
  evalLoss?: number;
  epoch?: number;
  step?: number;
  totalSteps?: number;
}): void {
  emitToUser(userId, 'job:progress', payload);
}

export function emitJobComplete(userId: string, payload: {
  jobId: string;
  projectId: string;
  status: string;
  outputPath?: string;
}): void {
  emitToUser(userId, 'job:complete', payload);
}

export function emitJobError(userId: string, payload: {
  jobId: string;
  projectId: string;
  error: string;
}): void {
  emitToUser(userId, 'job:error', payload);
}

export function emitExportReady(userId: string, payload: {
  jobId: string;
  projectId: string;
  downloadUrl: string;
}): void {
  emitToUser(userId, 'job:export:ready', payload);
}
