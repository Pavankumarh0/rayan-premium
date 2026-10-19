import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getSettings, settingBool } from "@/lib/settings";
import { siteUrlFrom } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";

/**
 * XML sitemap, generated from published content on every request.
 *
 * Anything that is a draft, flagged noindex, or blocked by the site-wide
 * staging switch is excluded — the sitemap and the robots directives must not
 * disagree with each other.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSettings();

  // Staging switch on: publish an empty sitemap rather than advertising URLs
  // that robots.txt is simultaneously disallowing.
  if (settingBool(settings, "seo.robotsPolicy")) return [];

  const siteUrl = siteUrlFrom(settings);
  const url = (path: string) => absoluteUrl(siteUrl, path);

  const published = { status: "PUBLISHED", noindex: false } as const;

  const [pages, vehicles, services, destinations, packages, articles, articleCategories] =
    await Promise.all([
      db.page.findMany({
        where: published,
        select: { slug: true, updatedAt: true, isSystem: true },
      }),
      db.vehicle.findMany({ where: published, select: { slug: true, updatedAt: true } }),
      db.service.findMany({ where: published, select: { slug: true, updatedAt: true } }),
      db.destination.findMany({ where: published, select: { slug: true, updatedAt: true } }),
      db.package.findMany({ where: published, select: { slug: true, updatedAt: true } }),
      db.article.findMany({
        where: published,
        select: { slug: true, updatedAt: true, publishedAt: true },
      }),
      db.articleCategory.findMany({
        where: { articles: { some: { status: "PUBLISHED" } } },
        select: { slug: true, updatedAt: true },
      }),
    ]);

  const entries: MetadataRoute.Sitemap = [];

  // Pages. "home" maps to "/", other system pages map to their own route, and
  // editor-created pages sit at the root.
  for (const page of pages) {
    const path = page.slug === "home" ? "/" : `/${page.slug}`;
    entries.push({
      url: url(path),
      lastModified: page.updatedAt,
      changeFrequency: page.slug === "home" ? "weekly" : "monthly",
      priority: page.slug === "home" ? 1 : page.isSystem ? 0.8 : 0.5,
    });
  }

  const push = (
    rows: Array<{ slug: string; updatedAt: Date }>,
    prefix: string,
    priority: number,
    changeFrequency: "weekly" | "monthly",
  ) => {
    for (const row of rows) {
      entries.push({
        url: url(`${prefix}/${row.slug}`),
        lastModified: row.updatedAt,
        changeFrequency,
        priority,
      });
    }
  };

  push(vehicles, "/fleet", 0.9, "monthly");
  push(services, "/services", 0.8, "monthly");
  push(destinations, "/outstation", 0.8, "monthly");
  push(packages, "/packages", 0.7, "monthly");
  push(articles, "/guides", 0.6, "weekly");
  push(articleCategories, "/guides/category", 0.4, "monthly");

  // Deduplicate: a system page slug and a hard-coded route can both produce
  // the same URL, and a duplicate entry is an avoidable sitemap warning.
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
