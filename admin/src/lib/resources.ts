import type { ZodType } from "zod";
import {
  articleSchema,
  destinationSchema,
  faqSchema,
  galleryItemSchema,
  packageSchema,
  serviceSchema,
  testimonialSchema,
  vehicleSchema,
  tariffGroupSchema,
  GALLERY_KINDS,
  STATUSES,
} from "./validation";

/**
 * The content-type registry.
 *
 * Nine content types share one list screen, one edit screen and one set of
 * actions. Each is described here instead of being hand-built, so a new type
 * is a block of configuration rather than four more files that drift apart.
 *
 * A field's `t` decides the control rendered, how FormData is read back, and
 * how the stored value is turned into a form value. The Zod schema stays the
 * single source of truth for validation and is shared with the public site.
 */

export type FieldDef =
  | { k: string; t: "text" | "slug" | "image" | "link"; label: string; hint?: string; span?: boolean; required?: boolean; placeholder?: string }
  | { k: string; t: "textarea" | "richtext"; label: string; hint?: string; rows?: number }
  | { k: string; t: "number"; label: string; hint?: string }
  | { k: string; t: "select"; label: string; hint?: string; options: Array<{ value: string; label: string }> }
  | { k: string; t: "switch"; label: string; hint?: string }
  | { k: string; t: "stringList"; label: string; hint?: string; addLabel?: string }
  | {
      k: string;
      t: "jsonList";
      label: string;
      hint?: string;
      addLabel?: string;
      fields: Array<{ key: string; label: string; textarea?: boolean }>;
    }
  | { k: string; t: "relation"; label: string; hint?: string; model: RelationModel; allowNone?: boolean };

export type RelationModel =
  | "vehicleCategory"
  | "articleCategory"
  | "faqCategory"
  | "galleryCategory"
  | "service"
  | "vehicle"
  | "destination"
  | "package";

export type FieldGroup = { heading: string; fields: FieldDef[] };

export type ResourceDef = {
  /** URL segment and the key used everywhere else. */
  slug: string;
  label: string;
  singular: string;
  /** Prisma delegate name. */
  model: string;
  schema: ZodType<Record<string, unknown>>;
  description: string;
  /** Columns shown in the list, after the always-present title column. */
  listExtra?: Array<{ k: string; label: string }>;
  /** Field used as the row title. */
  titleField: string;
  /** Builds the public URL for a row, for the "view" link. */
  publicPath?: (row: Record<string, unknown>) => string | null;
  hasStatus: boolean;
  hasFeatured: boolean;
  hasSortOrder: boolean;
  groups: FieldGroup[];
  /** Default ordering for the list. */
  orderBy: Record<string, "asc" | "desc">;
};

const STATUS_FIELD: FieldDef = {
  k: "status",
  t: "select",
  label: "Status",
  hint: "Drafts are never visible on the website.",
  options: STATUSES.map((s) => ({ value: s, label: s === "PUBLISHED" ? "Published" : "Draft" })),
};

const SEO_GROUP: FieldGroup = {
  heading: "Search engine listing",
  fields: [
    { k: "metaTitle", t: "text", label: "Meta title", hint: "Around 60 characters. Falls back to the name.", span: true },
    { k: "metaDescription", t: "textarea", label: "Meta description", hint: "Around 155 characters. Falls back to the summary.", rows: 2 },
    { k: "ogImage", t: "image", label: "Social share image", hint: "1200×630. Falls back to the hero image.", span: true },
    { k: "noindex", t: "switch", label: "Hide from search engines", hint: "Keeps the page live but asks search engines not to list it." },
  ],
};

/** Publishing controls, shared by every type that has them. */
function publishing(opts: { featured?: string; sort?: boolean } = {}): FieldGroup {
  const fields: FieldDef[] = [STATUS_FIELD];
  if (opts.featured) {
    fields.push({ k: "isFeatured", t: "switch", label: opts.featured });
  }
  if (opts.sort !== false) {
    fields.push({
      k: "sortOrder",
      t: "number",
      label: "Sort order",
      hint: "Lower numbers appear first.",
    });
  }
  return { heading: "Publishing", fields };
}

