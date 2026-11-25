import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { UserForm } from "../user-form";
import { deleteUser } from "../actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await db.user.findUnique({
    where: { id: (await params).id },
    select: { name: true },
  });
  return { title: user?.name ?? "Not found" };
}

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  self: "You cannot delete your own account. Ask another administrator to do it.",
  lastadmin:
    "This is the only active administrator. Promote somebody else first, or nobody will be able to manage the site.",
};

export default async function EditUserPage({ params, searchParams }: Props) {
  const me = await requireAdmin();

  const { id } = await params;
  const [user, query] = await Promise.all([
    db.user.findUnique({ where: { id } }),
    searchParams,
  ]);
  if (!user) notFound();

  const isSelf = user.id === me.id;
  const otherAdmins = await db.user.count({
    where: { role: "ADMIN", isActive: true, id: { not: id } },
  });
  const isLastAdmin = user.role === "ADMIN" && user.isActive && otherAdmins === 0;
  const errorKey = typeof query.error === "string" ? query.error : null;

  return (
    <>
      <Link href="/users" className="btn btn-ghost btn-sm mb-3 -ml-2">
        <ChevronLeft size={15} aria-hidden="true" />
        Users
      </Link>

      <PageHeader
        title={user.name}
        description={isSelf ? "This is your own account." : user.email}
      />

      {query.created !== undefined ? (
        <p className="notice notice-ok mb-5" role="status">
          Account created. Send them the password yourself — it is never emailed from here.
        </p>
      ) : null}

      {errorKey && ERRORS[errorKey] ? (
        <p className="notice notice-danger mb-5" role="status">
          {ERRORS[errorKey]}
        </p>
      ) : null}

      <UserForm
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        }}
        isSelf={isSelf}
      />

      <section className="border-danger/30 mt-8 rounded-md border border-dashed p-4">
        {isSelf || isLastAdmin ? (
          // Say why rather than showing a button that will refuse.
          <p className="text-ink-muted text-sm">
            {isSelf
              ? "You cannot delete your own account. Ask another administrator to do it."
              : "This is the only active administrator and cannot be deleted. Promote somebody else first."}
          </p>
        ) : (
          <details>
            <summary className="text-danger cursor-pointer text-sm font-medium">
              Delete this account
            </summary>
            <div className="mt-3">
              <p className="text-ink-muted mb-3 text-sm">
                This cannot be undone. To stop them signing in while keeping the record, turn off
                &ldquo;Account is active&rdquo; above instead — that takes effect on their next
                request.
              </p>
              <form action={deleteUser}>
                <input type="hidden" name="id" value={user.id} readOnly />
                <button type="submit" className="btn btn-danger btn-sm">
                  <Trash2 size={14} aria-hidden="true" />
                  Delete permanently
                </button>
              </form>
            </div>
          </details>
        )}
      </section>
    </>
  );
}
