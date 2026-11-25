"use client";

import { initialFormState } from "@/lib/form-state";
import { FormShell, SelectField, SwitchField, TextField, TextareaField } from "@/components/form";
import { saveRedirect } from "./actions";

export function RedirectForm({
  item,
}: {
  item: {
    id: string | null;
    source: string;
    destination: string;
    statusCode: number;
    isActive: boolean;
    note: string;
  };
}) {
  return (
    <FormShell action={saveRedirect} initialState={initialFormState}>
      {(state) => (
        <>
          <input type="hidden" name="id" value={item.id ?? ""} readOnly />

          <section className="card card-pad">
            <div className="field-grid">
              <TextField
                name="source"
                label="From"
                defaultValue={item.source}
                required
                placeholder="/old-page"
                hint="The old path, starting with /. Not a full address."
                span
                error={state.errors.source}
              />

              <TextField
                name="destination"
                label="To"
                defaultValue={item.destination}
                required
                placeholder="/fleet/force-urbania-dx"
                hint="Where it should go instead — a path on this site, or a full https:// address."
                span
                error={state.errors.destination}
              />

              <SelectField
                name="statusCode"
                label="Kind"
                options={[
                  { value: "301", label: "Permanent — the page has moved for good" },
                  { value: "302", label: "Temporary — it will come back" },
                ]}
                defaultValue={String(item.statusCode)}
                hint="Permanent tells search engines to transfer the old page's ranking. Use it unless the move is genuinely temporary."
                error={state.errors.statusCode}
              />

              <TextareaField
                name="note"
                label="Note"
                defaultValue={item.note}
                hint="For your own records. Never shown publicly — say why this rule exists so the next person knows whether it is still needed."
                rows={2}
                error={state.errors.note}
              />

              <SwitchField
                name="isActive"
                label="Rule is on"
                defaultChecked={item.isActive}
                hint="Turn off to stop redirecting without deleting the rule."
              />
            </div>
          </section>
        </>
      )}
    </FormShell>
  );
}
