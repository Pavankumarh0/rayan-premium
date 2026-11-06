"use client";

import { ENQUIRY_STATUSES } from "@/lib/validation";
import { initialFormState } from "@/lib/form-state";
import { FormShell, SelectField, TextareaField } from "@/components/form";
import { STATUS_LABELS } from "../status";
import { updateEnquiry } from "../actions";

/** The only editable part of an enquiry: how it is being handled. */
export function TriageForm({
  id,
  status,
  internalNotes,
}: {
  id: string;
  status: string;
  internalNotes: string;
}) {
  return (
    <FormShell action={updateEnquiry} initialState={initialFormState}>
      {(state) => (
        <>
          <input type="hidden" name="id" value={id} readOnly />
          <div className="field-grid">
            <SelectField
              name="status"
              label="Status"
              options={ENQUIRY_STATUSES.map((value) => ({
                value,
                label: STATUS_LABELS[value],
              }))}
              defaultValue={status}
              error={state.errors.status}
            />
            <TextareaField
              name="internalNotes"
              label="Internal notes"
              defaultValue={internalNotes}
              hint="Only ever visible here. Never shown on the website or sent to the customer."
              rows={5}
              error={state.errors.internalNotes}
            />
          </div>
        </>
      )}
    </FormShell>
  );
}
