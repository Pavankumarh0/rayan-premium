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
    <div className="flex min-h-screen">
      <SideNav isAdmin={isAdmin(user)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-surface border-line sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4">
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

        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
