import { z } from "zod";
import { slugify } from "./utils";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export const STATUSES = ["DRAFT", "PUBLISHED"] as const;
export const ENQUIRY_TYPES = ["GENERAL", "VEHICLE", "SERVICE", "DESTINATION", "PACKAGE"] as const;
export const ENQUIRY_STATUSES = ["NEW", "IN_PROGRESS", "QUOTED", "CLOSED", "SPAM"] as const;
export const ROLES = ["ADMIN", "EDITOR"] as const;
export const NAV_MENUS = [
  "HEADER",
  "FOOTER_MENU",
  "FOOTER_SERVICES",
  "FOOTER_ROUTES",
  "LEGAL",
] as const;
export const IMAGE_KINDS = ["EXTERIOR", "INTERIOR", "AMENITY"] as const;
export const GALLERY_KINDS = ["IMAGE", "VIDEO"] as const;
export const PAGE_TEMPLATES = ["standard", "home", "listing", "contact"] as const;

export const statusSchema = z.enum(STATUSES);
export const roleSchema = z.enum(ROLES);

/** Accepts either a typed slug or raw text, always returns a clean slug. */
export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(80)
  .transform(slugify)
  .refine((value) => value.length > 0, "Slug must contain at least one letter or number");

/** Empty form inputs arrive as "" — normalise those to null for nullable columns. */
export const optionalText = (max = 500) =>
  z
    .unknown()
    .optional()
    .transform((value) => (typeof value === "string" ? value.trim().slice(0, max) : ""))
    .transform((value) => (value.length === 0 ? null : value));

// `.optional()` first: in Zod 4 a `.transform()` makes its key required, even
// when the input union already allows undefined. Without it, any form that
// omits the field entirely (the compact enquiry form drops the trip fields)
// fails validation instead of treating the value as absent.
export const optionalInt = (min = 0, max = 100_000_000) =>
  z
    .unknown()
    .optional()
    .transform((value) => {
      if (value === null || value === undefined || value === "") return null;
      const parsed = typeof value === "number" ? value : Number(value);
      return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
    })
    .refine((value) => value === null || (value >= min && value <= max), {
      message: `Must be between ${min} and ${max}`,
    });

export const checkbox = z
  .unknown()
  .optional()
  .transform((value) => value === true || value === "on" || value === "true" || value === "1");

export const sortOrderSchema = z.coerce.number().int().min(0).max(9999).catch(0);

/** Internal path or absolute URL — blocks javascript: and data: URLs. */
export const linkSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) =>
      value === "" ||
      value.startsWith("/") ||
      value.startsWith("#") ||
      /^https?:\/\//i.test(value) ||
      /^(tel|mailto):/i.test(value),
    "Use a path starting with /, or a full http(s), tel: or mailto: URL",
  );

export const imageUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => value === "" || value.startsWith("/") || /^https?:\/\//i.test(value),
    "Use an uploaded path (/uploads/...) or a full https URL",
  );

// ---------------------------------------------------------------------------
// Structured JSON content shapes
// ---------------------------------------------------------------------------

export const stringListSchema = z.array(z.string().trim().min(1).max(300)).max(60);

export const titleDetailSchema = z.array(
  z.object({
    title: z.string().trim().min(1).max(160),
    detail: z.string().trim().max(600).default(""),
  }),
).max(40);

export const labelValueSchema = z.array(
  z.object({
    label: z.string().trim().min(1).max(120),
    value: z.string().trim().max(240).default(""),
  }),
).max(40);

export const labelDetailSchema = z.array(
  z.object({
    label: z.string().trim().min(1).max(160),
    detail: z.string().trim().max(600).default(""),
  }),
).max(40);

export const featureSchema = z.array(
  z.object({
    icon: z.string().trim().max(40).default("Check"),
    label: z.string().trim().min(1).max(160),
    detail: z.string().trim().max(600).default(""),
  }),
).max(40);

export const cellsSchema = z.array(z.string().trim().max(200)).max(12);
export const columnsSchema = z.array(z.string().trim().min(1).max(120)).max(12);

// ---------------------------------------------------------------------------
// SEO block — shared by every content type
// ---------------------------------------------------------------------------

export const seoFields = {
  metaTitle: optionalText(70),
  metaDescription: optionalText(180),
  ogImage: imageUrlSchema.transform((v) => v || null).nullable().catch(null),
  noindex: checkbox,
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password").max(200),
});

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(200, "Password is too long")
  .refine((v) => /[a-z]/i.test(v), "Include at least one letter")
  .refine((v) => /\d/.test(v), "Include at least one number");

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(10).max(200),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const userCreateSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  role: roleSchema,
  password: passwordSchema,
  isActive: checkbox,
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  role: roleSchema,
  password: z.union([z.literal(""), passwordSchema]).optional(),
  isActive: checkbox,
});

