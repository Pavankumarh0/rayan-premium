import type { Metadata } from "next";
import Link from "next/link";
import { Eye, EyeOff, Plus, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { NAV_MENUS } from "@/lib/validation";
import { PageHeader } from "@/components/ui";
import { moveNavItem, toggleNavItem } from "./actions";

export const metadata: Metadata = { title: "Navigation" };
export const dynamic = "force-dynamic";

/** Where each menu actually appears, so the labels mean something. */
const MENU_LABELS: Record<string, { title: string; where: string }> = {
  HEADER: { title: "Header", where: "The main menu at the top of every page." },
  FOOTER_MENU: { title: "Footer — Explore", where: "The first column of links in the footer." },
  FOOTER_SERVICES: { title: "Footer — Services", where: "The second column of links in the footer." },
  FOOTER_ROUTES: { title: "Footer — Routes", where: "An optional third footer column." },
  LEGAL: { title: "Legal", where: "The small print row at the very bottom." },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NavigationPage({ searchParams }: Props) {
  await requireAdmin();

  const [items, query] = await Promise.all([
    db.navItem.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] }),
    searchParams,
  ]);

  return (
    <>
      <PageHeader
        title="Navigation"
        description="The menus in the header and footer. Changes appear on the website immediately."
        actions={
          <Link href="/navigation/new" className="btn btn-primary">
            <Plus size={15} aria-hidden="true" />
            New menu item
          </Link>
        }
      />

      {query.deleted !== undefined ? (
        <p className="notice notice-ok mb-5" role="status">
          Menu item deleted.
        </p>
      ) : null}

      <div className="grid gap-5">
        {NAV_MENUS.map((menu) => {
          const parents = items.filter((i) => i.menu === menu && !i.parentId);
          const meta = MENU_LABELS[menu] ?? { title: menu, where: "" };

          return (
            <section key={menu} className="card card-pad">
              <h2 className="text-base">{meta.title}</h2>
              <p className="text-ink-faint mb-4 text-sm">{meta.where}</p>

              {parents.length === 0 ? (
                <p className="text-ink-muted text-sm">
                  Nothing in this menu.{" "}
                  <Link href={`/navigation/new?menu=${menu}`} className="underline">
                    Add an item
                  </Link>
                  .
                </p>
              ) : (
                <ol className="grid gap-1.5">
                  {parents.map((item, index) => {
                    const children = items.filter((c) => c.parentId === item.id);
                    return (
                      <li key={item.id}>
                        <Row
                          item={item}
                          first={index === 0}
                          last={index === parents.length - 1}
                        />
                        {children.length > 0 ? (
                          <ol className="border-line mt-1.5 ml-6 grid gap-1.5 border-l pl-4">
                            {children.map((child, childIndex) => (
                              <li key={child.id}>
                                <Row
                                  item={child}
                                  first={childIndex === 0}
                                  last={childIndex === children.length - 1}
                                />
                              </li>
                            ))}
                          </ol>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

function Row({
  item,
  first,
  last,
}: {
  item: {
    id: string;
    label: string;
    url: string;
    description: string | null;
    isVisible: boolean;
    openInNewTab: boolean;
  };
  first: boolean;
  last: boolean;
}) {
  return (
    <div className="border-line bg-surface flex items-center gap-3 rounded-md border p-2.5">
      <div className="min-w-0 flex-1">
        <Link href={`/navigation/${item.id}`} className="font-medium hover:underline">
          {item.label}
        </Link>
        {!item.isVisible ? <span className="badge badge-muted ml-2">Hidden</span> : null}
        {item.openInNewTab ? (
          <ExternalLink size={12} aria-hidden="true" className="text-ink-faint ml-1.5 inline" />
        ) : null}
        <span className="text-ink-faint mt-0.5 block truncate text-xs">
          {item.url}
          {item.description ? ` — ${item.description}` : ""}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <form action={moveNavItem}>
          <input type="hidden" name="id" value={item.id} readOnly />
          <input type="hidden" name="direction" value="up" readOnly />
          <button type="submit" className="btn btn-ghost btn-sm" disabled={first}>
            ↑<span className="sr-only">Move {item.label} up</span>
          </button>
        </form>
        <form action={moveNavItem}>
          <input type="hidden" name="id" value={item.id} readOnly />
          <input type="hidden" name="direction" value="down" readOnly />
          <button type="submit" className="btn btn-ghost btn-sm" disabled={last}>
            ↓<span className="sr-only">Move {item.label} down</span>
          </button>
        </form>
        <form action={toggleNavItem}>
          <input type="hidden" name="id" value={item.id} readOnly />
          <button type="submit" className="btn btn-ghost btn-sm">
            {item.isVisible ? (
              <Eye size={14} aria-hidden="true" />
            ) : (
              <EyeOff size={14} aria-hidden="true" />
            )}
            <span className="sr-only">
              {item.isVisible ? `Hide ${item.label}` : `Show ${item.label}`}
            </span>
          </button>
        </form>
        <Link href={`/navigation/${item.id}`} className="btn btn-secondary btn-sm">
          Edit
        </Link>
      </div>
    </div>
  );
}
