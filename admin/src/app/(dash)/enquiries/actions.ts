"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { enquiryUpdateSchema, parseForm } from "@/lib/validation";
import { fail, invalid, ok, type FormState } from "@/lib/form-state";

/**
 * Enquiries are never edited, only triaged.
 *
 * What a customer submitted is a record of what they said, so the contact
 * details and the message are read-only here. Only the status and the internal
 * notes — the dashboard's own columns — can change.
 */
export async function updateEnquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();

  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return fail("Unknown enquiry.");

  const parsed = parseForm(enquiryUpdateSchema, formData);
  if (!parsed.success) return invalid(parsed.errors);

  try {
    await db.enquiry.update({
      where: { id },
      data: { status: parsed.data.status, internalNotes: parsed.data.internalNotes },
    });
  } catch (error) {
    const detail =
      error instanceof Error ? (error.message.split(/\r?\n/)[0] ?? error.message) : "Unknown error";
    return fail(`Could not save: ${detail}`);
  }

  revalidatePath("/enquiries");
  revalidatePath(`/enquiries/${id}`);
  revalidatePath("/");

  return ok("Saved.");
}

/** Status change straight from the list, without opening the enquiry. */
export async function setEnquiryStatus(formData: FormData): Promise<void> {
  await requireUser();

  const id = formData.get("id");
  const status = formData.get("status");
  if (typeof id !== "string" || typeof status !== "string") return;

  const allowed = ["NEW", "IN_PROGRESS", "QUOTED", "CLOSED", "SPAM"];
  if (!allowed.includes(status)) return;

  await db.enquiry.update({ where: { id }, data: { status } });

  revalidatePath("/enquiries");
  revalidatePath("/");
}
