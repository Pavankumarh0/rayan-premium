import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getResource } from "@/lib/resources";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { cellsSchema, columnsSchema } from "@/lib/validation";
import { findRow, relationOptions, toFormValues } from "@/lib/resource-db";
import { PageHeader } from "@/components/ui";
import { ResourceForm } from "../resource-form";
import { deleteResource } from "../actions";
import { TariffRows } from "./tariff-rows";

type Props = {
  params: Promise<{ resource: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { resource, id } = await params;
  const def = getResource(resource);
  if (!def) return { title: "Not found" };
  const row = await findRow(def, id);
  const title = row ? String(row[def.titleField] ?? "").trim() : "";
  return { title: title || `Edit ${def.singular.toLowerCase()}` };
}

export const dynamic = "force-dynamic";

export default async function EditResourcePage({ params, searchParams }: Props) {
  const { resource, id } = await params;
  const def = getResource(resource);
  if (!def) notFound();

  await requireUser();

  const [row, relations, query] = await Promise.all([
    findRow(def, id),
    relationOptions(def),
    searchParams,
  ]);
  if (!row) notFound();

  const title = String(row[def.titleField] ?? "").trim() || `(untitled ${def.singular.toLowerCase()})`;
  const isPublished = row.status === "PUBLISHED";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const publicPath = def.publicPath?.({ slug: row.slug });

  // Only a tariff table has rows of its own; everything else keeps all its
  // content in its own columns.
  const tariffRows =
    def.slug === "tariffs"
      ? (
          await db.tariffRow.findMany({
            where: { groupId: id },
            orderBy: { sortOrder: "asc" },
            select: { cells: true, isHighlighted: true },
          })
        ).map((tariffRow) => ({
          cells: parseJson(tariffRow.cells, cellsSchema, [] as string[]),
          isHighlighted: tariffRow.isHighlighted,
        }))
      : [];

  return (
    <>
      <Link href={`/${def.slug}`} className="btn btn-ghost btn-sm mb-3 -ml-2">
        <ChevronLeft size={15} aria-hidden="true" />
        {def.label}
      </Link>

      <PageHeader
        title={title}
        description={
          isPublished
            ? "Live on the website. Saved changes appear immediately."
            : "A draft. Nothing is visible on the website until the status is Published."
        }
        actions={
          publicPath && isPublished ? (
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

      {query.created !== undefined ? (
        <p className="notice notice-ok mb-5" role="status">
          Created. {isPublished ? "It is live on the website." : "Set the status to Published when it is ready."}
        </p>
      ) : null}

      {query.undeletable !== undefined ? (
        <p className="notice notice-danger mb-5" role="status">
          This could not be deleted because something else still points at it. Unpublish it instead,
          or remove whatever references it first.
        </p>
      ) : null}

      <ResourceForm
        resource={def.slug}
        id={id}
        groups={def.groups}
        values={toFormValues(def, row)}
        relations={relations}
        siteUrl={siteUrl}
      />

      {/*
        A price table's rows are its whole point, but they live in their own
        table rather than in a column, so they are edited by their own form
        below the table's own fields.
      */}
      {def.slug === "tariffs" ? (
        <section className="card card-pad mt-5">
          <h2 className="border-line mb-4 border-b pb-2 text-base">Rates</h2>
          <TariffRows
            groupId={id}
            columns={parseJson(
              typeof row.columns === "string" ? row.columns : null,
              columnsSchema,
              [] as string[],
            )}
            initial={tariffRows}
          />
        </section>
      ) : null}

      {/*
        Deletion sits outside the editor form — a form cannot be nested in
        another — and behind a disclosure, so the permanent action is never one
        stray click away. No JavaScript confirm: this works with scripting off
        and reads properly to a screen reader.
      */}
      <section className="border-danger/30 mt-8 rounded-md border border-dashed p-4">
        <details>
          <summary className="text-danger cursor-pointer text-sm font-medium">
            Delete this {def.singular.toLowerCase()}
          </summary>
          <div className="mt-3">
            <p className="text-ink-muted mb-3 text-sm">
              This cannot be undone. If you only want it off the website, set the status to Draft
              instead — that keeps the content and the URL.
            </p>
            <form action={deleteResource}>
              <input type="hidden" name="__resource" value={def.slug} readOnly />
              <input type="hidden" name="__id" value={id} readOnly />
              <button type="submit" className="btn btn-danger btn-sm">
                <Trash2 size={14} aria-hidden="true" />
                Delete permanently
              </button>
            </form>
          </div>
        </details>
      </section>
    </>
  );
}
