import "server-only";

import { db } from "./db";
import { parseJson } from "./json";
import {
  featureSchema,
  labelDetailSchema,
  labelValueSchema,
  stringListSchema,
  titleDetailSchema,
  columnsSchema,
  cellsSchema,
} from "./validation";
import { readingMinutes } from "./utils";

/**
 * Public read layer. Every function here filters to PUBLISHED content, so a
 * draft can never leak onto the site through a forgotten `where` clause.
 */

const PUBLISHED = { status: "PUBLISHED" } as const;

// ---------------------------------------------------------------------------
// Shared view-model types
// ---------------------------------------------------------------------------

export type TitleDetail = { title: string; detail: string };
export type LabelValue = { label: string; value: string };
export type LabelDetail = { label: string; detail: string };
export type Feature = { icon: string; label: string; detail: string };

export type SeoFields = {
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  noindex: boolean;
};

// ---------------------------------------------------------------------------
// Pages & sections
// ---------------------------------------------------------------------------

export type SectionRecord = {
  id: string;
  type: string;
  sortOrder: number;
  data: string;
};

export type PageRecord = {
  id: string;
  slug: string;
  title: string;
  template: string;
  canonicalUrl: string | null;
  updatedAt: Date;
  sections: SectionRecord[];
} & SeoFields;

export async function getPublishedPage(slug: string): Promise<PageRecord | null> {
  const page = await db.page.findFirst({
    where: { slug, ...PUBLISHED },
    include: {
      sections: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, type: true, sortOrder: true, data: true },
      },
    },
  });
  return page;
}

/** System pages back a hard-coded route and supply its SEO + extra sections. */
export async function getSystemPage(slug: string): Promise<PageRecord | null> {
  return getPublishedPage(slug);
}

export async function listPublishedPages() {
  return db.page.findMany({
    where: { ...PUBLISHED, noindex: false },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, title: true, updatedAt: true, isSystem: true },
  });
}

// ---------------------------------------------------------------------------
// Fleet
// ---------------------------------------------------------------------------

const vehicleCardSelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  seats: true,
  luggage: true,
  summary: true,
  heroImage: true,
  heroImageAlt: true,
  showPrice: true,
  priceLocal: true,
  priceLocalLabel: true,
  priceOutstationPerKm: true,
  features: true,
  updatedAt: true,
  category: { select: { slug: true, name: true } },
} as const;

export type VehicleCard = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  seats: number;
  luggage: string | null;
  summary: string | null;
  heroImage: string | null;
  heroImageAlt: string | null;
  showPrice: boolean;
  priceLocal: number | null;
  priceLocalLabel: string | null;
  priceOutstationPerKm: number | null;
  features: Feature[];
  updatedAt: Date;
  category: { slug: string; name: string } | null;
};

function toVehicleCard(row: {
  features: string;
  [key: string]: unknown;
}): VehicleCard {
  const { features, ...rest } = row;
  return {
    ...(rest as Omit<VehicleCard, "features">),
    features: parseJson<Feature[]>(features, featureSchema, []),
  };
}

export async function listVehicles(options: {
  categorySlug?: string | null;
  featuredOnly?: boolean;
  limit?: number;
  excludeId?: string;
} = {}): Promise<VehicleCard[]> {
  const rows = await db.vehicle.findMany({
    where: {
      ...PUBLISHED,
      ...(options.categorySlug ? { category: { slug: options.categorySlug } } : {}),
      ...(options.featuredOnly ? { isFeatured: true } : {}),
      ...(options.excludeId ? { id: { not: options.excludeId } } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: options.limit,
    select: vehicleCardSelect,
  });
  return rows.map(toVehicleCard);
}

export type VehicleDetail = VehicleCard & {
  body: string | null;
  specs: LabelValue[];
  seatLayouts: LabelDetail[];
  useCases: TitleDetail[];
  extraKmRate: number | null;
  extraHourRate: number | null;
  driverAllowance: number | null;
  priceNote: string | null;
  canonicalSlug: string;
  images: Array<{ id: string; url: string; alt: string; kind: string }>;
  faqs: Array<{ id: string; question: string; answer: string }>;
} & SeoFields;

export async function getVehicle(slug: string): Promise<VehicleDetail | null> {
  const row = await db.vehicle.findFirst({
    where: { slug, ...PUBLISHED },
    include: {
      category: { select: { slug: true, name: true } },
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, alt: true, kind: true } },
      faqs: {
        where: { ...PUBLISHED },
        orderBy: { sortOrder: "asc" },
        select: { id: true, question: true, answer: true },
      },
    },
  });
  if (!row) return null;

  return {
    ...toVehicleCard(row),
    body: row.body,
    specs: parseJson<LabelValue[]>(row.specs, labelValueSchema, []),
    seatLayouts: parseJson<LabelDetail[]>(row.seatLayouts, labelDetailSchema, []),
    useCases: parseJson<TitleDetail[]>(row.useCases, titleDetailSchema, []),
    extraKmRate: row.extraKmRate,
    extraHourRate: row.extraHourRate,
    driverAllowance: row.driverAllowance,
    priceNote: row.priceNote,
    canonicalSlug: row.slug,
    images: row.images,
    faqs: row.faqs,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    ogImage: row.ogImage,
    noindex: row.noindex,
  };
}

