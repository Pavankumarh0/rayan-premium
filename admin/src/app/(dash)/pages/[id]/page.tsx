import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  Plus,
  Trash2,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { describeSection, findPage, sectionChoices } from "@/lib/pages-db";
import { getSectionDef } from "@/lib/sections";
import { PageHeader } from "@/components/ui";
import { PageSettingsForm } from "./page-settings-form";
import {
  addSectionAction,
  deleteSectionAction,
  moveSectionAction,
  toggleSectionAction,
} from "../actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await findPage((await params).id);
  return { title: page ? page.title : "Not found" };
}

export const dynamic = "force-dynamic";

export default async function PageEditor({ params, searchParams }: Props) {
  await requireUser();

  const { id } = await params;
  const [page, query] = await Promise.all([findPage(id), searchParams]);
  if (!page) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const publicPath = `/${page.slug === "home" ? "" : page.slug}`;
  const choices = sectionChoices();

  return (
    <>
      <Link href="/pages" className="btn btn-ghost btn-sm mb-3 -ml-2">
        <ChevronLeft size={15} aria-hidden="true" />
        Pages &amp; sections
      </Link>

      <PageHeader
        title={page.title}
        description={
          page.isSystem
            ? "A built-in page. Its wording and sections are yours to change; its address is fixed because a route depends on it."
            : "Saved changes appear on the website immediately."
        }
        actions={
          page.status === "PUBLISHED" ? (
            <a
              href={`${siteUrl}${publicPath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              <ExternalLink size={14} aria-hidden="true" />
              View on site
            </a>
          ) : null
        }
      />

      {query.removed !== undefined ? (
        <p className="notice notice-ok mb-5" role="status">
          Section removed.
        </p>
      ) : null}

      {/* Sections ----------------------------------------------------------- */}
      <section className="card card-pad mb-5">
        <h2 className="border-line mb-4 border-b pb-2 text-base">
          Sections
          <span className="text-ink-faint ml-2 text-sm font-normal">
            in the order they appear on the page
          </span>
        </h2>

        {page.sections.length === 0 ? (
          <p className="text-ink-muted mb-4 text-sm">
            This page has no sections yet, so it renders only its heading. Add one below.
          </p>
        ) : (
          <ol className="mb-5 grid gap-2">
            {page.sections.map((section, index) => {
              const def = getSectionDef(section.type);
              const summary = describeSection(section.type, section.data);
              return (
                <li
                  key={section.id}
                  className="border-line bg-surface flex items-start gap-3 rounded-md border p-3"
                >
                  <span className="text-ink-faint w-5 shrink-0 pt-0.5 text-xs tabular-nums">
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/pages/${page.id}/sections/${section.id}`}
                      className="font-medium hover:underline"
                    >
                      {def?.label ?? section.type}
                    </Link>
                    {!section.isVisible ? (
                      <span className="badge badge-muted ml-2">Hidden</span>
                    ) : null}
                    {!def ? (
                      <span className="badge badge-danger ml-2" title={section.type}>
                        Unknown type
                      </span>
                    ) : null}
                    {summary ? (
                      <p className="text-ink-muted mt-0.5 truncate text-sm">{summary}</p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <form action={moveSectionAction}>
                      <input type="hidden" name="sectionId" value={section.id} readOnly />
                      <input type="hidden" name="pageId" value={page.id} readOnly />
                      <input type="hidden" name="direction" value="up" readOnly />
                      <button
                        type="submit"
                        className="btn btn-ghost btn-sm"
                        disabled={index === 0}
                      >
                        ↑<span className="sr-only">Move {def?.label ?? "section"} up</span>
                      </button>
                    </form>

                    <form action={moveSectionAction}>
                      <input type="hidden" name="sectionId" value={section.id} readOnly />
                      <input type="hidden" name="pageId" value={page.id} readOnly />
                      <input type="hidden" name="direction" value="down" readOnly />
                      <button
                        type="submit"
                        className="btn btn-ghost btn-sm"
                        disabled={index === page.sections.length - 1}
                      >
                        ↓<span className="sr-only">Move {def?.label ?? "section"} down</span>
                      </button>
                    </form>

                    {/*
                      Hiding is the safe sibling of deleting: the wording is
                      kept and the section simply stops rendering.
                    */}
                    <form action={toggleSectionAction}>
                      <input type="hidden" name="sectionId" value={section.id} readOnly />
                      <input type="hidden" name="pageId" value={page.id} readOnly />
                      <button type="submit" className="btn btn-ghost btn-sm">
                        {section.isVisible ? (
                          <Eye size={14} aria-hidden="true" />
                        ) : (
                          <EyeOff size={14} aria-hidden="true" />
                        )}
                        <span className="sr-only">
                          {section.isVisible ? "Hide this section" : "Show this section"}
                        </span>
                      </button>
                    </form>

                    <Link
                      href={`/pages/${page.id}/sections/${section.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      Edit
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <details className="border-line rounded-md border border-dashed p-4">
          <summary className="cursor-pointer text-sm font-medium">
            <Plus size={14} aria-hidden="true" className="mr-1 inline" />
            Add a section
          </summary>
          <div className="mt-4 grid gap-5">
            {choices.map((group) => (
              <div key={group.group}>
                <p className="text-ink-faint mb-2 text-xs font-semibold tracking-[0.06em] uppercase">
                  {group.group}
                </p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {group.items.map((item) => (
                    <form key={item.type} action={addSectionAction}>
                      <input type="hidden" name="pageId" value={page.id} readOnly />
                      <input type="hidden" name="type" value={item.type} readOnly />
                      <button
                        type="submit"
                        className="border-line hover:border-line-strong w-full rounded-md border p-3 text-left transition-colors"
                      >
                        <span className="block text-sm font-medium">{item.label}</span>
                        <span className="text-ink-faint mt-0.5 block text-xs">
                          {item.description}
                        </span>
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      </section>

      {/* Page settings ------------------------------------------------------ */}
      <PageSettingsForm
        page={{
          id: page.id,
          title: page.title,
          slug: page.slug,
          template: page.template,
          status: page.status,
          isSystem: page.isSystem,
          sortOrder: page.sortOrder,
          metaTitle: page.metaTitle ?? "",
          metaDescription: page.metaDescription ?? "",
          ogImage: page.ogImage ?? "",
          canonicalUrl: page.canonicalUrl ?? "",
          noindex: page.noindex,
        }}
        siteUrl={siteUrl}
      />

      {page.isSystem ? (
        <p className="text-ink-faint mt-4 flex items-start gap-2 text-sm">
          <Lock size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
          This page backs a built-in route, so it cannot be deleted and its address is fixed.
          Everything else about it is editable.
        </p>
      ) : null}
    </>
  );
}
