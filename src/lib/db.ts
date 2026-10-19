import "server-only";

import { PrismaClient } from "@/generated/prisma/client";
import { createPrismaAdapter, databaseUrl } from "./prisma-adapter";

// The engine is chosen in ./prisma-adapter.ts — see the note there.
function createClient() {
  return new PrismaClient({
    adapter: createPrismaAdapter(databaseUrl()),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// Reuse one client across hot reloads in dev so we do not exhaust connections.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>;
};

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
