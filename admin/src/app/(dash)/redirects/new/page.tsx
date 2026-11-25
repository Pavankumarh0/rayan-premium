import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { RedirectForm } from "../redirect-form";

export const metadata: Metadata = { title: "New redirect" };
export const dynamic = "force-dynamic";

export default async function NewRedirectPage() {
  await requireAdmin();

  return (
    <>
      <Link href="/redirects" className="btn btn-ghost btn-sm mb-3 -ml-2">
        <ChevronLeft size={15} aria-hidden="true" />
        Redirects
      </Link>

      <PageHeader
        title="New redirect"
        description="The rule applies as soon as you save."
      />

      <RedirectForm
        item={{ id: null, source: "", destination: "", statusCode: 301, isActive: true, note: "" }}
      />
    </>
  );
}
