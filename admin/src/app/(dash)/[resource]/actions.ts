"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getResource } from "@/lib/resources";
import {
  buildData,
  createRow,
  deleteRow,
  findRow,
  setRowStatus,
  updateRow,
} from "@/lib/resource-db";
import { parseForm, type FieldErrors } from "@/lib/validation";
import { fail, invalid, ok, type FormState } from "@/lib/form-state";

/**
 * One set of actions for every content type.
 *
 * The resource and row id travel in hidden inputs rather than closure
 * arguments, so the form stays a plain uncontrolled form and the action is
 * still a single, cacheable server reference.
 */

function resourceFrom(formData: FormData) {
  const slug = formData.get("__resource");
  if (typeof slug !== "string") return null;
  return getResource(slug) ?? null;
}

/** Turns a Prisma failure into something an editor can act on. */
function describe(error: unknown): { message: string; errors: FieldErrors } {
  const code = (error as { code?: string } | null)?.code;

  if (code === "P2002") {
    const target = (error as { meta?: { target?: string[] | string } }).meta?.target;
    const fields = Array.isArray(target) ? target : typeof target === "string" ? [target] : [];
    if (fields.includes("slug")) {
      return {
        message: "That URL slug is already taken.",
        errors: { slug: "Already used by another entry. Choose a different one." },
      };
    }
    return { message: `A ${fields.join(", ") || "field"} with that value already exists.`, errors: {} };
  }

  if (code === "P2003" || code === "P2025") {
    return {
      message: "Something this entry points at no longer exists. Reload the page and try again.",
      errors: {},
    };
  }

  const detail =
    error instanceof Error ? (error.message.split(/\r?\n/)[0] ?? error.message) : "Unknown error";
  return { message: `Could not save: ${detail}`, errors: {} };
}

export async function saveResource(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();

  const def = resourceFrom(formData);
  if (!def) return fail("Unknown content type.");

  const idRaw = formData.get("__id");
  const id = typeof idRaw === "string" && idRaw.length > 0 ? idRaw : null;

  const parsed = parseForm(def.schema, formData);
  if (!parsed.success) return invalid(parsed.errors);

  const built = buildData(def, parsed.data as Record<string, unknown>);
  if (!built.ok) return invalid(built.errors);

  let newId = id;
  try {
    if (id) {
      await updateRow(def, id, built.data);
    } else {
      const created = await createRow(def, built.data);
      newId = String(created.id);
    }
  } catch (error) {
    const { message, errors } = describe(error);
    return fail(message, errors);
  }

  revalidatePath(`/${def.slug}`);
  if (newId) revalidatePath(`/${def.slug}/${newId}`);

  // A new entry has no URL of its own until it is saved, so creating one
  // redirects to its editor. Redirecting on every save instead would lose the
  // success notice, so an update stays put.
  if (!id && newId) redirect(`/${def.slug}/${newId}?created=1`);

  return ok("Saved. The website updates immediately.");
}

export async function deleteResource(formData: FormData): Promise<void> {
  await requireUser();

  const def = resourceFrom(formData);
  const id = formData.get("__id");
  if (!def || typeof id !== "string" || id.length === 0) return;

  // Deleting is permanent, so confirm the row exists first and report through
  // the list rather than failing silently.
  const row = await findRow(def, id);
  if (!row) redirect(`/${def.slug}?gone=1`);

  try {
    await deleteRow(def, id);
  } catch {
    redirect(`/${def.slug}/${id}?undeletable=1`);
  }

  revalidatePath(`/${def.slug}`);
  redirect(`/${def.slug}?deleted=1`);
}

export async function toggleResourceStatus(formData: FormData): Promise<void> {
  await requireUser();

  const def = resourceFrom(formData);
  const id = formData.get("__id");
  const next = formData.get("__status");
  if (!def || typeof id !== "string" || (next !== "PUBLISHED" && next !== "DRAFT")) return;

  await setRowStatus(def, id, next);

  revalidatePath(`/${def.slug}`);
  revalidatePath(`/${def.slug}/${id}`);
}
