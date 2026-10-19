import "server-only";

import { headers } from "next/headers";
import { db } from "./db";
import { hashIp } from "./password";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Fixed-window counter persisted in the database, so the limit holds across
 * restarts and multiple app instances. Good enough for login and contact form
 * abuse; put a WAF or reverse-proxy limit in front for volumetric attacks.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStartCutoff = new Date(now.getTime() - windowSeconds * 1000);

  const existing = await db.rateLimit.findUnique({ where: { key } });

  if (!existing || existing.windowStart < windowStartCutoff) {
    await db.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, windowStart: now },
      update: { count: 1, windowStart: now },
    });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    const elapsed = Math.floor((now.getTime() - existing.windowStart.getTime()) / 1000);
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, windowSeconds - elapsed),
    };
  }

  const updated = await db.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });

  return { ok: true, remaining: Math.max(0, limit - updated.count), retryAfterSeconds: 0 };
}

/** Best-effort client IP from common proxy headers. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? "unknown";
}

export async function clientFingerprint(): Promise<string> {
  return hashIp(await clientIp());
}

/** Drop stale buckets so the table does not grow without bound. */
export async function pruneRateLimits(olderThanHours = 24): Promise<void> {
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
  await db.rateLimit.deleteMany({ where: { windowStart: { lt: cutoff } } });
}
