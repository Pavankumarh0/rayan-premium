/**
 * Mirrors the shared schema and library modules into the admin app.
 *
 * The two apps deploy separately but share one database, so they must agree on
 * the schema, the validation rules and the section registry exactly.
 *
 * Why copies rather than a workspace package: a shared package couples the two
 * deployments — you can no longer point a host at `admin/` alone, and every
 * release of one drags the other. Copies keep each app self-contained. The
 * cost is drift, which this script removes and `tests/admin-sync.test.ts`
 * guards: the test fails if any mirrored file differs.
 *
 * Every mirrored file is byte-identical. They import through the `@/` alias or
 * relative paths that resolve the same inside either app, and the Prisma
 * generator's `output` is relative to its schema file.
 *
 * The public app owns migrations. The admin only runs `prisma generate`, so
 * there is no second migration history to diverge.
 *
 * Run: npm run sync:admin
 */

import { copyFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** [from repo root, to repo root] */
export const MIRRORED = [
  ["prisma/schema.prisma", "admin/prisma/schema.prisma"],

  // Pure helpers and the single source of truth for validation and the
  // section registry. The admin edits what the public site renders, so these
  // cannot be allowed to disagree.
  ["src/lib/utils.ts", "admin/src/lib/utils.ts"],
  ["src/lib/json.ts", "admin/src/lib/json.ts"],
  ["src/lib/validation.ts", "admin/src/lib/validation.ts"],
  ["src/lib/sections.ts", "admin/src/lib/sections.ts"],
  ["src/lib/sanitize.ts", "admin/src/lib/sanitize.ts"],
  ["src/lib/session.ts", "admin/src/lib/session.ts"],
  ["src/lib/password.ts", "admin/src/lib/password.ts"],
  ["src/lib/rate-limit.ts", "admin/src/lib/rate-limit.ts"],
  ["src/lib/prisma-adapter.ts", "admin/src/lib/prisma-adapter.ts"],
  ["src/lib/db.ts", "admin/src/lib/db.ts"],
  ["src/lib/settings.ts", "admin/src/lib/settings.ts"],
];

export async function differences() {
  const out = [];
  for (const [from, to] of MIRRORED) {
    const [a, b] = await Promise.all([
      readFile(join(root, from)).catch(() => null),
      readFile(join(root, to)).catch(() => null),
    ]);
    if (a === null) out.push({ from, to, reason: "source missing" });
    else if (b === null) out.push({ from, to, reason: "copy missing" });
    else if (!a.equals(b)) out.push({ from, to, reason: "differs" });
  }
  return out;
}

async function main() {
  for (const [from, to] of MIRRORED) {
    await mkdir(dirname(join(root, to)), { recursive: true });
    await copyFile(join(root, from), join(root, to));
    console.log(`  ${from} -> ${to}`);
  }
  console.log(`\nMirrored ${MIRRORED.length} files.`);
  console.log("If the schema changed, run `npm run db:generate` inside admin/ too.");
}

if (process.argv[1] && process.argv[1].endsWith("sync-admin.mjs")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
