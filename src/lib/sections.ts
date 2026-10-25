import { z } from "zod";

/**
 * The page-section registry.
 *
 * Each section type declares its editable fields once. The admin form, the Zod
 * validation schema and the default payload are all derived from that single
 * declaration, so adding a section type never means touching three files.
 *
 * Imported by both the server renderer and the client editor — keep it free of
 * server-only imports.
 */

export type SelectOption = { value: string; label: string };

export type SimpleFieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "image"
  | "link"
  | "select"
  | "number"
  | "boolean";

export type SimpleFieldDef = {
  name: string;
  type: SimpleFieldType;
  label: string;
  help?: string;
  placeholder?: string;
  options?: SelectOption[];
  max?: number;
  min?: number;
  default?: string | number | boolean;
  /** Width hint for the admin grid. */
  span?: 1 | 2;
};

export type RepeaterFieldDef = {
  name: string;
  type: "repeater";
  label: string;
  help?: string;
  maxItems?: number;
  addLabel?: string;
  fields: SimpleFieldDef[];
  span?: 1 | 2;
};

export type FieldDef = SimpleFieldDef | RepeaterFieldDef;

export type SectionDef = {
  type: string;
  label: string;
  description: string;
  icon: string;
  /** Grouping in the "add section" picker. */
  group: "Layout" | "Media" | "Content collections" | "Conversion";
  fields: FieldDef[];
};

export function isRepeater(field: FieldDef): field is RepeaterFieldDef {
  return field.type === "repeater";
}

// ---------------------------------------------------------------------------
// Shared field fragments
// ---------------------------------------------------------------------------

const eyebrow: SimpleFieldDef = {
  name: "eyebrow",
  type: "text",
  label: "Eyebrow",
  placeholder: "Small label above the heading",
  max: 80,
};

const heading = (label = "Heading"): SimpleFieldDef => ({
  name: "heading",
  type: "text",
  label,
  max: 180,
  span: 2,
});

const intro: SimpleFieldDef = {
  name: "intro",
  type: "textarea",
  label: "Introduction",
  max: 800,
  span: 2,
};

const imageField = (name = "image", label = "Image"): SimpleFieldDef => ({
  name,
  type: "image",
  label,
  help: "Pick from the media library or paste an image URL.",
});

const altField = (name = "imageAlt", label = "Image alt text"): SimpleFieldDef => ({
  name,
  type: "text",
  label,
  help: "Describe the image for screen readers and search engines.",
  max: 240,
});

const ctaFields = (prefix: "primary" | "secondary"): SimpleFieldDef[] => [
  {
    name: `${prefix}Label`,
    type: "text",
    label: `${prefix === "primary" ? "Primary" : "Secondary"} button label`,
    max: 60,
  },
  {
    name: `${prefix}Url`,
    type: "link",
    label: `${prefix === "primary" ? "Primary" : "Secondary"} button link`,
    placeholder: "/contact",
  },
];

const linkCta: SimpleFieldDef[] = [
  { name: "ctaLabel", type: "text", label: "Link label", max: 60 },
  { name: "ctaUrl", type: "link", label: "Link URL", placeholder: "/fleet" },
];

const limitField = (def = 6): SimpleFieldDef => ({
  name: "limit",
  type: "number",
  label: "How many to show",
  min: 1,
  max: 24,
  default: def,
});

/**
 * Surface tone. The stored values are historical identifiers, not colour
 * names — the palette they map to is defined by the .tone-* classes in
 * globals.css, so a rebrand never requires migrating section data.
 */
