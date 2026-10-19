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
export function createPrismaAdapter(url: string) {
  return new PrismaPg({
    connectionString: url,
    // Prisma Postgres closes idle connections; a modest pool with a short idle
    // timeout avoids holding sockets the server has already dropped.
    max: 10,
    idleTimeoutMillis: 30_000,
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
