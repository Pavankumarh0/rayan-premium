import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus, Power } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmptyState, PageHeader } from "@/components/ui";
import { toggleRedirect } from "./actions";

export const metadata: Metadata = { title: "Redirects" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function RedirectsPage({ searchParams }: Props) {
  await requireAdmin();

  const [rows, query] = await Promise.all([
    db.redirect.findMany({ orderBy: [{ isActive: "desc" }, { hits: "desc" }, { source: "asc" }] }),
    searchParams,
  ]);

  return (
    <>
      <PageHeader
        title="Redirects"
        description="Send an old address to a new one, so links already out in the world keep working."
        actions={
          <Link href="/redirects/new" className="btn btn-primary">
            <Plus size={15} aria-hidden="true" />
            New redirect
          </Link>
        }
      />

      {query.deleted !== undefined ? (
        <p className="notice notice-ok mb-5" role="status">
          Redirect deleted.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No redirects yet"
          description="Add one whenever you change a page's address, so anyone following the old link still arrives."
          action={
            <Link href="/redirects/new" className="btn btn-primary">
              <Plus size={15} aria-hidden="true" />
              Add the first one
            </Link>
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Rule</th>
                <th scope="col" className="w-24">Kind</th>
                <th scope="col" className="w-24">Used</th>
                <th scope="col" className="w-36 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={row.isActive ? undefined : "opacity-55"}>
                  <td>
                    <Link href={`/redirects/${row.id}`} className="hover:underline">
                      <span className="font-medium">{row.source}</span>
                      <ArrowRight
                        size={13}
                        aria-hidden="true"
                        className="text-ink-faint mx-2 inline"
                      />
                      <span className="text-ink-muted">{row.destination}</span>
                    </Link>
                    {!row.isActive ? <span className="badge badge-muted ml-2">Off</span> : null}
                    {row.note ? (
                      <span className="text-ink-faint mt-0.5 block truncate text-xs">
                        {row.note}
                      </span>
                    ) : null}
                  </td>

                  <td className="text-ink-muted text-sm">
                    {row.statusCode === 301 ? "Permanent" : "Temporary"}
                  </td>

                  {/*
                    Hit counts show which old links are still in circulation,
                    and which rules have gone quiet and could be retired.
                  */}
                  <td className="text-ink-muted text-sm tabular-nums">
                    {row.hits === 0 ? <span className="text-ink-faint">Never</span> : row.hits}
                  </td>

                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <form action={toggleRedirect}>
                        <input type="hidden" name="id" value={row.id} readOnly />
                        <button type="submit" className="btn btn-ghost btn-sm">
                          <Power size={13} aria-hidden="true" />
                          {row.isActive ? "Turn off" : "Turn on"}
                        </button>
                      </form>
                      <Link href={`/redirects/${row.id}`} className="btn btn-secondary btn-sm">
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

      <p className="text-ink-faint mt-4 text-sm">
        A redirect is checked when an address matches no page, so it never slows down a page that
        works. The response is a 308 for permanent rules, which search engines treat the same as a
        301.
      </p>
    </>
  );
}
