import "server-only";

import type { Metadata } from "next";
import {
  formatAddress,
  getSettings,
  settingBool,
  settingOrNull,
  settingText,
  type SiteSettings,
} from "./settings";
import { absoluteUrl, stripHtml, truncate } from "./utils";

export type SeoInput = {
  /** Page title without the brand suffix. */
  title: string;
  description?: string | null;
  /** Site-relative path, e.g. "/fleet/premium-van". */
  path: string;
  image?: string | null;
  noindex?: boolean;
  /** Overrides the computed canonical. Used by the Page model's canonicalUrl. */
  canonicalOverride?: string | null;
  type?: "website" | "article";
  publishedTime?: Date | null;
  modifiedTime?: Date | null;
  authorName?: string | null;
};

export function siteUrlFrom(settings: SiteSettings): string {
  return (
    settingOrNull(settings, "seo.siteUrl") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

/**
 * Builds the complete Metadata object for a route: title, description,
 * canonical, robots and Open Graph. Every public page goes through this so
 * nothing ships with a duplicated or missing tag.
 */
export async function buildMetadata(input: SeoInput): Promise<Metadata> {
  const settings = await getSettings();
  return buildMetadataWith(settings, input);
}

export function buildMetadataWith(settings: SiteSettings, input: SeoInput): Metadata {
  const siteUrl = siteUrlFrom(settings);
  const brandName = settingText(settings, "brand.name") || "Rayan Premium Mobility";
  const template = settingText(settings, "seo.titleTemplate") || `%s · ${brandName}`;

  const rawTitle = input.title.trim();
  const fullTitle = rawTitle.length > 0 ? template.replace("%s", rawTitle) : brandName;

  const description = truncate(
    stripHtml(input.description?.trim() || settingText(settings, "seo.defaultDescription")),
    170,
  );

  const canonical = input.canonicalOverride?.trim()
    ? input.canonicalOverride.trim()
    : absoluteUrl(siteUrl, input.path);

  const image = input.image || settingOrNull(settings, "seo.defaultOgImage");
  const absoluteImage = image
    ? image.startsWith("http")
      ? image
      : absoluteUrl(siteUrl, image)
    : null;

  // The staging switch blocks the whole site; per-page noindex blocks one route.
  const blockAll = settingBool(settings, "seo.robotsPolicy");
  const noindex = blockAll || input.noindex === true;

  const verification = settingOrNull(settings, "seo.googleSiteVerification");

  return {
    metadataBase: new URL(siteUrl),
    title: fullTitle,
    description,
    alternates: { canonical },
    robots: noindex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
        },
    ...(verification ? { verification: { google: verification } } : {}),
    openGraph: {
      type: input.type ?? "website",
      title: fullTitle,
      description,
      url: canonical,
      siteName: brandName,
      locale: "en_IN",
      ...(absoluteImage
        ? { images: [{ url: absoluteImage, width: 1200, height: 630, alt: rawTitle || brandName }] }
        : {}),
      ...(input.type === "article"
        ? {
            publishedTime: input.publishedTime?.toISOString(),
            modifiedTime: input.modifiedTime?.toISOString(),
            authors: input.authorName ? [input.authorName] : undefined,
          }
        : {}),
    },
    twitter: {
      card: absoluteImage ? "summary_large_image" : "summary",
      title: fullTitle,
      description,
      ...(absoluteImage ? { images: [absoluteImage] } : {}),
    },
  };
}

// ---------------------------------------------------------------------------
// Structured data
//
// Only facts the client has actually supplied are emitted. Nothing here
// invents an address, a rating, a review count or a price.
// ---------------------------------------------------------------------------

export type JsonLd = Record<string, unknown>;

export function organizationJsonLd(settings: SiteSettings): JsonLd {
  const siteUrl = siteUrlFrom(settings);
  const name = settingText(settings, "brand.name") || "Rayan Premium Mobility";
  const legalName = settingOrNull(settings, "seo.legalName");
  const phone = settingOrNull(settings, "contact.phone");
  const email = settingOrNull(settings, "contact.email");
  const logo = settingOrNull(settings, "brand.logoImage");

  const sameAs = [
    settingOrNull(settings, "social.instagram"),
    settingOrNull(settings, "social.facebook"),
    settingOrNull(settings, "social.youtube"),
    settingOrNull(settings, "social.linkedin"),
    settingOrNull(settings, "social.x"),
  ].filter((value): value is string => value !== null);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name,
    url: siteUrl,
    ...(legalName ? { legalName } : {}),
    ...(logo ? { logo: absoluteUrl(siteUrl, logo) } : {}),
    ...(phone ? { telephone: phone } : {}),
    ...(email ? { email } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/**
 * LocalBusiness is only emitted when the client has explicitly confirmed the
 * details are accurate (Settings → SEO → "Publish LocalBusiness structured
 * data") AND the required name/address/phone are present. Publishing an
 * invented address is a real-world trust and compliance problem.
 */
export function localBusinessJsonLd(settings: SiteSettings): JsonLd | null {
  if (!settingBool(settings, "seo.enableLocalBusiness")) return null;

  const phone = settingOrNull(settings, "contact.phone");
  const street = settingOrNull(settings, "contact.addressLine1");
  const city = settingOrNull(settings, "contact.city");
  if (!phone || !street || !city) return null;

  const siteUrl = siteUrlFrom(settings);

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#localbusiness`,
    name: settingText(settings, "brand.name"),
    url: siteUrl,
    telephone: phone,
    ...(settingOrNull(settings, "contact.email")
      ? { email: settingText(settings, "contact.email") }
      : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: [street, settingOrNull(settings, "contact.addressLine2")]
        .filter(Boolean)
        .join(", "),
      addressLocality: city,
      ...(settingOrNull(settings, "contact.state")
        ? { addressRegion: settingText(settings, "contact.state") }
        : {}),
      ...(settingOrNull(settings, "contact.postalCode")
        ? { postalCode: settingText(settings, "contact.postalCode") }
        : {}),
      addressCountry: settingText(settings, "contact.country") || "IN",
    },
    ...(settingOrNull(settings, "contact.hours")
      ? { openingHours: settingText(settings, "contact.hours") }
      : {}),
  };
}

export function websiteJsonLd(settings: SiteSettings): JsonLd {
  const siteUrl = siteUrlFrom(settings);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: settingText(settings, "brand.name"),
    publisher: { "@id": `${siteUrl}/#organization` },
    inLanguage: "en-IN",
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbJsonLd(settings: SiteSettings, crumbs: Crumb[]): JsonLd | null {
  if (crumbs.length < 2) return null;
  const siteUrl = siteUrlFrom(settings);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(siteUrl, crumb.path),
    })),
  };
}

