import "server-only";

import { db } from "./db";

export type SettingType = "text" | "textarea" | "boolean" | "url" | "email" | "tel" | "image" | "number";

export type SettingDef = {
  key: string;
  label: string;
  group: SettingGroup;
  type: SettingType;
  help?: string;
  default: string;
  /** Flagged on the admin dashboard until the client fills it in. */
  requiredForLaunch?: boolean;
  /** Never rendered back into an input once saved (SMTP password). */
  secret?: boolean;
};

export const SETTING_GROUPS = {
  brand: "Brand",
  contact: "Contact details",
  social: "Social links",
  seo: "SEO & analytics",
  display: "Display options",
  email: "Email notifications",
} as const;

export type SettingGroup = keyof typeof SETTING_GROUPS;

/**
 * The full settings catalogue. Contact details intentionally ship empty — the
 * site must never publish an invented phone number, email or address. Public
 * components fall back to the contact page while a value is missing.
 */
export const SETTING_DEFS: SettingDef[] = [
  // Brand -------------------------------------------------------------------
  { key: "brand.name", label: "Business name", group: "brand", type: "text", default: "Rayan Premium Mobility" },
  { key: "brand.shortName", label: "Short name", group: "brand", type: "text", default: "Rayan", help: "Used in tight spaces such as the mobile header." },
  { key: "brand.tagline", label: "Tagline", group: "brand", type: "text", default: "Chauffeur-driven group travel" },
  { key: "brand.logoImage", label: "Logo image", group: "brand", type: "image", default: "", help: "Used on light surfaces such as the header. The wordmark is used when empty." },
  { key: "brand.logoImageLight", label: "Logo image (for dark backgrounds)", group: "brand", type: "image", default: "", help: "A light or knockout version, used in the footer. Falls back to the main logo, then the wordmark." },
  { key: "brand.footerBlurb", label: "Footer description", group: "brand", type: "textarea", default: "Chauffeur-driven premium vans and coaches for weddings, corporate travel, pilgrimages and outstation journeys." },

  // Contact -----------------------------------------------------------------
  { key: "contact.phone", label: "Phone number", group: "contact", type: "tel", default: "", requiredForLaunch: true, help: "Include the country code, e.g. +91 98765 43210. Call buttons stay hidden until this is set." },
  { key: "contact.phoneSecondary", label: "Second phone number", group: "contact", type: "tel", default: "" },
  { key: "contact.whatsapp", label: "WhatsApp number", group: "contact", type: "tel", default: "", requiredForLaunch: true, help: "With country code. WhatsApp buttons stay hidden until this is set." },
  { key: "contact.whatsappMessage", label: "WhatsApp prefilled message", group: "contact", type: "text", default: "Hello, I would like a quote for a chauffeur-driven trip." },
  { key: "contact.email", label: "Email address", group: "contact", type: "email", default: "", requiredForLaunch: true },
  { key: "contact.addressLine1", label: "Address line 1", group: "contact", type: "text", default: "" },
  { key: "contact.addressLine2", label: "Address line 2", group: "contact", type: "text", default: "" },
  { key: "contact.city", label: "City", group: "contact", type: "text", default: "" },
  { key: "contact.state", label: "State", group: "contact", type: "text", default: "" },
  { key: "contact.postalCode", label: "Postal code", group: "contact", type: "text", default: "" },
  { key: "contact.country", label: "Country", group: "contact", type: "text", default: "India" },
  { key: "contact.hours", label: "Operating hours", group: "contact", type: "text", default: "" , help: "Shown on the contact page and used for LocalBusiness data. Leave empty if not confirmed." },
  { key: "contact.mapEmbedUrl", label: "Map embed URL", group: "contact", type: "url", default: "", help: "Google Maps embed src. The map block is hidden when empty." },
  { key: "contact.mapLinkUrl", label: "Map link URL", group: "contact", type: "url", default: "" },

  // Social ------------------------------------------------------------------
  { key: "social.instagram", label: "Instagram", group: "social", type: "url", default: "" },
  { key: "social.facebook", label: "Facebook", group: "social", type: "url", default: "" },
  { key: "social.youtube", label: "YouTube", group: "social", type: "url", default: "" },
  { key: "social.linkedin", label: "LinkedIn", group: "social", type: "url", default: "" },
  { key: "social.x", label: "X / Twitter", group: "social", type: "url", default: "" },

  // SEO ---------------------------------------------------------------------
  { key: "seo.siteUrl", label: "Canonical site URL", group: "seo", type: "url", default: "http://localhost:3000", requiredForLaunch: true, help: "No trailing slash. Drives canonical tags, Open Graph URLs and the sitemap." },
  { key: "seo.defaultTitle", label: "Default meta title", group: "seo", type: "text", default: "Rayan Premium Mobility" },
  { key: "seo.titleTemplate", label: "Title template", group: "seo", type: "text", default: "%s · Rayan Premium Mobility", help: "%s is replaced by the page title." },
  { key: "seo.defaultDescription", label: "Default meta description", group: "seo", type: "textarea", default: "Chauffeur-driven premium vans and coaches for weddings, corporate travel, pilgrimages, airport transfers and outstation journeys." },
  { key: "seo.defaultOgImage", label: "Default social share image", group: "seo", type: "image", default: "", help: "1200×630 recommended." },
  { key: "seo.robotsPolicy", label: "Search engine indexing", group: "seo", type: "boolean", default: "false", help: "Turn ON to block all search engines (use while the site is in staging)." },
  { key: "seo.robotsExtra", label: "Extra robots.txt rules", group: "seo", type: "textarea", default: "", help: "Appended verbatim to the generated robots.txt." },
  { key: "seo.googleSiteVerification", label: "Google site verification", group: "seo", type: "text", default: "" },
  { key: "seo.gaMeasurementId", label: "Google Analytics measurement ID", group: "seo", type: "text", default: "", help: "e.g. G-XXXXXXXXXX. Analytics is not loaded while empty." },
  { key: "seo.gtmId", label: "Google Tag Manager ID", group: "seo", type: "text", default: "", help: "e.g. GTM-XXXXXXX." },
  { key: "seo.enableLocalBusiness", label: "Publish LocalBusiness structured data", group: "seo", type: "boolean", default: "false", help: "Only enable once the business name, address and phone above are verified and accurate." },
  { key: "seo.legalName", label: "Registered legal name", group: "seo", type: "text", default: "", help: "Used in Organization structured data when provided." },

  // Display -----------------------------------------------------------------
  { key: "display.showPrices", label: "Show prices on fleet pages", group: "display", type: "boolean", default: "true", help: "Master switch. Individual vehicles can still opt out." },
  { key: "display.showTariffPage", label: "Show the tariffs page in navigation", group: "display", type: "boolean", default: "true" },
  { key: "display.priceDisclaimer", label: "Pricing disclaimer", group: "display", type: "textarea", default: "Indicative rates only. Final pricing depends on route, duration, season and vehicle availability, and is confirmed in writing before travel. Tolls, parking, permits and state entry fees are charged at actuals unless stated otherwise." },
  { key: "display.announcement", label: "Announcement bar text", group: "display", type: "text", default: "", help: "Shown above the header. Hidden when empty." },
  { key: "display.announcementUrl", label: "Announcement bar link", group: "display", type: "text", default: "" },

  // Email -------------------------------------------------------------------
  { key: "email.notifyTo", label: "Send enquiry alerts to", group: "email", type: "email", default: "", help: "Leave empty to store enquiries without sending email." },
  { key: "email.fromAddress", label: "From address", group: "email", type: "email", default: "" },
  { key: "email.fromName", label: "From name", group: "email", type: "text", default: "Rayan Premium Mobility" },
  { key: "email.smtpHost", label: "SMTP host", group: "email", type: "text", default: "" },
  { key: "email.smtpPort", label: "SMTP port", group: "email", type: "number", default: "587" },
  { key: "email.smtpUser", label: "SMTP username", group: "email", type: "text", default: "" },
  { key: "email.smtpPassword", label: "SMTP password", group: "email", type: "text", default: "", secret: true },
  { key: "email.smtpSecure", label: "Use TLS (port 465)", group: "email", type: "boolean", default: "false" },
];

