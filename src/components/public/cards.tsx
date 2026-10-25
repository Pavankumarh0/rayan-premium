import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Luggage, Navigation, Users } from "lucide-react";
import { cn, formatDate, formatPrice, truncate } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import type {
  ArticleCard as ArticleCardData,
  DestinationCard as DestinationCardData,
  PackageCard as PackageCardData,
  ServiceCard as ServiceCardData,
  VehicleCard as VehicleCardData,
} from "@/lib/content";

/** Shared placeholder for a record whose photography has not been supplied. */
function MediaPlaceholder({ label }: { label: string }) {
  return (
    <div
      className="bg-charcoal flex h-full w-full items-center justify-center"
      role="img"
      aria-label={`${label} — photograph to be supplied`}
    >
      <span className="text-on-dark-faint text-micro tracking-[0.18em] uppercase">
        Image pending
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fleet
// ---------------------------------------------------------------------------

export function VehicleCard({
  vehicle,
  showPrices,
  priority = false,
  tone = "light",
}: {
  vehicle: VehicleCardData;
  showPrices: boolean;
  priority?: boolean;
  tone?: "light" | "dark";
}) {
  const price = showPrices && vehicle.showPrice ? formatPrice(vehicle.priceLocal) : null;

  return (
    <article
      className={cn(
        // h-full so sibling cards in a grid row share a baseline even when
        // one tagline wraps to two lines.
        "group flex h-full flex-col overflow-hidden",
        tone === "light" ? "card-light" : "card-dark",
      )}
    >
      <Link href={`/fleet/${vehicle.slug}`} className="media-frame block aspect-[4/3]">
        {vehicle.heroImage ? (
          <Image
            src={vehicle.heroImage}
            alt={vehicle.heroImageAlt || vehicle.name}
            width={720}
            height={540}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes="(min-width: 1280px) 360px, (min-width: 768px) 45vw, 92vw"
            className="h-full w-full object-cover"
          />
        ) : (
          <MediaPlaceholder label={vehicle.name} />
        )}
      </Link>

      <div className="flex flex-1 flex-col p-6 lg:p-7">
        {vehicle.category ? (
          <p
            className={cn(
              "text-micro tracking-[0.16em] uppercase",
              tone === "light" ? "text-on-light-faint" : "text-on-dark-faint",
            )}
          >
            {vehicle.category.name}
          </p>
        ) : null}

        <h3 className="font-display mt-2 text-title">
          <Link href={`/fleet/${vehicle.slug}`} className="hover:text-brand-dim transition-colors">
            {vehicle.name}
          </Link>
        </h3>

        {vehicle.tagline ? (
          <p
            className={cn(
              "mt-2 text-small",
              tone === "light" ? "text-on-light-muted" : "text-on-dark-muted",
            )}
          >
            {truncate(vehicle.tagline, 110)}
          </p>
        ) : null}

        <dl
          className={cn(
            "mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-micro",
            tone === "light" ? "text-on-light-muted" : "text-on-dark-muted",
          )}
        >
          {vehicle.seats > 0 ? (
            <div className="flex items-center gap-1.5">
              <Users size={14} strokeWidth={1.75} aria-hidden="true" className="text-brand-dim" />
              <dt className="sr-only">Seats</dt>
              <dd className="tabular">{vehicle.seats} seats</dd>
            </div>
          ) : null}
          {vehicle.luggage ? (
            <div className="flex items-center gap-1.5">
              <Luggage size={14} strokeWidth={1.75} aria-hidden="true" className="text-brand-dim" />
              <dt className="sr-only">Luggage</dt>
              <dd>{vehicle.luggage}</dd>
            </div>
          ) : null}
        </dl>

        <div
          className={cn(
            "mt-auto flex items-end justify-between gap-4 border-t pt-5",
            tone === "light" ? "border-mist-line" : "border-charcoal-line",
          )}
        >
          {price ? (
            <div>
              <p
                className={cn(
                  "text-micro",
                  tone === "light" ? "text-on-light-faint" : "text-on-dark-faint",
                )}
              >
                From
              </p>
              <p className="font-display tabular mt-0.5 text-title">
                {price}
                {vehicle.priceLocalLabel ? (
                  <span
                    className={cn(
                      "ml-1.5 font-sans text-micro",
                      tone === "light" ? "text-on-light-faint" : "text-on-dark-faint",
                    )}
                  >
                    / {vehicle.priceLocalLabel}
                  </span>
                ) : null}
              </p>
            </div>
          ) : (
            <span />
          )}

          <Link href={`/fleet/${vehicle.slug}`} className="link-arrow shrink-0">
            Details
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Services — icon-led, no photograph, so a service grid reads differently
// from a fleet grid on the same page.
// ---------------------------------------------------------------------------

export function ServiceCard({
  service,
  tone = "dark",
}: {
  service: ServiceCardData;
  tone?: "light" | "dark";
}) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col p-7 lg:p-8",
        tone === "light" ? "card-light" : "card-dark",
      )}
    >
      <span
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-xs border",
          tone === "light" ? "border-mist-line text-brand-dim" : "border-charcoal-line text-brand-bright",
        )}
        aria-hidden="true"
      >
        <Icon name={service.icon} size={19} />
      </span>

      <h3 className="font-display mt-6 text-title">
        <Link href={`/services/${service.slug}`} className="after:absolute after:inset-0">
          {service.name}
        </Link>
      </h3>

      {service.summary ? (
        <p
          className={cn(
            "mt-3 flex-1 text-small",
            tone === "light" ? "text-on-light-muted" : "text-on-dark-muted",
          )}
        >
          {truncate(service.summary, 155)}
        </p>
      ) : null}

      <span className="link-arrow mt-6">
        Explore
        <ArrowRight size={15} aria-hidden="true" />
      </span>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Destinations — wide photographic tile with the route facts overlaid.
