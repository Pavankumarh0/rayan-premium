import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { MIRRORED, differences } from "../scripts/sync-admin.mjs";

/**
 * The admin app deploys separately but shares the public site's database and
 * its rules. These files are copied rather than imported from a shared
 * package, so this test is what stops them drifting apart: if someone edits
 * a validation rule or the section registry on one side only, this fails.
 *
 * Fix with: npm run sync:admin
 */
describe("admin mirror", () => {
  test("every mirrored file is identical on both sides", async () => {
    const drift = await differences();
    assert.deepEqual(
      drift,
      [],
      `Mirrored files are out of sync. Run \`npm run sync:admin\`.\n` +
        drift.map((d) => `  ${d.from} -> ${d.to} (${d.reason})`).join("\n"),
    );
  });

  test("the mirror covers the schema and the shared rule modules", () => {
    const targets = MIRRORED.map(([, to]) => to);
    for (const required of [
      "admin/prisma/schema.prisma",
      "admin/src/lib/validation.ts",
      "admin/src/lib/sections.ts",
      "admin/src/lib/settings.ts",
    ]) {
      assert.ok(targets.includes(required), `${required} must be mirrored`);
    }
  });
});
