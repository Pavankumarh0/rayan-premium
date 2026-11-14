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
 * The ceiling is `max × processes × instances`, not `max`. A Prisma Postgres
 * role allows ~45 connections in total, and that budget is now shared by two
 * deployments — the public site and the dashboard.
 *
 * This has brought the site down twice. First with `max: 10` under
 * `next start`. Then again on Vercel with `max: 3`, where the arithmetic is
 * worse: every concurrent serverless instance builds its own pool, so three
 * apiece exhausts the role after about fifteen of them. Both times every
 * route returned 500 with `P2037: too many connections`.
 *
 * Serverless therefore gets **one** connection per instance. A page makes a
 * handful of queries and they are already awaited in sequence, so a second
 * connection buys almost nothing — and under load the pool size is what
 * decides whether the site stays up.
 *
 * `idleTimeoutMillis` is not a reliable release on serverless either: a
 * frozen instance runs no timers, so its connection is held until the
 * platform reaps the instance. That is why the recovery for an exhausted
 * pool is to terminate idle backends server-side:
 *
 *   select pg_terminate_backend(pid) from pg_stat_activity
 *    where pid <> pg_backend_pid()
 *      and state in ('idle', 'idle in transaction')
 *      and now() - state_change > interval '20 seconds';
 *
 * The real fix is a connection pooler in front of the database (Prisma
 * Accelerate, PgBouncer) so instance count stops mattering — see
 * docs/CONTENT.md. Until then, keep this at 1 on serverless.
 *
 * Check the role's own limit with:
 *
 *   select rolconnlimit from pg_roles where rolname = current_user;
 */
const DEFAULT_POOL_MAX = 3;
const SERVERLESS_POOL_MAX = 1;

/** True on Vercel and similar per-request-instance runtimes. */
function isServerless(): boolean {
  return process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
}

function poolMax(): number {
  const raw = Number(process.env.DATABASE_POOL_MAX);
  if (Number.isFinite(raw) && raw >= 1) return Math.min(Math.trunc(raw), 20);
  return isServerless() ? SERVERLESS_POOL_MAX : DEFAULT_POOL_MAX;
}

export function createPrismaAdapter(url: string) {
  return new PrismaPg({
    connectionString: url,
    max: poolMax(),
    // Hand idle connections back quickly. A crashed or recycled worker
    // otherwise leaves them held until the server times them out, and the next
    // deploy starts against a pool that is already nearly full. Shorter on
    // serverless, where an instance may be frozen moments after responding.
    idleTimeoutMillis: isServerless() ? 5_000 : 10_000,
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
