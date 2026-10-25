import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getArticle, listArticles } from "@/lib/content";
import { getSiteSettings } from "@/lib/site";
import { articleJsonLd, breadcrumbJsonLd, buildMetadataWith, type Crumb } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { RichText } from "@/components/public/rich-text";
import { SectionHeading } from "@/components/public/section-heading";
import { ArticleCard } from "@/components/public/cards";
import { CtaSection } from "@/components/public/cta-section";
import { JsonLd } from "@/components/ui/json-ld";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [settings, article] = await Promise.all([getSiteSettings(), getArticle(slug)]);
  if (!article) {
    return buildMetadataWith(settings, { title: "Not found", path: `/guides/${slug}`, noindex: true });
  }

  return buildMetadataWith(settings, {
    title: article.metaTitle ?? article.title,
    description: article.metaDescription ?? article.excerpt,
    path: `/guides/${article.slug}`,
    image: article.ogImage ?? article.heroImage,
    noindex: article.noindex,
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    authorName: article.authorName,
  });
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const [settings, article] = await Promise.all([getSiteSettings(), getArticle(slug)]);
  if (!article) notFound();

  const related = await listArticles({
    limit: 3,
    excludeId: article.id,
    categorySlug: article.category?.slug ?? null,
  });

  // Fall back to any recent articles if the category has nothing else in it.
  const moreToRead =
    related.length > 0 ? related : await listArticles({ limit: 3, excludeId: article.id });

  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Travel guides", path: "/guides" },
    ...(article.category
      ? [{ name: article.category.name, path: `/guides/category/${article.category.slug}` }]
      : []),
    { name: article.title, path: `/guides/${article.slug}` },
  ];

  const published = formatDate(article.publishedAt);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(settings, crumbs),
          articleJsonLd(settings, {
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            heroImage: article.heroImage,
            publishedAt: article.publishedAt,
            updatedAt: article.updatedAt,
            authorName: article.authorName,
          }),
        ].filter((d): d is Record<string, unknown> => d !== null)}
      />

      {/* Article header — a narrower, text-led hero than the listing pages. */}
      <article>
        <header className="tone-deep pt-32 pb-14 lg:pt-44 lg:pb-16">
          <div className="shell">
            <div className="mb-8">
              <Breadcrumbs crumbs={crumbs} tone="dark" />
            </div>

            <div className="max-w-4xl">
              {article.category ? (
                <Link
                  href={`/guides/category/${article.category.slug}`}
                  className="eyebrow eyebrow-plain hover:text-brand-bright transition-colors"
                >
                  {article.category.name}
                </Link>
              ) : null}

              <h1 className="text-display-2 mt-5">{article.title}</h1>

              {article.excerpt ? <p className="lede mt-6 max-w-2xl">{article.excerpt}</p> : null}

              <div className="border-charcoal-line text-on-dark-faint mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-6 text-micro">
                {article.authorName ? (
                  <span>
                    By {article.authorName}
                    {article.authorRole ? `, ${article.authorRole}` : ""}
                  </span>
                ) : null}
                {published && article.publishedAt ? (
                  <time dateTime={article.publishedAt.toISOString()}>{published}</time>
                ) : null}
                {article.readMinutes ? <span>{article.readMinutes} min read</span> : null}
              </div>
            </div>
          </div>
        </header>

        {article.heroImage ? (
          <div className="bg-ink">
            <div className="shell">
              <Image
                src={article.heroImage}
                alt={article.heroImageAlt || ""}
                width={1600}
                height={1000}
                priority
                sizes="(min-width: 1280px) 1200px, 100vw"
                className="aspect-[16/10] w-full rounded-md object-cover"
                aria-hidden={article.heroImageAlt ? undefined : true}
              />
            </div>
          </div>
        ) : null}

        <div className="tone-light section">
          <div className="shell">
            <div className="shell-measure">
              <RichText html={article.body} />
            </div>
          </div>
        </div>
      </article>

      {moreToRead.length > 0 ? (
        <section className="tone-light-soft section">
          <div className="shell">
            <SectionHeading
              eyebrow="Keep reading"
              heading="Related guides"
              ctaLabel="All guides"
              ctaUrl="/guides"
              align="split"
              className="mb-12"
            />
            <ul className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {moreToRead.map((item) => (
                <li key={item.id}>
                  <ArticleCard article={item} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <CtaSection
        eyebrow="Ready to travel?"
        heading="Get a written quote."
        body="Send your dates, group size and route, and we will confirm availability and pricing."
        primaryLabel="Request a quote"
        primaryUrl="/contact"
        variant="band"
      />
    </>
  );
}