// ---------------------------------------------------------------------------

export function DestinationCard({ destination }: { destination: DestinationCardData }) {
  // Distance and journey time are only shown once the client has confirmed them.
  const showFacts = destination.factsVerified;

  return (
    <article className="group relative isolate overflow-hidden rounded-md">
      <div className="media-frame scrim-bottom aspect-[5/4] sm:aspect-[4/3]">
        {destination.heroImage ? (
          <Image
            src={destination.heroImage}
            alt={destination.heroImageAlt || destination.name}
            width={720}
            height={540}
            loading="lazy"
            sizes="(min-width: 1280px) 320px, (min-width: 768px) 45vw, 92vw"
            className="h-full w-full object-cover"
          />
        ) : (
          <MediaPlaceholder label={destination.name} />
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6">
        {destination.region ? (
          <p className="text-brand-bright text-micro tracking-[0.16em] uppercase">{destination.region}</p>
        ) : null}

        <h3 className="font-display text-on-dark mt-1.5 text-title">
          <Link href={`/outstation/${destination.slug}`} className="after:absolute after:inset-0">
            {destination.name}
          </Link>
        </h3>

        {showFacts && (destination.distanceKm || destination.travelTimeText) ? (
          <dl className="text-on-dark-muted mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-micro">
            {destination.distanceKm ? (
              <div className="flex items-center gap-1.5">
                <Navigation size={13} strokeWidth={1.75} aria-hidden="true" className="text-brand-bright" />
                <dt className="sr-only">Distance</dt>
                <dd className="tabular">{destination.distanceKm} km</dd>
              </div>
            ) : null}
            {destination.travelTimeText ? (
              <div className="flex items-center gap-1.5">
                <Clock size={13} strokeWidth={1.75} aria-hidden="true" className="text-brand-bright" />
                <dt className="sr-only">Approximate journey time</dt>
                <dd>{destination.travelTimeText}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Packages — horizontal editorial row.
// ---------------------------------------------------------------------------

export function PackageCard({
  pkg,
  showPrices,
}: {
  pkg: PackageCardData;
  showPrices: boolean;
}) {
  const price = showPrices && pkg.showPrice ? formatPrice(pkg.priceFrom) : null;

  return (
    <article className="group card-light grid h-full overflow-hidden sm:grid-cols-[minmax(0,13rem)_1fr] lg:grid-cols-[minmax(0,17rem)_1fr]">
      <Link href={`/packages/${pkg.slug}`} className="media-frame aspect-[4/3] sm:aspect-auto">
        {pkg.heroImage ? (
          <Image
            src={pkg.heroImage}
            alt={pkg.heroImageAlt || pkg.name}
            width={560}
            height={420}
            loading="lazy"
            sizes="(min-width: 1024px) 272px, (min-width: 640px) 208px, 92vw"
            className="h-full w-full object-cover"
          />
        ) : (
          <MediaPlaceholder label={pkg.name} />
        )}
      </Link>

      <div className="flex flex-col p-6 lg:p-8">
        <div className="text-on-light-faint flex flex-wrap items-center gap-x-4 gap-y-1 text-micro">
          {pkg.durationText ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} strokeWidth={1.75} aria-hidden="true" className="text-brand-dim" />
              {pkg.durationText}
            </span>
          ) : null}
          {price ? <span className="tabular">From {price}</span> : null}
        </div>

        <h3 className="font-display mt-2.5 text-title">
          <Link href={`/packages/${pkg.slug}`} className="hover:text-brand-dim transition-colors">
            {pkg.name}
          </Link>
        </h3>

        {pkg.summary ? (
          <p className="text-on-light-muted mt-3 text-small">{truncate(pkg.summary, 170)}</p>
        ) : null}

        <Link href={`/packages/${pkg.slug}`} className="link-arrow mt-6">
          View itinerary
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export function ArticleCard({
  article,
  tone = "light",
  featured = false,
}: {
  article: ArticleCardData;
  tone?: "light" | "dark";
  featured?: boolean;
}) {
  const published = formatDate(article.publishedAt);

  return (
    <article className={cn("group flex flex-col", featured && "lg:flex-row lg:items-center lg:gap-10")}>
      <Link
        href={`/guides/${article.slug}`}
        className={cn(
          "media-frame block overflow-hidden rounded-md",
          featured ? "aspect-[16/10] lg:w-1/2" : "aspect-[16/10]",
        )}
      >
        {article.heroImage ? (
          <Image
            src={article.heroImage}
            alt={article.heroImageAlt || article.title}
            width={880}
            height={550}
            loading="lazy"
            sizes={featured ? "(min-width: 1024px) 560px, 92vw" : "(min-width: 1024px) 380px, 92vw"}
            className="h-full w-full object-cover"
          />
        ) : (
          <MediaPlaceholder label={article.title} />
        )}
      </Link>

      <div className={cn("flex flex-1 flex-col", featured ? "mt-6 lg:mt-0" : "mt-5")}>
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-3 gap-y-1 text-micro",
            tone === "light" ? "text-on-light-faint" : "text-on-dark-faint",
          )}
        >
          {article.category ? (
            <Link
              href={`/guides/category/${article.category.slug}`}
              className="text-brand-dim tracking-[0.14em] uppercase hover:underline"
            >
              {article.category.name}
            </Link>
          ) : null}
          {published ? <time dateTime={article.publishedAt!.toISOString()}>{published}</time> : null}
          {article.readMinutes ? <span>{article.readMinutes} min read</span> : null}
        </div>

        <h3 className={cn("font-display mt-2.5", featured ? "text-headline" : "text-title")}>
          <Link href={`/guides/${article.slug}`} className="hover:text-brand-dim transition-colors">
            {article.title}
          </Link>
        </h3>

        {article.excerpt ? (
          <p
            className={cn(
              "mt-3 text-small",
              tone === "light" ? "text-on-light-muted" : "text-on-dark-muted",
            )}
          >
            {truncate(article.excerpt, featured ? 220 : 140)}
          </p>
        ) : null}

        <Link href={`/guides/${article.slug}`} className="link-arrow mt-5">
          Read guide
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
