import "server-only";

import { PrismaClient } from "@/generated/prisma/client";
import { createPrismaAdapter, databaseUrl } from "./prisma-adapter";

// The engine and pool size are chosen in ./prisma-adapter.ts — see the note there.
function createClient() {
  return new PrismaClient({
    adapter: createPrismaAdapter(databaseUrl()),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

/**
 * One client per process, in every environment.
 *
 * In development this stops hot reload from leaking a new pool on each edit.
 * The global is kept in production too: a worker that evaluates this module
 * more than once would otherwise open a second pool against a role that only
 * allows a few dozen connections in total.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>;
};

export const db = globalForPrisma.prisma ?? createClient();

globalForPrisma.prisma = db;