const toneField: SimpleFieldDef = {
  name: "tone",
  type: "select",
  label: "Background",
  options: [
    { value: "ivory", label: "Off-white (light)" },
    { value: "charcoal", label: "Deep green (dark)" },
    { value: "ink", label: "Darkest green" },
  ],
  default: "ivory",
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const SECTION_DEFS: SectionDef[] = [
  {
    type: "hero",
    label: "Hero",
    description: "Full-bleed cinematic opener with headline, buttons and spec strip.",
    icon: "PanelTop",
    group: "Layout",
    fields: [
      eyebrow,
      heading("Headline"),
      { name: "body", type: "textarea", label: "Introduction", max: 600, span: 2 },
      ...ctaFields("primary"),
      ...ctaFields("secondary"),
      imageField("image", "Background image"),
      altField(),
      {
        name: "align",
        type: "select",
        label: "Text alignment",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Centred" },
        ],
        default: "left",
      },
      {
        name: "stats",
        type: "repeater",
        label: "Spec strip",
        help: "Short facts shown under the hero. Leave empty to hide.",
        maxItems: 6,
        addLabel: "Add spec",
        span: 2,
        fields: [
          { name: "label", type: "text", label: "Label", max: 60 },
          { name: "value", type: "text", label: "Value", max: 80 },
        ],
      },
    ],
  },
  {
    type: "richText",
    label: "Rich text",
    description: "A measured column of formatted copy.",
    icon: "Type",
    group: "Layout",
    fields: [
      eyebrow,
      heading(),
      { name: "body", type: "richtext", label: "Body", span: 2 },
      toneField,
      {
        name: "width",
        type: "select",
        label: "Column width",
        options: [
          { value: "prose", label: "Reading width" },
          { value: "wide", label: "Wide" },
        ],
        default: "prose",
      },
    ],
  },
  {
    type: "imageText",
    label: "Image and text",
    description: "Asymmetric editorial split with an optional bullet list.",
    icon: "Columns2",
    group: "Layout",
    fields: [
      eyebrow,
      heading(),
      { name: "body", type: "richtext", label: "Body", span: 2 },
      imageField(),
      altField(),
      {
        name: "mediaSide",
        type: "select",
        label: "Image position",
        options: [
          { value: "right", label: "Right" },
          { value: "left", label: "Left" },
        ],
        default: "right",
      },
      toneField,
      ...linkCta,
      {
        name: "points",
        type: "repeater",
        label: "Supporting points",
        maxItems: 8,
        addLabel: "Add point",
        span: 2,
        fields: [
          { name: "title", type: "text", label: "Title", max: 120 },
          { name: "detail", type: "textarea", label: "Detail", max: 400 },
        ],
      },
    ],
  },
  {
    type: "fullImage",
    label: "Full-width image",
    description: "Edge-to-edge photograph, optionally with an overlaid line of text.",
    icon: "Image",
    group: "Media",
    fields: [
      imageField("image", "Image"),
      altField(),
      heading("Overlay text"),
      { name: "caption", type: "text", label: "Caption", max: 200 },
      {
        name: "height",
        type: "select",
        label: "Height",
        options: [
          { value: "short", label: "Short" },
          { value: "medium", label: "Medium" },
          { value: "tall", label: "Tall" },
        ],
        default: "medium",
      },
    ],
  },
  {
    type: "gallery",
    label: "Image gallery",
    description: "Grid pulled from the gallery library, with an accessible lightbox.",
    icon: "Images",
    group: "Media",
    fields: [
      eyebrow,
      heading(),
      intro,
      {
        name: "categorySlug",
        type: "text",
        label: "Gallery category slug",
        help: "Leave empty to show every published image.",
        max: 80,
      },
      limitField(8),
      ...linkCta,
      toneField,
    ],
  },
  {
    type: "video",
    label: "Video",
    description: "A single embedded video with a poster frame.",
    icon: "Play",
    group: "Media",
    fields: [
      eyebrow,
      heading(),
      intro,
      { name: "videoUrl", type: "link", label: "Video URL", help: "YouTube, Vimeo or a direct MP4 URL.", span: 2 },
      imageField("poster", "Poster image"),
      altField("posterAlt", "Poster alt text"),
      toneField,
    ],
  },
  {
    type: "stats",
    label: "Statistics",
    description: "A row of figures. Only publish numbers the client has confirmed.",
    icon: "BarChart3",
    group: "Content collections",
    fields: [
      eyebrow,
      heading(),
      intro,
      toneField,
      {
        name: "items",
        type: "repeater",
        label: "Figures",
        help: "Do not publish an unverified statistic.",
        maxItems: 6,
        addLabel: "Add figure",
        span: 2,
        fields: [
          { name: "value", type: "text", label: "Figure", max: 40 },
          { name: "label", type: "text", label: "Label", max: 80 },
          { name: "detail", type: "text", label: "Supporting line", max: 160 },
        ],
      },
    ],
  },
  {
    type: "featureGrid",
    label: "Feature grid",
    description: "Icon-led reasons to choose the business.",
    icon: "LayoutGrid",
    group: "Content collections",
    fields: [
      eyebrow,
      heading(),
      intro,
      toneField,
      {
        name: "columns",
        type: "select",
        label: "Columns",
        options: [
          { value: "2", label: "Two" },
          { value: "3", label: "Three" },
          { value: "4", label: "Four" },
        ],
        default: "3",
      },
      {
        name: "items",
        type: "repeater",
        label: "Features",
        maxItems: 12,
        addLabel: "Add feature",
        span: 2,
        fields: [
          { name: "icon", type: "text", label: "Lucide icon name", placeholder: "ShieldCheck", max: 40 },
          { name: "title", type: "text", label: "Title", max: 120 },
          { name: "detail", type: "textarea", label: "Detail", max: 400 },
        ],
      },
    ],
  },
  {
    type: "process",
    label: "Booking process",
    description: "Numbered steps explaining how a booking works.",
    icon: "ListOrdered",
    group: "Content collections",
    fields: [
      eyebrow,
      heading(),
      intro,
      toneField,
      {
        name: "steps",
        type: "repeater",
        label: "Steps",
        maxItems: 6,
        addLabel: "Add step",
        span: 2,
        fields: [
          { name: "title", type: "text", label: "Title", max: 120 },
          { name: "detail", type: "textarea", label: "Detail", max: 400 },
        ],
      },
    ],
  },
  {
    type: "fleetShowcase",
    label: "Fleet showcase",
    description: "Published vehicles pulled live from the fleet library.",
    icon: "Bus",
    group: "Content collections",
    fields: [
      eyebrow,
      heading(),
      intro,
      {
        name: "categorySlug",
        type: "text",
        label: "Category slug",
        help: "Leave empty for all categories.",
        max: 80,
      },
      {
        name: "source",
        type: "select",
        label: "Which vehicles",
        options: [
          { value: "featured", label: "Featured only" },
          { value: "all", label: "All published" },
        ],
        default: "featured",
      },
      limitField(5),
      {
        name: "layout",
        type: "select",
        label: "Layout",
        options: [
          { value: "grid", label: "Card grid" },
          { value: "rail", label: "Horizontal rail" },
        ],
        default: "grid",
      },
      ...linkCta,
      toneField,
    ],
  },
  {
    type: "serviceShowcase",
    label: "Service showcase",
    description: "Published services pulled live from the services library.",
    icon: "Sparkles",
    group: "Content collections",
    fields: [eyebrow, heading(), intro, limitField(9), ...linkCta, toneField],
  },
  {
    type: "routeShowcase",
    label: "Outstation routes",
    description: "Published destinations with distance and journey time.",
    icon: "Route",
    group: "Content collections",
    fields: [eyebrow, heading(), intro, limitField(8), ...linkCta, toneField],
  },
  {
    type: "packageShowcase",
    label: "Packages",
    description: "Published tour packages.",
    icon: "Package",
    group: "Content collections",
    fields: [eyebrow, heading(), intro, limitField(6), ...linkCta, toneField],
  },
  {
    type: "articleShowcase",
    label: "Travel guides",
    description: "The most recent published articles.",
    icon: "Newspaper",
    group: "Content collections",
    fields: [eyebrow, heading(), intro, limitField(3), ...linkCta, toneField],
  },
  {
    type: "pricing",
    label: "Pricing table",
    description: "A tariff group rendered as an accessible table.",
    icon: "IndianRupee",
    group: "Conversion",
    fields: [
      eyebrow,
      heading(),
      intro,
      {
        name: "groupSlug",
        type: "text",
        label: "Tariff group slug",
        help: "Leave empty to show every published tariff group.",
        max: 80,
      },
      { name: "note", type: "textarea", label: "Note under the table", max: 600, span: 2 },
      ...linkCta,
      toneField,
    ],
  },
  {
    type: "testimonials",
    label: "Testimonials",
    description:
      "Hidden automatically until at least one verified testimonial is published.",
    icon: "Quote",
    group: "Conversion",
    fields: [eyebrow, heading(), intro, limitField(6), toneField],
  },
  {
    type: "faq",
    label: "FAQ accordion",
    description: "Questions from the FAQ library, with FAQPage structured data.",
    icon: "CircleHelp",
    group: "Conversion",
    fields: [
      eyebrow,
      heading(),
      intro,
      {
        name: "categorySlug",
        type: "text",
        label: "FAQ category slug",
        help: "Leave empty to show from every category.",
        max: 80,
      },
      limitField(6),
      ...linkCta,
      toneField,
    ],
  },
  {
    type: "cta",
    label: "Call to action",
    description: "A closing enquiry prompt with call and WhatsApp buttons.",
    icon: "Megaphone",
    group: "Conversion",
    fields: [
      eyebrow,
      heading(),
      { name: "body", type: "textarea", label: "Body", max: 600, span: 2 },
      ...ctaFields("primary"),
      ...ctaFields("secondary"),
      imageField("image", "Background image"),
      altField(),
      {
        name: "showContactButtons",
        type: "boolean",
        label: "Show call and WhatsApp buttons",
        default: true,
        help: "Buttons appear only once the numbers are filled in under Settings.",
      },
      {
        name: "variant",
        type: "select",
        label: "Style",
        options: [
          { value: "band", label: "Full-width band" },
          { value: "panel", label: "Inset panel" },
        ],
        default: "band",
      },
    ],
  },
  {
    type: "contactDetails",
    label: "Contact details",
    description: "Phone, WhatsApp, email, address and an optional map.",
    icon: "MapPin",
    group: "Conversion",
    fields: [
      eyebrow,
      heading(),
      intro,
      { name: "showMap", type: "boolean", label: "Show the map", default: true },
      { name: "showForm", type: "boolean", label: "Show the enquiry form", default: true },
      toneField,
    ],
  },
];

