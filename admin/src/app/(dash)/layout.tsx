import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { requireUser, isAdmin } from "@/lib/auth";
import { logout } from "../login/actions";
import { SideNav } from "@/components/nav";

/**
 * Authenticated shell. Every route in this group is behind `requireUser`,
 * which re-reads the account from the database on each request — so this is
 * the authorisation boundary, not merely a layout.
 */
export const dynamic = "force-dynamic";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    /*
      The shell is exactly the height of the window and never scrolls itself.
      That is what lets the rail and the content scroll independently: with a
      growing page instead, both would move together and a long editor would
      carry the menu off the top of the screen.
    */
    <div className="flex h-screen overflow-hidden">
      <SideNav isAdmin={isAdmin(user)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/*
          No longer sticky: the header sits outside the scrolling area
          rather than riding along inside it, so it stays put without
          overlapping anything.
        */}
        <header className="bg-surface border-line flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <div className="lg:hidden">
            <SideNav isAdmin={isAdmin(user)} />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
            >
              <ExternalLink size={14} aria-hidden="true" />
              View site
            </a>

            <div className="border-line hidden border-l pl-3 sm:block">
              <p className="text-sm leading-tight font-medium">{user.name}</p>
              <p className="text-ink-faint text-xs leading-tight">
                {user.role === "ADMIN" ? "Administrator" : "Editor"}
              </p>
            </div>

            <form action={logout}>
              <button type="submit" className="btn btn-ghost btn-sm">
                <LogOut size={14} aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Sign out</span>
              </button>
            </form>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
