import "server-only";

import { cache } from "react";
import { getAllMenus } from "./content";
import { getSettings, settingOrNull, settingText, type SiteSettings } from "./settings";
import { buildWhatsAppUrl, phoneDigits } from "./utils";

/**
 * Request-scoped accessors.
 *
 * The header, footer, hero and several sections all need the settings row and
 * the menus. React's `cache()` dedupes them to one query each per render —
 * Next.js only does that automatically for `fetch`, not for a database client.
 */
export const getSiteSettings = cache(getSettings);
export const getSiteMenus = cache(getAllMenus);

export type ContactLinks = {
  /** The number to call. Falls back to the secondary if no primary is set. */
  phone: string | null;
  phoneHref: string | null;
  /** Only populated when there is genuinely a second, different number. */
  phoneSecondary: string | null;
  phoneSecondaryHref: string | null;
  whatsapp: string | null;
  whatsappHref: string | null;
  email: string | null;
  emailHref: string | null;
};

/**
 * Contact links are null until the client fills them in. Callers must branch on
 * null rather than rendering a placeholder — the site must never publish an
 * invented phone number or email address.
 */
export function contactLinks(settings: SiteSettings, message?: string): ContactLinks {
  // Whichever number the client has filled in should be callable. If only the
  // secondary field is set, it becomes the primary rather than staying hidden
  // behind an empty one.
  const primaryRaw = settingOrNull(settings, "contact.phone");
  const secondaryRaw = settingOrNull(settings, "contact.phoneSecondary");
  const phone = primaryRaw ?? secondaryRaw;
  const phoneSecondary = primaryRaw ? secondaryRaw : null;

  const whatsapp = settingOrNull(settings, "contact.whatsapp");
  const email = settingOrNull(settings, "contact.email");
  const defaultMessage =
    settingText(settings, "contact.whatsappMessage") ||
    "Hello, I would like a quote for a chauffeur-driven trip.";

  return {
    phone,
    phoneHref: phone ? `tel:+${phoneDigits(phone)}` : null,
    phoneSecondary,
    phoneSecondaryHref: phoneSecondary ? `tel:+${phoneDigits(phoneSecondary)}` : null,
    whatsapp,
    whatsappHref: whatsapp ? buildWhatsAppUrl(whatsapp, message || defaultMessage) : null,
    email,
    emailHref: email ? `mailto:${email}` : null,
  };
}

export const getContactLinks = cache(async (message?: string): Promise<ContactLinks> => {
  return contactLinks(await getSiteSettings(), message);
});
