import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getSiteMenus, getSiteSettings, contactLinks } from "@/lib/site";
import { settingOrNull, settingText } from "@/lib/settings";
import { Wordmark } from "./wordmark";
import { SiteNav } from "./site-nav";

export async function Header() {
  const [settings, menus] = await Promise.all([getSiteSettings(), getSiteMenus()]);
  const contact = contactLinks(settings);

  const brandName = settingText(settings, "brand.name") || "Rayan Premium Mobility";
  const shortName = settingText(settings, "brand.shortName") || brandName;
  const logo = settingOrNull(settings, "brand.logoImage");
  const announcement = settingOrNull(settings, "display.announcement");
  const announcementUrl = settingOrNull(settings, "display.announcementUrl");

  // Passed into the client nav as a slot, so the logo stays server-rendered.
  const logoSlot = (
    <Link href="/" aria-label={`${brandName} — home`} className="inline-flex items-center">
      {logo ? (
        <Image
          src={logo}
          alt={brandName}
          width={240}
          height={88}
          priority
          className="h-9 w-auto object-contain lg:h-12"
        />
      ) : (
        <Wordmark name={brandName} shortName={shortName} />
      )}
    </Link>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {announcement ? (
        <div className="bg-brand text-on-dark text-micro">
          <div className="shell-wide flex min-h-9 items-center justify-center py-1.5 text-center">
            {announcementUrl ? (
              <Link href={announcementUrl} className="inline-flex items-center gap-1.5 hover:underline">
                {announcement}
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            ) : (
              <span>{announcement}</span>
            )}
          </div>
        </div>
      ) : null}

      <SiteNav
        logo={logoSlot}
        items={menus.header}
        ctaLabel="Enquire"
        ctaUrl="/contact"
        phoneHref={contact.phoneHref}
        phoneLabel={contact.phone}
      />
    </header>
  );
}
