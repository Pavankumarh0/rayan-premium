import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseSectionData, sBool, sList, sNum, sText } from "@/lib/sections";
import {
  listArticles,
  listDestinations,
  listFaqs,
  listGalleryItems,
  listPackages,
  listServices,
  listTariffGroups,
  listTestimonials,
  listVehicles,
  type SectionRecord,
} from "@/lib/content";
import { getSiteSettings, contactLinks } from "@/lib/site";
import { formatAddress, settingBool, settingOrNull, settingText } from "@/lib/settings";
import { faqJsonLd } from "@/lib/seo";
import { Icon } from "@/components/ui/icon";
import { JsonLd } from "@/components/ui/json-ld";
import { SectionHeading } from "./section-heading";
import { RichText } from "./rich-text";
import { ArticleCard, DestinationCard, PackageCard, ServiceCard, VehicleCard } from "./cards";
import { FaqAccordion } from "./faq-accordion";
import { PricingTable } from "./pricing-table";
import { Testimonials } from "./testimonials";
import { GalleryGrid } from "./gallery-grid";
import { CtaSection } from "./cta-section";
import { ContactButtons } from "./contact-buttons";
import { EnquiryForm } from "./enquiry-form";
import { HomeHero } from "./home-hero";

type Data = Record<string, unknown>;

/** Maps the CMS `tone` field onto the surface classes. */
function toneClass(data: Data): string {
  switch (sText(data, "tone")) {
    case "charcoal":
      return "tone-charcoal";
    case "ink":
      return "tone-ink";
    default:
      return "tone-ivory";
  }
}

function toneVariant(data: Data): "light" | "dark" {
  const tone = sText(data, "tone");
  return tone === "charcoal" || tone === "ink" ? "dark" : "light";
}

export async function SectionRenderer({
  sections,
  isFirst = true,
}: {
  sections: SectionRecord[];
  /** When true the first section may claim LCP priority for its image. */
  isFirst?: boolean;
}) {
  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((section, index) => (
        <SectionSwitch
          key={section.id}
          section={section}
          priority={isFirst && index === 0}
        />
      ))}
    </>
  );
}

async function SectionSwitch({
  section,
  priority,
}: {
  section: SectionRecord;
  priority: boolean;
}) {
  const data = parseSectionData(section.type, section.data);

  switch (section.type) {
    case "hero":
      return <HomeHero data={data} priority={priority} />;
    case "richText":
      return <RichTextSection data={data} />;
    case "imageText":
      return <ImageTextSection data={data} priority={priority} />;
    case "fullImage":
      return <FullImageSection data={data} priority={priority} />;
    case "gallery":
      return <GallerySection data={data} />;
    case "video":
      return <VideoSection data={data} />;
    case "stats":
      return <StatsSection data={data} />;
    case "featureGrid":
      return <FeatureGridSection data={data} />;
    case "process":
      return <ProcessSection data={data} />;
    case "fleetShowcase":
      return <FleetShowcaseSection data={data} />;
    case "serviceShowcase":
      return <ServiceShowcaseSection data={data} />;
    case "routeShowcase":
      return <RouteShowcaseSection data={data} />;
    case "packageShowcase":
      return <PackageShowcaseSection data={data} />;
    case "articleShowcase":
      return <ArticleShowcaseSection data={data} />;
    case "pricing":
      return <PricingSection data={data} />;
    case "testimonials":
      return <TestimonialsSection data={data} />;
    case "faq":
      return <FaqSection data={data} />;
    case "cta":
      return <CtaSectionWrapper data={data} />;
    case "contactDetails":
      return <ContactDetailsSection data={data} />;
    default:
      // An unknown type means the registry changed after the row was saved.
      // Rendering nothing is correct; the admin flags it for the editor.
      return null;
  }
}

// ---------------------------------------------------------------------------
// Layout sections
// ---------------------------------------------------------------------------

