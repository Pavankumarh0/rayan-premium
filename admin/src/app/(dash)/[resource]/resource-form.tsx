"use client";

import Image from "next/image";
import { useState } from "react";
import type { FieldDef, FieldGroup } from "@/lib/resources";
import type { FormValues, RelationOptions } from "@/lib/resource-db";
import { initialFormState, type FormState } from "@/lib/form-state";
import {
  Field,
  FormShell,
  JsonListField,
  SelectField,
  StringListField,
  SwitchField,
  TextField,
  TextareaField,
} from "@/components/form";
import { saveResource } from "./actions";

/**
 * Renders the editor for any content type from its field groups.
 *
 * Only plain data crosses from the server: the registry's Zod schemas and
 * `publicPath` function stay on the server side, because a client component's
 * props have to be serialisable.
 */
export function ResourceForm({
  resource,
  id,
  groups,
  values,
  relations,
  siteUrl,
}: {
  resource: string;
  id: string | null;
  groups: FieldGroup[];
  values: FormValues;
  relations: RelationOptions;
  /** Where image paths resolve — the public site, not this dashboard. */
  siteUrl: string;
}) {
  return (
    <FormShell action={saveResource} initialState={initialFormState}>
      {(state) => (
        <>
          <input type="hidden" name="__resource" value={resource} readOnly />
          <input type="hidden" name="__id" value={id ?? ""} readOnly />

          <div className="grid gap-5">
            {groups.map((group) => (
              <section key={group.heading} className="card card-pad">
                <h2 className="border-line mb-4 border-b pb-2 text-base">{group.heading}</h2>
                <div className="field-grid">
                  {group.fields.map((field) => (
                    <Control
                      key={field.k}
                      field={field}
                      values={values}
                      relations={relations}
                      state={state}
                      siteUrl={siteUrl}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </FormShell>
  );
}

function str(values: FormValues, key: string): string {
  const value = values[key];
  return typeof value === "string" ? value : "";
}

function bool(values: FormValues, key: string): boolean {
  return values[key] === true;
}

function Control({
  field,
  values,
  relations,
  state,
  siteUrl,
}: {
  field: FieldDef;
  values: FormValues;
  relations: RelationOptions;
  state: FormState;
  siteUrl: string;
}) {
  const error = state.errors[field.k];

  switch (field.t) {
    case "text":
    case "slug":
    case "link":
      return (
        <TextField
          name={field.k}
          label={field.label}
          defaultValue={str(values, field.k)}
          hint={field.hint}
          error={error}
          required={field.required}
          span={field.span}
          placeholder={field.placeholder}
        />
      );

    case "image":
      return (
        <ImageField
          name={field.k}
          label={field.label}
          defaultValue={str(values, field.k)}
          hint={field.hint}
          error={error}
          required={field.required}
          siteUrl={siteUrl}
        />
      );

    case "number":
      return (
        <TextField
          name={field.k}
          label={field.label}
          type="number"
          defaultValue={str(values, field.k)}
          hint={field.hint}
          error={error}
        />
      );

    case "textarea":
      return (
        <TextareaField
          name={field.k}
          label={field.label}
          defaultValue={str(values, field.k)}
          hint={field.hint}
          error={error}
          rows={field.rows}
        />
      );

    case "richtext":
      return (
        <TextareaField
          name={field.k}
          label={field.label}
          defaultValue={str(values, field.k)}
          hint={field.hint}
          error={error}
          rows={field.rows ?? 10}
          mono
        />
      );

    case "select":
      return (
        <SelectField
          name={field.k}
          label={field.label}
          options={field.options}
          defaultValue={str(values, field.k)}
          hint={field.hint}
          error={error}
        />
      );

    case "switch":
      return (
        <SwitchField
          name={field.k}
          label={field.label}
          defaultChecked={bool(values, field.k)}
          hint={field.hint}
        />
      );

    case "relation": {
      const options = relations[field.model] ?? [];
      return (
        <SelectField
          name={field.k}
          label={field.label}
          options={[
            { value: "", label: options.length === 0 ? "None available yet" : "None" },
            ...options,
          ]}
          defaultValue={str(values, field.k)}
          hint={field.hint}
          error={error}
        />
      );
    }

    case "stringList":
      return (
        <StringListField
          name={field.k}
          label={field.label}
          hint={field.hint}
          addLabel={field.addLabel}
          initial={parseList<string>(str(values, field.k))}
        />
      );

    case "jsonList":
      return (
        <JsonListField
          name={field.k}
          label={field.label}
          hint={field.hint}
          addLabel={field.addLabel}
          fields={field.fields}
          initial={parseList<Record<string, string>>(str(values, field.k))}
          error={error}
        />
      );
  }
}

/**
 * Structured columns arrive as JSON text. A row that cannot be parsed is shown
 * as empty rather than crashing the editor — the same degradation the public
 * site applies, so the two never disagree about what a broken row means.
 */
function parseList<T>(raw: string): T[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}

/**
 * A path or URL, with a live preview.
 *
 * There is no upload button yet, so the preview is what tells an editor
 * whether the path they typed actually resolves — a broken path otherwise
 * looks identical to a working one until the public page is loaded.
 *
 * A stored path like `/placeholders/service-1.svg` is relative to the public
 * site, which is a different origin from this dashboard, so it is resolved
 * against the site URL rather than against the page it is rendered on.
 */
function ImageField({
  name,
  label,
  defaultValue,
  hint,
  error,
  required,
  siteUrl,
}: {
  name: string;
  label: string;
  defaultValue: string;
  hint?: string;
  error?: string;
  required?: boolean;
  siteUrl: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [broken, setBroken] = useState(false);
  const showable = value.startsWith("/") || /^https?:\/\//i.test(value);
  const src = value.startsWith("/") ? `${siteUrl.replace(/\/$/, "")}${value}` : value;

  return (
    <Field label={label} htmlFor={name} hint={hint} error={error} required={required} span>
      <div className="flex items-start gap-3">
        {showable && !broken ? (
          <span className="border-line bg-surface-sunken relative block h-16 w-24 shrink-0 overflow-hidden rounded border">
            <Image
              src={src}
              alt=""
              fill
              sizes="96px"
              unoptimized
              className="object-cover"
              onError={() => setBroken(true)}
            />
          </span>
        ) : null}
        <input
          id={name}
          name={name}
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setBroken(false);
          }}
          placeholder="/images/example.jpg"
          aria-invalid={error ? true : undefined}
          className="input"
        />
      </div>
      {showable && broken ? (
        <span className="hint text-danger">
          Nothing loads from that path. Check the spelling, or that the file exists in the public
          site&rsquo;s <code>public/</code> folder.
        </span>
      ) : null}
    </Field>
  );
}
