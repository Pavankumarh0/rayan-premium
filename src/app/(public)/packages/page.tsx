import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSystemPage, listPackages } from "@/lib/content";
import { getSiteSettings } from "@/lib/site";
import { breadcrumbJsonLd, buildMetadataWith, type Crumb } from "@/lib/seo";
import { settingBool } from "@/lib/settings";
import { PageHero } from "@/components/public/page-hero";
import { PackageCard } from "@/components/public/cards";
import { CtaSection } from "@/components/public/cta-section";
import { SectionRenderer } from "@/components/public/section-renderer";
import { JsonLd } from "@/components/ui/json-ld";

const CRUMBS: Crumb[] = [
  { name: "Home", path: "/" },
  { name: "Packages", path: "/packages" },
];

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSiteSettings(), getSystemPage("packages")]);
  return buildMetadataWith(settings, {
    title: page?.metaTitle ?? page?.title ?? "Tour packages",
    description: page?.metaDescription,
    path: "/packages",
    image: page?.ogImage,
    noindex: page?.noindex,
    canonicalOverride: page?.canonicalUrl,
  });
}

export default async function PackagesPage() {
  const [settings, page, packages] = await Promise.all([
    getSiteSettings(),
    getSystemPage("packages"),
    listPackages(),
  ]);

  // Optional module: unpublishing this page in the admin removes the route
  // entirely, rather than leaving an empty listing linked from nowhere.
  if (!page) notFound();

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(settings, CRUMBS)} />

      <PageHero
        eyebrow="Packages"
        title={page?.title ?? "Tour packages"}
        intro="Multi-day itineraries with the vehicle and chauffeur for the whole trip. Each one lists exactly what is included and what is not."
        crumbs={CRUMBS}
        priority
      />

      <section className="tone-light section">
        <div className="shell">
          {packages.length === 0 ? (
            <p className="lede shell-measure text-center">
              Packages will appear here once they are published in the admin.
            </p>
          ) : (
            <ul className="grid gap-5 lg:grid-cols-2">
              {packages.map((pkg) => (
                <li key={pkg.id}>
                  <PackageCard pkg={pkg} showPrices={settingBool(settings, "display.showPrices")} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {page?.sections?.length ? <SectionRenderer sections={page.sections} isFirst={false} /> : null}

      <CtaSection
        eyebrow="Build your own"
        heading="Packages are a starting point."
        body="Any itinerary can be adjusted, extended or built from scratch around your dates."
        primaryLabel="Request a quote"
        primaryUrl="/contact"
        secondaryLabel="Browse destinations"
        secondaryUrl="/outstation"
        variant="band"
      />
    </>
  );
}