export const SECTION_DEF_BY_TYPE = new Map(SECTION_DEFS.map((def) => [def.type, def]));

export function getSectionDef(type: string): SectionDef | undefined {
  return SECTION_DEF_BY_TYPE.get(type);
}

// ---------------------------------------------------------------------------
// Derived schema + defaults
// ---------------------------------------------------------------------------

/**
 * Every field schema starts from `z.unknown().optional()`.
 *
 * In Zod 4 a `.transform()` makes its key *required*, even when the input
 * union already includes `z.undefined()`. Without `.optional()` first, a saved
 * section row that predates a newly added field fails to parse, and the
 * object-level `.catch()` then discards the editor's entire payload and
 * replaces it with defaults. `.optional()` keeps a partial payload parseable
 * so missing fields fall back individually.
 */
const booleanish = z
  .unknown()
  .optional()
  .transform((v) => v === true || v === "on" || v === "true" || v === 1 || v === "1");

function simpleFieldSchema(field: SimpleFieldDef): z.ZodTypeAny {
  switch (field.type) {
    case "boolean":
      return booleanish;
    case "number":
      return z
        .unknown()
        .optional()
        .transform((v) => {
          if (v === null || v === undefined || v === "") {
            return typeof field.default === "number" ? field.default : 0;
          }
          const n = typeof v === "number" ? v : Number(v);
          if (!Number.isFinite(n)) return typeof field.default === "number" ? field.default : 0;
          const clamped = Math.min(field.max ?? 9999, Math.max(field.min ?? 0, Math.trunc(n)));
          return clamped;
        });
    case "select": {
      const values = (field.options ?? []).map((o) => o.value);
      const fallback = (field.default as string) ?? values[0] ?? "";
      return z
        .unknown()
        .optional()
        .transform((v) => (typeof v === "string" && values.includes(v) ? v : fallback));
    }
    case "richtext":
      return z
        .unknown()
        .optional()
        .transform((v) => (typeof v === "string" ? v.slice(0, 40_000) : ""));
    default:
      return z
        .unknown()
        .optional()
        .transform((v) =>
          v === null || v === undefined ? "" : String(v).trim().slice(0, field.max ?? 1000),
        );
  }
}