export const RESOURCES: ResourceDef[] = [
  // -------------------------------------------------------------------------
  {
    slug: "fleet",
    label: "Fleet",
    singular: "Vehicle",
    model: "vehicle",
    schema: vehicleSchema,
    description: "Vehicles shown on the fleet pages.",
    titleField: "name",
    listExtra: [{ k: "seats", label: "Seats" }],
    publicPath: (row) => `/fleet/${row.slug}`,
    hasStatus: true,
    hasFeatured: true,
    hasSortOrder: true,
    orderBy: { sortOrder: "asc" },
    groups: [
      {
        heading: "Vehicle",
        fields: [
          { k: "name", t: "text", label: "Name", required: true },
          { k: "slug", t: "slug", label: "URL slug", hint: "Changing this breaks existing links — add a redirect.", required: true },
          { k: "tagline", t: "text", label: "Tagline", span: true },
          { k: "categoryId", t: "relation", label: "Category", model: "vehicleCategory", allowNone: true },
          { k: "seats", t: "number", label: "Seats", hint: "Leave at 0 to show no seating figure at all." },
          { k: "luggage", t: "text", label: "Luggage capacity", hint: "Free text, e.g. “6 large cases”." },
          { k: "summary", t: "textarea", label: "Summary", hint: "Used on cards and as the meta description fallback.", rows: 3 },
          { k: "body", t: "richtext", label: "Full description", hint: "HTML. Headings, paragraphs, lists, links and bold are allowed.", rows: 12 },
        ],
      },
      {
        heading: "Photography",
        fields: [
          { k: "heroImage", t: "image", label: "Main image", span: true },
          { k: "heroImageAlt", t: "text", label: "Main image alt text", hint: "Describe the photograph for screen readers and search engines.", span: true },
        ],
      },
      {
        heading: "Details",
        fields: [
          { k: "features", t: "jsonList", label: "Features", addLabel: "Add feature", hint: "Icon names come from the Lucide set, e.g. Armchair, Wifi, Snowflake.", fields: [{ key: "icon", label: "Icon name" }, { key: "label", label: "Feature" }, { key: "detail", label: "Detail", textarea: true }] },
          { k: "specs", t: "jsonList", label: "Specifications", addLabel: "Add specification", fields: [{ key: "label", label: "Label" }, { key: "value", label: "Value" }] },
          { k: "seatLayouts", t: "jsonList", label: "Seat configurations", addLabel: "Add layout", fields: [{ key: "label", label: "Layout" }, { key: "detail", label: "Detail", textarea: true }] },
          { k: "useCases", t: "jsonList", label: "What it is booked for", addLabel: "Add use case", fields: [{ key: "title", label: "Title" }, { key: "detail", label: "Detail", textarea: true }] },
        ],
      },
      {
        heading: "Pricing",
        fields: [
          { k: "showPrice", t: "switch", label: "Show prices for this vehicle", hint: "Also requires Settings → Display → Show prices." },
          { k: "priceLocalLabel", t: "text", label: "Local package label", placeholder: "8 hrs / 80 km" },
          { k: "priceLocal", t: "number", label: "Local package price" },
          { k: "priceOutstationPerKm", t: "number", label: "Outstation, per km" },
          { k: "extraKmRate", t: "number", label: "Extra kilometre" },
          { k: "extraHourRate", t: "number", label: "Extra hour" },
          { k: "driverAllowance", t: "number", label: "Driver allowance per day" },
          { k: "priceNote", t: "textarea", label: "Pricing note", rows: 2 },
        ],
      },
      publishing({ featured: "Feature on the homepage" }),
      SEO_GROUP,
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "services",
    label: "Services",
    singular: "Service",
    model: "service",
    schema: serviceSchema,
    description: "The services offered, each with its own page.",
    titleField: "name",
    publicPath: (row) => `/services/${row.slug}`,
    hasStatus: true,
    hasFeatured: true,
    hasSortOrder: true,
    orderBy: { sortOrder: "asc" },
    groups: [
      {
        heading: "Service",
        fields: [
          { k: "name", t: "text", label: "Name", required: true },
          { k: "slug", t: "slug", label: "URL slug", required: true },
          { k: "icon", t: "text", label: "Icon name", hint: "From the Lucide set, e.g. Heart, Plane, Camera." },
          { k: "tagline", t: "text", label: "Tagline" },
          { k: "summary", t: "textarea", label: "Summary", hint: "Used on cards and as the meta description fallback.", rows: 3 },
          { k: "body", t: "richtext", label: "Full description", hint: "HTML.", rows: 14 },
        ],
      },
      {
        heading: "Photography",
        fields: [
          { k: "heroImage", t: "image", label: "Main image", span: true },
          { k: "heroImageAlt", t: "text", label: "Main image alt text", span: true },
        ],
      },
      {
        heading: "Page content",
        fields: [
          { k: "highlights", t: "jsonList", label: "What we provide", addLabel: "Add item", hint: "Shown as a numbered grid.", fields: [{ key: "title", label: "Title" }, { key: "detail", label: "Detail", textarea: true }] },
          { k: "checklist", t: "stringList", label: "Why choose RPM", addLabel: "Add reason", hint: "Short lines, shown in the sidebar." },
          { k: "ctaHeading", t: "text", label: "Closing call-to-action heading", span: true },
          { k: "ctaBody", t: "textarea", label: "Closing call-to-action text", rows: 3 },
        ],
      },
      publishing({ featured: "Feature on the homepage" }),
      SEO_GROUP,
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "destinations",
    label: "Destinations",
    singular: "Destination",
    model: "destination",
    schema: destinationSchema,
    description: "Outstation routes. Distances stay hidden until marked verified.",
    titleField: "name",
    listExtra: [{ k: "region", label: "Region" }],
    publicPath: (row) => `/outstation/${row.slug}`,
    hasStatus: true,
    hasFeatured: true,
    hasSortOrder: true,
    orderBy: { sortOrder: "asc" },
    groups: [
      {
        heading: "Destination",
        fields: [
          { k: "name", t: "text", label: "Name", required: true },
          { k: "slug", t: "slug", label: "URL slug", required: true },
          { k: "region", t: "text", label: "Region" },
          { k: "tagline", t: "text", label: "Tagline" },
          { k: "summary", t: "textarea", label: "Summary", rows: 3 },
          { k: "body", t: "richtext", label: "Full description", rows: 12 },
        ],
      },
      {
        heading: "Route facts",
        fields: [
          { k: "distanceKm", t: "number", label: "Distance in km" },
          { k: "travelTimeText", t: "text", label: "Journey time", placeholder: "About 3 hr 30 min" },
          { k: "bestSeason", t: "text", label: "Best season" },
          {
            k: "factsVerified",
            t: "switch",
            label: "Facts verified",
            hint: "Distance, journey time and season stay hidden from the public page until this is on. Only switch it on once someone has checked them.",
          },
        ],
      },
      {
        heading: "Photography",
        fields: [
          { k: "heroImage", t: "image", label: "Main image", span: true },
          { k: "heroImageAlt", t: "text", label: "Main image alt text", span: true },
        ],
      },
      {
        heading: "Page content",
        fields: [
          { k: "itinerary", t: "jsonList", label: "Suggested itinerary", addLabel: "Add step", fields: [{ key: "title", label: "Step" }, { key: "detail", label: "Detail", textarea: true }] },
          { k: "highlights", t: "stringList", label: "Included", addLabel: "Add line" },
          { k: "priceNote", t: "textarea", label: "Pricing note", rows: 2 },
        ],
      },
      publishing({ featured: "Feature on the homepage" }),
      SEO_GROUP,
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "packages",
    label: "Packages",
    singular: "Package",
    model: "package",
    schema: packageSchema,
    description: "Multi-day tour packages.",
    titleField: "name",
    listExtra: [{ k: "durationText", label: "Duration" }],
    publicPath: (row) => `/packages/${row.slug}`,
    hasStatus: true,
    hasFeatured: true,
    hasSortOrder: true,
    orderBy: { sortOrder: "asc" },
    groups: [
      {
        heading: "Package",
        fields: [
          { k: "name", t: "text", label: "Name", required: true },
          { k: "slug", t: "slug", label: "URL slug", required: true },
          { k: "tagline", t: "text", label: "Tagline" },
          { k: "durationText", t: "text", label: "Duration", placeholder: "3 days / 2 nights" },
          { k: "summary", t: "textarea", label: "Summary", rows: 3 },
          { k: "body", t: "richtext", label: "Full description", rows: 12 },
        ],
      },
      {
        heading: "Photography",
        fields: [
          { k: "heroImage", t: "image", label: "Main image", span: true },
          { k: "heroImageAlt", t: "text", label: "Main image alt text", span: true },
        ],
      },
      {
        heading: "Itinerary and pricing",
        fields: [
          { k: "itinerary", t: "jsonList", label: "Itinerary", addLabel: "Add day", fields: [{ key: "title", label: "Day" }, { key: "detail", label: "Detail", textarea: true }] },
          { k: "inclusions", t: "stringList", label: "What is included", addLabel: "Add inclusion" },
          { k: "exclusions", t: "stringList", label: "What is not included", addLabel: "Add exclusion" },
          { k: "showPrice", t: "switch", label: "Show the price" },
          { k: "priceFrom", t: "number", label: "Price from" },
          { k: "priceNote", t: "textarea", label: "Pricing note", rows: 2 },
        ],
      },
      publishing({ featured: "Feature on the homepage" }),
      SEO_GROUP,
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "articles",
    label: "Travel guides",
    singular: "Guide",
    model: "article",
    schema: articleSchema,
    description: "Articles published under Travel guides.",
    titleField: "title",
    publicPath: (row) => `/guides/${row.slug}`,
    hasStatus: true,
    hasFeatured: true,
    hasSortOrder: false,
    orderBy: { createdAt: "desc" },
    groups: [
      {
        heading: "Guide",
        fields: [
          { k: "title", t: "text", label: "Title", required: true },
          { k: "slug", t: "slug", label: "URL slug", required: true },
          { k: "categoryId", t: "relation", label: "Category", model: "articleCategory", allowNone: true },
          { k: "excerpt", t: "textarea", label: "Excerpt", hint: "Shown on cards and used as the meta description fallback.", rows: 3 },
          { k: "body", t: "richtext", label: "Article", hint: "HTML.", rows: 18 },
        ],
      },
      {
        heading: "Byline and photography",
        fields: [
          { k: "authorName", t: "text", label: "Author name" },
          { k: "authorRole", t: "text", label: "Author role" },
          { k: "heroImage", t: "image", label: "Main image", span: true },
          { k: "heroImageAlt", t: "text", label: "Main image alt text", span: true },
        ],
      },
      publishing({ featured: "Feature at the top of the listing", sort: false }),
      SEO_GROUP,
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "faqs",
    label: "FAQs",
    singular: "FAQ",
    model: "faq",
    schema: faqSchema,
    description: "Questions for the FAQ page and for individual detail pages.",
    titleField: "question",
    hasStatus: true,
    hasFeatured: false,
    hasSortOrder: true,
    orderBy: { sortOrder: "asc" },
    groups: [
      {
        heading: "Question",
        fields: [
          { k: "question", t: "text", label: "Question", required: true, span: true },
          { k: "answer", t: "richtext", label: "Answer", hint: "HTML. Keep it to a paragraph or two.", rows: 6 },
          { k: "categoryId", t: "relation", label: "Category", model: "faqCategory", allowNone: true },
        ],
      },
      {
        heading: "Where it appears",
        fields: [
          {
            k: "showInDirectory",
            t: "switch",
            label: "Show on the main FAQ page",
            hint: "Turn this off for a question that belongs only on one detail page.",
          },
          { k: "serviceId", t: "relation", label: "Attach to a service", model: "service", allowNone: true },
          { k: "vehicleId", t: "relation", label: "Attach to a vehicle", model: "vehicle", allowNone: true },
          { k: "destinationId", t: "relation", label: "Attach to a destination", model: "destination", allowNone: true },
          { k: "packageId", t: "relation", label: "Attach to a package", model: "package", allowNone: true },
        ],
      },
      publishing(),
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "gallery",
    label: "Gallery",
    singular: "Image",
    model: "galleryItem",
    schema: galleryItemSchema,
    description: "Photographs and videos for the gallery.",
    titleField: "alt",
    hasStatus: true,
    hasFeatured: false,
    hasSortOrder: true,
    orderBy: { sortOrder: "asc" },
    groups: [
      {
        heading: "Media",
        fields: [
          { k: "url", t: "image", label: "Image", required: true, span: true },
          {
            k: "alt",
            t: "text",
            label: "Alt text",
            required: true,
            span: true,
            hint: "Required. Describe the image for screen readers and search engines.",
          },
          { k: "title", t: "text", label: "Caption", span: true },
          { k: "categoryId", t: "relation", label: "Category", model: "galleryCategory", allowNone: true },
          { k: "kind", t: "select", label: "Type", options: GALLERY_KINDS.map((k) => ({ value: k, label: k === "IMAGE" ? "Image" : "Video" })) },
          { k: "videoUrl", t: "link", label: "Video embed URL", hint: "Only used when the type is Video." },
          { k: "width", t: "number", label: "Width in pixels" },
          { k: "height", t: "number", label: "Height in pixels" },
        ],
      },
      publishing(),
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "testimonials",
    label: "Testimonials",
    singular: "Testimonial",
    model: "testimonial",
    schema: testimonialSchema,
    description:
      "Only testimonials that are both verified and published appear on the website.",
    titleField: "authorName",
    hasStatus: true,
    hasFeatured: false,
    hasSortOrder: true,
    orderBy: { sortOrder: "asc" },
    groups: [
      {
        heading: "Testimonial",
        fields: [
          { k: "authorName", t: "text", label: "Customer name", required: true },
          { k: "authorRole", t: "text", label: "Role or context", placeholder: "Wedding, Chennai" },
          { k: "quote", t: "textarea", label: "Quote", rows: 5 },
          { k: "rating", t: "number", label: "Rating out of 5", hint: "Leave empty to show no stars." },
          { k: "source", t: "text", label: "Source", hint: "For your records. Never shown publicly.", span: true },
          {
            k: "isVerified",
            t: "switch",
            label: "Verified",
            hint: "Confirm this is a real, attributable quote from a real customer. Nothing appears on the site until this is on AND the status is Published.",
          },
        ],
      },
      publishing(),
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "tariffs",
    label: "Tariffs",
    singular: "Tariff table",
    model: "tariffGroup",
    schema: tariffGroupSchema,
    description: "Pricing tables. Rows are edited after saving the table.",
    titleField: "title",
    hasStatus: true,
    hasFeatured: false,
    hasSortOrder: true,
    orderBy: { sortOrder: "asc" },
    groups: [
      {
        heading: "Table",
        fields: [
          { k: "title", t: "text", label: "Title", required: true },
          { k: "slug", t: "slug", label: "URL slug", required: true },
          { k: "description", t: "textarea", label: "Description", rows: 2 },
          { k: "columns", t: "stringList", label: "Column headings", addLabel: "Add column", hint: "The first column is the row label; the rest are right-aligned." },
          { k: "footnote", t: "textarea", label: "Footnote", rows: 2 },
        ],
      },
      publishing(),
    ],
  },
];

export const RESOURCE_BY_SLUG = new Map(RESOURCES.map((r) => [r.slug, r]));

export function getResource(slug: string): ResourceDef | undefined {
  return RESOURCE_BY_SLUG.get(slug);
}

/** Every field across every group, flattened. */
export function allFields(def: ResourceDef): FieldDef[] {
  return def.groups.flatMap((group) => group.fields);
}

/** Fields whose stored value is JSON text rather than a scalar. */
export function isJsonField(field: FieldDef): boolean {
  return field.t === "jsonList" || field.t === "stringList";
}
