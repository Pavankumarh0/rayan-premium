import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getResource } from "@/lib/resources";
import { relationOptions, toFormValues } from "@/lib/resource-db";
import { PageHeader } from "@/components/ui";
import { ResourceForm } from "../resource-form";

type Props = { params: Promise<{ resource: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const def = getResource((await params).resource);
  return { title: def ? `New ${def.singular.toLowerCase()}` : "Not found" };
}

export const dynamic = "force-dynamic";

export default async function NewResourcePage({ params }: Props) {
  const { resource } = await params;
  const def = getResource(resource);
  if (!def) notFound();

  await requireUser();
  const relations = await relationOptions(def);

  return (
    <>
      <Link href={`/${def.slug}`} className="btn btn-ghost btn-sm mb-3 -ml-2">
        <ChevronLeft size={15} aria-hidden="true" />
        {def.label}
      </Link>

      <PageHeader
        title={`New ${def.singular.toLowerCase()}`}
        description="It is saved as a draft unless you set the status to Published."
      />

      <ResourceForm
        resource={def.slug}
        id={null}
        groups={def.groups}
        values={toFormValues(def, null)}
        relations={relations}
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}
      />
    </>
  );
}
