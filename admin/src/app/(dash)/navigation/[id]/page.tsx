import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { NavForm } from "../nav-form";
import { deleteNavItem } from "../actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await db.navItem.findUnique({
    where: { id: (await params).id },
    select: { label: true },
  });
  return { title: item?.label ?? "Not found" };
}

export const dynamic = "force-dynamic";

export default async function EditNavItemPage({ params, searchParams }: Props) {
  await requireAdmin();

  const { id } = await params;
  const [item, query] = await Promise.all([
    db.navItem.findUnique({ where: { id }, include: { children: { select: { id: true } } } }),
    searchParams,
  ]);
  if (!item) notFound();

  const parents = await db.navItem.findMany({
    // Not itself, and not anything that already sits inside something else:
    // menus are one level deep.
    where: { parentId: null, id: { not: id } },
    orderBy: [{ menu: "asc" }, { sortOrder: "asc" }],
    select: { id: true, label: true, menu: true },
  });

  return (
    <>
      <Link href="/navigation" className="btn btn-ghost btn-sm mb-3 -ml-2">
        <ChevronLeft size={15} aria-hidden="true" />
        Navigation
      </Link>

      <PageHeader title={item.label} description="Saved changes appear on the website immediately." />

      {query.created !== undefined ? (
        <p className="notice notice-ok mb-5" role="status">
          Menu item created.
        </p>
      ) : null}

      <NavForm
        item={{
          id: item.id,
          menu: item.menu,
          label: item.label,
          url: item.url,
          parentId: item.parentId ?? "",
          description: item.description ?? "",
          openInNewTab: item.openInNewTab,
          isVisible: item.isVisible,
          sortOrder: item.sortOrder,
        }}
        parents={parents}
      />

      <section className="border-danger/30 mt-8 rounded-md border border-dashed p-4">
        <details>
          <summary className="text-danger cursor-pointer text-sm font-medium">
            Delete this menu item
          </summary>
          <div className="mt-3">
            <p className="text-ink-muted mb-3 text-sm">
              {item.children.length > 0 ? (
                <>
                  This will also delete the {item.children.length}{" "}
                  {item.children.length === 1 ? "item" : "items"} inside it.
                </>
              ) : null}
              To take it out of the menu without losing it, turn off &ldquo;Show this
              item&rdquo; above instead.
            </p>
            <form action={deleteNavItem}>
              <input type="hidden" name="id" value={item.id} readOnly />
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
