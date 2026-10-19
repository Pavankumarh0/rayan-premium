import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Clock, Navigation, Sun } from "lucide-react";
import { getDestination, listDestinations, listVehicles } from "@/lib/content";
import { getSiteSettings } from "@/lib/site";
import {
  breadcrumbJsonLd,
  buildMetadataWith,
  faqJsonLd,
  serviceJsonLd,
  type Crumb,
} from "@/lib/seo";
import { settingBool, settingText } from "@/lib/settings";
import { PageHero } from "@/components/public/page-hero";
import { RichText } from "@/components/public/rich-text";
import { SectionHeading } from "@/components/public/section-heading";
import { FaqAccordion } from "@/components/public/faq-accordion";
import { DestinationCard, VehicleCard } from "@/components/public/cards";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { ContactButtons } from "@/components/public/contact-buttons";
import { JsonLd } from "@/components/ui/json-ld";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [settings, destination] = await Promise.all([getSiteSettings(), getDestination(slug)]);
  if (!destination) {
    return buildMetadataWith(settings, { title: "Not found", path: `/outstation/${slug}`, noindex: true });
  }

  return buildMetadataWith(settings, {
    title: destination.metaTitle ?? destination.name,
    description: destination.metaDescription ?? destination.summary,
    path: `/outstation/${destination.slug}`,
    image: destination.ogImage ?? destination.heroImage,
    noindex: destination.noindex,
  });
}

