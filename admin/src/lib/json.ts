import type { z } from "zod";

/**
 * Structured content columns are stored as JSON text so the schema is identical
 * on SQLite and MySQL. Every read goes through a Zod schema, so malformed or
 * hand-edited rows degrade to the fallback instead of crashing a page render.
 */
export function parseJson<T>(raw: string | null | undefined, schema: z.ZodType<T>, fallback: T): T {
  if (!raw) return fallback;
  try {
    const result = schema.safeParse(JSON.parse(raw));
    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
}

export function stringifyJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}
