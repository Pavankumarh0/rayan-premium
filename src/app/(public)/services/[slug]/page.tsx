import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { getService, listServices, listVehicles } from "@/lib/content";
import { getSiteSettings } from "@/lib/site";
import {
  breadcrumbJsonLd,
  buildMetadataWith,
  faqJsonLd,
  serviceJsonLd,
  type Crumb,
} from "@/lib/seo";
import { settingBool } from "@/lib/settings";
import { PageHero } from "@/components/public/page-hero";
import { RichText } from "@/components/public/rich-text";
import { SectionHeading } from "@/components/public/section-heading";
import { FaqAccordion } from "@/components/public/faq-accordion";
import { ServiceCard, VehicleCard } from "@/components/public/cards";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { ContactButtons } from "@/components/public/contact-buttons";
import { JsonLd } from "@/components/ui/json-ld";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [settings, service] = await Promise.all([getSiteSettings(), getService(slug)]);
  if (!service) {
    return buildMetadataWith(settings, { title: "Not found", path: `/services/${slug}`, noindex: true });
  }

  return buildMetadataWith(settings, {
    title: service.metaTitle ?? service.name,
    description: service.metaDescription ?? service.summary,
    path: `/services/${service.slug}`,
    image: service.ogImage ?? service.heroImage,
    noindex: service.noindex,
  });
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const [settings, service] = await Promise.all([getSiteSettings(), getService(slug)]);
  if (!service) notFound();

  const [related, vehicles] = await Promise.all([
    listServices({ limit: 3, excludeId: service.id }),
    listVehicles({ featuredOnly: true, limit: 3 }),
  ]);

  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: service.name, path: `/services/${service.slug}` },
  ];

  const whatsappMessage = `Hello, I would like a quote for ${service.name.toLowerCase()}.`;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(settings, crumbs),
          serviceJsonLd(settings, {
            name: service.name,
            description: service.summary,
            path: `/services/${service.slug}`,
            image: service.heroImage,
          }),
          faqJsonLd(service.faqs),
        ].filter((d): d is Record<string, unknown> => d !== null)}
      />

      <PageHero
        eyebrow="Service"
        title={service.name}
        intro={service.tagline ?? service.summary}
        image={service.heroImage}
        imageAlt={service.heroImageAlt}
        crumbs={crumbs}
        priority
        actions={<ContactButtons message={whatsappMessage} fallbackLabel="Request a quote" />}
      />

      {/* Body + checklist -------------------------------------------------- */}
      <section className="tone-light section">
        <div className="shell">
          <div className="grid gap-14 lg:grid-cols-[1fr_minmax(0,20rem)] lg:gap-20">
            <div>
              <SectionHeading eyebrow="Overview" heading={`How ${service.name.toLowerCase()} works`} />
              {service.body ? (
                <RichText html={service.body} className="mt-8" />
              ) : service.summary ? (
                <p className="lede mt-8">{service.summary}</p>
              ) : null}
            </div>

            {service.checklist.length > 0 ? (
              <aside className="lg:sticky lg:top-28 lg:self-start">
                <div className="card-light p-7">
                  <h2 className="text-on-light-faint text-micro tracking-[0.18em] uppercase">
                    What this covers
                  </h2>
                  <ul className="mt-5 grid gap-3.5">
                    {service.checklist.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-small">
                        <Check
                          size={15}
                          strokeWidth={2}
                          aria-hidden="true"
                          className="text-brand-dim mt-1 shrink-0"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </section>

      {/* Highlights --------------------------------------------------------- */}
      {service.highlights.length > 0 ? (
        <section className="tone-dark section">
          <div className="shell">
            <SectionHeading
              eyebrow="What you get"
              heading="How we run it"
              className="mb-14"
            />
            <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-14">
              {service.highlights.map((highlight, index) => (
                <li key={highlight.title}>
                  <span
                    className="font-display tabular text-charcoal-line block text-display-3 leading-none"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display mt-4 text-title">{highlight.title}</h3>
                  {highlight.detail ? (
                    <p className="text-on-dark-muted mt-3 text-small">{highlight.detail}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Suggested vehicles -------------------------------------------------- */}
      {vehicles.length > 0 ? (
        <section className="tone-light section">
          <div className="shell">
            <SectionHeading
              eyebrow="Vehicles"
              heading="Commonly booked for this"
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
          </div>
        </section>
      ) : null}

      {/* FAQs ----------------------------------------------------------------- */}
      {service.faqs.length > 0 ? (
        <section className="tone-light-soft section">
          <div className="shell">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
              <SectionHeading
                eyebrow="Questions"
                heading={service.name}
                ctaLabel="All questions"
                ctaUrl="/faq"
              />
              <FaqAccordion items={service.faqs} tone="light" />
            </div>
          </div>
        </section>
      ) : null}

      {/* Enquiry ---------------------------------------------------------------- */}
      <section className="tone-deep section">
        <div className="shell">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-20">
            <SectionHeading
              eyebrow="Enquire"
              heading={`Plan your ${service.name.toLowerCase()}`}
              intro="Tell us the dates and the group, and we will come back with a written price."
            />
            <div className="border-charcoal-line bg-ink-raised rounded-md border p-7 lg:p-9">
              <EnquiryForm
                type="SERVICE"
                serviceId={service.id}
                subject={service.name}
                tone="dark"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Related ----------------------------------------------------------------- */}
      {related.length > 0 ? (
        <section className="tone-light section">
          <div className="shell">
            <SectionHeading
              eyebrow="Related"
              heading="Other services"
              ctaLabel="All services"
              ctaUrl="/services"
              align="split"
              className="mb-12"
            />
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <ServiceCard service={item} tone="light" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
