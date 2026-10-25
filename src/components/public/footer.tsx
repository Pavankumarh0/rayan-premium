import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getSiteMenus, getSiteSettings, contactLinks } from "@/lib/site";
import { formatAddress, settingOrNull, settingText } from "@/lib/settings";
import type { NavNode } from "@/lib/content";
import { Wordmark } from "./wordmark";
import { SOCIAL_ICONS, type SocialIconName } from "@/components/ui/social-icons";

const SOCIALS: Array<{ key: string; label: string; icon: SocialIconName }> = [
  { key: "social.instagram", label: "Instagram", icon: "instagram" },
  { key: "social.facebook", label: "Facebook", icon: "facebook" },
  { key: "social.youtube", label: "YouTube", icon: "youtube" },
  { key: "social.linkedin", label: "LinkedIn", icon: "linkedin" },
  { key: "social.x", label: "X", icon: "x" },
];

function FooterColumn({ title, items }: { title: string; items: NavNode[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="text-on-dark-faint text-micro font-medium tracking-[0.18em] uppercase">
        {title}
      </h2>
      <ul className="mt-5 grid gap-2.5">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.url}
              target={item.openInNewTab ? "_blank" : undefined}
              rel={item.openInNewTab ? "noopener noreferrer" : undefined}
              className="text-on-dark-muted hover:text-brand-bright text-small transition-colors duration-200"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function Footer() {
  const [settings, menus] = await Promise.all([getSiteSettings(), getSiteMenus()]);
  const contact = contactLinks(settings);

  const brandName = settingText(settings, "brand.name") || "Rayan Premium Mobility";
  const shortName = settingText(settings, "brand.shortName");
  // The footer is a dark surface, so the light logo variant comes first.
  const logo =
    settingOrNull(settings, "brand.logoImageLight") ??
    settingOrNull(settings, "brand.logoImage");
  const blurb = settingText(settings, "brand.footerBlurb");
  const address = formatAddress(settings);
  const mapLink = settingOrNull(settings, "contact.mapLinkUrl");

  const socials = SOCIALS.map((social) => ({
    ...social,
    url: settingOrNull(settings, social.key),
  })).filter((social) => social.url !== null);

  return (
    <footer className="bg-ink border-charcoal-line border-t">
      <div className="shell-wide py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10">
          {/* Brand block --------------------------------------------------- */}
          <div className="max-w-sm">
            <Link href="/" aria-label={`${brandName} — home`} className="inline-flex">
              {logo ? (
                <Image
                  src={logo}
                  alt={brandName}
                  width={260}
                  height={113}
                  className="h-14 w-auto object-contain"
                />
              ) : (
                <Wordmark name={brandName} shortName={shortName} />
              )}
            </Link>

            {blurb ? <p className="text-on-dark-muted mt-6 text-small">{blurb}</p> : null}

            <div className="mt-7 grid gap-3">
              {contact.phoneHref ? (
                <a
                  href={contact.phoneHref}
                  className="text-on-dark hover:text-brand-bright inline-flex items-center gap-3 text-small transition-colors"
                >
                  <Phone size={15} strokeWidth={1.75} aria-hidden="true" className="text-brand-bright" />
                  <span className="tabular">{contact.phone}</span>
                </a>
              ) : null}

              {contact.whatsappHref ? (
                <a
                  href={contact.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-on-dark hover:text-brand-bright inline-flex items-center gap-3 text-small transition-colors"
                >
                  <MessageCircle size={15} strokeWidth={1.75} aria-hidden="true" className="text-brand-bright" />
                  WhatsApp
                </a>
              ) : null}

              {contact.emailHref ? (
                <a
                  href={contact.emailHref}
                  className="text-on-dark hover:text-brand-bright inline-flex items-center gap-3 text-small transition-colors break-all"
                >
                  <Mail size={15} strokeWidth={1.75} aria-hidden="true" className="text-brand-bright shrink-0" />
                  {contact.email}
                </a>
              ) : null}

              {address.length > 0 ? (
                <div className="text-on-dark-muted flex items-start gap-3 text-small">
                  <MapPin size={15} strokeWidth={1.75} aria-hidden="true" className="text-brand-bright mt-1 shrink-0" />
                  <address className="not-italic">
                    {address.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                    {mapLink ? (
                      <a
                        href={mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-bright mt-1.5 inline-block hover:underline"
                      >
                        View on map
                      </a>
                    ) : null}
                  </address>
                </div>
              ) : null}
            </div>

            {socials.length > 0 ? (
              <ul className="mt-7 flex items-center gap-2">
                {socials.map((social) => {
                  const SocialIcon = SOCIAL_ICONS[social.icon];
                  return (
                    <li key={social.key}>
                      <a
                        href={social.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-charcoal-line text-on-dark-muted hover:border-brand hover:text-brand-bright inline-flex h-10 w-10 items-center justify-center rounded-xs border transition-colors"
                      >
                        <SocialIcon size={17} />
                        <span className="sr-only">{social.label}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          <FooterColumn title="Explore" items={menus.footerMenu} />
          <FooterColumn title="Services" items={menus.footerServices} />
          <FooterColumn title="Top routes" items={menus.footerRoutes} />
        </div>

        <div className="divider-dark mt-14" />

        <div className="mt-7 flex flex-col-reverse items-start justify-between gap-5 sm:flex-row sm:items-center">
          <p className="text-on-dark-faint text-micro">
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>

          {menus.legal.length > 0 ? (
            <nav aria-label="Legal">
              <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {menus.legal.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.url}
                      className="text-on-dark-faint hover:text-brand-bright text-micro transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