function RichTextSection({ data }: { data: Data }) {
  const wide = sText(data, "width") === "wide";
  return (
    <section className={cn(toneClass(data), "section")}>
      <div className="shell">
        <div className={cn(wide ? "max-w-4xl" : "shell-measure")}>
          <SectionHeading
            eyebrow={sText(data, "eyebrow")}
            heading={sText(data, "heading")}
            className="mb-10"
          />
          <RichText html={sText(data, "body")} />
        </div>
      </div>
    </section>
  );
}

function ImageTextSection({ data, priority }: { data: Data; priority: boolean }) {
  const mediaLeft = sText(data, "mediaSide") === "left";
  const image = sText(data, "image");
  const points = sList<{ title: string; detail: string }>(data, "points");
  const ctaLabel = sText(data, "ctaLabel");
  const ctaUrl = sText(data, "ctaUrl");

  return (
    <section className={cn(toneClass(data), "section")}>
      <div className="shell">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {image ? (
            <div className={cn("media-frame overflow-hidden rounded-md", mediaLeft ? "lg:order-1" : "lg:order-2")}>
              <Image
                src={image}
                alt={sText(data, "imageAlt")}
                width={960}
                height={1100}
                priority={priority}
                loading={priority ? undefined : "lazy"}
                sizes="(min-width: 1024px) 560px, 92vw"
                className="aspect-[4/5] w-full object-cover sm:aspect-[4/3] lg:aspect-[4/5]"
              />
            </div>
          ) : null}

          <div className={cn(mediaLeft ? "lg:order-2" : "lg:order-1")}>
            <SectionHeading
              eyebrow={sText(data, "eyebrow")}
              heading={sText(data, "heading")}
            />
            <RichText html={sText(data, "body")} className="mt-6" />

            {points.length > 0 ? (
              <dl className="mt-9 grid gap-6 sm:grid-cols-2">
                {points.map((point) => (
                  <div key={point.title}>
                    <dt className="font-display flex items-start gap-2.5 text-title">
                      <Check
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                        className="text-gold-dim mt-1.5 shrink-0"
                      />
                      {point.title}
                    </dt>
                    {point.detail ? (
                      <dd className="mt-2 pl-[1.625rem] text-small opacity-75">{point.detail}</dd>
                    ) : null}
                  </div>
                ))}
              </dl>
            ) : null}

            {ctaLabel && ctaUrl ? (
              <Link href={ctaUrl} className="link-arrow mt-9">
                {ctaLabel}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function FullImageSection({ data, priority }: { data: Data; priority: boolean }) {
  const image = sText(data, "image");
  if (!image) return null;

  const height = sText(data, "height");
  const heading = sText(data, "heading");
  const caption = sText(data, "caption");

  return (
    <section className="bg-ink relative isolate">
      <div
        className={cn(
          "relative overflow-hidden",
          height === "short" && "h-[36vh] min-h-[16rem]",
          height === "tall" && "h-[78vh] min-h-[28rem]",
          (height === "medium" || !height) && "h-[56vh] min-h-[22rem]",
          heading && "scrim-bottom",
        )}
      >
        <Image
          src={image}
          alt={sText(data, "imageAlt")}
          fill
          priority={priority}
          loading={priority ? undefined : "lazy"}
          sizes="100vw"
          className="object-cover"
        />
        {heading ? (
          <div className="absolute inset-x-0 bottom-0 z-10">
            <div className="shell pb-10 lg:pb-14">
              <h2 className="font-display text-on-dark max-w-2xl text-display-3">{heading}</h2>
            </div>
          </div>
        ) : null}
      </div>
      {caption ? (
        <div className="shell">
          <p className="text-on-dark-faint py-4 text-micro">{caption}</p>
        </div>
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Media sections
// ---------------------------------------------------------------------------

async function GallerySection({ data }: { data: Data }) {
  const items = await listGalleryItems({
    categorySlug: sText(data, "categorySlug") || null,
    limit: sNum(data, "limit", 8),
  });
  if (items.length === 0) return null;

  return (
    <section className={cn(toneClass(data), "section")}>
      <div className="shell">
        <SectionHeading
          eyebrow={sText(data, "eyebrow")}
          heading={sText(data, "heading")}
          intro={sText(data, "intro")}
          ctaLabel={sText(data, "ctaLabel")}
          ctaUrl={sText(data, "ctaUrl")}
          align="split"
          className="mb-12"
        />
        <GalleryGrid items={items} />
      </div>
    </section>
  );
}

function VideoSection({ data }: { data: Data }) {
  const url = sText(data, "videoUrl");
  if (!url) return null;
  const poster = sText(data, "poster");

  return (
    <section className={cn(toneClass(data), "section")}>
      <div className="shell">
        <SectionHeading
          eyebrow={sText(data, "eyebrow")}
          heading={sText(data, "heading")}
          intro={sText(data, "intro")}
          align="center"
          className="mb-12"
        />
        <div className="relative mx-auto aspect-video max-w-5xl overflow-hidden rounded-md">
          <iframe
            src={url}
            title={sText(data, "heading") || "Video"}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
            {...(poster ? { poster } : {})}
          />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Content sections
// ---------------------------------------------------------------------------

function StatsSection({ data }: { data: Data }) {
  const items = sList<{ value: string; label: string; detail: string }>(data, "items");
  if (items.length === 0) return null;
  const dark = toneVariant(data) === "dark";

  return (
    <section className={cn(toneClass(data), "section-tight")}>
      <div className="shell">
        <SectionHeading
          eyebrow={sText(data, "eyebrow")}
          heading={sText(data, "heading")}
          intro={sText(data, "intro")}
          className="mb-12"
        />
        <dl
          className={cn(
            "grid gap-px overflow-hidden rounded-md",
            items.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3",
            dark ? "bg-charcoal-line" : "bg-ivory-line",
          )}
        >
          {items.map((item) => (
            <div key={item.label} className={cn("p-7 lg:p-8", dark ? "bg-ink" : "bg-paper")}>
              <dt className="sr-only">{item.label}</dt>
              <dd>
                <span className="font-display tabular text-gold block text-display-3">
                  {item.value}
                </span>
                <span className="mt-3 block text-small font-medium">{item.label}</span>
                {item.detail ? (
                  <span className="mt-1.5 block text-micro opacity-65">{item.detail}</span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function FeatureGridSection({ data }: { data: Data }) {
  const items = sList<{ icon: string; title: string; detail: string }>(data, "items");
  if (items.length === 0) return null;

  const columns = sText(data, "columns") || "3";
  const dark = toneVariant(data) === "dark";

  return (
    <section className={cn(toneClass(data), "section")}>
      <div className="shell">
        <SectionHeading
          eyebrow={sText(data, "eyebrow")}
          heading={sText(data, "heading")}
          intro={sText(data, "intro")}
          className="mb-14"
        />
        <ul
          className={cn(
            "grid gap-x-10 gap-y-12",
            columns === "2" && "sm:grid-cols-2",
            columns === "3" && "sm:grid-cols-2 lg:grid-cols-3",
            columns === "4" && "sm:grid-cols-2 lg:grid-cols-4",
          )}
        >
          {items.map((item) => (
            <li key={item.title}>
              <span
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center rounded-xs border",
                  dark ? "border-charcoal-line text-gold" : "border-ivory-line text-gold-dim",
                )}
                aria-hidden="true"
              >
                <Icon name={item.icon} size={19} />
              </span>
              <h3 className="font-display mt-5 text-title">{item.title}</h3>
              {item.detail ? <p className="mt-3 text-small opacity-75">{item.detail}</p> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ProcessSection({ data }: { data: Data }) {
  const steps = sList<{ title: string; detail: string }>(data, "steps");
  if (steps.length === 0) return null;
  const dark = toneVariant(data) === "dark";

  return (
    <section className={cn(toneClass(data), "section")}>
      <div className="shell">
        <SectionHeading
          eyebrow={sText(data, "eyebrow")}
          heading={sText(data, "heading")}
          intro={sText(data, "intro")}
          className="mb-14"
        />
        <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-14">
          {steps.map((step, index) => (
            <li key={step.title} className="relative">
              <span
                className={cn(
                  "font-display tabular block text-display-3 leading-none",
                  dark ? "text-charcoal-line" : "text-ivory-line",
                )}
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display mt-4 text-title">
                <span className="sr-only">Step {index + 1}: </span>
                {step.title}
              </h3>
              {step.detail ? <p className="mt-3 text-small opacity-75">{step.detail}</p> : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Collection sections
// ---------------------------------------------------------------------------

async function FleetShowcaseSection({ data }: { data: Data }) {
  const settings = await getSiteSettings();
  const vehicles = await listVehicles({
    categorySlug: sText(data, "categorySlug") || null,
    featuredOnly: sText(data, "source") !== "all",
    limit: sNum(data, "limit", 5),
  });
  if (vehicles.length === 0) return null;

  const showPrices = settingBool(settings, "display.showPrices");
  const rail = sText(data, "layout") === "rail";
  const cardTone = toneVariant(data);

  return (
    <section className={cn(toneClass(data), "section")}>
      <div className="shell">
        <SectionHeading
          eyebrow={sText(data, "eyebrow")}
          heading={sText(data, "heading")}
          intro={sText(data, "intro")}
          ctaLabel={sText(data, "ctaLabel")}
          ctaUrl={sText(data, "ctaUrl")}
          align="split"
          className="mb-12"
        />
      </div>

      {rail ? (
        // Horizontal rail keeps a 5-vehicle fleet from becoming a ragged grid.
        <div className="shell-wide">
          <ul className="-mx-[var(--spacing-gutter)] flex snap-x snap-mandatory gap-5 overflow-x-auto px-[var(--spacing-gutter)] pb-4">
            {vehicles.map((vehicle) => (
              <li
                key={vehicle.id}
                className="w-[78vw] shrink-0 snap-start sm:w-[22rem] lg:w-[24rem]"
              >
                <VehicleCard vehicle={vehicle} showPrices={showPrices} tone={cardTone} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="shell">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <li key={vehicle.id}>
                <VehicleCard vehicle={vehicle} showPrices={showPrices} tone={cardTone} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

async function ServiceShowcaseSection({ data }: { data: Data }) {
  const services = await listServices({ limit: sNum(data, "limit", 9) });
  if (services.length === 0) return null;

  return (
    <section className={cn(toneClass(data), "section")}>
      <div className="shell">
        <SectionHeading
          eyebrow={sText(data, "eyebrow")}
          heading={sText(data, "heading")}
          intro={sText(data, "intro")}
          ctaLabel={sText(data, "ctaLabel")}
          ctaUrl={sText(data, "ctaUrl")}
          align="split"
          className="mb-12"
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <li key={service.id}>
              <ServiceCard service={service} tone={toneVariant(data)} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

async function RouteShowcaseSection({ data }: { data: Data }) {
  const destinations = await listDestinations({ limit: sNum(data, "limit", 8) });
  if (destinations.length === 0) return null;

  return (
    <section className={cn(toneClass(data), "section")}>
      <div className="shell">
        <SectionHeading
          eyebrow={sText(data, "eyebrow")}
          heading={sText(data, "heading")}
          intro={sText(data, "intro")}
          ctaLabel={sText(data, "ctaLabel")}
          ctaUrl={sText(data, "ctaUrl")}
          align="split"
          className="mb-12"
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((destination) => (
            <li key={destination.id}>
              <DestinationCard destination={destination} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

async function PackageShowcaseSection({ data }: { data: Data }) {
  const settings = await getSiteSettings();
  const packages = await listPackages({ limit: sNum(data, "limit", 6) });
  if (packages.length === 0) return null;

  return (
    <section className={cn(toneClass(data), "section")}>
      <div className="shell">
        <SectionHeading
          eyebrow={sText(data, "eyebrow")}
          heading={sText(data, "heading")}
          intro={sText(data, "intro")}
          ctaLabel={sText(data, "ctaLabel")}
          ctaUrl={sText(data, "ctaUrl")}
          align="split"
          className="mb-12"
        />
        <ul className="grid gap-5 lg:grid-cols-2">
          {packages.map((pkg) => (
            <li key={pkg.id}>
              <PackageCard pkg={pkg} showPrices={settingBool(settings, "display.showPrices")} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

async function ArticleShowcaseSection({ data }: { data: Data }) {
  const articles = await listArticles({ limit: sNum(data, "limit", 3) });
  if (articles.length === 0) return null;

  return (
    <section className={cn(toneClass(data), "section")}>
      <div className="shell">
        <SectionHeading
          eyebrow={sText(data, "eyebrow")}
          heading={sText(data, "heading")}
          intro={sText(data, "intro")}
          ctaLabel={sText(data, "ctaLabel")}
          ctaUrl={sText(data, "ctaUrl")}
          align="split"
          className="mb-12"
        />
        <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <li key={article.id}>
              <ArticleCard article={article} tone={toneVariant(data)} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

async function PricingSection({ data }: { data: Data }) {
  const settings = await getSiteSettings();
  if (!settingBool(settings, "display.showPrices")) return null;

  const tables = await listTariffGroups(sText(data, "groupSlug") || null);
  if (tables.length === 0) return null;

  const note = sText(data, "note") || settingText(settings, "display.priceDisclaimer");

  return (
    <section className={cn(toneClass(data), "section")}>
      <div className="shell">
        <SectionHeading
          eyebrow={sText(data, "eyebrow")}
          heading={sText(data, "heading")}
          intro={sText(data, "intro")}
          ctaLabel={sText(data, "ctaLabel")}
          ctaUrl={sText(data, "ctaUrl")}
          align="split"
          className="mb-12"
        />
        <div className="grid min-w-0 gap-12">
          {tables.map((table) => (
            <div key={table.id} className="min-w-0">
              {tables.length > 1 ? (
                <h3 className="font-display mb-5 text-title">{table.title}</h3>
              ) : null}
              <PricingTable table={table} tone={toneVariant(data)} />
            </div>
          ))}
        </div>
        {note ? <p className="mt-8 max-w-3xl text-micro opacity-65">{note}</p> : null}
      </div>
    </section>
  );
}

async function TestimonialsSection({ data }: { data: Data }) {
  const items = await listTestimonials(sNum(data, "limit", 6));
  // Stays hidden entirely until the client supplies verified testimonials.
  if (items.length === 0) return null;

  return (
    <section className={cn(toneClass(data), "section")}>
      <div className="shell">
        <SectionHeading
          eyebrow={sText(data, "eyebrow")}
          heading={sText(data, "heading")}
          intro={sText(data, "intro")}
          className="mb-12"
        />
        <Testimonials items={items} tone={toneVariant(data)} />
      </div>
    </section>
  );
}

async function FaqSection({ data }: { data: Data }) {
  const items = await listFaqs({
    categorySlug: sText(data, "categorySlug") || null,
    limit: sNum(data, "limit", 6),
  });
  if (items.length === 0) return null;

  return (
    <section className={cn(toneClass(data), "section")}>
      <JsonLd data={faqJsonLd(items)} />
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
          <SectionHeading
            eyebrow={sText(data, "eyebrow")}
            heading={sText(data, "heading")}
            intro={sText(data, "intro")}
            ctaLabel={sText(data, "ctaLabel")}
            ctaUrl={sText(data, "ctaUrl")}
          />
          <FaqAccordion items={items} tone={toneVariant(data)} />
        </div>
      </div>
    </section>
  );
}

async function CtaSectionWrapper({ data }: { data: Data }) {
  return (
    <CtaSection
      eyebrow={sText(data, "eyebrow")}
      heading={sText(data, "heading")}
      body={sText(data, "body")}
      primaryLabel={sText(data, "primaryLabel")}
      primaryUrl={sText(data, "primaryUrl")}
      secondaryLabel={sText(data, "secondaryLabel")}
      secondaryUrl={sText(data, "secondaryUrl")}
      image={sText(data, "image") || null}
      imageAlt={sText(data, "imageAlt")}
      variant={sText(data, "variant") === "panel" ? "panel" : "band"}
      showContactButtons={sBool(data, "showContactButtons")}
    />
  );
}

async function ContactDetailsSection({ data }: { data: Data }) {
  const settings = await getSiteSettings();
  const contact = contactLinks(settings);
  const address = formatAddress(settings);
  const mapEmbed = settingOrNull(settings, "contact.mapEmbedUrl");
  const hours = settingOrNull(settings, "contact.hours");
  const dark = toneVariant(data) === "dark";

  return (
    <section className={cn(toneClass(data), "section")}>
      <div className="shell">
        <SectionHeading
          eyebrow={sText(data, "eyebrow")}
          heading={sText(data, "heading")}
          intro={sText(data, "intro")}
          className="mb-14"
        />

        <div className="grid gap-14 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-20">
          <div>
            <dl className="grid gap-7">
              {contact.phone ? (
                <div>
                  <dt className="text-micro tracking-[0.16em] uppercase opacity-60">Call</dt>
                  <dd className="mt-2">
                    <a
                      href={contact.phoneHref!}
                      className="font-display hover:text-gold-dim tabular text-title transition-colors"
                    >
                      {contact.phone}
                    </a>
                    {contact.phoneSecondary ? (
                      <span className="mt-1 block text-small opacity-70 tabular">
                        {contact.phoneSecondary}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ) : null}

              {contact.email ? (
                <div>
                  <dt className="text-micro tracking-[0.16em] uppercase opacity-60">Email</dt>
                  <dd className="mt-2">
                    <a
                      href={contact.emailHref!}
                      className="font-display hover:text-gold-dim text-title break-all transition-colors"
                    >
                      {contact.email}
                    </a>
                  </dd>
                </div>
              ) : null}

              {address.length > 0 ? (
                <div>
                  <dt className="text-micro tracking-[0.16em] uppercase opacity-60">Visit</dt>
                  <dd className="mt-2">
                    <address className="text-small not-italic opacity-80">
                      {address.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </address>
                  </dd>
                </div>
              ) : null}

              {hours ? (
                <div>
                  <dt className="text-micro tracking-[0.16em] uppercase opacity-60">Hours</dt>
                  <dd className="mt-2 text-small opacity-80">{hours}</dd>
                </div>
              ) : null}
            </dl>

            <ContactButtons variant={dark ? "dark" : "light"} className="mt-9" />

            {!contact.phone && !contact.email && address.length === 0 ? (
              <p className="text-small opacity-70">
                Contact details will appear here once they are added in the admin under Settings →
                Contact details.
              </p>
            ) : null}
          </div>

          <div className="grid gap-10">
            {sBool(data, "showForm") ? (
              <div
                className={cn(
                  "rounded-md border p-7 lg:p-9",
                  dark ? "border-charcoal-line bg-ink-raised" : "border-ivory-line bg-paper",
                )}
              >
                <EnquiryForm tone={dark ? "dark" : "light"} heading="Send an enquiry" />
              </div>
            ) : null}

            {sBool(data, "showMap") && mapEmbed ? (
              <div className="overflow-hidden rounded-md">
                <iframe
                  src={mapEmbed}
                  title="Our location on a map"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-[22rem] w-full border-0"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
