import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Lock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listPages } from "@/lib/pages-db";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Pages & sections" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PagesListPage({ searchParams }: Props) {
  await requireUser();
  const [pages, query] = await Promise.all([listPages(), searchParams]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <>
      <PageHeader
        title="Pages & sections"
        description="Every page on the website and the blocks it is built from. Edit a page to change its wording, reorder its sections or hide one."
      />

      {query.saved !== undefined ? (
        <p className="notice notice-ok mb-5" role="status">
          Saved.
        </p>
      ) : null}

      {pages.length === 0 ? (
        <EmptyState
          title="No pages yet"
          description="Run the seed to create the standard set of pages."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Page</th>
                <th scope="col" className="w-32">Sections</th>
                <th scope="col" className="w-28">Status</th>
                <th scope="col" className="w-40 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id}>
                  <td>
                    <Link href={`/pages/${page.id}`} className="font-medium hover:underline">
                      {page.title}
                    </Link>
                    {page.isSystem ? (
                      <span
                        className="badge badge-muted ml-2"
                        title="Backs a built-in route, so it cannot be deleted or re-slugged"
                      >
                        <Lock size={11} aria-hidden="true" />
                        Built in
                      </span>
                    ) : null}
                    <span className="text-ink-faint mt-0.5 block text-xs">
                      /{page.slug === "home" ? "" : page.slug}
                    </span>
                  </td>

                  <td className="text-ink-muted text-sm">
                    {page.sectionCount === 0 ? (
                      <span className="text-ink-faint">None</span>
                    ) : (
                      <>
                        {page.sectionCount}
                        {page.hiddenCount > 0 ? (
                          <span className="text-ink-faint"> · {page.hiddenCount} hidden</span>
                        ) : null}
                      </>
                    )}
                  </td>

                  <td>
                    <StatusBadge status={page.status} />
                  </td>

                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {page.status === "PUBLISHED" ? (
                        <a
                          href={`${siteUrl}/${page.slug === "home" ? "" : page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                        >
                          <ExternalLink size={13} aria-hidden="true" />
                          <span className="sr-only">View {page.title} on the website</span>
                        </a>
                      ) : null}
                      <Link href={`/pages/${page.id}`} className="btn btn-secondary btn-sm">
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
