"use client";

import { Lock } from "lucide-react";
import { FormShell, SwitchField, TextField, TextareaField } from "@/components/form";
import { initialFormState } from "@/lib/form-state";
import type { SettingDef, SettingGroup } from "@/lib/settings";
import { saveSettings } from "./actions";

/**
 * Renders every setting from the catalogue, grouped.
 *
 * The form is generated from SETTING_DEFS rather than hand-written, so adding
 * a setting is a one-line change in lib/settings.ts and it appears here with
 * the right control, help text and validation automatically.
 */
export function SettingsForm({
  groups,
  values,
  secretsSet,
}: {
  groups: Array<{ key: SettingGroup; title: string; defs: SettingDef[] }>;
  values: Record<string, string>;
  /** Which secret fields already hold a value, so we can say so without showing it. */
  secretsSet: Record<string, boolean>;
}) {
  return (
    <FormShell action={saveSettings} initialState={initialFormState}>
      <div className="grid gap-5">
        {groups.map((group) => (
          <section key={group.key} id={group.key} className="card card-pad scroll-mt-20">
            <h2 className="text-lg">{group.title}</h2>

            <div className="field-grid mt-4">
              {group.defs.map((def) => {
                const value = values[def.key] ?? "";

                if (def.type === "boolean") {
                  return (
                    <SwitchField
                      key={def.key}
                      name={def.key}
                      label={def.label}
                      hint={def.help}
                      defaultChecked={value === "true"}
                    />
                  );
                }

                if (def.type === "textarea") {
                  return (
                    <TextareaField
                      key={def.key}
                      name={def.key}
                      label={def.label}
                      hint={def.help}
                      defaultValue={value}
                      rows={3}
                    />
                  );
                }

                if (def.secret) {
                  return (
                    <TextField
                      key={def.key}
                      name={def.key}
                      label={def.label}
                      type="password"
                      defaultValue=""
                      placeholder={secretsSet[def.key] ? "••••••••  (unchanged)" : ""}
                      hint={
                        secretsSet[def.key]
                          ? "A value is stored. Leave blank to keep it, or type a new one to replace it."
                          : def.help
                      }
                    />
                  );
                }

                const type =
                  def.type === "email"
                    ? "email"
                    : def.type === "tel"
                      ? "tel"
                      : def.type === "url"
                        ? "url"
                        : def.type === "number"
                          ? "number"
                          : "text";

                return (
                  <TextField
                    key={def.key}
                    name={def.key}
                    label={def.label}
                    type={type}
                    defaultValue={value}
                    hint={def.help}
                    required={def.requiredForLaunch}
                    span={def.type === "image"}
                  />
                );
              })}
            </div>

            {group.key === "email" ? (
              <p className="notice notice-info mt-4">
                <Lock size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                Enquiries are always saved to the inbox. These details only control whether an
                email alert is also sent — leave them blank to skip email entirely.
              </p>
            ) : null}
          </section>
        ))}
      </div>
    </FormShell>
  );
}