// ---------------------------------------------------------------------------
// Content types
// ---------------------------------------------------------------------------

export const pageSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(160),
  slug: slugSchema,
  template: z.enum(PAGE_TEMPLATES).catch("standard"),
  status: statusSchema,
  canonicalUrl: optionalText(500),
  sortOrder: sortOrderSchema,
  ...seoFields,
});

export const sectionSchema = z.object({
  type: z.string().trim().min(1).max(60),
  sortOrder: sortOrderSchema,
  isVisible: checkbox,
  data: z.string().max(60_000),
});

export const vehicleCategorySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: slugSchema,
  description: optionalText(400),
  sortOrder: sortOrderSchema,
});

export const vehicleSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(160),
  slug: slugSchema,
  tagline: optionalText(200),
  categoryId: optionalText(40),
  seats: z.coerce.number().int().min(0).max(120).catch(0),
  luggage: optionalText(120),
  summary: optionalText(600),
  body: optionalText(40_000),
  heroImage: imageUrlSchema.transform((v) => v || null).nullable().catch(null),
  heroImageAlt: optionalText(240),
  features: z.string().max(20_000),
  specs: z.string().max(20_000),
  seatLayouts: z.string().max(20_000),
  useCases: z.string().max(20_000),
  showPrice: checkbox,
  priceLocalLabel: optionalText(120),
  priceLocal: optionalInt(),
  priceOutstationPerKm: optionalInt(0, 10_000),
  extraKmRate: optionalInt(0, 10_000),
  extraHourRate: optionalInt(0, 100_000),
  driverAllowance: optionalInt(0, 100_000),
  priceNote: optionalText(400),
  status: statusSchema,
  isFeatured: checkbox,
  sortOrder: sortOrderSchema,
  ...seoFields,
});

export const vehicleImageSchema = z.object({
  url: imageUrlSchema.refine((v) => v.length > 0, "Image is required"),
  alt: z.string().trim().min(3, "Alt text is required for accessibility and SEO").max(240),
  kind: z.enum(IMAGE_KINDS).catch("EXTERIOR"),
  sortOrder: sortOrderSchema,
});

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(160),
  slug: slugSchema,
  tagline: optionalText(200),
  summary: optionalText(600),
  body: optionalText(40_000),
  heroImage: imageUrlSchema.transform((v) => v || null).nullable().catch(null),
  heroImageAlt: optionalText(240),
  icon: z.string().trim().max(40).catch("Sparkles"),
  highlights: z.string().max(20_000),
  checklist: z.string().max(20_000),
  status: statusSchema,
  isFeatured: checkbox,
  sortOrder: sortOrderSchema,
  ...seoFields,
});

export const destinationSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(160),
  slug: slugSchema,
  region: optionalText(120),
  tagline: optionalText(200),
  summary: optionalText(600),
  body: optionalText(40_000),
  heroImage: imageUrlSchema.transform((v) => v || null).nullable().catch(null),
  heroImageAlt: optionalText(240),
  distanceKm: optionalInt(0, 5000),
  travelTimeText: optionalText(120),
  bestSeason: optionalText(160),
  factsVerified: checkbox,
  itinerary: z.string().max(20_000),
  highlights: z.string().max(20_000),
  priceNote: optionalText(400),
  status: statusSchema,
  isFeatured: checkbox,
  sortOrder: sortOrderSchema,
  ...seoFields,
});

export const packageSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(160),
  slug: slugSchema,
  tagline: optionalText(200),
  summary: optionalText(600),
  body: optionalText(40_000),
  heroImage: imageUrlSchema.transform((v) => v || null).nullable().catch(null),
  heroImageAlt: optionalText(240),
  durationText: optionalText(120),
  priceFrom: optionalInt(),
  showPrice: checkbox,
  priceNote: optionalText(400),
  inclusions: z.string().max(20_000),
  exclusions: z.string().max(20_000),
  itinerary: z.string().max(20_000),
  status: statusSchema,
  isFeatured: checkbox,
  sortOrder: sortOrderSchema,
  ...seoFields,
});

export const articleCategorySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: slugSchema,
  description: optionalText(400),
  sortOrder: sortOrderSchema,
});

export const articleSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(200),
  slug: slugSchema,
  excerpt: optionalText(400),
  body: optionalText(80_000),
  heroImage: imageUrlSchema.transform((v) => v || null).nullable().catch(null),
  heroImageAlt: optionalText(240),
  categoryId: optionalText(40),
  authorName: optionalText(120),
  authorRole: optionalText(120),
  status: statusSchema,
  isFeatured: checkbox,
  ...seoFields,
});

export const faqCategorySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: slugSchema,
  sortOrder: sortOrderSchema,
});

