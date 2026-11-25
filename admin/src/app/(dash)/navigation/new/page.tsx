import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { NAV_MENUS } from "@/lib/validation";
import { PageHeader } from "@/components/ui";
import { NavForm } from "../nav-form";

export const metadata: Metadata = { title: "New menu item" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NewNavItemPage({ searchParams }: Props) {
  await requireAdmin();

  const query = await searchParams;
  const requested = typeof query.menu === "string" ? query.menu : "";
  const menu = (NAV_MENUS as readonly string[]).includes(requested) ? requested : "HEADER";

  const parents = await db.navItem.findMany({
    where: { parentId: null },
    orderBy: [{ menu: "asc" }, { sortOrder: "asc" }],
    select: { id: true, label: true, menu: true },
  });

  return (
    <>
      <Link href="/navigation" className="btn btn-ghost btn-sm mb-3 -ml-2">
        <ChevronLeft size={15} aria-hidden="true" />
        Navigation
      </Link>

      <PageHeader
        title="New menu item"
        description="It appears in the menu as soon as you save, unless you turn it off below."
      />

      <NavForm
        item={{
          id: null,
          menu,
          label: "",
          url: "",
          parentId: "",
          description: "",
          openInNewTab: false,
          isVisible: true,
          sortOrder: 0,
        }}
        parents={parents}
      />
    </>
  );
}
