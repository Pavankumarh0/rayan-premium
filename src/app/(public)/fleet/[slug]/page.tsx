import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Check, Luggage, Users } from "lucide-react";
import { getVehicle, listVehicles } from "@/lib/content";
import { getSiteSettings } from "@/lib/site";
import {
  breadcrumbJsonLd,
  buildMetadataWith,
  faqJsonLd,
  serviceJsonLd,
  type Crumb,
} from "@/lib/seo";
import { settingBool, settingText } from "@/lib/settings";
import { formatPrice, truncate, stripHtml } from "@/lib/utils";
import { PageHero } from "@/components/public/page-hero";
import { RichText } from "@/components/public/rich-text";
import { FaqAccordion } from "@/components/public/faq-accordion";
import { VehicleCard } from "@/components/public/cards";
import { SectionHeading } from "@/components/public/section-heading";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { ContactButtons } from "@/components/public/contact-buttons";
import { GalleryGrid } from "@/components/public/gallery-grid";
import { JsonLd } from "@/components/ui/json-ld";
import { Icon } from "@/components/ui/icon";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [settings, vehicle] = await Promise.all([getSiteSettings(), getVehicle(slug)]);
  if (!vehicle) return buildMetadataWith(settings, { title: "Not found", path: `/fleet/${slug}`, noindex: true });

  return buildMetadataWith(settings, {
    title: vehicle.metaTitle ?? vehicle.name,
    description: vehicle.metaDescription ?? vehicle.summary,
    path: `/fleet/${vehicle.slug}`,
    image: vehicle.ogImage ?? vehicle.heroImage,
    noindex: vehicle.noindex,
  });
}

