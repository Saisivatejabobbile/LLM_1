import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Don't send response if headers already sent
  if (res.headersSent) {
    next(err);
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log the error
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} — ${statusCode}: ${message}`, {
      stack: err.stack,
      body: req.body,
      params: req.params,
      query: req.query,
    });
  } else {
    logger.warn(`[${req.method}] ${req.path} — ${statusCode}: ${message}`);
  }

  const response: {
    error: string;
    code?: string;
    details?: unknown;
    stack?: string;
  } = {
    error: message,
  };

  if (err.code) {
    response.code = err.code;
  }

  if (err.details) {
    response.details = err.details;
  }

  // Only include stack in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

// 404 handler — must be registered AFTER all routes
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`,
  });
}

// Helper to create typed errors
export function createError(
  message: string,
  statusCode: number = 500,
  details?: unknown
): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.details = details;
  return err;
}
