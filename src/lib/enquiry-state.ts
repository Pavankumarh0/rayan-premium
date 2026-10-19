import type { FieldErrors } from "./validation";

/**
 * Form state for the enquiry action.
 *
 * This lives outside the `"use server"` module on purpose: a server-action file
 * may only export async functions, so exporting the initial state object from
 * there silently yields `undefined` on the client and the form crashes on its
 * first render.
 */

/**
 * What the visitor typed, echoed back so a validation error does not wipe the
 * form. React 19 resets a form whose `action` is a function once the action
 * resolves, and that reset restores each input to its `defaultValue` — so the
 * values have to come back through state for the fields to survive.
 */
export type EnquiryValues = {
  name: string;
  phone: string;
  email: string;
  message: string;
  travelDate: string;
  passengers: string;
  pickup: string;
  dropoff: string;
};

export const emptyEnquiryValues: EnquiryValues = {
  name: "",
  phone: "",
  email: "",
  message: "",
  travelDate: "",
  passengers: "",
  pickup: "",
  dropoff: "",
};

export type EnquiryState = {
  status: "idle" | "success" | "error";
  message: string;
  errors: FieldErrors;
  values: EnquiryValues;
};

export const initialEnquiryState: EnquiryState = {
  status: "idle",
  message: "",
  errors: {},
  values: emptyEnquiryValues,
};

/** Pulls the echo-back values straight off the submitted FormData. */
export function readEnquiryValues(formData: FormData): EnquiryValues {
  const get = (key: keyof EnquiryValues): string => {
    const value = formData.get(key);
    return typeof value === "string" ? value.slice(0, 2000) : "";
  };

  return {
    name: get("name"),
    phone: get("phone"),
    email: get("email"),
    message: get("message"),
    travelDate: get("travelDate"),
    passengers: get("passengers"),
    pickup: get("pickup"),
    dropoff: get("dropoff"),
  };
}
