import type { Metadata } from "next";
import Link from "next/link";
import { getSystemPage, listFaqCategories, listFaqs } from "@/lib/content";
import { getSiteSettings } from "@/lib/site";
import { breadcrumbJsonLd, buildMetadataWith, faqJsonLd, type Crumb } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/public/page-hero";
import { FaqAccordion } from "@/components/public/faq-accordion";
import { CtaSection } from "@/components/public/cta-section";
import { JsonLd } from "@/components/ui/json-ld";

type Props = { searchParams: Promise<{ category?: string; q?: string }> };

const CRUMBS: Crumb[] = [
  { name: "Home", path: "/" },
  { name: "FAQ", path: "/faq" },
];

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSiteSettings(), getSystemPage("faq")]);
  return buildMetadataWith(settings, {
    title: page?.metaTitle ?? page?.title ?? "Frequently asked questions",
    description: page?.metaDescription,
    path: "/faq",
    image: page?.ogImage,
    noindex: page?.noindex,
    canonicalOverride: page?.canonicalUrl,
  });
}

export default async function FaqPage({ searchParams }: Props) {
  const { category, q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();

  const [settings, page, categories, allFaqs] = await Promise.all([
    getSiteSettings(),
    getSystemPage("faq"),
    listFaqCategories(),
    listFaqs({ categorySlug: category ?? null }),
  ]);

  // Search runs server-side over the already-filtered set, so results are a
  // real URL that can be linked and crawled.
  const faqs = query
    ? allFaqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query),
      )
    : allFaqs;

  const active = categories.find((c) => c.slug === category);

  return (
    <>
      <JsonLd
        data={[breadcrumbJsonLd(settings, CRUMBS), faqJsonLd(faqs)].filter(
          (d): d is Record<string, unknown> => d !== null,
        )}
      />

      <PageHero
        eyebrow="Questions"
        title={active ? active.name : (page?.title ?? "Frequently asked questions")}
        intro="Booking an Urbania DX rental, outstation journeys, wedding and corporate travel, and how rental charges are calculated."
        crumbs={CRUMBS}
        priority
      />

      <section className="tone-ivory section">
        <div className="shell">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,17rem)_1fr] lg:gap-16">
            {/* Filters + search ------------------------------------------- */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <form action="/faq" method="get" role="search" className="mb-8">
                {category ? <input type="hidden" name="category" value={category} /> : null}
                <label htmlFor="faq-search" className="field-label">
                  Search questions
                </label>
                <input
                  id="faq-search"
                  name="q"
                  type="search"
                  defaultValue={q ?? ""}
                  placeholder="e.g. driver allowance"
                  className="field-input"
                />
                <button type="submit" className="btn btn-outline-dark btn-sm mt-3 w-full">
                  Search
                </button>
              </form>

              {categories.length > 0 ? (
                <nav aria-label="FAQ categories">
                  <h2 className="text-on-light-faint text-micro tracking-[0.18em] uppercase">
                    Categories
                  </h2>
                  <ul className="mt-4 grid gap-1">
                    <li>
                      <Link
                        href="/faq"
                        aria-current={!category ? "page" : undefined}
                        className={cn(
                          "block rounded-xs px-3 py-2 text-small transition-colors",
                          !category
                            ? "bg-ink text-on-dark"
                            : "text-on-light-muted hover:text-gold-dim",
                        )}
                      >
                        All questions
                      </Link>
                    </li>
                    {categories
                      .filter((c) => c._count.faqs > 0)
                      .map((c) => (
                        <li key={c.id}>
                          <Link
                            href={`/faq?category=${c.slug}`}
                            aria-current={category === c.slug ? "page" : undefined}
                            className={cn(
                              "flex items-center justify-between gap-3 rounded-xs px-3 py-2 text-small transition-colors",
                              category === c.slug
                                ? "bg-ink text-on-dark"
                                : "text-on-light-muted hover:text-gold-dim",
                            )}
                          >
                            {c.name}
                            <span className="tabular text-micro opacity-60">{c._count.faqs}</span>
                          </Link>
                        </li>
                      ))}
                  </ul>
                </nav>
              ) : null}
            </div>

            {/* Questions ---------------------------------------------------- */}
            <div>
              {query ? (
                <p className="text-on-light-muted mb-6 text-small" role="status">
                  {faqs.length} {faqs.length === 1 ? "result" : "results"} for “{q}”.{" "}
                  <Link href={category ? `/faq?category=${category}` : "/faq"} className="text-gold-dim underline underline-offset-4">
                    Clear
                  </Link>
                </p>
              ) : null}

              {faqs.length === 0 ? (
                <div className="card-light p-8 text-center">
                  <h2 className="font-display text-title">No matching questions.</h2>
                  <p className="text-on-light-muted mt-3 text-small">
                    Try a different search, or{" "}
                    <Link href="/contact" className="text-gold-dim underline underline-offset-4">
                      ask us directly
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                <FaqAccordion items={faqs} tone="light" headingLevel={2} />
              )}
            </div>
          </div>
        </div>
      </section>

      <CtaSection
        eyebrow="Still unsure?"
        heading="Still have a question?"
        body="Share your travel date, pickup location, destination, group size and trip duration to receive availability details and a rental quotation."
        primaryLabel="Contact us"
        primaryUrl="/contact"
        variant="band"
      />
    </>
  );
}