export default async function VehiclePage({ params }: Props) {
  const { slug } = await params;
  const [settings, vehicle] = await Promise.all([getSiteSettings(), getVehicle(slug)]);
  if (!vehicle) notFound();

  const related = await listVehicles({ limit: 3, excludeId: vehicle.id });
  const showPrices = settingBool(settings, "display.showPrices") && vehicle.showPrice;

  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Our fleet", path: "/fleet" },
    { name: vehicle.name, path: `/fleet/${vehicle.slug}` },
  ];

  const facts = [
    vehicle.seats > 0 ? { label: "Seating", value: `${vehicle.seats} passengers` } : null,
    vehicle.luggage ? { label: "Luggage", value: vehicle.luggage } : null,
    vehicle.category ? { label: "Category", value: vehicle.category.name } : null,
    showPrices && vehicle.priceLocal
      ? { label: "From", value: formatPrice(vehicle.priceLocal) ?? "—" }
      : { label: "Chauffeur", value: "Included" },
  ].filter((f): f is { label: string; value: string } => f !== null);

  const priceRows = [
    vehicle.priceLocal
      ? { label: vehicle.priceLocalLabel || "Local package", value: formatPrice(vehicle.priceLocal) }
      : null,
    vehicle.priceOutstationPerKm
      ? { label: "Outstation, per km", value: formatPrice(vehicle.priceOutstationPerKm) }
      : null,
    vehicle.extraKmRate ? { label: "Extra kilometre", value: formatPrice(vehicle.extraKmRate) } : null,
    vehicle.extraHourRate ? { label: "Extra hour", value: formatPrice(vehicle.extraHourRate) } : null,
    vehicle.driverAllowance
      ? { label: "Driver allowance, per day", value: formatPrice(vehicle.driverAllowance) }
      : null,
  ].filter((r): r is { label: string; value: string } => r !== null && r.value !== null);

  const galleryItems = vehicle.images.map((image) => ({
    id: image.id,
    title: null,
    alt: image.alt,
    url: image.url,
    kind: "IMAGE",
    videoUrl: null,
    width: null,
    height: null,
    categoryName: null,
    categorySlug: null,
  }));

  const whatsappMessage = `Hello, I would like a quote for the ${vehicle.name}.`;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(settings, crumbs),
          serviceJsonLd(settings, {
            name: vehicle.name,
            description: vehicle.summary,
            path: `/fleet/${vehicle.slug}`,
            image: vehicle.heroImage,
          }),
          faqJsonLd(vehicle.faqs),
        ].filter((d): d is Record<string, unknown> => d !== null)}
      />

      <PageHero
        eyebrow={vehicle.category?.name ?? "The fleet"}
        title={vehicle.name}
        intro={vehicle.tagline ?? vehicle.summary}
        image={vehicle.heroImage}
        imageAlt={vehicle.heroImageAlt}
        crumbs={crumbs}
        facts={facts}
        priority
        size="tall"
        actions={<ContactButtons message={whatsappMessage} fallbackLabel="Request a quote" />}
      />

      {/* Overview + specifications ---------------------------------------- */}
      <section className="tone-light section">
        <div className="shell">
          <div className="grid gap-14 lg:grid-cols-[1fr_minmax(0,22rem)] lg:gap-20">
            <div>
              <SectionHeading eyebrow="Overview" heading={`About the ${vehicle.name}`} />
              {vehicle.body ? (
                <RichText html={vehicle.body} className="mt-8" />
              ) : vehicle.summary ? (
                <p className="lede mt-8">{vehicle.summary}</p>
              ) : null}

              {vehicle.features.length > 0 ? (
                <dl className="mt-12 grid gap-7 sm:grid-cols-2">
                  {vehicle.features.map((feature) => (
                    <div key={feature.label} className="flex gap-4">
                      <span
                        className="border-mist-line text-brand-dim inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xs border"
                        aria-hidden="true"
                      >
                        <Icon name={feature.icon} size={18} />
                      </span>
                      <div>
                        <dt className="font-display text-title">{feature.label}</dt>
                        {feature.detail ? (
                          <dd className="text-on-light-muted mt-1.5 text-small">{feature.detail}</dd>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>

            {/* Specification rail */}
            {vehicle.specs.length > 0 ? (
              <aside className="lg:sticky lg:top-28 lg:self-start">
                <div className="card-light p-7">
                  <h2 className="text-micro tracking-[0.18em] text-on-light-faint uppercase">
                    Specifications
                  </h2>
                  <dl className="divide-mist-line mt-5 divide-y">
                    {vehicle.specs.map((spec) => (
                      <div key={spec.label} className="flex items-baseline justify-between gap-4 py-3">
                        <dt className="text-on-light-muted text-small">{spec.label}</dt>
                        <dd className="text-right text-small font-medium">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <Link href="/contact" className="btn btn-solid-dark mt-7 w-full">
                    Request a quote
                  </Link>
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </section>

      {/* Gallery ----------------------------------------------------------- */}
      {galleryItems.length > 0 ? (
        <section className="tone-dark section">
          <div className="shell">
            <SectionHeading eyebrow="Gallery" heading="Inside and out" className="mb-12" />
            <GalleryGrid items={galleryItems} />
          </div>
        </section>
      ) : null}

      {/* Seat layouts + use cases ------------------------------------------ */}
      {vehicle.seatLayouts.length > 0 || vehicle.useCases.length > 0 ? (
        <section className="tone-light-soft section">
          <div className="shell">
            <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
              {vehicle.seatLayouts.length > 0 ? (
                <div>
                  <SectionHeading eyebrow="Seating" heading="Seat configurations" />
                  <ul className="divide-mist-line mt-8 divide-y border-t border-b border-[color:var(--color-mist-line)]">
                    {vehicle.seatLayouts.map((layout) => (
                      <li key={layout.label} className="flex items-start gap-4 py-5">
                        <Users
                          size={17}
                          strokeWidth={1.75}
                          aria-hidden="true"
                          className="text-brand-dim mt-1 shrink-0"
                        />
                        <div>
                          <p className="font-display text-title">{layout.label}</p>
                          {layout.detail ? (
                            <p className="text-on-light-muted mt-1 text-small">{layout.detail}</p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {vehicle.useCases.length > 0 ? (
                <div>
                  <SectionHeading eyebrow="Suitability" heading="What it is booked for" />
                  <ul className="mt-8 grid gap-6">
                    {vehicle.useCases.map((useCase) => (
                      <li key={useCase.title} className="flex items-start gap-3">
                        <Check
                          size={16}
                          strokeWidth={2}
                          aria-hidden="true"
                          className="text-brand-dim mt-1.5 shrink-0"
                        />
                        <div>
                          <p className="font-display text-title">{useCase.title}</p>
                          {useCase.detail ? (
                            <p className="text-on-light-muted mt-1 text-small">{useCase.detail}</p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* Pricing ------------------------------------------------------------ */}
      {showPrices && priceRows.length > 0 ? (
        <section className="tone-deep section">
          <div className="shell">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
              <SectionHeading
                eyebrow="Pricing"
                heading="Indicative rates"
                intro="A starting point for planning. Your written quote confirms the final price."
                ctaLabel="Full tariff card"
                ctaUrl="/tariffs"
              />
              <div>
                <dl className="divide-charcoal-line border-charcoal-line divide-y border-t border-b">
                  {priceRows.map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between gap-6 py-5">
                      <dt className="text-on-dark-muted text-small">{row.label}</dt>
                      <dd className="font-display tabular text-title">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                {vehicle.priceNote ? (
                  <p className="text-on-dark-faint mt-6 text-micro">{vehicle.priceNote}</p>
                ) : null}
                <p className="text-on-dark-faint mt-4 text-micro">
                  {settingText(settings, "display.priceDisclaimer")}
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : vehicle.priceNote ? (
        <section className="tone-deep section-tight">
          <div className="shell">
            <p className="lede shell-measure text-center">{vehicle.priceNote}</p>
          </div>
        </section>
      ) : null}

      {/* FAQs ---------------------------------------------------------------- */}
      {vehicle.faqs.length > 0 ? (
        <section className="tone-light section">
          <div className="shell">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
              <SectionHeading
                eyebrow="Questions"
                heading={`About the ${vehicle.name}`}
                ctaLabel="All questions"
                ctaUrl="/faq"
              />
              <FaqAccordion items={vehicle.faqs} tone="light" />
            </div>
          </div>
        </section>
      ) : null}

      {/* Enquiry -------------------------------------------------------------- */}
      <section className="tone-dark section">
        <div className="shell">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-20">
            <SectionHeading
              eyebrow="Enquire"
              heading={`Book the ${vehicle.name}`}
              intro="Send your dates and route. We will confirm availability and a written price."
            />
            <div className="border-charcoal-line bg-ink-raised rounded-md border p-7 lg:p-9">
              <EnquiryForm
                type="VEHICLE"
                vehicleId={vehicle.id}
                subject={vehicle.name}
                tone="dark"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Related -------------------------------------------------------------- */}
      {related.length > 0 ? (
        <section className="tone-light section">
          <div className="shell">
            <SectionHeading
              eyebrow="Also consider"
              heading="Other vehicles"
              ctaLabel="View the full fleet"
              ctaUrl="/fleet"
              align="split"
              className="mb-12"
            />
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <VehicleCard
                    vehicle={item}
                    showPrices={settingBool(settings, "display.showPrices")}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
