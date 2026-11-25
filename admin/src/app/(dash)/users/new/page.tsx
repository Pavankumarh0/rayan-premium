import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { UserForm } from "../user-form";

export const metadata: Metadata = { title: "New user" };
export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  await requireAdmin();

  return (
    <>
      <Link href="/users" className="btn btn-ghost btn-sm mb-3 -ml-2">
        <ChevronLeft size={15} aria-hidden="true" />
        Users
      </Link>

      <PageHeader
        title="New user"
        description="They can sign in as soon as you save. Send them the password yourself — it is never emailed from here."
      />

      <UserForm
        user={{ id: null, name: "", email: "", role: "EDITOR", isActive: true }}
        isSelf={false}
      />
    </>
  );
}
