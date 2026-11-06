import type { FieldErrors } from "@/lib/validation";

/**
 * Login form state.
 *
 * Kept out of actions.ts because a `"use server"` module may only export async
 * functions — exporting a plain object from one yields `undefined` on the
 * client and the form crashes on first render.
 */
export type LoginState = {
  status: "idle" | "error";
  message: string;
  /** Echoed back so a failed attempt does not clear the field. */
  email: string;
  errors?: FieldErrors;
};

export const initialLoginState: LoginState = {
  status: "idle",
  message: "",
  email: "",
};