export const faqSchema = z.object({
  question: z.string().trim().min(5, "Question is required").max(300),
  answer: z.string().trim().min(5, "Answer is required").max(5000),
  categoryId: optionalText(40),
  vehicleId: optionalText(40),
  serviceId: optionalText(40),
  destinationId: optionalText(40),
  packageId: optionalText(40),
  showInDirectory: checkbox,
  status: statusSchema,
  sortOrder: sortOrderSchema,
});

export const galleryCategorySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: slugSchema,
  sortOrder: sortOrderSchema,
});

export const galleryItemSchema = z.object({
  title: optionalText(200),
  alt: z.string().trim().min(3, "Alt text is required for accessibility and SEO").max(240),
  url: imageUrlSchema.refine((v) => v.length > 0, "Image is required"),
  kind: z.enum(GALLERY_KINDS).catch("IMAGE"),
  videoUrl: optionalText(500),
  width: optionalInt(0, 20_000),
  height: optionalInt(0, 20_000),
  categoryId: optionalText(40),
  status: statusSchema,
  sortOrder: sortOrderSchema,
});

export const testimonialSchema = z.object({
  authorName: z.string().trim().min(2, "Name is required").max(120),
  authorRole: optionalText(160),
  quote: z.string().trim().min(10, "Quote is required").max(1500),
  rating: optionalInt(1, 5),
  source: optionalText(200),
  isVerified: checkbox,
  status: statusSchema,
  sortOrder: sortOrderSchema,
});

export const tariffGroupSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(160),
  slug: slugSchema,
  description: optionalText(600),
  columns: z.string().max(4000),
  footnote: optionalText(600),
  status: statusSchema,
  sortOrder: sortOrderSchema,
});

export const tariffRowSchema = z.object({
  cells: z.string().max(4000),
  isHighlighted: checkbox,
  sortOrder: sortOrderSchema,
});

export const navItemSchema = z.object({
  menu: z.enum(NAV_MENUS),
  label: z.string().trim().min(1, "Label is required").max(80),
  url: linkSchema.refine((v) => v.length > 0, "URL is required"),
  parentId: optionalText(40),
  description: optionalText(200),
  openInNewTab: checkbox,
  isVisible: checkbox,
  sortOrder: sortOrderSchema,
});

export const redirectSchema = z
  .object({
    source: z
      .string()
      .trim()
      .min(1, "Source path is required")
      .max(500)
      .refine((v) => v.startsWith("/"), "Source must start with /"),
    destination: linkSchema.refine((v) => v.length > 0, "Destination is required"),
    statusCode: z.coerce.number().int().refine((v) => v === 301 || v === 302, "Use 301 or 302"),
    isActive: checkbox,
    note: optionalText(300),
  })
  .refine((data) => data.source !== data.destination, {
    message: "Source and destination cannot be the same",
    path: ["destination"],
  });

// ---------------------------------------------------------------------------
// Public enquiry form
// ---------------------------------------------------------------------------

export const enquirySchema = z.object({
  type: z.enum(ENQUIRY_TYPES).catch("GENERAL"),
  name: z.string().trim().min(2, "Please enter your name").max(120),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a contact number")
    .max(24)
    .refine((v) => /^[\d\s()+-]+$/.test(v), "Use digits, spaces and + ( ) - only"),
  email: z
    .unknown()
    .optional()
    .transform((v) => (typeof v === "string" ? v.trim().toLowerCase() : ""))
    .refine(
      (v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
      "Enter a valid email address",
    )
    .transform((v) => (v === "" ? null : v)),
  message: optionalText(2000),
  travelDate: optionalText(40),
  passengers: optionalInt(0, 200),
  pickup: optionalText(200),
  dropoff: optionalText(200),
  subject: optionalText(200),
  vehicleId: optionalText(40),
  serviceId: optionalText(40),
  destinationId: optionalText(40),
  packageId: optionalText(40),
  sourcePath: optionalText(300),
  /** Honeypot — must stay empty. Real browsers never fill a hidden field. */
  company: z.string().max(200).optional(),
  /** Milliseconds since the form rendered; sub-second submits are bots. */
  elapsed: z.coerce.number().catch(0),
});

export const enquiryUpdateSchema = z.object({
  status: z.enum(ENQUIRY_STATUSES),
  internalNotes: optionalText(4000),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export type FieldErrors = Record<string, string>;

/** Flatten a ZodError into { fieldName: firstMessage } for form rendering. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Parse a FormData object with a Zod schema, returning typed data or errors. */
export function parseForm<T>(
  schema: z.ZodType<T>,
  formData: FormData,
): { success: true; data: T } | { success: false; errors: FieldErrors } {
  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue;
    raw[key] = value;
  }
  const result = schema.safeParse(raw);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: fieldErrors(result.error) };
}
