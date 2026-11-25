import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Users" };
export const dynamic = "force-dynamic";

function when(date: Date | null): string {
  if (!date) return "Never";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function UsersPage({ searchParams }: Props) {
  const me = await requireAdmin();
  const [users, query] = await Promise.all([
    db.user.findMany({ orderBy: [{ isActive: "desc" }, { role: "asc" }, { name: "asc" }] }),
    searchParams,
  ]);

  const activeAdmins = users.filter((u) => u.role === "ADMIN" && u.isActive).length;

  return (
    <>
      <PageHeader
        title="Users"
        description="Who can sign in to this dashboard."
        actions={
          <Link href="/users/new" className="btn btn-primary">
            <Plus size={15} aria-hidden="true" />
            New user
          </Link>
        }
      />

      {query.deleted !== undefined ? (
        <p className="notice notice-ok mb-5" role="status">
          Account deleted.
        </p>
      ) : null}

      {activeAdmins === 1 ? (
        <p className="notice notice-warn mb-5">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          There is only one active administrator. If that account is lost, nobody can manage
          settings, accounts or navigation. Consider adding a second.
        </p>
      ) : null}

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col" className="w-32">Role</th>
              <th scope="col" className="w-32">Last signed in</th>
              <th scope="col" className="w-24">Status</th>
              <th scope="col" className="w-20 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={user.isActive ? undefined : "opacity-55"}>
                <td>
                  <Link href={`/users/${user.id}`} className="font-medium hover:underline">
                    {user.name}
                  </Link>
                  {user.id === me.id ? (
                    <span className="badge badge-info ml-2">You</span>
                  ) : null}
                  <span className="text-ink-faint mt-0.5 block text-xs">{user.email}</span>
                </td>
                <td className="text-ink-muted text-sm">
                  {user.role === "ADMIN" ? "Administrator" : "Editor"}
                </td>
                <td className="text-ink-muted text-sm">{when(user.lastLoginAt)}</td>
                <td>
                  <span className={user.isActive ? "badge badge-ok" : "badge badge-muted"}>
                    {user.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="text-right">
                  <Link href={`/users/${user.id}`} className="btn btn-secondary btn-sm">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
