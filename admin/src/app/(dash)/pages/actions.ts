"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  addSection,
  deleteSection,
  moveSection,
  toggleSectionVisibility,
} from "@/lib/pages-db";
import { getSectionDef, isRepeater, sectionDataSchema } from "@/lib/sections";
import { pageSchema, parseForm } from "@/lib/validation";
import { fail, invalid, ok, type FormState } from "@/lib/form-state";

/** Page settings: title, slug, template, status and the search listing. */
export async function savePage(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();

  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return fail("Unknown page.");

  const existing = await db.page.findUnique({
    where: { id },
    select: { isSystem: true, slug: true },
  });
  if (!existing) return fail("That page no longer exists.");

  const parsed = parseForm(pageSchema, formData);
  if (!parsed.success) return invalid(parsed.errors);

  const data = { ...parsed.data } as Record<string, unknown>;

  // A system page backs a hard-coded route. Re-slugging it would point the
  // route at nothing, so the slug is pinned rather than trusted from the form.
  if (existing.isSystem) data.slug = existing.slug;

  try {
    await db.page.update({ where: { id }, data });
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "P2002") {
      return fail("That URL slug is already taken.", {
        slug: "Another page already uses this slug.",
      });
    }
    const detail =
      error instanceof Error ? (error.message.split(/\r?\n/)[0] ?? error.message) : "Unknown error";
    return fail(`Could not save: ${detail}`);
  }

  revalidatePath("/pages");
  revalidatePath(`/pages/${id}`);
  return ok("Saved. The website updates immediately.");
}

/**
 * A section's own content, rebuilt from the registry's field list.
 *
 * The payload is assembled here rather than trusted wholesale from the form:
 * only fields the type actually declares are read, so a stale input left in
 * the DOM cannot write a key the renderer does not expect.
 */
export async function saveSection(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();

  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return fail("Unknown section.");

  const section = await db.section.findUnique({
    where: { id },
    select: { type: true, pageId: true },
  });
  if (!section) return fail("That section no longer exists.");

  const def = getSectionDef(section.type);
  if (!def) return fail(`"${section.type}" is not a section type this site knows about.`);

  const payload: Record<string, unknown> = {};
  for (const field of def.fields) {
    if (isRepeater(field)) {
      const raw = formData.get(field.name);
      if (typeof raw !== "string") continue;
      try {
        payload[field.name] = JSON.parse(raw.length > 0 ? raw : "[]");
      } catch {
        return fail(`"${field.label}" could not be read. Remove the items and add them again.`);
      }
      continue;
    }

    if (field.type === "boolean") {
      // An unchecked switch submits nothing at all, so absence means false.
      payload[field.name] = formData.get(field.name) === "on";
      continue;
    }

    const raw = formData.get(field.name);
    if (typeof raw !== "string") continue;
    payload[field.name] = field.type === "number" ? Number(raw) : raw;
  }

  // Validate through the same schema the public site parses with, so nothing
  // can be saved here that the renderer would silently fall back on.
  const result = sectionDataSchema(section.type).safeParse(payload);
  if (!result.success) {
    const issue = result.error.issues[0];
    return fail(
      issue ? `${issue.path.join(".") || "This section"}: ${issue.message}` : "That is not valid.",
    );
  }

  const isVisible = formData.get("isVisible") === "on";

  await db.section.update({
    where: { id },
    data: { data: JSON.stringify(result.data), isVisible },
  });

  revalidatePath(`/pages/${section.pageId}`);
  revalidatePath(`/pages/${section.pageId}/sections/${id}`);
  return ok("Saved. The website updates immediately.");
}

// ---------------------------------------------------------------------------
// Structural changes. Each redirects back to the page it acted on.
// ---------------------------------------------------------------------------

export async function addSectionAction(formData: FormData): Promise<void> {
  await requireUser();
  const pageId = formData.get("pageId");
  const type = formData.get("type");
  if (typeof pageId !== "string" || typeof type !== "string") return;

  const sectionId = await addSection(pageId, type);
  revalidatePath(`/pages/${pageId}`);
  // Straight into the new section: it was added to be filled in.
  if (sectionId) redirect(`/pages/${pageId}/sections/${sectionId}?added=1`);
  redirect(`/pages/${pageId}`);
}

export async function moveSectionAction(formData: FormData): Promise<void> {
  await requireUser();
  const sectionId = formData.get("sectionId");
  const pageId = formData.get("pageId");
  const direction = formData.get("direction");
  if (typeof sectionId !== "string" || typeof pageId !== "string") return;

  await moveSection(sectionId, direction === "up" ? -1 : 1);
  revalidatePath(`/pages/${pageId}`);
}

export async function toggleSectionAction(formData: FormData): Promise<void> {
  await requireUser();
  const sectionId = formData.get("sectionId");
  const pageId = formData.get("pageId");
  if (typeof sectionId !== "string" || typeof pageId !== "string") return;

  await toggleSectionVisibility(sectionId);
  revalidatePath(`/pages/${pageId}`);
}

export async function deleteSectionAction(formData: FormData): Promise<void> {
  await requireUser();
  const sectionId = formData.get("sectionId");
  if (typeof sectionId !== "string") return;

  const pageId = await deleteSection(sectionId);
  if (pageId) {
    revalidatePath(`/pages/${pageId}`);
    redirect(`/pages/${pageId}?removed=1`);
  }
}
