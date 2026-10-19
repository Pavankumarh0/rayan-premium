import type { Metadata } from "next";
import { getSystemPage, listServices } from "@/lib/content";
import { getSiteSettings } from "@/lib/site";
import { breadcrumbJsonLd, buildMetadataWith, type Crumb } from "@/lib/seo";
import { PageHero } from "@/components/public/page-hero";
import { ServiceCard } from "@/components/public/cards";
import { CtaSection } from "@/components/public/cta-section";
import { SectionRenderer } from "@/components/public/section-renderer";
import { JsonLd } from "@/components/ui/json-ld";

const CRUMBS: Crumb[] = [
  { name: "Home", path: "/" },
  { name: "Services", path: "/services" },
];

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSiteSettings(), getSystemPage("services")]);
  return buildMetadataWith(settings, {
    title: page?.metaTitle ?? page?.title ?? "Services",
    description: page?.metaDescription,
    path: "/services",
    image: page?.ogImage,
    noindex: page?.noindex,
    canonicalOverride: page?.canonicalUrl,
  });
}

export default async function ServicesPage() {
  const [settings, page, services] = await Promise.all([
    getSiteSettings(),
    getSystemPage("services"),
    listServices(),
  ]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(settings, CRUMBS)} />

      <PageHero
        eyebrow="Services"
        title={page?.title ?? "Services"}
        intro="Every kind of group has its own planning rhythm. These are the ones we are booked for most often, and how each one is run."
        crumbs={CRUMBS}
        priority
      />

      <section className="tone-ink section">
        <div className="shell">
          {services.length === 0 ? (
            <p className="lede shell-measure text-center">
              Services will appear here once they are published in the admin.
            </p>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <li key={service.id}>
                  <ServiceCard service={service} tone="dark" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {page?.sections?.length ? <SectionRenderer sections={page.sections} isFirst={false} /> : null}

      <CtaSection
        eyebrow="Get started"
        heading="Tell us what you are planning."
        body="Send your dates, group size and route, and we will confirm availability and a written price."
        primaryLabel="Request a quote"
        primaryUrl="/contact"
        secondaryLabel="Browse the fleet"
        secondaryUrl="/fleet"
        variant="band"
      />
    </>
  );
}
