"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { login, createFirstAdmin } from "./actions";
import { initialLoginState } from "./state";

function Submit({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary mt-5 w-full" disabled={pending}>
      {pending ? busy : label}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState(login, initialLoginState);

  return (
    <form action={action} noValidate>
      {state.status === "error" ? (
        <p className="notice notice-danger mb-5" role="alert">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      ) : null}

      <div className="mb-4">
        <label htmlFor="email" className="label">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          defaultValue={state.email}
          className="input"
        />
      </div>

      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </div>

      <Submit label="Sign in" busy="Signing in…" />
    </form>
  );
}

/** Shown only when the database has no accounts at all. */
export function FirstAdminForm() {
  const [state, action] = useActionState(createFirstAdmin, initialLoginState);
  const err = (name: string) => state.errors?.[name];

  return (
    <form action={action} noValidate>
      {state.status === "error" ? (
        <p className="notice notice-danger mb-5" role="alert">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      ) : null}

      <div className="mb-4">
        <label htmlFor="name" className="label">
          Your name
        </label>
        <input id="name" name="name" type="text" required className="input" />
        {err("name") ? <span className="error">{err("name")}</span> : null}
      </div>

      <div className="mb-4">
        <label htmlFor="email" className="label">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          defaultValue={state.email}
          className="input"
        />
        {err("email") ? <span className="error">{err("email")}</span> : null}
      </div>

      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className="input"
          aria-describedby="password-hint"
        />
        <span id="password-hint" className="hint">
          At least 10 characters, including a letter and a number.
        </span>
        {err("password") ? <span className="error">{err("password")}</span> : null}
      </div>

      <input type="hidden" name="role" value="ADMIN" />
      <input type="hidden" name="isActive" value="on" />

      <Submit label="Create account" busy="Creating…" />
    </form>
  );
}
