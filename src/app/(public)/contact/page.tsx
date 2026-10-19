import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getSystemPage } from "@/lib/content";
import { getSiteSettings, contactLinks } from "@/lib/site";
import { breadcrumbJsonLd, buildMetadataWith, type Crumb } from "@/lib/seo";
import { formatAddress, settingOrNull } from "@/lib/settings";
import { PageHero } from "@/components/public/page-hero";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { SectionRenderer } from "@/components/public/section-renderer";
import { JsonLd } from "@/components/ui/json-ld";

const CRUMBS: Crumb[] = [
  { name: "Home", path: "/" },
  { name: "Contact", path: "/contact" },
];

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSiteSettings(), getSystemPage("contact")]);
  return buildMetadataWith(settings, {
    title: page?.metaTitle ?? page?.title ?? "Contact",
    description: page?.metaDescription,
    path: "/contact",
    image: page?.ogImage,
    noindex: page?.noindex,
    canonicalOverride: page?.canonicalUrl,
  });
}

export default async function ContactPage() {
  const [settings, page] = await Promise.all([getSiteSettings(), getSystemPage("contact")]);
  const contact = contactLinks(settings);
  const address = formatAddress(settings);
  const hours = settingOrNull(settings, "contact.hours");
  const mapEmbed = settingOrNull(settings, "contact.mapEmbedUrl");

  const hasAnyContactDetail =
    Boolean(contact.phone || contact.email || contact.whatsapp) || address.length > 0;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(settings, CRUMBS)} />

      <PageHero
        eyebrow="Contact"
        title={page?.title ?? "Request a quote"}
        intro="Tell us your dates, group size and route. We will confirm vehicle availability and send a written price, usually the same day."
        crumbs={CRUMBS}
        size="compact"
        priority
      />

      <section className="tone-ivory section">
        <div className="shell">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
            {/* Details ---------------------------------------------------- */}
            <div>
              {hasAnyContactDetail ? (
                <dl className="grid gap-8">
                  {contact.phone ? (
                    <div>
                      <dt className="text-on-light-faint text-micro tracking-[0.16em] uppercase">
                        Call
                      </dt>
                      <dd className="mt-2.5">
                        <a
                          href={contact.phoneHref!}
                          className="font-display hover:text-gold-dim tabular text-title transition-colors"
                        >
                          {contact.phone}
                        </a>
                        {contact.phoneSecondary ? (
                          <span className="text-on-light-muted tabular mt-1 block text-small">
                            {contact.phoneSecondary}
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  ) : null}

                  {contact.whatsappHref ? (
                    <div>
                      <dt className="text-on-light-faint text-micro tracking-[0.16em] uppercase">
                        WhatsApp
                      </dt>
                      <dd className="mt-2.5">
                        <a
                          href={contact.whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-gold-dim inline-flex items-center gap-2 text-small transition-colors"
                        >
                          <MessageCircle size={16} strokeWidth={1.75} aria-hidden="true" className="text-gold-dim" />
                          Message us on WhatsApp
                        </a>
                      </dd>
                    </div>
                  ) : null}

                  {contact.email ? (
                    <div>
                      <dt className="text-on-light-faint text-micro tracking-[0.16em] uppercase">
                        Email
                      </dt>
                      <dd className="mt-2.5">
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
                      <dt className="text-on-light-faint text-micro tracking-[0.16em] uppercase">
                        Visit
                      </dt>
                      <dd className="mt-2.5">
                        <address className="text-on-light-muted text-small not-italic">
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
                      <dt className="text-on-light-faint text-micro tracking-[0.16em] uppercase">
                        Hours
                      </dt>
                      <dd className="text-on-light-muted mt-2.5 text-small">{hours}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : (
                // Honest empty state: better than printing an invented number.
                <div className="card-light p-7">
                  <h2 className="font-display text-title">Contact details coming soon</h2>
                  <p className="text-on-light-muted mt-3 text-small">
                    Phone, WhatsApp and email will appear here once they are added in the admin
                    under <strong>Settings → Contact details</strong>. The form opposite already
                    works and every enquiry is stored.
                  </p>
                </div>
              )}
            </div>

            {/* Form -------------------------------------------------------- */}
            <div className="card-light p-7 lg:p-10">
              <EnquiryForm tone="light" heading="Send an enquiry" />
            </div>
          </div>

          {mapEmbed ? (
            <div className="mt-16 overflow-hidden rounded-md">
              <iframe
                src={mapEmbed}
                title="Our location on a map"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[26rem] w-full border-0"
              />
            </div>
          ) : null}
        </div>
      </section>

      {page?.sections?.length ? <SectionRenderer sections={page.sections} isFirst={false} /> : null}
    </>
  );
}