export function articleJsonLd(
  settings: SiteSettings,
  article: {
    title: string;
    slug: string;
    excerpt: string | null;
    heroImage: string | null;
    publishedAt: Date | null;
    updatedAt: Date;
    authorName: string | null;
  },
): JsonLd {
  const siteUrl = siteUrlFrom(settings);
  const url = absoluteUrl(siteUrl, `/guides/${article.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: truncate(article.title, 110),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    ...(article.excerpt ? { description: truncate(stripHtml(article.excerpt), 200) } : {}),
    ...(article.heroImage
      ? { image: [article.heroImage.startsWith("http") ? article.heroImage : absoluteUrl(siteUrl, article.heroImage)] }
      : {}),
    ...(article.publishedAt ? { datePublished: article.publishedAt.toISOString() } : {}),
    dateModified: article.updatedAt.toISOString(),
    ...(article.authorName
      ? { author: { "@type": "Person", name: article.authorName } }
      : { author: { "@id": `${siteUrl}/#organization` } }),
    publisher: { "@id": `${siteUrl}/#organization` },
  };
}

export function faqJsonLd(items: Array<{ question: string; answer: string }>): JsonLd | null {
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: stripHtml(item.answer) },
    })),
  };
}

/**
 * A vehicle is described as a Service offering, not a Product. Product/Offer
 * markup invites price and availability properties this business cannot
 * guarantee, and Google treats inaccurate Offer data as a structured-data
 * violation. No price is emitted here.
 */
export function serviceJsonLd(
  settings: SiteSettings,
  input: { name: string; description: string | null; path: string; image?: string | null },
): JsonLd {
  const siteUrl = siteUrlFrom(settings);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    serviceType: "Chauffeur-driven vehicle hire",
    url: absoluteUrl(siteUrl, input.path),
    ...(input.description ? { description: truncate(stripHtml(input.description), 220) } : {}),
    ...(input.image
      ? { image: input.image.startsWith("http") ? input.image : absoluteUrl(siteUrl, input.image) }
      : {}),
    provider: { "@id": `${siteUrl}/#organization` },
    ...(settingOrNull(settings, "contact.city")
      ? { areaServed: { "@type": "City", name: settingText(settings, "contact.city") } }
      : {}),
  };
}

export function addressLines(settings: SiteSettings): string[] {
  return formatAddress(settings);
}
