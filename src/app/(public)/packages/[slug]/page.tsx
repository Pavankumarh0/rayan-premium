import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Clock, X } from "lucide-react";
import { getPackage, listPackages } from "@/lib/content";
import { getSiteSettings } from "@/lib/site";
import {
  breadcrumbJsonLd,
  buildMetadataWith,
  faqJsonLd,
  serviceJsonLd,
  type Crumb,
} from "@/lib/seo";
import { settingBool, settingText } from "@/lib/settings";
import { formatPrice } from "@/lib/utils";
import { PageHero } from "@/components/public/page-hero";
import { RichText } from "@/components/public/rich-text";
import { SectionHeading } from "@/components/public/section-heading";
import { FaqAccordion } from "@/components/public/faq-accordion";
import { PackageCard } from "@/components/public/cards";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { ContactButtons } from "@/components/public/contact-buttons";
import { JsonLd } from "@/components/ui/json-ld";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [settings, pkg] = await Promise.all([getSiteSettings(), getPackage(slug)]);
  if (!pkg) {
    return buildMetadataWith(settings, { title: "Not found", path: `/packages/${slug}`, noindex: true });
  }

  return buildMetadataWith(settings, {
    title: pkg.metaTitle ?? pkg.name,
    description: pkg.metaDescription ?? pkg.summary,
    path: `/packages/${pkg.slug}`,
    image: pkg.ogImage ?? pkg.heroImage,
    noindex: pkg.noindex,
  });
}

export default async function PackagePage({ params }: Props) {
  const { slug } = await params;
  const [settings, pkg] = await Promise.all([getSiteSettings(), getPackage(slug)]);
  if (!pkg) notFound();

  const related = await listPackages({ limit: 2, excludeId: pkg.id });
  const showPrice = settingBool(settings, "display.showPrices") && pkg.showPrice;

  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Packages", path: "/packages" },
    { name: pkg.name, path: `/packages/${pkg.slug}` },
  ];

  const facts = [
    pkg.durationText ? { label: "Duration", value: pkg.durationText } : null,
    showPrice && pkg.priceFrom ? { label: "From", value: formatPrice(pkg.priceFrom) ?? "—" } : null,
    { label: "Chauffeur", value: "Included" },
    { label: "Vehicle", value: "Held throughout" },
  ].filter((f): f is { label: string; value: string } => f !== null);

  const whatsappMessage = `Hello, I would like a quote for the ${pkg.name} package.`;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(settings, crumbs),
          serviceJsonLd(settings, {
            name: pkg.name,
            description: pkg.summary,
            path: `/packages/${pkg.slug}`,
            image: pkg.heroImage,
          }),
          faqJsonLd(pkg.faqs),
        ].filter((d): d is Record<string, unknown> => d !== null)}
      />

      <PageHero
        eyebrow="Package"
        title={pkg.name}
        intro={pkg.tagline && pkg.tagline !== pkg.durationText ? pkg.tagline : pkg.summary}
        image={pkg.heroImage}
        imageAlt={pkg.heroImageAlt}
        crumbs={crumbs}
        facts={facts}
        priority
        size="tall"
        actions={<ContactButtons message={whatsappMessage} fallbackLabel="Request a quote" />}
      />

      {/* Overview ----------------------------------------------------------- */}
      <section className="tone-ivory section">
        <div className="shell">
          <div className="shell-measure">
            <SectionHeading eyebrow="Overview" heading={`About the ${pkg.name.toLowerCase()}`} />
            {pkg.body ? (
              <RichText html={pkg.body} className="mt-8" />
            ) : pkg.summary ? (
              <p className="lede mt-8">{pkg.summary}</p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Itinerary ------------------------------------------------------------ */}
      {pkg.itinerary.length > 0 ? (
        <section className="tone-charcoal section">
          <div className="shell">
            <SectionHeading eyebrow="Itinerary" heading="Day by day" className="mb-14" />
            <ol className="border-charcoal-line divide-charcoal-line divide-y border-t border-b">
              {pkg.itinerary.map((day, index) => (
                <li key={day.title} className="grid gap-4 py-7 sm:grid-cols-[8rem_1fr] sm:gap-10">
                  <p className="text-gold text-micro tracking-[0.18em] uppercase sm:pt-1">
                    <span className="sr-only">Step {index + 1}: </span>
                    {day.title}
                  </p>
                  {day.detail ? <p className="text-on-dark-muted text-small">{day.detail}</p> : null}
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Inclusions / exclusions ----------------------------------------------- */}
      {pkg.inclusions.length > 0 || pkg.exclusions.length > 0 ? (
        <section className="tone-ivory section">
          <div className="shell">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              {pkg.inclusions.length > 0 ? (
                <div className="card-light p-8 lg:p-10">
                  <h2 className="font-display text-headline">What is included</h2>
                  <ul className="mt-7 grid gap-4">
                    {pkg.inclusions.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-small">
                        <Check
                          size={16}
                          strokeWidth={2}
                          aria-hidden="true"
                          className="text-success mt-1 shrink-0"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {pkg.exclusions.length > 0 ? (
                <div className="card-light p-8 lg:p-10">
                  <h2 className="font-display text-headline">What is not included</h2>
                  <ul className="mt-7 grid gap-4">
                    {pkg.exclusions.map((item) => (
                      <li key={item} className="text-on-light-muted flex items-start gap-3 text-small">
                        <X
                          size={16}
                          strokeWidth={2}
                          aria-hidden="true"
                          className="text-on-light-faint mt-1 shrink-0"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <p className="text-on-light-faint mt-10 max-w-3xl text-micro">
              {pkg.priceNote ? `${pkg.priceNote} ` : ""}
              {settingText(settings, "display.priceDisclaimer")}
            </p>
          </div>
        </section>
      ) : null}

      {/* FAQs -------------------------------------------------------------------- */}
      {pkg.faqs.length > 0 ? (
        <section className="tone-ivory-soft section">
          <div className="shell">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
              <SectionHeading
                eyebrow="Questions"
                heading={pkg.name}
                ctaLabel="All questions"
                ctaUrl="/faq"
              />
              <FaqAccordion items={pkg.faqs} tone="light" />
            </div>
          </div>
        </section>
      ) : null}

      {/* Enquiry ------------------------------------------------------------------ */}
      <section className="tone-ink section">
        <div className="shell">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-20">
            <SectionHeading
              eyebrow="Enquire"
              heading={`Book the ${pkg.name.toLowerCase()}`}
              intro="Tell us your dates and group size and we will confirm a written price."
            />
            <div className="border-charcoal-line bg-ink-raised rounded-md border p-7 lg:p-9">
              <EnquiryForm type="PACKAGE" packageId={pkg.id} subject={pkg.name} tone="dark" />
            </div>
          </div>
        </div>
      </section>

      {/* Related -------------------------------------------------------------------- */}
      {related.length > 0 ? (
        <section className="tone-ivory section">
          <div className="shell">
            <SectionHeading
              eyebrow="Related"
              heading="Other packages"
              ctaLabel="All packages"
              ctaUrl="/packages"
              align="split"
              className="mb-12"
            />
            <ul className="grid gap-5 lg:grid-cols-2">
              {related.map((item) => (
                <li key={item.id}>
                  <PackageCard
                    pkg={item}
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
