"use client";

import { PAGE_TEMPLATES, STATUSES } from "@/lib/validation";
import { initialFormState } from "@/lib/form-state";
import {
  FormShell,
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
} from "@/components/form";
import { savePage } from "../actions";

/**
 * A page's own settings, as opposed to the wording inside its sections.
 *
 * The slug is read-only on a built-in page: a route in the code looks it up
 * by name, so renaming it would point that route at nothing. It is shown
 * rather than hidden, because an editor still needs to know the address.
 */
export function PageSettingsForm({
  page,
  siteUrl,
}: {
  page: {
    id: string;
    title: string;
    slug: string;
    template: string;
    status: string;
    isSystem: boolean;
    sortOrder: number;
    metaTitle: string;
    metaDescription: string;
    ogImage: string;
    canonicalUrl: string;
    noindex: boolean;
  };
  siteUrl: string;
}) {
  return (
    <FormShell action={savePage} initialState={initialFormState}>
      {(state) => (
        <>
          <input type="hidden" name="id" value={page.id} readOnly />

          <div className="grid gap-5">
            <section className="card card-pad">
              <h2 className="border-line mb-4 border-b pb-2 text-base">Page</h2>
              <div className="field-grid">
                <TextField
                  name="title"
                  label="Title"
                  defaultValue={page.title}
                  required
                  error={state.errors.title}
                />

                {page.isSystem ? (
                  <TextField
                    name="slug_display"
                    label="Address"
                    defaultValue={`${siteUrl}/${page.slug === "home" ? "" : page.slug}`}
                    hint="Fixed: a built-in route looks this page up by name."
                  />
                ) : (
                  <TextField
                    name="slug"
                    label="URL slug"
                    defaultValue={page.slug}
                    required
                    hint="Changing this breaks existing links — add a redirect."
                    error={state.errors.slug}
                  />
                )}

                <SelectField
                  name="template"
                  label="Template"
                  options={PAGE_TEMPLATES.map((t) => ({
                    value: t,
                    label: t.charAt(0).toUpperCase() + t.slice(1),
                  }))}
                  defaultValue={page.template}
                  error={state.errors.template}
                />

                <SelectField
                  name="status"
                  label="Status"
                  options={STATUSES.map((s) => ({
                    value: s,
                    label: s === "PUBLISHED" ? "Published" : "Draft",
                  }))}
                  defaultValue={page.status}
                  hint="A draft page returns a 404 on the website."
                  error={state.errors.status}
                />

                <TextField
                  name="sortOrder"
                  label="Sort order"
                  type="number"
                  defaultValue={String(page.sortOrder)}
                  hint="Lower numbers come first in listings."
                  error={state.errors.sortOrder}
                />
              </div>
            </section>

            <section className="card card-pad">
              <h2 className="border-line mb-4 border-b pb-2 text-base">
                Search engine listing
              </h2>
              <div className="field-grid">
                <TextField
                  name="metaTitle"
                  label="Meta title"
                  defaultValue={page.metaTitle}
                  hint="Around 60 characters. Falls back to the page title."
                  span
                  error={state.errors.metaTitle}
                />
                <TextareaField
                  name="metaDescription"
                  label="Meta description"
                  defaultValue={page.metaDescription}
                  hint="Around 155 characters. Falls back to the site default in Settings → SEO."
                  rows={2}
                  error={state.errors.metaDescription}
                />
                <TextField
                  name="ogImage"
                  label="Social share image"
                  defaultValue={page.ogImage}
                  hint="1200×630. Falls back to the site default."
                  span
                  error={state.errors.ogImage}
                />
                <TextField
                  name="canonicalUrl"
                  label="Canonical URL"
                  defaultValue={page.canonicalUrl}
                  hint="Only set this if this page duplicates another one. Leave empty otherwise."
                  span
                  error={state.errors.canonicalUrl}
                />
                <SwitchField
                  name="noindex"
                  label="Hide from search engines"
                  defaultChecked={page.noindex}
                  hint="Keeps the page live but asks search engines not to list it."
                />
              </div>
            </section>
          </div>
        </>
      )}
    </FormShell>
  );
}
