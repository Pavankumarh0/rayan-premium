import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPage } from "@/lib/content";
import { getSiteSettings } from "@/lib/site";
import { buildMetadataWith } from "@/lib/seo";
import { SectionRenderer } from "@/components/public/section-renderer";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSiteSettings(), getPublishedPage("home")]);

  return buildMetadataWith(settings, {
    title: page?.metaTitle ?? "",
    description: page?.metaDescription,
    path: "/",
    image: page?.ogImage,
    noindex: page?.noindex,
    canonicalOverride: page?.canonicalUrl,
  });
}

export default async function HomePage() {
  const page = await getPublishedPage("home");

  if (!page || page.sections.length === 0) {
    return <EmptyHome />;
  }

  return <SectionRenderer sections={page.sections} />;
}

/**
 * Shown before the homepage has been seeded or published. It is a real,
 * useful state rather than a blank screen — it tells whoever is setting the
 * site up exactly what to do next.
 */
function EmptyHome() {
  return (
    <section className="tone-ink section flex min-h-[70svh] items-center">
      <div className="shell">
        <p className="eyebrow">Setup</p>
        <h1 className="text-display-2 mt-6 max-w-3xl">Your homepage has not been published yet.</h1>
        <p className="lede mt-6 max-w-xl">
          Sign in to the admin, open <strong>Pages → Home</strong>, add the sections you want and
          set the status to Published.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/admin" className="btn btn-gold">
            Open the admin
          </Link>
          <Link href="/fleet" className="btn btn-outline-light">
            Browse the fleet
          </Link>
        </div>
      </div>
    </section>
  );
}
