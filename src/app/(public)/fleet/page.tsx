import type { Metadata } from "next";
import Link from "next/link";
import { getSystemPage, listVehicleCategories, listVehicles } from "@/lib/content";
import { getSiteSettings } from "@/lib/site";
import { breadcrumbJsonLd, buildMetadataWith, type Crumb } from "@/lib/seo";
import { settingBool, settingText } from "@/lib/settings";
import { PageHero } from "@/components/public/page-hero";
import { VehicleCard } from "@/components/public/cards";
import { CtaSection } from "@/components/public/cta-section";
import { SectionRenderer } from "@/components/public/section-renderer";
import { JsonLd } from "@/components/ui/json-ld";
import { cn } from "@/lib/utils";

type Props = { searchParams: Promise<{ category?: string }> };

const CRUMBS: Crumb[] = [
  { name: "Home", path: "/" },
  { name: "Our fleet", path: "/fleet" },
];

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSiteSettings(), getSystemPage("fleet")]);
  return buildMetadataWith(settings, {
    title: page?.metaTitle ?? page?.title ?? "Our fleet",
    description: page?.metaDescription,
    path: "/fleet",
    image: page?.ogImage,
    noindex: page?.noindex,
    canonicalOverride: page?.canonicalUrl,
  });
}

export default async function FleetPage({ searchParams }: Props) {
  const { category } = await searchParams;

  const [settings, page, categories, vehicles] = await Promise.all([
    getSiteSettings(),
    getSystemPage("fleet"),
    listVehicleCategories(),
    listVehicles({ categorySlug: category ?? null }),
  ]);

  const showPrices = settingBool(settings, "display.showPrices");
  const activeCategory = categories.find((c) => c.slug === category);
  const totalSeatsRange = vehicles.reduce(
    (acc, v) => ({ min: Math.min(acc.min, v.seats || 99), max: Math.max(acc.max, v.seats) }),
    { min: 99, max: 0 },
  );

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(settings, CRUMBS)} />

      <PageHero
        eyebrow="The fleet"
        title={activeCategory ? activeCategory.name : (page?.title ?? "Our fleet")}
        intro={
          activeCategory?.description ??
          "Every vehicle is chauffeur-driven, maintained in-house and matched to your group's headcount, luggage and journey length."
        }
        crumbs={CRUMBS}
        priority
        facts={
          vehicles.length > 0
            ? [
                { label: "Vehicles", value: String(vehicles.length) },
                {
                  label: "Capacity",
                  value: totalSeatsRange.max > 0 ? `${totalSeatsRange.min}–${totalSeatsRange.max} seats` : "—",
                },
                { label: "Chauffeur", value: "Always included" },
                { label: "Coverage", value: "Local and outstation" },
              ]
            : undefined
        }
      />

      {/* Category filter — plain links, so filtering works without JavaScript
          and each filtered view is a crawlable URL. */}
      {categories.length > 1 ? (
        <section className="tone-ivory border-ivory-line border-b">
          <div className="shell py-6">
            <nav aria-label="Filter the fleet by category">
              <ul className="flex flex-wrap items-center gap-2">
                <li>
                  <Link
                    href="/fleet"
                    aria-current={!category ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-10 items-center rounded-sm border px-4 text-small transition-colors",
                      !category
                        ? "border-ink bg-ink text-on-dark"
                        : "border-ivory-line hover:border-gold-dim text-on-light-muted",
                    )}
                  >
                    All vehicles
                  </Link>
                </li>
                {categories
                  .filter((c) => c._count.vehicles > 0)
                  .map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/fleet?category=${c.slug}`}
                        aria-current={category === c.slug ? "page" : undefined}
                        className={cn(
                          "inline-flex min-h-10 items-center gap-2 rounded-sm border px-4 text-small transition-colors",
                          category === c.slug
                            ? "border-ink bg-ink text-on-dark"
                            : "border-ivory-line hover:border-gold-dim text-on-light-muted",
                        )}
                      >
                        {c.name}
                        <span className="tabular text-micro opacity-60">{c._count.vehicles}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </nav>
          </div>
        </section>
      ) : null}

      <section className="tone-ivory section">
        <div className="shell">
          {vehicles.length === 0 ? (
            <div className="shell-measure text-center">
              <h2 className="font-display text-headline">No vehicles in this category yet.</h2>
              <p className="text-on-light-muted mt-4 text-small">
                Try another category, or{" "}
                <Link href="/fleet" className="text-gold-dim underline underline-offset-4">
                  view the whole fleet
                </Link>
                .
              </p>
            </div>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((vehicle, index) => (
                <li key={vehicle.id}>
                  <VehicleCard vehicle={vehicle} showPrices={showPrices} priority={index < 3} />
                </li>
              ))}
            </ul>
          )}

          {showPrices && vehicles.some((v) => v.showPrice) ? (
            <p className="text-on-light-faint mt-10 max-w-3xl text-micro">
              {settingText(settings, "display.priceDisclaimer")}
            </p>
          ) : null}
        </div>
      </section>

      {/* Any extra sections the client adds to this page in the admin. */}
      {page?.sections?.length ? (
        <SectionRenderer sections={page.sections} isFirst={false} />
      ) : null}

      <CtaSection
        eyebrow="Not sure which vehicle?"
        heading="Tell us the group and we will size it."
        body="Send your headcount, luggage and route. We will recommend a vehicle and confirm a written price."
        primaryLabel="Request a quote"
        primaryUrl="/contact"
        secondaryLabel="See tariffs"
        secondaryUrl="/tariffs"
        variant="band"
      />
    </>
  );
}
