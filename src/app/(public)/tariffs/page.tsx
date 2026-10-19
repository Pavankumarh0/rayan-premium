import type { Metadata } from "next";
import { Check, Info, X } from "lucide-react";
import { getSystemPage, listTariffGroups } from "@/lib/content";
import { getSiteSettings } from "@/lib/site";
import { breadcrumbJsonLd, buildMetadataWith, type Crumb } from "@/lib/seo";
import { settingBool, settingText } from "@/lib/settings";
import { PageHero } from "@/components/public/page-hero";
import { PricingTable } from "@/components/public/pricing-table";
import { SectionHeading } from "@/components/public/section-heading";
import { CtaSection } from "@/components/public/cta-section";
import { SectionRenderer } from "@/components/public/section-renderer";
import { JsonLd } from "@/components/ui/json-ld";

const CRUMBS: Crumb[] = [
  { name: "Home", path: "/" },
  { name: "Tariffs", path: "/tariffs" },
];

const INCLUDED = [
  "The vehicle for the hours or distance quoted",
  "A professional chauffeur",
  "Fuel for the quoted distance",
  "Vehicle insurance and routine maintenance",
];

const EXCLUDED = [
  "Tolls, parking and state entry permits (charged at actuals)",
  "Inter-state taxes where applicable",
  "Driver allowance on multi-day journeys",
  "Accommodation, meals and entry tickets",
  "Distance or hours beyond the quoted package",
];

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSiteSettings(), getSystemPage("tariffs")]);
  return buildMetadataWith(settings, {
    title: page?.metaTitle ?? page?.title ?? "Tariffs",
    description: page?.metaDescription,
    path: "/tariffs",
    image: page?.ogImage,
    noindex: page?.noindex,
    canonicalOverride: page?.canonicalUrl,
  });
}

export default async function TariffsPage() {
  const [settings, page, tables] = await Promise.all([
    getSiteSettings(),
    getSystemPage("tariffs"),
    listTariffGroups(),
  ]);

  const showPrices = settingBool(settings, "display.showPrices");

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(settings, CRUMBS)} />

      <PageHero
        eyebrow="Tariffs"
        title={page?.title ?? "Tariffs"}
        intro="Indicative rates to help you plan. The binding figure is always the written quote issued for your specific journey."
        crumbs={CRUMBS}
        priority
      />

      {!showPrices ? (
        <section className="tone-ivory section">
          <div className="shell shell-measure text-center">
            <h2 className="font-display text-headline">Pricing is available on request.</h2>
            <p className="text-on-light-muted mt-5">
              Send us your dates, group size and route and we will return a written quote.
            </p>
          </div>
        </section>
      ) : (
        <section className="tone-ivory section">
          <div className="shell">
            {tables.length === 0 ? (
              <p className="lede shell-measure text-center">
                Tariff tables will appear here once they are published in the admin.
              </p>
            ) : (
              <div className="grid min-w-0 gap-16">
                {tables.map((table) => (
                  <div key={table.id} className="min-w-0">
                    <SectionHeading
                      heading={table.title}
                      intro={table.description}
                      level={2}
                      className="mb-8"
                    />
                    <PricingTable table={table} tone="light" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Included / excluded -------------------------------------------------- */}
      <section className="tone-charcoal section">
        <div className="shell">
          <SectionHeading
            eyebrow="The detail"
            heading="What a quote includes"
            intro="So there is nothing to discover at the end of a trip."
            className="mb-14"
          />
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h3 className="font-display text-title">Included</h3>
              <ul className="mt-6 grid gap-4">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-small">
                    <Check size={16} strokeWidth={2} aria-hidden="true" className="text-gold mt-1 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-title">Charged separately</h3>
              <ul className="mt-6 grid gap-4">
                {EXCLUDED.map((item) => (
                  <li key={item} className="text-on-dark-muted flex items-start gap-3 text-small">
                    <X
                      size={16}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="text-on-dark-faint mt-1 shrink-0"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="border-charcoal-line text-on-dark-muted mt-14 flex items-start gap-3 rounded-md border p-5 text-small">
            <Info size={17} strokeWidth={1.75} aria-hidden="true" className="text-gold mt-0.5 shrink-0" />
            {settingText(settings, "display.priceDisclaimer")}
          </p>
        </div>
      </section>

      {page?.sections?.length ? <SectionRenderer sections={page.sections} isFirst={false} /> : null}

      <CtaSection
        eyebrow="Get a figure"
        heading="Ask for a written quote."
        body="Rates above are indicative. Send your route and dates for a price you can hold us to."
        primaryLabel="Request a quote"
        primaryUrl="/contact"
        secondaryLabel="Browse the fleet"
        secondaryUrl="/fleet"
        variant="band"
      />
    </>
  );
}
