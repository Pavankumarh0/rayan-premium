import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getSettings, SETTING_DEFS, SETTING_GROUPS, type SettingGroup } from "@/lib/settings";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdmin();
  const values = await getSettings();

  const groups = (Object.keys(SETTING_GROUPS) as SettingGroup[]).map((key) => ({
    key,
    title: SETTING_GROUPS[key],
    defs: SETTING_DEFS.filter((def) => def.group === key),
  }));

  // Report only whether a secret is set, never the value itself.
  const secretsSet = Object.fromEntries(
    SETTING_DEFS.filter((def) => def.secret).map((def) => [
      def.key,
      (values[def.key] ?? "").length > 0,
    ]),
  );

  return (
    <>
      <PageHeader
        title="Settings"
        description="Branding, contact details, SEO and email. Changes appear on the website immediately."
      />

      <nav aria-label="Settings sections" className="mb-5 flex flex-wrap gap-1.5">
        {groups.map((group) => (
          <a key={group.key} href={`#${group.key}`} className="btn btn-secondary btn-sm">
            {group.title}
          </a>
        ))}
      </nav>

      <SettingsForm groups={groups} values={values} secretsSet={secretsSet} />
    </>
  );
}
