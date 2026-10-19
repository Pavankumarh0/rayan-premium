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
        intro="Day trips and multi-day journeys. The vehicle and chauffeur stay with you throughout, so luggage can be left aboard and the itinerary can change as the day goes."
        crumbs={CRUMBS}
        priority
      />

      <section className="tone-ivory section">
        <div className="shell">
          {destinations.length === 0 ? (
            <p className="lede shell-measure text-center">
              Destinations will appear here once they are published in the admin.
            </p>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((destination) => (
                <li key={destination.id}>
                  <DestinationCard destination={destination} />
                </li>
              ))}
            </ul>
          )}

          <p className="text-on-light-faint mt-10 max-w-3xl text-micro">
            {settingText(settings, "display.priceDisclaimer")}
          </p>
        </div>
      </section>

      {page?.sections?.length ? <SectionRenderer sections={page.sections} isFirst={false} /> : null}

      <CtaSection
        eyebrow="Somewhere else?"
        heading="We will quote any route."
        body="These are the destinations we are asked for most often, not a limit. Tell us where you need to go."
        primaryLabel="Request a quote"
        primaryUrl="/contact"
        variant="band"
      />
    </>
  );
}
