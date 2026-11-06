import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Plus, Star } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getResource } from "@/lib/resources";
import { listRows } from "@/lib/resource-db";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { toggleResourceStatus } from "./actions";

type Props = {
  params: Promise<{ resource: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const def = getResource((await params).resource);
  return { title: def?.label ?? "Not found" };
}

export const dynamic = "force-dynamic";

const NOTICES: Record<string, { tone: string; text: string }> = {
  deleted: { tone: "notice-ok", text: "Deleted." },
  gone: { tone: "notice-warn", text: "That entry had already been deleted." },
};

export default async function ResourceListPage({ params, searchParams }: Props) {
  const { resource } = await params;
  const def = getResource(resource);
  if (!def) notFound();

  await requireUser();

  const [rows, query] = await Promise.all([listRows(def), searchParams]);
  const notice = Object.keys(NOTICES).find((key) => query[key] !== undefined);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const published = rows.filter((row) => row.status === "PUBLISHED").length;

  return (
    <>
      <PageHeader
        title={def.label}
        description={def.description}
        actions={
          <Link href={`/${def.slug}/new`} className="btn btn-primary">
            <Plus size={15} aria-hidden="true" />
            New {def.singular.toLowerCase()}
          </Link>
        }
      />

      {notice ? (
        <p className={`notice mb-5 ${NOTICES[notice]!.tone}`} role="status">
          {NOTICES[notice]!.text}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title={`No ${def.label.toLowerCase()} yet`}
          description={def.description}
          action={
            <Link href={`/${def.slug}/new`} className="btn btn-primary">
              <Plus size={15} aria-hidden="true" />
              Add the first one
            </Link>
          }
        />
      ) : (
        <>
          <p className="text-ink-faint mb-3 text-sm">
            {rows.length} {rows.length === 1 ? "entry" : "entries"}, {published} published
            {published !== rows.length ? ` · ${rows.length - published} draft` : ""}
          </p>

          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  {def.hasSortOrder ? <th scope="col" className="w-14">#</th> : null}
                  <th scope="col">{def.singular}</th>
                  {(def.listExtra ?? []).map((col) => (
                    <th key={col.k} scope="col">
                      {col.label}
                    </th>
                  ))}
                  <th scope="col" className="w-28">
                    Status
                  </th>
                  <th scope="col" className="w-44 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {def.hasSortOrder ? (
                      <td className="text-ink-faint tabular-nums">{row.sortOrder ?? "—"}</td>
                    ) : null}

                    <td>
                      <Link href={`/${def.slug}/${row.id}`} className="font-medium hover:underline">
                        {row.title}
                      </Link>
                      {def.hasFeatured && row.isFeatured ? (
                        <span className="badge badge-info ml-2">
                          <Star size={11} aria-hidden="true" />
                          Featured
                        </span>
                      ) : null}
                      {row.slug ? (
                        <span className="text-ink-faint mt-0.5 block text-xs">/{row.slug}</span>
                      ) : null}
                    </td>

                    {(def.listExtra ?? []).map((col) => (
                      <td key={col.k} className="text-ink-muted text-sm">
                        {row.extra[col.k]}
                      </td>
                    ))}

                    <td>
                      <StatusBadge status={row.status ?? "DRAFT"} />
                    </td>

                    <td>
                      <div className="flex items-center justify-end gap-1">
                        {/*
                          Publishing is the one change made straight from the
                          list: it is the action an editor repeats, and making
                          it a round trip through the editor adds nothing.
                        */}
                        <form action={toggleResourceStatus}>
                          <input type="hidden" name="__resource" value={def.slug} readOnly />
                          <input type="hidden" name="__id" value={row.id} readOnly />
                          <input
                            type="hidden"
                            name="__status"
                            value={row.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"}
                            readOnly
                          />
                          <button type="submit" className="btn btn-ghost btn-sm">
                            {row.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                          </button>
                        </form>

                        {def.publicPath && row.status === "PUBLISHED" ? (
                          <a
                            href={`${siteUrl}${def.publicPath({ slug: row.slug })}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm"
                          >
                            <ExternalLink size={13} aria-hidden="true" />
                            <span className="sr-only">View {row.title} on the website</span>
                          </a>
                        ) : null}

                        <Link href={`/${def.slug}/${row.id}`} className="btn btn-secondary btn-sm">
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
