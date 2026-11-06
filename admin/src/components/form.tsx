"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, GripVertical, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FormState } from "@/lib/form-state";

/**
 * Form primitives shared by every editor.
 *
 * All of them are uncontrolled and read back through FormData, so a server
 * action is the single source of truth and nothing needs client state to
 * stay in sync. The only stateful one is JsonListField, which has to be:
 * it edits an array.
 */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  span,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  span?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(span && "field-span")}>
      <label htmlFor={htmlFor} className="label">
        {label}
        {required ? <span className="text-danger ml-1">*</span> : null}
      </label>
      {children}
      {hint ? <span className="hint">{hint}</span> : null}
      {error ? (
        <span className="error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function TextField({
  name,
  label,
  defaultValue,
  error,
  hint,
  required,
  type = "text",
  placeholder,
  span,
  maxLength,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  error?: string;
  hint?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  span?: boolean;
  maxLength?: number;
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint} error={error} required={required} span={span}>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        className="input"
      />
    </Field>
  );
}

export function TextareaField({
  name,
  label,
  defaultValue,
  error,
  hint,
  rows = 4,
  span = true,
  mono,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  error?: string;
  hint?: string;
  rows?: number;
  span?: boolean;
  mono?: boolean;
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint} error={error} span={span}>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        className={cn("input", mono && "input-code")}
      />
    </Field>
  );
}

