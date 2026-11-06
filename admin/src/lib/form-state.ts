import type { FieldErrors } from "./validation";

/**
 * Shared state shape for every editor form.
 *
 * Lives outside the server-action modules because a `"use server"` file may
 * only export async functions — exporting a plain object from one yields
 * `undefined` on the client and the form crashes on first render.
 */
export type FormState = {
  status: "idle" | "success" | "error";
  message: string;
  errors: FieldErrors;
};

export const initialFormState: FormState = {
  status: "idle",
  message: "",
  errors: {},
};

export function ok(message = "Saved."): FormState {
  return { status: "success", message, errors: {} };
}

export function fail(message: string, errors: FieldErrors = {}): FormState {
  return { status: "error", message, errors };
}

/** Turns the first validation failure into a sentence worth reading. */
export function invalid(errors: FieldErrors): FormState {
  const count = Object.keys(errors).length;
  return fail(
    count === 1
      ? "One field needs attention."
      : `${count} fields need attention.`,
    errors,
  );
}
