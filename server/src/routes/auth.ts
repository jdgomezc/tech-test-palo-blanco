import type { Request, Response } from 'express';
import { prisma } from '../lib/db.js';
import { hashPassword, verifyPassword } from '../lib/auth.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in .env');
}

const JWT_EXPIRES_IN = '1h';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || typeof username !== 'string' || username.trim() === '') {
      res.status(400).json({ error: 'username is required' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length === 0) {
      res.status(400).json({ error: 'password is required' });
      return;
    }

    const existing = await prisma.user.findFirst({ where: { username: username.trim() } });
    if (existing) {
      res.status(409).json({ error: 'username already registered' });
      return;
    }

    const hashed = hashPassword(password);
    const user = await prisma.user.create({
      data: { username: username.trim(), password: hashed },
      select: { id: true, username: true },
    });

    res.status(201).json({ id: user.id, username: user.username });
  } catch (err) {
    console.error('register error', err);
    res.status(500).json({ error: 'registration failed' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || typeof username !== 'string' || username.trim() === '') {
      res.status(400).json({ error: 'username is required' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length === 0) {
      res.status(400).json({ error: 'password is required' });
      return;
    }

    const user = await prisma.user.findFirst({ where: { username: username.trim() } });
    if (!user || !verifyPassword(password, user.password)) {
      res.status(401).json({ error: 'invalid username or password' });
      return;
    }

    const token = jwt.sign(
      { sub: user.id, username: user.username },
      JWT_SECRET as string,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ token, expiresIn: JWT_EXPIRES_IN });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'login failed' });
  }
}
