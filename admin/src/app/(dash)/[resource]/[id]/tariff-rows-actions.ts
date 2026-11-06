"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cellsSchema } from "@/lib/validation";
import { fail, ok, type FormState } from "@/lib/form-state";

const rowsPayload = z.array(
  z.object({
    cells: cellsSchema,
    isHighlighted: z.boolean().catch(false),
  }),
).max(100);

/**
 * Replaces every row of a tariff table in one go.
 *
 * A price table is edited as a whole — someone adjusts several rates at once
 * and saves — so reconciling individual row ids would add bookkeeping without
 * changing what an editor can do. Rows carry no incoming references (the
 * group owns them, `onDelete: Cascade`), so replacing them loses nothing but
 * the row ids, which are never used anywhere else.
 *
 * Delete and insert run in one transaction: a half-applied price table is the
 * one outcome that must not be possible.
 */
export async function saveTariffRows(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();

  const groupId = formData.get("groupId");
  if (typeof groupId !== "string" || groupId.length === 0) return fail("Unknown tariff table.");

  const raw = formData.get("rows");
  if (typeof raw !== "string") return fail("Nothing to save.");

  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    return fail("The rows could not be read. Reload the page and try again.");
  }

  // Rows left entirely blank are dropped rather than saved as empty lines.
  const cleaned = Array.isArray(decoded)
    ? decoded.filter(
        (row) =>
          row &&
          typeof row === "object" &&
          Array.isArray((row as { cells?: unknown }).cells) &&
          (row as { cells: unknown[] }).cells.some(
            (cell) => typeof cell === "string" && cell.trim().length > 0,
          ),
      )
    : [];

  const parsed = rowsPayload.safeParse(cleaned);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Those rows are not valid.");
  }

  const group = await db.tariffGroup.findUnique({ where: { id: groupId }, select: { id: true } });
  if (!group) return fail("That tariff table no longer exists.");

  try {
    await db.$transaction([
      db.tariffRow.deleteMany({ where: { groupId } }),
      ...parsed.data.map((row, index) =>
        db.tariffRow.create({
          data: {
            groupId,
            cells: JSON.stringify(row.cells),
            isHighlighted: row.isHighlighted,
            sortOrder: index,
          },
        }),
      ),
    ]);
  } catch (error) {
    const detail =
      error instanceof Error ? (error.message.split(/\r?\n/)[0] ?? error.message) : "Unknown error";
    return fail(`Could not save: ${detail}`);
  }

  revalidatePath(`/tariffs/${groupId}`);
  revalidatePath("/tariffs");

  const count = parsed.data.length;
  return ok(count === 1 ? "1 row saved." : `${count} rows saved.`);
}
