import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { findSection } from "@/lib/pages-db";
import { getSectionDef, parseSectionData } from "@/lib/sections";
import { PageHeader } from "@/components/ui";
import { SectionForm } from "./section-form";
import { deleteSectionAction } from "../../../actions";

type Props = {
  params: Promise<{ id: string; sectionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const section = await findSection((await params).sectionId);
  const def = section ? getSectionDef(section.type) : undefined;
  return { title: def?.label ?? "Section" };
}

export const dynamic = "force-dynamic";

export default async function SectionEditor({ params, searchParams }: Props) {
  await requireUser();

  const { id, sectionId } = await params;
  const [section, query] = await Promise.all([findSection(sectionId), searchParams]);
  if (!section || section.pageId !== id) notFound();

  const def = getSectionDef(section.type);

  // A row whose type is no longer registered cannot be edited meaningfully,
  // but it can still be removed — so say so rather than 404.
  if (!def) {
    return (
      <>
        <Link href={`/pages/${id}`} className="btn btn-ghost btn-sm mb-3 -ml-2">
          <ChevronLeft size={15} aria-hidden="true" />
          {section.page.title}
        </Link>
        <PageHeader title="Unknown section type" />
        <p className="notice notice-danger">
          This section is of type <code>{section.type}</code>, which the website no longer knows
          how to render. It is ignored on the public page. You can remove it below.
        </p>
        <form action={deleteSectionAction} className="mt-5">
          <input type="hidden" name="sectionId" value={section.id} readOnly />
          <button type="submit" className="btn btn-danger btn-sm">
            <Trash2 size={14} aria-hidden="true" />
            Remove this section
          </button>
        </form>
      </>
    );
  }

  const values = parseSectionData(section.type, section.data);

  return (
    <>
      <Link href={`/pages/${id}`} className="btn btn-ghost btn-sm mb-3 -ml-2">
        <ChevronLeft size={15} aria-hidden="true" />
        {section.page.title}
      </Link>

      <PageHeader title={def.label} description={def.description} />

      {query.added !== undefined ? (
        <p className="notice notice-ok mb-5" role="status">
          Section added, with this type&rsquo;s default wording. Edit it below and save.
        </p>
      ) : null}

      <SectionForm
        sectionId={section.id}
        fields={def.fields}
        values={values}
        isVisible={section.isVisible}
      />

      {/*
        Removal sits outside the editor form and behind a disclosure: it is
        permanent, and hiding the section is almost always what was meant.
      */}
      <section className="border-danger/30 mt-8 rounded-md border border-dashed p-4">
        <details>
          <summary className="text-danger cursor-pointer text-sm font-medium">
            Remove this section
          </summary>
          <div className="mt-3">
            <p className="text-ink-muted mb-3 text-sm">
              This cannot be undone. To take it off the page but keep the wording, turn off
              &ldquo;Show this section&rdquo; above instead.
            </p>
            <form action={deleteSectionAction}>
              <input type="hidden" name="sectionId" value={section.id} readOnly />
              <button type="submit" className="btn btn-danger btn-sm">
                <Trash2 size={14} aria-hidden="true" />
                Remove permanently
              </button>
            </form>
          </div>
        </details>
      </section>
    </>
  );
}