export const SETTING_DEF_BY_KEY = new Map(SETTING_DEFS.map((def) => [def.key, def]));

export type SiteSettings = Record<string, string>;

function withDefaults(rows: Array<{ key: string; value: string }>): SiteSettings {
  const out: SiteSettings = {};
  for (const def of SETTING_DEFS) out[def.key] = def.default;
  for (const row of rows) {
    if (SETTING_DEF_BY_KEY.has(row.key)) out[row.key] = row.value;
  }
  return out;
}

/**
 * Read every setting. Deduplicated per request so a page render that touches
 * the header, footer and body only issues one query.
 */
export async function getSettings(): Promise<SiteSettings> {
  const rows = await db.setting.findMany({ select: { key: true, value: true } });
  return withDefaults(rows);
}

export function settingBool(settings: SiteSettings, key: string): boolean {
  return settings[key] === "true";
}

export function settingText(settings: SiteSettings, key: string): string {
  return (settings[key] ?? "").trim();
}

/** A set value, or null — so callers can branch on "not configured yet". */
export function settingOrNull(settings: SiteSettings, key: string): string | null {
  const value = settingText(settings, key);
  return value.length > 0 ? value : null;
}

export async function updateSettings(values: Record<string, string>): Promise<void> {
  const writes = Object.entries(values)
    .filter(([key]) => SETTING_DEF_BY_KEY.has(key))
    .map(([key, value]) => {
      const def = SETTING_DEF_BY_KEY.get(key)!;
      const clean = value.slice(0, 5000);
      return db.setting.upsert({
        where: { key },
        create: { key, value: clean, group: def.group },
        update: { value: clean, group: def.group },
      });
    });

  if (writes.length > 0) await db.$transaction(writes);
}

/** Launch checklist surfaced on the admin dashboard. */
export function missingLaunchSettings(settings: SiteSettings): SettingDef[] {
  return SETTING_DEFS.filter(
    (def) => def.requiredForLaunch && settingText(settings, def.key).length === 0,
  );
}

/**
 * Composed postal address, skipping blank parts.
 *
 * Returns an empty array unless there is a street line or a city: the country
 * defaults to "India", and rendering that on its own reads as a broken address
 * block rather than a real one.
 */
export function formatAddress(settings: SiteSettings): string[] {
  const hasRealAddress =
    settingText(settings, "contact.addressLine1").length > 0 ||
    settingText(settings, "contact.city").length > 0;
  if (!hasRealAddress) return [];

  return [
    settingText(settings, "contact.addressLine1"),
    settingText(settings, "contact.addressLine2"),
    [settingText(settings, "contact.city"), settingText(settings, "contact.state")]
      .filter(Boolean)
      .join(", "),
    [settingText(settings, "contact.postalCode"), settingText(settings, "contact.country")]
      .filter(Boolean)
      .join(" "),
  ].filter((line) => line.length > 0);
}
