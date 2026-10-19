import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPage } from "@/lib/content";
import { getSiteSettings } from "@/lib/site";
import { breadcrumbJsonLd, buildMetadataWith, type Crumb } from "@/lib/seo";
import { PageHero } from "@/components/public/page-hero";
import { SectionRenderer } from "@/components/public/section-renderer";
import { JsonLd } from "@/components/ui/json-ld";

/**
 * Catch-all for editor-created pages (About, Privacy policy, Terms, …).
 *
 * Static segments such as /fleet and /contact take precedence over this
 * dynamic segment in Next's route matching, so adding a hard-coded route never
 * collides with a CMS page of the same slug. Slugs that back a hard-coded
 * route are blocked here so the two can never render the same URL twice.
 */
type Props = { params: Promise<{ slug: string }> };

const RESERVED = new Set([
  "home",
  "fleet",
  "services",
  "outstation",
  "packages",
  "tariffs",
  "gallery",
  "guides",
  "faq",
  "contact",
  "admin",
  "api",
]);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [settings, page] = await Promise.all([getSiteSettings(), getPublishedPage(slug)]);

  if (!page || RESERVED.has(slug)) {
    return buildMetadataWith(settings, { title: "Not found", path: `/${slug}`, noindex: true });
  }

  return buildMetadataWith(settings, {
    title: page.metaTitle ?? page.title,
    description: page.metaDescription,
    path: `/${page.slug}`,
    image: page.ogImage,
    noindex: page.noindex,
    canonicalOverride: page.canonicalUrl,
  });
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params;
  if (RESERVED.has(slug)) notFound();

  const [settings, page] = await Promise.all([getSiteSettings(), getPublishedPage(slug)]);
  if (!page) notFound();

  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: page.title, path: `/${page.slug}` },
  ];

  // A page whose first section is its own hero renders that instead of the
  // standard PageHero, so an editor can art-direct the top of the page.
  const leadsWithHero = page.sections[0]?.type === "hero";

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(settings, crumbs)} />

      {leadsWithHero ? null : (
        <PageHero title={page.title} crumbs={crumbs} size="compact" priority />
      )}

      {page.sections.length > 0 ? (
        <SectionRenderer sections={page.sections} isFirst={leadsWithHero} />
      ) : (
        <section className="tone-ivory section">
          <div className="shell shell-measure text-center">
            <p className="lede">
              This page has no content sections yet. Add them in the admin under Pages.
            </p>
          </div>
        </section>
      )}
    </>
  );
}
