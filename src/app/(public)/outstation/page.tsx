import type { Metadata } from "next";
import { getSystemPage, listDestinations } from "@/lib/content";
import { getSiteSettings } from "@/lib/site";
import { breadcrumbJsonLd, buildMetadataWith, type Crumb } from "@/lib/seo";
import { settingText } from "@/lib/settings";
import { PageHero } from "@/components/public/page-hero";
import { DestinationCard } from "@/components/public/cards";
import { CtaSection } from "@/components/public/cta-section";
import { SectionRenderer } from "@/components/public/section-renderer";
import { JsonLd } from "@/components/ui/json-ld";

const CRUMBS: Crumb[] = [
  { name: "Home", path: "/" },
  { name: "Outstation", path: "/outstation" },
];

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSiteSettings(), getSystemPage("outstation")]);
  return buildMetadataWith(settings, {
    title: page?.metaTitle ?? page?.title ?? "Outstation routes",
    description: page?.metaDescription,
    path: "/outstation",
    image: page?.ogImage,
    noindex: page?.noindex,
    canonicalOverride: page?.canonicalUrl,
  });
}

export default async function OutstationPage() {
  const [settings, page, destinations] = await Promise.all([
    getSiteSettings(),
    getSystemPage("outstation"),
    listDestinations(),
  ]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(settings, CRUMBS)} />

      <PageHero
        eyebrow="Outstation"
        title={page?.title ?? "Outstation routes"}
        intro="Chauffeur-driven Urbania rentals for outstation journeys from Chennai to destinations across Tamil Nadu and other parts of India, subject to availability and route requirements."
        crumbs={CRUMBS}
        priority
      />

      {/* The destination grid only exists when the client has published
          destinations. With none, the page's own CMS sections carry it, rather
          than showing an empty listing. */}
      {destinations.length > 0 ? (
        <section className="tone-ivory section">
          <div className="shell">
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((destination) => (
                <li key={destination.id}>
                  <DestinationCard destination={destination} />
                </li>
              ))}
            </ul>

            <p className="text-on-light-faint mt-10 max-w-3xl text-micro">
              {settingText(settings, "display.priceDisclaimer")}
            </p>
          </div>
        </section>
      ) : null}

      {page?.sections?.length ? <SectionRenderer sections={page.sections} isFirst={false} /> : null}

      <CtaSection
        eyebrow="Somewhere else?"
        heading="Tell us where you are going"
        body="Share your travel date, pickup location, destination, group size and trip duration to receive availability details and a rental quotation."
        primaryLabel="Request a quote"
        primaryUrl="/contact"
        variant="band"
      />
    </>
  );
}
