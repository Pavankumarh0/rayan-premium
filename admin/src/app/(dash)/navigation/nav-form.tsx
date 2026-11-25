"use client";

import { NAV_MENUS } from "@/lib/validation";
import { initialFormState } from "@/lib/form-state";
import {
  FormShell,
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
} from "@/components/form";
import { saveNavItem } from "./actions";

const MENU_LABELS: Record<string, string> = {
  HEADER: "Header",
  FOOTER_MENU: "Footer — Explore",
  FOOTER_SERVICES: "Footer — Services",
  FOOTER_ROUTES: "Footer — Routes",
  LEGAL: "Legal",
};

export function NavForm({
  item,
  parents,
}: {
  item: {
    id: string | null;
    menu: string;
    label: string;
    url: string;
    parentId: string;
    description: string;
    openInNewTab: boolean;
    isVisible: boolean;
    sortOrder: number;
  };
  /** Candidate parents: top-level items only, never this item itself. */
  parents: Array<{ id: string; label: string; menu: string }>;
}) {
  return (
    <FormShell action={saveNavItem} initialState={initialFormState}>
      {(state) => (
        <>
          <input type="hidden" name="id" value={item.id ?? ""} readOnly />

          <section className="card card-pad">
            <div className="field-grid">
              <TextField
                name="label"
                label="Label"
                defaultValue={item.label}
                required
                hint="What a visitor reads."
                error={state.errors.label}
              />

              <TextField
                name="url"
                label="Link"
                defaultValue={item.url}
                required
                placeholder="/fleet"
                hint="A path on this site, like /fleet, or a full https:// address."
                error={state.errors.url}
              />

              <SelectField
                name="menu"
                label="Menu"
                options={NAV_MENUS.map((m) => ({ value: m, label: MENU_LABELS[m] ?? m }))}
                defaultValue={item.menu}
                hint="Ignored when this item sits inside another: it follows its parent."
                error={state.errors.menu}
              />

              <SelectField
                name="parentId"
                label="Sits inside"
                options={[
                  { value: "", label: "Nothing — top level" },
                  ...parents.map((p) => ({
                    value: p.id,
                    label: `${p.label} (${MENU_LABELS[p.menu] ?? p.menu})`,
                  })),
                ]}
                defaultValue={item.parentId}
                hint="Menus are one level deep. Only the header shows a dropdown."
                error={state.errors.parentId}
              />

              <TextareaField
                name="description"
                label="Description"
                defaultValue={item.description}
                hint="Shown under the label in the header dropdown. Left blank elsewhere."
                rows={2}
                error={state.errors.description}
              />

              <TextField
                name="sortOrder"
                label="Sort order"
                type="number"
                defaultValue={String(item.sortOrder)}
                hint="Lower numbers come first. The arrows on the list do this for you."
                error={state.errors.sortOrder}
              />

              <SwitchField
                name="isVisible"
                label="Show this item"
                defaultChecked={item.isVisible}
                hint="Turn off to take it out of the menu without deleting it."
              />

              <SwitchField
                name="openInNewTab"
                label="Open in a new tab"
                defaultChecked={item.openInNewTab}
                hint="Use for links that leave this website."
              />
            </div>
          </section>
        </>
      )}
    </FormShell>
  );
}
