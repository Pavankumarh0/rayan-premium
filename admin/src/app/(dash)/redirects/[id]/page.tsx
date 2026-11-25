import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { RedirectForm } from "../redirect-form";
import { deleteRedirect } from "../actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await db.redirect.findUnique({
    where: { id: (await params).id },
    select: { source: true },
  });
  return { title: row ? `Redirect ${row.source}` : "Not found" };
}

export const dynamic = "force-dynamic";

export default async function EditRedirectPage({ params, searchParams }: Props) {
  await requireAdmin();

  const { id } = await params;
  const [row, query] = await Promise.all([
    db.redirect.findUnique({ where: { id } }),
    searchParams,
  ]);
  if (!row) notFound();

  return (
    <>
      <Link href="/redirects" className="btn btn-ghost btn-sm mb-3 -ml-2">
        <ChevronLeft size={15} aria-hidden="true" />
        Redirects
      </Link>

      <PageHeader
        title={row.source}
        description={
          row.hits === 0
            ? "Nobody has followed this rule yet."
            : `Followed ${row.hits} ${row.hits === 1 ? "time" : "times"}.`
        }
      />

      {query.created !== undefined ? (
        <p className="notice notice-ok mb-5" role="status">
          Redirect created and live.
        </p>
      ) : null}

      <RedirectForm
        item={{
          id: row.id,
          source: row.source,
          destination: row.destination,
          statusCode: row.statusCode,
          isActive: row.isActive,
          note: row.note ?? "",
        }}
      />

      <section className="border-danger/30 mt-8 rounded-md border border-dashed p-4">
        <details>
          <summary className="text-danger cursor-pointer text-sm font-medium">
            Delete this redirect
          </summary>
          <div className="mt-3">
            <p className="text-ink-muted mb-3 text-sm">
              Anyone following the old link will get a 404 again. To stop it without losing the
              rule, turn it off above instead.
            </p>
            <form action={deleteRedirect}>
              <input type="hidden" name="id" value={row.id} readOnly />
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
