"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { usePathname } from "next/navigation";
import { CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitEnquiry } from "@/app/actions/enquiry";
import { initialEnquiryState } from "@/lib/enquiry-state";

export type EnquiryFormProps = {
  type?: "GENERAL" | "VEHICLE" | "SERVICE" | "DESTINATION" | "PACKAGE";
  subject?: string;
  vehicleId?: string;
  serviceId?: string;
  destinationId?: string;
  packageId?: string;
  tone?: "light" | "dark";
  /** Trip fields are noise on a short "ask a question" form. */
  showTripFields?: boolean;
  heading?: string;
};

function Field({
  label,
  name,
  error,
  children,
  required,
  help,
  className,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  help?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="field-label">
        {label}
        {required ? (
          <span className="text-brand-dim ml-1" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1.5 opacity-55 lowercase">(optional)</span>
        )}
      </label>
      {children}
      {help ? (
        <span id={`${name}-help`} className="field-help">
          {help}
        </span>
      ) : null}
      {error ? (
        <span id={`${name}-error`} className="field-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function SubmitButton({ tone }: { tone: "light" | "dark" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-brand w-full sm:w-auto" disabled={pending}>
      {pending ? "Sending…" : "Send enquiry"}
    </button>
  );
}

export function EnquiryForm({
  type = "GENERAL",
  subject,
  vehicleId,
  serviceId,
  destinationId,
  packageId,
  tone = "light",
  showTripFields = true,
  heading,
}: EnquiryFormProps) {
  const [state, formAction] = useActionState(submitEnquiry, initialEnquiryState);
  const pathname = usePathname();
  const statusRef = useRef<HTMLDivElement | null>(null);
  const [mountedAt] = useState(() => Date.now());
  const headingId = useId();

  // Move focus to the status message so the outcome is announced rather than
  // silently replacing the form for a screen-reader or keyboard user.
  useEffect(() => {
    if (state.status === "idle") return;
    statusRef.current?.focus();
  }, [state]);

  const err = (name: string) => state.errors[name];
  const describedBy = (name: string, hasHelp = false) =>
    [err(name) ? `${name}-error` : null, hasHelp ? `${name}-help` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <form
      action={formAction}
      aria-labelledby={heading ? headingId : undefined}
      className={cn(tone === "dark" && "tone-deep")}
      noValidate
    >
      {heading ? (
        <h2 id={headingId} className="font-display text-headline mb-7">
          {heading}
        </h2>
      ) : null}

      {/* Context — never rendered as user-visible text. */}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="sourcePath" value={pathname} />
      {subject ? <input type="hidden" name="subject" value={subject} /> : null}
      {vehicleId ? <input type="hidden" name="vehicleId" value={vehicleId} /> : null}
      {serviceId ? <input type="hidden" name="serviceId" value={serviceId} /> : null}
      {destinationId ? <input type="hidden" name="destinationId" value={destinationId} /> : null}
      {packageId ? <input type="hidden" name="packageId" value={packageId} /> : null}
      <ElapsedField mountedAt={mountedAt} />

      {/* Honeypot: hidden from sight and from assistive tech, so only a bot fills it. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company (leave this field empty)</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={cn(state.status === "idle" && "sr-only")}
      >
        {state.status !== "idle" ? (
          <p
            className={cn(
              "mb-7 flex items-start gap-3 rounded-sm border p-4 text-small",
              state.status === "success"
                ? "border-success/35 bg-success-wash text-success"
                : "border-danger/35 bg-danger-wash text-danger",
            )}
          >
            {state.status === "success" ? (
              <CheckCircle2 size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
            ) : (
              <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
            )}
            {state.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" name="name" error={err("name")} required>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={state.values.name}
            autoComplete="name"
            maxLength={120}
            className="field-input"
            aria-invalid={err("name") ? true : undefined}
            aria-describedby={describedBy("name")}
          />
        </Field>

        <Field label="Phone" name="phone" error={err("phone")} required help="With country code if outside India.">
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            defaultValue={state.values.phone}
            inputMode="tel"
            autoComplete="tel"
            maxLength={24}
            className="field-input"
            aria-invalid={err("phone") ? true : undefined}
            aria-describedby={describedBy("phone", true)}
          />
        </Field>

        <Field label="Email" name="email" error={err("email")} className="sm:col-span-2">
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={state.values.email}
            autoComplete="email"
            maxLength={200}
            className="field-input"
            aria-invalid={err("email") ? true : undefined}
            aria-describedby={describedBy("email")}
          />
        </Field>

        {showTripFields ? (
          <>
            <Field label="Travel date" name="travelDate" error={err("travelDate")}>
              <input
                id="travelDate"
                name="travelDate"
                type="date"
                defaultValue={state.values.travelDate}
                className="field-input"
                aria-invalid={err("travelDate") ? true : undefined}
                aria-describedby={describedBy("travelDate")}
              />
            </Field>

            <Field label="Passengers" name="passengers" error={err("passengers")}>
              <input
                id="passengers"
                name="passengers"
                type="number"
                defaultValue={state.values.passengers}
                min={1}
                max={200}
                inputMode="numeric"
                className="field-input"
                aria-invalid={err("passengers") ? true : undefined}
                aria-describedby={describedBy("passengers")}
              />
            </Field>

            <Field label="Pick-up" name="pickup" error={err("pickup")}>
              <input
                id="pickup"
                name="pickup"
                type="text"
                defaultValue={state.values.pickup}
                maxLength={200}
                className="field-input"
                aria-invalid={err("pickup") ? true : undefined}
                aria-describedby={describedBy("pickup")}
              />
            </Field>

            <Field label="Destination" name="dropoff" error={err("dropoff")}>
              <input
                id="dropoff"
                name="dropoff"
                type="text"
                defaultValue={state.values.dropoff}
                maxLength={200}
                className="field-input"
                aria-invalid={err("dropoff") ? true : undefined}
                aria-describedby={describedBy("dropoff")}
              />
            </Field>
          </>
        ) : null}

        <Field label="Message" name="message" error={err("message")} className="sm:col-span-2">
          <textarea
            id="message"
            name="message"
            rows={4}
            defaultValue={state.values.message}
            maxLength={2000}
            className="field-input"
            aria-invalid={err("message") ? true : undefined}
            aria-describedby={describedBy("message")}
          />
        </Field>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SubmitButton tone={tone} />
        <p
          className={cn(
            "text-micro",
            tone === "light" ? "text-on-light-faint" : "text-on-dark-faint",
          )}
        >
          We use your details only to respond to this enquiry.
        </p>
      </div>
    </form>
  );
}

/**
 * Records how long the form was on screen. Written from an effect so the value
 * is only ever present for a real browser session.
 */
function ElapsedField({ mountedAt }: { mountedAt: number }) {
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const update = () => {
      if (ref.current) ref.current.value = String(Date.now() - mountedAt);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [mountedAt]);

  return <input ref={ref} type="hidden" name="elapsed" defaultValue="0" />;
}
