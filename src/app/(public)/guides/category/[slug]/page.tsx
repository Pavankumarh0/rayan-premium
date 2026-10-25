import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { countArticles, listArticleCategories, listArticles } from "@/lib/content";
import { getSiteSettings } from "@/lib/site";
import { breadcrumbJsonLd, buildMetadataWith, type Crumb } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/public/page-hero";
import { ArticleCard } from "@/components/public/cards";
import { Pagination } from "@/components/public/pagination";
import { CtaSection } from "@/components/public/cta-section";
import { JsonLd } from "@/components/ui/json-ld";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

const PER_PAGE = 9;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [settings, categories] = await Promise.all([getSiteSettings(), listArticleCategories()]);
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return buildMetadataWith(settings, {
      title: "Not found",
      path: `/guides/category/${slug}`,
      noindex: true,
    });
  }

  return buildMetadataWith(settings, {
    title: `${category.name} — travel guides`,
    description:
      category.description ??
      `Travel guides filed under ${category.name.toLowerCase()}, from Rayan Premium Mobility.`,
    path: `/guides/category/${category.slug}`,
  });
}

export default async function GuideCategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;

  const [settings, categories] = await Promise.all([getSiteSettings(), listArticleCategories()]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const total = await countArticles(slug);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const current = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);

  const articles = await listArticles({
    categorySlug: slug,
    limit: PER_PAGE,
    skip: (current - 1) * PER_PAGE,
  });

  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Travel guides", path: "/guides" },
    { name: category.name, path: `/guides/category/${category.slug}` },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(settings, crumbs)} />

      <PageHero
        eyebrow="Travel guides"
        title={category.name}
        intro={category.description}
        crumbs={crumbs}
        size="compact"
        priority
      />

      <section className="tone-light border-mist-line border-b">
        <div className="shell py-6">
          <nav aria-label="Guide categories">
            <ul className="flex flex-wrap items-center gap-2">
              <li>
                <Link
                  href="/guides"
                  className="border-mist-line hover:border-brand-dim text-on-light-muted inline-flex min-h-10 items-center rounded-sm border px-4 text-small transition-colors"
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
                      aria-current={c.slug === slug ? "page" : undefined}
                      className={cn(
                        "inline-flex min-h-10 items-center gap-2 rounded-sm border px-4 text-small transition-colors",
                        c.slug === slug
                          ? "border-ink bg-ink text-on-dark"
                          : "border-mist-line hover:border-brand-dim text-on-light-muted",
                      )}
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

      <section className="tone-light section">
        <div className="shell">
          {articles.length === 0 ? (
            <p className="lede shell-measure text-center">
              No guides in this category yet.{" "}
              <Link href="/guides" className="text-brand-dim underline underline-offset-4">
                View all guides
              </Link>
              .
            </p>
          ) : (
            <ul className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <li key={article.id}>
                  <ArticleCard article={article} />
                </li>
              ))}
            </ul>
          )}

          <Pagination
            basePath={`/guides/category/${category.slug}`}
            current={current}
            totalPages={totalPages}
          />
        </div>
      </section>

      <CtaSection
        eyebrow="Planning a trip?"
        heading="Get advice on your specific journey."
        body="Send us your route and dates and we will tell you what we would recommend."
        primaryLabel="Request a quote"
        primaryUrl="/contact"
        variant="panel"
      />
    </>
  );
}
