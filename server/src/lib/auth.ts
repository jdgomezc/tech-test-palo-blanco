import crypto from 'node:crypto';

const HASH_SECRET = process.env.HASH_SECRET;
if (!HASH_SECRET) {
  throw new Error('HASH_SECRET (base64) must be set in .env');
}

const KEY = Buffer.from(HASH_SECRET, 'base64');

export function hashPassword(password: string): string {
  return crypto.createHmac('sha256', KEY).update(password, 'utf8').digest('base64');
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const computed = hashPassword(password);
  return crypto.timingSafeEqual(Buffer.from(computed, 'base64'), Buffer.from(storedHash, 'base64'));
}
