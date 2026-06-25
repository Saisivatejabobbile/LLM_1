import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization token required' });
      return;
    }

    const token = authHeader.substring(7);

    let decoded: { userId: string; email: string };
    try {
      decoded = jwt.verify(token, config.jwt.secret) as { userId: string; email: string };
    } catch (jwtErr) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (err) {
    logger.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Optional auth — doesn't fail if no token
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string; email: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true },
      });
      if (user) {
        (req as AuthenticatedRequest).user = user;
      }
    } catch {
      // ignore invalid token in optional auth
    }

    next();
  } catch (err) {
    next();
  }
}