export function SelectField({
  name,
  label,
  options,
  defaultValue,
  error,
  hint,
}: {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  defaultValue?: string | null;
  error?: string;
  hint?: string;
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint} error={error}>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? options[0]?.value}
        className="input"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function SwitchField({
  name,
  label,
  defaultChecked,
  hint,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  return (
    <div className="field-span">
      <div className="flex items-start gap-3">
        <input
          id={name}
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          className="checkbox mt-0.5"
        />
        <div>
          <label htmlFor={name} className="label mb-0 cursor-pointer">
            {label}
          </label>
          {hint ? <span className="hint mt-0.5">{hint}</span> : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Edits a JSON array of objects — feature lists, specifications, itineraries
 * and the like.
 *
 * The value is kept in React state and mirrored into one hidden input as
 * JSON, so the server action receives it through ordinary FormData and the
 * same Zod schema validates it on the way in. Reordering is buttons rather
 * than drag-and-drop: it works by keyboard, on touch, and with a screen
 * reader, which drag-and-drop does not without a lot of extra code.
 */
export function JsonListField<T extends Record<string, string>>({
  name,
  label,
  hint,
  fields,
  initial,
  addLabel = "Add item",
  error,
}: {
  name: string;
  label: string;
  hint?: string;
  fields: Array<{ key: keyof T & string; label: string; textarea?: boolean }>;
  initial: T[];
  addLabel?: string;
  error?: string;
}) {
  const blank = () =>
    Object.fromEntries(fields.map((f) => [f.key, ""])) as T;

  const [rows, setRows] = useState<T[]>(initial.length > 0 ? initial : []);

  const update = (index: number, key: string, value: string) =>
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));

  const move = (index: number, delta: number) =>
    setRows((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  return (
    <div className="field-span">
      <span className="label">{label}</span>
      {hint ? <span className="hint mb-2 mt-0">{hint}</span> : null}
      {error ? (
        <span className="error" role="alert">
          {error}
        </span>
      ) : null}

      <input type="hidden" name={name} value={JSON.stringify(rows)} readOnly />

      <div className="mt-2 grid gap-2">
        {rows.map((row, index) => (
          <div key={index} className="border-line bg-surface rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-ink-faint flex items-center gap-1.5 text-xs font-medium">
                <GripVertical size={13} aria-hidden="true" />
                Item {index + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="btn btn-ghost btn-sm"
                >
                  ↑<span className="sr-only">Move item {index + 1} up</span>
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === rows.length - 1}
                  className="btn btn-ghost btn-sm"
                >
                  ↓<span className="sr-only">Move item {index + 1} down</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                  className="btn btn-ghost btn-sm text-danger"
                >
                  <Trash2 size={13} aria-hidden="true" />
                  <span className="sr-only">Remove item {index + 1}</span>
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              {fields.map((field) => (
                <div key={field.key}>
                  <label
                    htmlFor={`${name}-${index}-${field.key}`}
                    className="text-ink-muted mb-1 block text-xs font-medium"
                  >
                    {field.label}
                  </label>
                  {field.textarea ? (
                    <textarea
                      id={`${name}-${index}-${field.key}`}
                      rows={2}
                      value={row[field.key] ?? ""}
                      onChange={(e) => update(index, field.key, e.target.value)}
                      className="input"
                    />
                  ) : (
                    <input
                      id={`${name}-${index}-${field.key}`}
                      type="text"
                      value={row[field.key] ?? ""}
                      onChange={(e) => update(index, field.key, e.target.value)}
                      className="input"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setRows((prev) => [...prev, blank()])}
        className="btn btn-secondary btn-sm mt-2"
      >
        <Plus size={14} aria-hidden="true" />
        {addLabel}
      </button>
    </div>
  );
}

/** A JSON array of plain strings — checklists, inclusions, exclusions. */
export function StringListField({
  name,
  label,
  hint,
  initial,
  addLabel = "Add line",
}: {
  name: string;
  label: string;
  hint?: string;
  initial: string[];
  addLabel?: string;
}) {
  const [rows, setRows] = useState<string[]>(initial);

  return (
    <div className="field-span">
      <span className="label">{label}</span>
      {hint ? <span className="hint mb-2 mt-0">{hint}</span> : null}
      <input type="hidden" name={name} value={JSON.stringify(rows)} readOnly />

      <div className="mt-2 grid gap-1.5">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <input
              type="text"
              aria-label={`${label} line ${index + 1}`}
              value={row}
              onChange={(e) =>
                setRows((prev) => prev.map((r, i) => (i === index ? e.target.value : r)))
              }
              className="input"
            />
            <button
              type="button"
              onClick={() =>
                setRows((prev) => {
                  const next = [...prev];
                  if (index === 0) return prev;
                  [next[index], next[index - 1]] = [next[index - 1]!, next[index]!];
                  return next;
                })
              }
              disabled={index === 0}
              className="btn btn-ghost btn-sm shrink-0"
            >
              ↑<span className="sr-only">Move line {index + 1} up</span>
            </button>
            <button
              type="button"
              onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
              className="btn btn-ghost btn-sm text-danger shrink-0"
            >
              <Trash2 size={13} aria-hidden="true" />
              <span className="sr-only">Remove line {index + 1}</span>
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setRows((prev) => [...prev, ""])}
        className="btn btn-secondary btn-sm mt-2"
      >
        <Plus size={14} aria-hidden="true" />
        {addLabel}
      </button>
    </div>
  );
}

function SaveBar({ extra }: { extra?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky-actions mt-6 flex items-center justify-end gap-2 px-1 py-3">
      {extra}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

/**
 * Wraps an editor form: runs the action, announces the outcome and keeps the
 * save button pinned to the bottom of long forms.
 */
export function FormShell({
  action,
  initialState,
  children,
  extraActions,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initialState: FormState;
  children: React.ReactNode | ((state: FormState) => React.ReactNode);
  extraActions?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const noticeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (state.status !== "idle") noticeRef.current?.focus();
  }, [state]);

  return (
    <form action={formAction} noValidate>
      <div ref={noticeRef} tabIndex={-1} role="status" aria-live="polite">
        {state.status !== "idle" ? (
          <p
            className={cn(
              "notice mb-5",
              state.status === "success" ? "notice-ok" : "notice-danger",
            )}
          >
            {state.status === "success" ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            )}
            {state.message}
          </p>
        ) : null}
      </div>

      {typeof children === "function" ? children(state) : children}

      <SaveBar extra={extraActions} />
    </form>
  );
}
