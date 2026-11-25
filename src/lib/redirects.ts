import "server-only";

import { db } from "./db";

/**
 * Looks up a stored redirect for the path that produced a 404.
 *
 * Called from the root catch-all route, which is the last thing Next tries:
 * anything that still resolves to a real page never gets here, so a working
 * page pays nothing for this.
 *
 * The cost worth stating is that the response is a 308 issued after the route
 * miss, not a 301 issued at the edge before routing. Search engines treat 308
 * as permanent and a visitor cannot tell the difference, but this never saves
 * the round trip the way a CDN rule would.
 */
export type StoredRedirect = { destination: string; permanent: boolean };

export async function findRedirect(pathname: string): Promise<StoredRedirect | null> {
  // Stored by path, so trailing slashes and any query string are dropped.
  const path = pathname.split("?")[0]?.replace(/\/+$/, "") || "/";

  const row = await db.redirect.findFirst({
    where: { source: path, isActive: true },
    select: { id: true, destination: true, statusCode: true },
  });
  if (!row) return null;

  // Count the hit so an editor can see which old links are still in use, and
  // which rules have gone quiet and could be retired. Deliberately not
  // awaited into the critical path beyond its own statement.
  await db.redirect.update({
    where: { id: row.id },
    data: { hits: { increment: 1 } },
  });

  return { destination: row.destination, permanent: row.statusCode === 301 };
}
