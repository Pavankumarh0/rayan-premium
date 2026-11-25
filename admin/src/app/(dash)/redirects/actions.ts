"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseForm, redirectSchema } from "@/lib/validation";
import { fail, invalid, ok, type FormState } from "@/lib/form-state";

export async function saveRedirect(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const idRaw = formData.get("id");
  const id = typeof idRaw === "string" && idRaw.length > 0 ? idRaw : null;

  const parsed = parseForm(redirectSchema, formData);
  if (!parsed.success) return invalid(parsed.errors);

  const data = parsed.data;

  /**
   * Refuse a rule that points at another rule's source. Two hops cost the
   * visitor a second round trip, and a loop would bounce them until the
   * browser gives up — neither is visible until someone follows the link.
   */
  const next = await db.redirect.findFirst({
    where: { source: data.destination, isActive: true, ...(id ? { id: { not: id } } : {}) },
    select: { destination: true },
  });
  if (next) {
    return fail("That destination is itself redirected.", {
      destination: `This would chain: ${data.destination} already redirects to ${next.destination}. Point straight there instead.`,
    });
  }

  try {
    if (id) {
      await db.redirect.update({ where: { id }, data });
    } else {
      const created = await db.redirect.create({ data, select: { id: true } });
      revalidatePath("/redirects");
      redirect(`/redirects/${created.id}?created=1`);
    }
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "P2002") {
      return fail("There is already a rule for that path.", {
        source: "A redirect from this path already exists. Edit that one instead.",
      });
    }
    const detail =
      error instanceof Error ? (error.message.split(/\r?\n/)[0] ?? error.message) : "Unknown error";
    return fail(`Could not save: ${detail}`);
  }

  revalidatePath("/redirects");
  return ok("Saved. The rule applies immediately.");
}

export async function toggleRedirect(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const row = await db.redirect.findUnique({ where: { id }, select: { isActive: true } });
  if (!row) return;

  await db.redirect.update({ where: { id }, data: { isActive: !row.isActive } });
  revalidatePath("/redirects");
}

export async function deleteRedirect(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await db.redirect.delete({ where: { id } });
  revalidatePath("/redirects");
  redirect("/redirects?deleted=1");
}
