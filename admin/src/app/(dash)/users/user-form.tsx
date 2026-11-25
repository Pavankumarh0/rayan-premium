"use client";

import { ROLES } from "@/lib/validation";
import { initialFormState } from "@/lib/form-state";
import { FormShell, SelectField, SwitchField, TextField } from "@/components/form";
import { createUser, updateUser } from "./actions";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator — everything, including settings and accounts",
  EDITOR: "Editor — content and enquiries only",
};

export function UserForm({
  user,
  isSelf,
}: {
  user: {
    id: string | null;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  isSelf: boolean;
}) {
  const isNew = user.id === null;

  return (
    <FormShell action={isNew ? createUser : updateUser} initialState={initialFormState}>
      {(state) => (
        <>
          {!isNew ? <input type="hidden" name="id" value={user.id ?? ""} readOnly /> : null}

          <section className="card card-pad">
            <div className="field-grid">
              <TextField
                name="name"
                label="Name"
                defaultValue={user.name}
                required
                error={state.errors.name}
              />
              <TextField
                name="email"
                label="Email address"
                type="email"
                defaultValue={user.email}
                required
                hint="Used to sign in."
                error={state.errors.email}
              />
              <SelectField
                name="role"
                label="Role"
                options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] ?? r }))}
                defaultValue={user.role}
                error={state.errors.role}
              />
              <TextField
                name="password"
                label={isNew ? "Password" : "New password"}
                type="password"
                required={isNew}
                hint={
                  isNew
                    ? "At least 10 characters, with a letter and a number."
                    : "Leave blank to keep the current password."
                }
                error={state.errors.password}
              />
              <SwitchField
                name="isActive"
                label="Account is active"
                defaultChecked={user.isActive}
                hint={
                  isSelf
                    ? "You cannot deactivate your own account."
                    : "Turning this off signs the person out on their next request."
                }
              />
            </div>
          </section>
        </>
      )}
    </FormShell>
  );
}
