import type { Metadata } from "next";
import Link from "next/link";
import { getSystemPage, listGalleryCategories, listGalleryItems } from "@/lib/content";
import { getSiteSettings } from "@/lib/site";
import { breadcrumbJsonLd, buildMetadataWith, type Crumb } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/public/page-hero";
import { GalleryGrid } from "@/components/public/gallery-grid";
import { CtaSection } from "@/components/public/cta-section";
import { JsonLd } from "@/components/ui/json-ld";

type Props = { searchParams: Promise<{ category?: string }> };

const CRUMBS: Crumb[] = [
  { name: "Home", path: "/" },
  { name: "Gallery", path: "/gallery" },
];

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSiteSettings(), getSystemPage("gallery")]);
  return buildMetadataWith(settings, {
    title: page?.metaTitle ?? page?.title ?? "Gallery",
    description: page?.metaDescription,
    path: "/gallery",
    image: page?.ogImage,
    noindex: page?.noindex,
    canonicalOverride: page?.canonicalUrl,
  });
}

export default async function GalleryPage({ searchParams }: Props) {
  const { category } = await searchParams;

  const [settings, page, categories, items] = await Promise.all([
    getSiteSettings(),
    getSystemPage("gallery"),
    listGalleryCategories(),
    listGalleryItems({ categorySlug: category ?? null }),
  ]);

  const active = categories.find((c) => c.slug === category);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(settings, CRUMBS)} />

      <PageHero
        eyebrow="Gallery"
        title={active ? active.name : (page?.title ?? "Gallery")}
        intro="Exteriors, cabin interiors, onboard amenities and journeys from the road."
        crumbs={CRUMBS}
        size="compact"
        priority
      />

      {categories.length > 1 ? (
        <section className="tone-ink border-charcoal-line border-b">
          <div className="shell py-6">
            <nav aria-label="Filter the gallery by category">
              <ul className="flex flex-wrap items-center gap-2">
                <li>
                  <Link
                    href="/gallery"
                    aria-current={!category ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-10 items-center rounded-sm border px-4 text-small transition-colors",
                      !category
                        ? "border-gold bg-gold text-ink"
                        : "border-charcoal-line hover:border-gold text-on-dark-muted",
                    )}
                  >
                    All
                  </Link>
                </li>
                {categories
                  .filter((c) => c._count.items > 0)
                  .map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/gallery?category=${c.slug}`}
                        aria-current={category === c.slug ? "page" : undefined}
                        className={cn(
                          "inline-flex min-h-10 items-center gap-2 rounded-sm border px-4 text-small transition-colors",
                          category === c.slug
                            ? "border-gold bg-gold text-ink"
                            : "border-charcoal-line hover:border-gold text-on-dark-muted",
                        )}
                      >
                        {c.name}
                        <span className="tabular text-micro opacity-60">{c._count.items}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </nav>
          </div>
        </section>
      ) : null}

      <section className="tone-ink section">
        <div className="shell">
          {items.length === 0 ? (
            <p className="lede shell-measure text-center">
              Images will appear here once they are published in the admin.
            </p>
          ) : (
            <GalleryGrid items={items} />
          )}
        </div>
      </section>

      <CtaSection
        eyebrow="See it in person"
        heading="Arrange a viewing."
        body="Where a vehicle is available locally and not out on a booking, we can arrange for you to see it before you book."
        primaryLabel="Contact us"
        primaryUrl="/contact"
        variant="panel"
      />
    </>
  );
}
