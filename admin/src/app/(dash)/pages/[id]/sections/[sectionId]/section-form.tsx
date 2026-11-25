"use client";

import { isRepeater, type FieldDef, type SimpleFieldDef } from "@/lib/sections";
import { initialFormState, type FormState } from "@/lib/form-state";
import {
  FormShell,
  JsonListField,
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
} from "@/components/form";
import { saveSection } from "../../../actions";

/**
 * A section's fields, generated from its entry in the section registry.
 *
 * Nothing here is written per section type: adding a field to the registry
 * gives it an input, and the same registry is what the public site renders
 * from, so the two cannot drift apart.
 */
export function SectionForm({
  sectionId,
  fields,
  values,
  isVisible,
}: {
  sectionId: string;
  fields: FieldDef[];
  values: Record<string, unknown>;
  isVisible: boolean;
}) {
  return (
    <FormShell action={saveSection} initialState={initialFormState}>
      {(state) => (
        <>
          <input type="hidden" name="id" value={sectionId} readOnly />

          <section className="card card-pad">
            <div className="field-grid">
              {fields.map((field) => (
                <Control key={field.name} field={field} values={values} state={state} />
              ))}
            </div>
          </section>

          <section className="card card-pad mt-5">
            <SwitchField
              name="isVisible"
              label="Show this section on the page"
              defaultChecked={isVisible}
              hint="Turn off to hide it without losing the wording."
            />
          </section>
        </>
      )}
    </FormShell>
  );
}

function str(values: Record<string, unknown>, name: string): string {
  const value = values[name];
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function Control({
  field,
  values,
  state,
}: {
  field: FieldDef;
  values: Record<string, unknown>;
  state: FormState;
}) {
  const error = state.errors[field.name];

  if (isRepeater(field)) {
    const raw = values[field.name];
    const initial = Array.isArray(raw) ? (raw as Array<Record<string, string>>) : [];
    return (
      <JsonListField
        name={field.name}
        label={field.label}
        hint={field.help}
        addLabel={field.addLabel}
        fields={field.fields.map((f: SimpleFieldDef) => ({
          key: f.name,
          label: f.label,
          textarea: f.type === "textarea" || f.type === "richtext",
        }))}
        initial={initial}
        error={error}
      />
    );
  }

  const span = field.span === 2;

  switch (field.type) {
    case "boolean":
      return (
        <SwitchField
          name={field.name}
          label={field.label}
          defaultChecked={values[field.name] === true}
          hint={field.help}
        />
      );

    case "select":
      return (
        <SelectField
          name={field.name}
          label={field.label}
          options={field.options ?? []}
          defaultValue={str(values, field.name)}
          hint={field.help}
          error={error}
        />
      );

    case "textarea":
      return (
        <TextareaField
          name={field.name}
          label={field.label}
          defaultValue={str(values, field.name)}
          hint={field.help}
          rows={3}
          error={error}
        />
      );

    case "richtext":
      return (
        <TextareaField
          name={field.name}
          label={field.label}
          defaultValue={str(values, field.name)}
          hint={field.help ?? "HTML. Headings, paragraphs, lists, links and bold are allowed."}
          rows={10}
          mono
          error={error}
        />
      );

    case "number":
      return (
        <TextField
          name={field.name}
          label={field.label}
          type="number"
          defaultValue={str(values, field.name)}
          hint={field.help}
          error={error}
        />
      );

    // text, image and link are all a single line; the help text on each one
    // is what tells an editor what belongs in it.
    default:
      return (
        <TextField
          name={field.name}
          label={field.label}
          defaultValue={str(values, field.name)}
          hint={field.help}
          placeholder={field.placeholder}
          span={span}
          maxLength={field.max}
          error={error}
        />
      );
  }
}
