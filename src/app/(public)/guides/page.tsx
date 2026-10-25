import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { countArticles, getSystemPage, listArticleCategories, listArticles } from "@/lib/content";
import { getSiteSettings } from "@/lib/site";
import { breadcrumbJsonLd, buildMetadataWith, type Crumb } from "@/lib/seo";
import { PageHero } from "@/components/public/page-hero";
import { ArticleCard } from "@/components/public/cards";
import { CtaSection } from "@/components/public/cta-section";
import { Pagination } from "@/components/public/pagination";
import { JsonLd } from "@/components/ui/json-ld";

type Props = { searchParams: Promise<{ page?: string }> };

const PER_PAGE = 9;

const CRUMBS: Crumb[] = [
  { name: "Home", path: "/" },
  { name: "Travel guides", path: "/guides" },
];

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSiteSettings(), getSystemPage("guides")]);
  return buildMetadataWith(settings, {
    title: page?.metaTitle ?? page?.title ?? "Travel guides",
    description: page?.metaDescription,
    path: "/guides",
    image: page?.ogImage,
    noindex: page?.noindex,
    canonicalOverride: page?.canonicalUrl,
  });
}

export default async function GuidesPage({ searchParams }: Props) {
  const params = await searchParams;
  const current = Math.max(1, Number(params.page) || 1);

  const [settings, page, categories, total] = await Promise.all([
    getSiteSettings(),
    getSystemPage("guides"),
    listArticleCategories(),
    countArticles(),
  ]);

  // Optional module: unpublishing this page in the admin removes the route
  // entirely, rather than leaving an empty listing linked from nowhere.
  if (!page) notFound();

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(current, totalPages);

  const articles = await listArticles({
    limit: PER_PAGE,
    skip: (safePage - 1) * PER_PAGE,
  });

  // Only the first page gets a featured lead article.
  const [lead, ...rest] = safePage === 1 ? articles : [null, ...articles];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(settings, CRUMBS)} />

      <PageHero
        eyebrow="Travel guides"
        title={page?.title ?? "Travel guides"}
        intro="Practical notes on choosing a vehicle, understanding how journeys are priced, and planning travel for a group."
        crumbs={CRUMBS}
        size="compact"
        priority
      />

      {categories.length > 0 ? (
        <section className="tone-light border-mist-line border-b">
          <div className="shell py-6">
            <nav aria-label="Guide categories">
              <ul className="flex flex-wrap items-center gap-2">
                <li>
                  <Link
                    href="/guides"
                    aria-current="page"
                    className="border-ink bg-ink text-on-dark inline-flex min-h-10 items-center rounded-sm border px-4 text-small"
                  >
                    All guides
                  </Link>
                </li>
                {categories
                  .filter((c) => c._count.articles > 0)
                  .map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/guides/category/${c.slug}`}
                        className="border-mist-line hover:border-brand-dim text-on-light-muted inline-flex min-h-10 items-center gap-2 rounded-sm border px-4 text-small transition-colors"
                      >
                        {c.name}
                        <span className="tabular text-micro opacity-60">{c._count.articles}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </nav>
          </div>
        </section>
      ) : null}

      <section className="tone-light section">
        <div className="shell">
          {articles.length === 0 ? (
            <p className="lede shell-measure text-center">
              Guides will appear here once they are published in the admin.
            </p>
          ) : (
            <>
              {lead ? (
                <div className="border-mist-line mb-16 border-b pb-16">
                  <ArticleCard article={lead} featured />
                </div>
              ) : null}

              <ul className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((article) => (
                  <li key={article!.id}>
                    <ArticleCard article={article!} />
                  </li>
                ))}
              </ul>
            </>
          )}

          <Pagination basePath="/guides" current={safePage} totalPages={totalPages} />
        </div>
      </section>

      <CtaSection
        eyebrow="Planning a trip?"
        heading="Get advice on your specific journey."
        body="Guides cover the general case. Send us your actual route and we will tell you what we would do."
        primaryLabel="Request a quote"
        primaryUrl="/contact"
        variant="panel"
      />
    </>
  );
}
