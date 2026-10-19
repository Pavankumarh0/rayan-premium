import "server-only";

import bcrypt from "bcryptjs";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

/**
 * A dummy hash compared against when an email does not exist, so a failed login
 * costs the same time either way and cannot be used to enumerate accounts.
 */
const DUMMY_HASH = "$2b$12$Q3Zz3hQW2gq0WzGQ0y0nVeVbQ4gGt0KqQ6o.2Tz5bJd9m0RrLKkUa";

export async function verifyPasswordConstantTime(
  plain: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash) {
    await bcrypt.compare(plain, DUMMY_HASH);
    return false;
  }
  return verifyPassword(plain, hash);
}

/** Password reset tokens: random secret to the user, SHA-256 digest in the DB. */
export function createResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: sha256(token) };
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** One-way, salted hash of a client IP so enquiry abuse can be traced without storing PII. */
export function hashIp(ip: string): string {
  const salt = process.env.SESSION_SECRET ?? "rayan-dev-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
