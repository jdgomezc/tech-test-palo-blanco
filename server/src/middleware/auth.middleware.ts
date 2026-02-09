import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in .env');
}

export interface AuthPayload {
  sub: number;
  username: string;
}

export interface RequestWithAuth extends Request {
  auth?: AuthPayload;
}

export function authMiddleware(req: RequestWithAuth, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
    res.status(403).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET as string) as unknown as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}
