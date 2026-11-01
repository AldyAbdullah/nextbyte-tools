import crypto from 'crypto';
import { ClipboardExpiry } from '@/types/clipboard';

/**
 * Generates a cryptographically strong 32-byte management token.
 */
export function generateManagementToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Produces a SHA-256 hash of the management token for secure storage.
 */
export function hashManagementToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Verifies management token against its stored hash in constant time.
 */
export function verifyManagementToken(providedToken: string, storedHash: string): boolean {
  try {
    const providedHash = hashManagementToken(providedToken);
    const bufA = Buffer.from(providedHash, 'hex');
    const bufB = Buffer.from(storedHash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Securely hashes a password using PBKDF2 with SHA-512 and a unique salt.
 * Output format: <salt_hex>:<hash_hex>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored <salt>:<hash> string in constant time.
 */
export function verifyPassword(password: string, storedPasswordHash: string): boolean {
  try {
    const parts = storedPasswordHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, originalHash] = parts;
    const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const bufA = Buffer.from(computedHash, 'hex');
    const bufB = Buffer.from(originalHash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Computes expiration timestamp based on expiry selection.
 */
export function calculateExpiresAt(expiry: ClipboardExpiry): Date {
  const now = Date.now();
  let ms = 12 * 60 * 60 * 1000; // default 12h (maksimal 12 jam)

  switch (expiry) {
    case '10m':
      ms = 10 * 60 * 1000;
      break;
    case '1h':
      ms = 1 * 60 * 60 * 1000;
      break;
    case '6h':
      ms = 6 * 60 * 60 * 1000;
      break;
    case '12h':
    default:
      ms = 12 * 60 * 60 * 1000;
      break;
  }

  // Maksimal disimpan 12 jam
  const cappedMs = Math.min(ms, 12 * 60 * 60 * 1000);
  return new Date(now + cappedMs);
}