export async function listVehicleCategories() {
  return db.vehicleCategory.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      _count: { select: { vehicles: { where: PUBLISHED } } },
    },
  });
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export type ServiceCard = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  summary: string | null;
  icon: string;
  heroImage: string | null;
  heroImageAlt: string | null;
  updatedAt: Date;
};

export async function listServices(options: { limit?: number; featuredOnly?: boolean; excludeId?: string } = {}): Promise<ServiceCard[]> {
  return db.service.findMany({
    where: {
      ...PUBLISHED,
      ...(options.featuredOnly ? { isFeatured: true } : {}),
      ...(options.excludeId ? { id: { not: options.excludeId } } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: options.limit,
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      summary: true,
      icon: true,
      heroImage: true,
      heroImageAlt: true,
      updatedAt: true,
    },
  });
}

export type ServiceDetail = ServiceCard & {
  body: string | null;
  highlights: TitleDetail[];
  checklist: string[];
  faqs: Array<{ id: string; question: string; answer: string }>;
} & SeoFields;

export async function getService(slug: string): Promise<ServiceDetail | null> {
  const row = await db.service.findFirst({
    where: { slug, ...PUBLISHED },
    include: {
      faqs: {
        where: { ...PUBLISHED },
        orderBy: { sortOrder: "asc" },
        select: { id: true, question: true, answer: true },
      },
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    summary: row.summary,
    icon: row.icon,
    heroImage: row.heroImage,
    heroImageAlt: row.heroImageAlt,
    updatedAt: row.updatedAt,
    body: row.body,
    highlights: parseJson<TitleDetail[]>(row.highlights, titleDetailSchema, []),
    checklist: parseJson<string[]>(row.checklist, stringListSchema, []),
    faqs: row.faqs,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    ogImage: row.ogImage,
    noindex: row.noindex,
  };
}

// ---------------------------------------------------------------------------
// Destinations
// ---------------------------------------------------------------------------

export type DestinationCard = {
  id: string;
  slug: string;
  name: string;
  region: string | null;
  tagline: string | null;
  summary: string | null;
  heroImage: string | null;
  heroImageAlt: string | null;
  distanceKm: number | null;
  travelTimeText: string | null;
  factsVerified: boolean;
  updatedAt: Date;
};

export async function listDestinations(options: { limit?: number; featuredOnly?: boolean; excludeId?: string } = {}): Promise<DestinationCard[]> {
  return db.destination.findMany({
    where: {
      ...PUBLISHED,
      ...(options.featuredOnly ? { isFeatured: true } : {}),
      ...(options.excludeId ? { id: { not: options.excludeId } } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: options.limit,
    select: {
      id: true,
      slug: true,
      name: true,
      region: true,
      tagline: true,
      summary: true,
      heroImage: true,
      heroImageAlt: true,
      distanceKm: true,
      travelTimeText: true,
      factsVerified: true,
      updatedAt: true,
    },
  });
}

export type DestinationDetail = DestinationCard & {
  body: string | null;
  bestSeason: string | null;
  itinerary: TitleDetail[];
  highlights: string[];
  priceNote: string | null;
  faqs: Array<{ id: string; question: string; answer: string }>;
} & SeoFields;

export async function getDestination(slug: string): Promise<DestinationDetail | null> {
  const row = await db.destination.findFirst({
    where: { slug, ...PUBLISHED },
    include: {
      faqs: {
        where: { ...PUBLISHED },
        orderBy: { sortOrder: "asc" },
        select: { id: true, question: true, answer: true },
      },
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    region: row.region,
    tagline: row.tagline,
    summary: row.summary,
    heroImage: row.heroImage,
    heroImageAlt: row.heroImageAlt,
    distanceKm: row.distanceKm,
    travelTimeText: row.travelTimeText,
    factsVerified: row.factsVerified,
    updatedAt: row.updatedAt,
    body: row.body,
    bestSeason: row.bestSeason,
    itinerary: parseJson<TitleDetail[]>(row.itinerary, titleDetailSchema, []),
    highlights: parseJson<string[]>(row.highlights, stringListSchema, []),
    priceNote: row.priceNote,
    faqs: row.faqs,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    ogImage: row.ogImage,
    noindex: row.noindex,
  };
}

// ---------------------------------------------------------------------------
// Packages
// ---------------------------------------------------------------------------

export type PackageCard = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  summary: string | null;
  heroImage: string | null;
  heroImageAlt: string | null;
  durationText: string | null;
  priceFrom: number | null;
  showPrice: boolean;
  updatedAt: Date;
};

export async function listPackages(options: { limit?: number; featuredOnly?: boolean; excludeId?: string } = {}): Promise<PackageCard[]> {
  return db.package.findMany({
    where: {
      ...PUBLISHED,
      ...(options.featuredOnly ? { isFeatured: true } : {}),
      ...(options.excludeId ? { id: { not: options.excludeId } } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: options.limit,
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      summary: true,
      heroImage: true,
      heroImageAlt: true,
      durationText: true,
      priceFrom: true,
      showPrice: true,
      updatedAt: true,
    },
  });
}

export type PackageDetail = PackageCard & {
  body: string | null;
  priceNote: string | null;
  inclusions: string[];
  exclusions: string[];
  itinerary: TitleDetail[];
  faqs: Array<{ id: string; question: string; answer: string }>;
} & SeoFields;

export async function getPackage(slug: string): Promise<PackageDetail | null> {
  const row = await db.package.findFirst({
    where: { slug, ...PUBLISHED },
    include: {
      faqs: {
        where: { ...PUBLISHED },
        orderBy: { sortOrder: "asc" },
        select: { id: true, question: true, answer: true },
      },
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    summary: row.summary,
    heroImage: row.heroImage,
    heroImageAlt: row.heroImageAlt,
    durationText: row.durationText,
    priceFrom: row.priceFrom,
    showPrice: row.showPrice,
    updatedAt: row.updatedAt,
    body: row.body,
    priceNote: row.priceNote,
    inclusions: parseJson<string[]>(row.inclusions, stringListSchema, []),
    exclusions: parseJson<string[]>(row.exclusions, stringListSchema, []),
    itinerary: parseJson<TitleDetail[]>(row.itinerary, titleDetailSchema, []),
    faqs: row.faqs,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    ogImage: row.ogImage,
    noindex: row.noindex,
  };
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export type ArticleCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  heroImage: string | null;
  heroImageAlt: string | null;
  publishedAt: Date | null;
  readMinutes: number | null;
  authorName: string | null;
  category: { slug: string; name: string } | null;
};

const articleCardSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  heroImage: true,
  heroImageAlt: true,
  publishedAt: true,
  readMinutes: true,
  authorName: true,
  category: { select: { slug: true, name: true } },
} as const;

export async function listArticles(options: {
  categorySlug?: string | null;
  limit?: number;
  skip?: number;
  excludeId?: string;
} = {}): Promise<ArticleCard[]> {
  return db.article.findMany({
    where: {
      ...PUBLISHED,
      ...(options.categorySlug ? { category: { slug: options.categorySlug } } : {}),
      ...(options.excludeId ? { id: { not: options.excludeId } } : {}),
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: options.limit,
    skip: options.skip,
    select: articleCardSelect,
  });
}

export async function countArticles(categorySlug?: string | null): Promise<number> {
  return db.article.count({
    where: { ...PUBLISHED, ...(categorySlug ? { category: { slug: categorySlug } } : {}) },
  });
}

export type ArticleDetail = ArticleCard & {
  body: string | null;
  authorRole: string | null;
  updatedAt: Date;
} & SeoFields;

export async function getArticle(slug: string): Promise<ArticleDetail | null> {
  const row = await db.article.findFirst({
    where: { slug, ...PUBLISHED },
    include: { category: { select: { slug: true, name: true } } },
  });
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    heroImage: row.heroImage,
    heroImageAlt: row.heroImageAlt,
    publishedAt: row.publishedAt,
    readMinutes: row.readMinutes ?? readingMinutes(row.body),
    authorName: row.authorName,
    authorRole: row.authorRole,
    category: row.category,
    body: row.body,
    updatedAt: row.updatedAt,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    ogImage: row.ogImage,
    noindex: row.noindex,
  };
}

export async function listArticleCategories() {
  return db.articleCategory.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      _count: { select: { articles: { where: PUBLISHED } } },
    },
  });
}

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

export type FaqItem = { id: string; question: string; answer: string; categoryName: string | null };

export async function listFaqs(options: {
  categorySlug?: string | null;
  limit?: number;
  directoryOnly?: boolean;
} = {}): Promise<FaqItem[]> {
  const rows = await db.faq.findMany({
    where: {
      ...PUBLISHED,
      ...(options.directoryOnly !== false ? { showInDirectory: true } : {}),
      ...(options.categorySlug ? { category: { slug: options.categorySlug } } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: options.limit,
    select: {
      id: true,
      question: true,
      answer: true,
      category: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    question: row.question,
    answer: row.answer,
    categoryName: row.category?.name ?? null,
  }));
}

export async function listFaqCategories() {
  return db.faqCategory.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      _count: { select: { faqs: { where: { ...PUBLISHED, showInDirectory: true } } } },
    },
  });
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

export type GalleryEntry = {
  id: string;
  title: string | null;
  alt: string;
  url: string;
  kind: string;
  videoUrl: string | null;
  width: number | null;
  height: number | null;
  categoryName: string | null;
  categorySlug: string | null;
};

export async function listGalleryItems(options: { categorySlug?: string | null; limit?: number } = {}): Promise<GalleryEntry[]> {
  const rows = await db.galleryItem.findMany({
    where: {
      ...PUBLISHED,
      ...(options.categorySlug ? { category: { slug: options.categorySlug } } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: options.limit,
    select: {
      id: true,
      title: true,
      alt: true,
      url: true,
      kind: true,
      videoUrl: true,
      width: true,
      height: true,
      category: { select: { name: true, slug: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    alt: row.alt,
    url: row.url,
    kind: row.kind,
    videoUrl: row.videoUrl,
    width: row.width,
    height: row.height,
    categoryName: row.category?.name ?? null,
    categorySlug: row.category?.slug ?? null,
  }));
}

export async function listGalleryCategories() {
  return db.galleryCategory.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      _count: { select: { items: { where: PUBLISHED } } },
    },
  });
}

// ---------------------------------------------------------------------------
// Testimonials — only verified + published records ever reach the public site.
// ---------------------------------------------------------------------------

export type TestimonialItem = {
  id: string;
  authorName: string;
  authorRole: string | null;
  quote: string;
  rating: number | null;
};

export async function listTestimonials(limit?: number): Promise<TestimonialItem[]> {
  return db.testimonial.findMany({
    where: { ...PUBLISHED, isVerified: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
    select: { id: true, authorName: true, authorRole: true, quote: true, rating: true },
  });
}

// ---------------------------------------------------------------------------
// Tariffs
// ---------------------------------------------------------------------------

export type TariffTable = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  footnote: string | null;
  columns: string[];
  rows: Array<{ id: string; cells: string[]; isHighlighted: boolean }>;
};

export async function listTariffGroups(slug?: string | null): Promise<TariffTable[]> {
  const groups = await db.tariffGroup.findMany({
    where: { ...PUBLISHED, ...(slug ? { slug } : {}) },
    orderBy: { sortOrder: "asc" },
    include: {
      rows: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, cells: true, isHighlighted: true },
      },
    },
  });

  return groups.map((group) => ({
    id: group.id,
    slug: group.slug,
    title: group.title,
    description: group.description,
    footnote: group.footnote,
    columns: parseJson<string[]>(group.columns, columnsSchema, []),
    rows: group.rows.map((row) => ({
      id: row.id,
      cells: parseJson<string[]>(row.cells, cellsSchema, []),
      isHighlighted: row.isHighlighted,
    })),
  }));
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export type NavNode = {
  id: string;
  label: string;
  url: string;
  description: string | null;
  openInNewTab: boolean;
  children: NavNode[];
};

export async function getMenu(menu: string): Promise<NavNode[]> {
  const rows = await db.navItem.findMany({
    where: { menu, isVisible: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      label: true,
      url: true,
      description: true,
      openInNewTab: true,
      parentId: true,
    },
  });

  const byParent = new Map<string | null, typeof rows>();
  for (const row of rows) {
    const key = row.parentId;
    const bucket = byParent.get(key);
    if (bucket) bucket.push(row);
    else byParent.set(key, [row]);
  }

  const build = (parentId: string | null): NavNode[] =>
    (byParent.get(parentId) ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      url: row.url,
      description: row.description,
      openInNewTab: row.openInNewTab,
      children: build(row.id),
    }));

  return build(null);
}

/** Header, footer columns and legal links in one round trip. */
export async function getAllMenus() {
  const [header, footerMenu, footerServices, footerRoutes, legal] = await Promise.all([
    getMenu("HEADER"),
    getMenu("FOOTER_MENU"),
    getMenu("FOOTER_SERVICES"),
    getMenu("FOOTER_ROUTES"),
    getMenu("LEGAL"),
  ]);
  return { header, footerMenu, footerServices, footerRoutes, legal };
}