/** Build the Zod schema for one section type from its field declarations. */
export function sectionDataSchema(type: string): z.ZodTypeAny {
  const def = getSectionDef(type);
  if (!def) return z.object({}).catch({});

  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of def.fields) {
    if (isRepeater(field)) {
      const itemShape: Record<string, z.ZodTypeAny> = {};
      for (const sub of field.fields) itemShape[sub.name] = simpleFieldSchema(sub);
      shape[field.name] = z
        .array(z.object(itemShape).catch({} as never))
        .max(field.maxItems ?? 24)
        .optional()
        .catch([])
        .transform((v) => v ?? []);
    } else {
      shape[field.name] = simpleFieldSchema(field);
    }
  }

  // Unknown keys are dropped rather than rejected, so removing a field from the
  // registry never breaks an existing saved section.
  return z.object(shape).catch(() => sectionDefaults(type) as never);
}

/** The payload a freshly added section starts with. */
export function sectionDefaults(type: string): Record<string, unknown> {
  const def = getSectionDef(type);
  if (!def) return {};

  const out: Record<string, unknown> = {};
  for (const field of def.fields) {
    if (isRepeater(field)) {
      out[field.name] = [];
    } else if (field.default !== undefined) {
      out[field.name] = field.default;
    } else if (field.type === "boolean") {
      out[field.name] = false;
    } else if (field.type === "number") {
      out[field.name] = field.min ?? 0;
    } else if (field.type === "select") {
      out[field.name] = field.options?.[0]?.value ?? "";
    } else {
      out[field.name] = "";
    }
  }
  return out;
}

/** Parse stored JSON for a section, always returning a usable payload. */
export function parseSectionData(type: string, raw: string | null | undefined): Record<string, unknown> {
  const schema = sectionDataSchema(type);
  const fallback = sectionDefaults(type);
  if (!raw) return fallback;
  try {
    const result = schema.safeParse(JSON.parse(raw));
    return result.success ? { ...fallback, ...(result.data as object) } : fallback;
  } catch {
    return fallback;
  }
}

// Typed readers used by the renderers.
export function sText(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  return typeof value === "string" ? value : "";
}

export function sBool(data: Record<string, unknown>, key: string): boolean {
  return data[key] === true;
}

export function sNum(data: Record<string, unknown>, key: string, fallback = 0): number {
  const value = data[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function sList<T = Record<string, string>>(data: Record<string, unknown>, key: string): T[] {
  const value = data[key];
  return Array.isArray(value) ? (value as T[]) : [];
}