export default async function DestinationPage({ params }: Props) {
  const { slug } = await params;
  const [settings, destination] = await Promise.all([getSiteSettings(), getDestination(slug)]);
  if (!destination) notFound();

  const [related, vehicles] = await Promise.all([
    listDestinations({ limit: 3, excludeId: destination.id }),
    listVehicles({ featuredOnly: true, limit: 3 }),
  ]);

  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Outstation", path: "/outstation" },
    { name: destination.name, path: `/outstation/${destination.slug}` },
  ];

  /**
   * Distance, journey time and season are only rendered once an editor has
   * ticked "Facts verified" on the record. Publishing an unchecked distance as
   * if it were a fact is exactly the kind of claim this site must not make.
   */
  const facts = destination.factsVerified
    ? [
        destination.distanceKm ? { label: "Distance", value: `${destination.distanceKm} km` } : null,
        destination.travelTimeText ? { label: "Journey time", value: destination.travelTimeText } : null,
        destination.bestSeason ? { label: "Best season", value: destination.bestSeason } : null,
        { label: "Chauffeur", value: "Included" },
      ].filter((f): f is { label: string; value: string } => f !== null)
    : [{ label: "Chauffeur", value: "Included" }, { label: "Vehicle", value: "Held throughout" }];

  const whatsappMessage = `Hello, I would like a quote for a trip to ${destination.name}.`;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(settings, crumbs),
          serviceJsonLd(settings, {
            name: `Chauffeur-driven travel to ${destination.name}`,
            description: destination.summary,
            path: `/outstation/${destination.slug}`,
            image: destination.heroImage,
          }),
          faqJsonLd(destination.faqs),
        ].filter((d): d is Record<string, unknown> => d !== null)}
      />

      <PageHero
        eyebrow={destination.region ?? "Outstation"}
        title={destination.name}
        intro={destination.tagline ?? destination.summary}
        image={destination.heroImage}
        imageAlt={destination.heroImageAlt}
        crumbs={crumbs}
        facts={facts}
        priority
        size="tall"
        actions={<ContactButtons message={whatsappMessage} fallbackLabel="Request a quote" />}
      />

      {/* Overview + route facts -------------------------------------------- */}
      <section className="tone-ivory section">
        <div className="shell">
          <div className="grid gap-14 lg:grid-cols-[1fr_minmax(0,20rem)] lg:gap-20">
            <div>
              <SectionHeading eyebrow="The journey" heading={`Travelling to ${destination.name}`} />
              {destination.body ? (
                <RichText html={destination.body} className="mt-8" />
              ) : destination.summary ? (
                <p className="lede mt-8">{destination.summary}</p>
              ) : null}
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              {destination.factsVerified &&
              (destination.distanceKm || destination.travelTimeText || destination.bestSeason) ? (
                <div className="card-light p-7">
                  <h2 className="text-on-light-faint text-micro tracking-[0.18em] uppercase">
                    Route summary
                  </h2>
                  <dl className="divide-ivory-line mt-5 divide-y">
                    {destination.distanceKm ? (
                      <div className="flex items-center gap-3 py-3.5">
                        <Navigation size={15} strokeWidth={1.75} aria-hidden="true" className="text-gold-dim" />
                        <dt className="text-on-light-muted text-small">Distance</dt>
                        <dd className="tabular ml-auto text-small font-medium">
                          {destination.distanceKm} km
                        </dd>
                      </div>
                    ) : null}
                    {destination.travelTimeText ? (
                      <div className="flex items-center gap-3 py-3.5">
                        <Clock size={15} strokeWidth={1.75} aria-hidden="true" className="text-gold-dim" />
                        <dt className="text-on-light-muted text-small">Journey time</dt>
                        <dd className="ml-auto text-small font-medium">{destination.travelTimeText}</dd>
                      </div>
                    ) : null}
                    {destination.bestSeason ? (
                      <div className="flex items-center gap-3 py-3.5">
                        <Sun size={15} strokeWidth={1.75} aria-hidden="true" className="text-gold-dim" />
                        <dt className="text-on-light-muted text-small">Best season</dt>
                        <dd className="ml-auto text-small font-medium">{destination.bestSeason}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              ) : null}

              {destination.highlights.length > 0 ? (
                <div className="card-light mt-5 p-7">
                  <h2 className="text-on-light-faint text-micro tracking-[0.18em] uppercase">
                    Included
                  </h2>
                  <ul className="mt-5 grid gap-3.5">
                    {destination.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-small">
                        <Check
                          size={15}
                          strokeWidth={2}
                          aria-hidden="true"
                          className="text-gold-dim mt-1 shrink-0"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      {/* Itinerary ---------------------------------------------------------- */}
      {destination.itinerary.length > 0 ? (
        <section className="tone-charcoal section">
          <div className="shell">
            <SectionHeading
              eyebrow="Suggested itinerary"
              heading="How the day usually runs"
              intro="A starting point. Every itinerary is adjusted to the group before travel."
              className="mb-14"
            />
            <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-12">
              {destination.itinerary.map((step, index) => (
                <li key={step.title}>
                  <span
                    className="font-display tabular text-charcoal-line block text-display-3 leading-none"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display mt-4 text-title">{step.title}</h3>
                  {step.detail ? (
                    <p className="text-on-dark-muted mt-3 text-small">{step.detail}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Vehicles ------------------------------------------------------------ */}
      {vehicles.length > 0 ? (
        <section className="tone-ivory section">
          <div className="shell">
            <SectionHeading
              eyebrow="Vehicles"
              heading="Suited to this route"
              ctaLabel="View the full fleet"
              ctaUrl="/fleet"
              align="split"
              className="mb-12"
            />
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((vehicle) => (
                <li key={vehicle.id}>
                  <VehicleCard
                    vehicle={vehicle}
                    showPrices={settingBool(settings, "display.showPrices")}
                  />
                </li>
              ))}
            </ul>
            {destination.priceNote ? (
              <p className="text-on-light-faint mt-10 max-w-3xl text-micro">{destination.priceNote}</p>
            ) : null}
            <p className="text-on-light-faint mt-3 max-w-3xl text-micro">
              {settingText(settings, "display.priceDisclaimer")}
            </p>
          </div>
        </section>
      ) : null}

      {/* FAQs ------------------------------------------------------------------ */}
      {destination.faqs.length > 0 ? (
        <section className="tone-ivory-soft section">
          <div className="shell">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
              <SectionHeading
                eyebrow="Questions"
                heading={destination.name}
                ctaLabel="All questions"
                ctaUrl="/faq"
              />
              <FaqAccordion items={destination.faqs} tone="light" />
            </div>
          </div>
        </section>
      ) : null}

      {/* Enquiry ---------------------------------------------------------------- */}
      <section className="tone-ink section">
        <div className="shell">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-20">
            <SectionHeading
              eyebrow="Enquire"
              heading={`Plan your trip to ${destination.name}`}
              intro="Send your dates and group size, and we will confirm a vehicle and a written price."
            />
            <div className="border-charcoal-line bg-ink-raised rounded-md border p-7 lg:p-9">
              <EnquiryForm
                type="DESTINATION"
                destinationId={destination.id}
                subject={destination.name}
                tone="dark"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Related ------------------------------------------------------------------ */}
      {related.length > 0 ? (
        <section className="tone-ivory section">
          <div className="shell">
            <SectionHeading
              eyebrow="Nearby"
              heading="Other destinations"
              ctaLabel="All destinations"
              ctaUrl="/outstation"
              align="split"
              className="mb-12"
            />
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <DestinationCard destination={item} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
