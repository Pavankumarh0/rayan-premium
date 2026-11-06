"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { SETTING_DEFS, updateSettings } from "@/lib/settings";
import { fail, ok, type FormState } from "@/lib/form-state";

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  // Settings change how the whole site behaves, so they are administrator-only.
  await requireAdmin();

  const values: Record<string, string> = {};

  for (const def of SETTING_DEFS) {
    if (def.type === "boolean") {
      // An unchecked switch submits nothing at all, so absence means false.
      values[def.key] = formData.get(def.key) === "on" ? "true" : "false";
      continue;
    }

    const raw = formData.get(def.key);
    if (raw === null) continue;
    if (typeof raw !== "string") continue;

    // A secret left blank means "keep what is stored", not "clear it" —
    // otherwise saving the page would wipe the SMTP password every time,
    // since it is never rendered back into the form.
    if (def.secret && raw.trim() === "") continue;

    values[def.key] = raw.trim();
  }

  let changed = 0;
  try {
    changed = await updateSettings(values);
  } catch (error) {
    // Surface the real reason rather than a generic apology: an editor who
    // can see "connection timeout" can tell someone useful.
    const detail =
      error instanceof Error ? (error.message.split(/\r?\n/)[0] ?? error.message) : "Unknown error";
    return fail(`Could not save: ${detail}`);
  }

  revalidatePath("/settings");
  revalidatePath("/");

  if (changed === 0) return ok("No changes to save.");
  return ok(
    changed === 1
      ? "1 setting saved. The website updates immediately."
      : `${changed} settings saved. The website updates immediately.`,
  );
}
