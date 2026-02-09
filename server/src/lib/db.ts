import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';

export function getMariaDbConfig(): {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string | undefined;
  connectionLimit: number;
} {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const u = new URL(url);
  return {
    host: u.hostname,
    port: parseInt(u.port, 10) || 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.slice(1).replace(/^\/+/, '') || undefined,
    connectionLimit: 10,
  };
}

function getAdapterConfig() {
  return getMariaDbConfig();
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const adapter = new PrismaMariaDb(getAdapterConfig());

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
