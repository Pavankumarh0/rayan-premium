import { PrismaPg } from "@prisma/adapter-pg";

/**
 * The single place the database engine is chosen.
 *
 * Prisma 7 requires a driver adapter, and both the app (src/lib/db.ts) and the
 * seed script need one. Keeping the choice here means swapping engines is a
 * change to this file plus the datasource provider in prisma/schema.prisma —
 * not a hunt through every entry point.
 *
 * Deliberately free of `server-only` so the seed script, which runs in plain
 * Node rather than a React Server Component, can import it.
 */

/**
 * Connections are a hard, shared resource, not a tuning knob.
 *
 * `next start` renders across several worker processes, and each one builds
 * its own pool — so the ceiling is `max × workers × instances`, not `max`. A
 * Prisma Postgres role allows ~45 connections in total; an earlier `max: 10`
 * exhausted that and every route returned 500 with
 * `P2037: too many connections`, while dev (one process, one pool) looked fine.
 *
 * Three per process is enough to overlap the handful of queries a page makes
 * while leaving headroom for other workers, migrations and a psql session.
 * Raise it only after checking the role's limit:
 *
 *   select rolconnlimit from pg_roles where rolname = current_user;
 */
const DEFAULT_POOL_MAX = 3;

function poolMax(): number {
  const raw = Number(process.env.DATABASE_POOL_MAX);
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_POOL_MAX;
  return Math.min(Math.trunc(raw), 20);
}

export function createPrismaAdapter(url: string) {
  return new PrismaPg({
    connectionString: url,
    max: poolMax(),
    // Hand idle connections back quickly. A crashed or recycled worker
    // otherwise leaves them held until the server times them out, and the next
    // deploy starts against a pool that is already nearly full.
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
}

/** Reads and validates the connection string. */
export function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
  }
  return url;
}
