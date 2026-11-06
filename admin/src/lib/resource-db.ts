import "server-only";

import { z } from "zod";
import { db } from "./db";
import {
  columnsSchema,
  featureSchema,
  labelDetailSchema,
  labelValueSchema,
  stringListSchema,
  titleDetailSchema,
  type FieldErrors,
} from "./validation";
import { allFields, type FieldDef, type RelationModel, type ResourceDef } from "./resources";

/**
 * The data layer behind the generic content editors.
 *
 * Prisma's client is typed per model, and these screens choose their model at
 * runtime from the registry, so the delegate lookup cannot be statically
 * typed. That cast is confined to this one function rather than spread across
 * every page — everything below it works against a narrow interface.
 */
type Delegate = {
  findMany: (args?: unknown) => Promise<Array<Record<string, unknown>>>;
  findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
  create: (args: unknown) => Promise<Record<string, unknown>>;
  update: (args: unknown) => Promise<Record<string, unknown>>;
  delete: (args: unknown) => Promise<Record<string, unknown>>;
  count: (args?: unknown) => Promise<number>;
};

function delegate(model: string): Delegate {
  const client = db as unknown as Record<string, Delegate | undefined>;
  const found = client[model];
  if (!found || typeof found.findMany !== "function") {
    // A registry entry naming a model that does not exist is a programming
    // error, not something an editor can cause — fail loudly.
    throw new Error(`Unknown Prisma model "${model}"`);
  }
  return found;
}

// ---------------------------------------------------------------------------
// JSON content columns
// ---------------------------------------------------------------------------

/**
 * The shape a structured column must hold.
 *
 * Structured content is stored as JSON text, and the schema that guards the
 * form only checks it is a string of sane length. Without a shape check here,
 * a malformed value would save happily and then render as nothing at all on
 * the public site, because every public read falls back when parsing fails.
 * So the shape is matched from the field's own sub-field names, which are
 * exactly the four shapes the public components read.
 */
function jsonShape(field: FieldDef): z.ZodType<unknown> {
  if (field.t === "stringList") {
    return field.k === "columns" ? columnsSchema : stringListSchema;
  }
  if (field.t !== "jsonList") throw new Error(`${field.k} is not a JSON field`);

  const keys = field.fields.map((f) => f.key).sort().join(",");
  switch (keys) {
    case "detail,title":
      return titleDetailSchema;
    case "label,value":
      return labelValueSchema;
    case "detail,label":
      return labelDetailSchema;
    case "detail,icon,label":
      return featureSchema;
    default:
      throw new Error(`No JSON shape registered for field "${field.k}" (${keys})`);
  }
}

/** Drops rows the editor added but left completely blank. */
function dropEmpty(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return value.filter((row) => {
    if (typeof row === "string") return row.trim().length > 0;
    if (row && typeof row === "object") {
      return Object.values(row as Record<string, unknown>).some(
        (v) => typeof v === "string" && v.trim().length > 0,
      );
    }
    return false;
  });
}

// ---------------------------------------------------------------------------
// Row <-> form
// ---------------------------------------------------------------------------

export type FormValues = Record<string, string | boolean>;

/** Turns a database row into the values the form controls render from. */
export function toFormValues(def: ResourceDef, row: Record<string, unknown> | null): FormValues {
  const out: FormValues = {};

  for (const field of allFields(def)) {
    const raw = row?.[field.k];

    if (field.t === "switch") {
      // A new row takes the field's own sensible default rather than off:
      // "show on the main FAQ page" off by default would hide every new FAQ.
      out[field.k] = row ? raw === true : switchDefault(def, field.k);
      continue;
    }

    if (field.t === "jsonList" || field.t === "stringList") {
      out[field.k] = typeof raw === "string" && raw.length > 0 ? raw : "[]";
      continue;
    }

    if (field.t === "number") {
      out[field.k] = typeof raw === "number" ? String(raw) : "";
      continue;
    }

    out[field.k] = typeof raw === "string" ? raw : "";
  }

  return out;
}

/**
 * Defaults for a brand-new row.
 *
 * `showInDirectory` and `showPrice` default on because that is what an editor
 * creating one means; `isVerified`, `factsVerified` and `noindex` default off
 * because each one asserts something nobody has checked yet.
 */
function switchDefault(def: ResourceDef, key: string): boolean {
  if (key === "showInDirectory") return true;
  if (key === "showPrice") return def.slug === "fleet";
  return false;
}

/**
 * Validates and normalises the structured columns, then returns the object to
 * hand Prisma. Returns field errors instead when a structured column does not
 * hold the shape its public component reads.
 */
export function buildData(
  def: ResourceDef,
  parsed: Record<string, unknown>,
): { ok: true; data: Record<string, unknown> } | { ok: false; errors: FieldErrors } {
  const data = { ...parsed };
  const errors: FieldErrors = {};

  for (const field of allFields(def)) {
    if (field.t !== "jsonList" && field.t !== "stringList") continue;

    const raw = data[field.k];
    if (typeof raw !== "string") {
      data[field.k] = "[]";
      continue;
    }

    let decoded: unknown;
    try {
      decoded = JSON.parse(raw.length > 0 ? raw : "[]");
    } catch {
      errors[field.k] = "Could not be read. Remove the items and add them again.";
      continue;
    }

    const result = jsonShape(field).safeParse(dropEmpty(decoded));
    if (!result.success) {
      const issue = result.error.issues[0];
      const where = issue && issue.path.length > 0 ? ` (item ${Number(issue.path[0]) + 1})` : "";
      errors[field.k] = `${issue?.message ?? "Invalid"}${where}`;
      continue;
    }

    data[field.k] = JSON.stringify(result.data);
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export type ListRow = {
  id: string;
  title: string;
  status: string | null;
  isFeatured: boolean;
  sortOrder: number | null;
  slug: string | null;
  extra: Record<string, string>;
  updatedAt: Date | null;
};

export async function listRows(def: ResourceDef): Promise<ListRow[]> {
  const rows = await delegate(def.model).findMany({
    orderBy: [def.orderBy, { id: "asc" }],
  });

  return rows.map((row) => ({
    id: String(row.id),
    title: String(row[def.titleField] ?? "").trim() || "(untitled)",
    status: typeof row.status === "string" ? row.status : null,
    isFeatured: row.isFeatured === true,
    sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : null,
    slug: typeof row.slug === "string" ? row.slug : null,
    extra: Object.fromEntries(
      (def.listExtra ?? []).map((col) => [
        col.k,
        row[col.k] === null || row[col.k] === undefined ? "—" : String(row[col.k]),
      ]),
    ),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : null,
  }));
}

export async function findRow(def: ResourceDef, id: string) {
  return delegate(def.model).findUnique({ where: { id } });
}

export async function createRow(def: ResourceDef, data: Record<string, unknown>) {
  return delegate(def.model).create({ data });
}

export async function updateRow(def: ResourceDef, id: string, data: Record<string, unknown>) {
  return delegate(def.model).update({ where: { id }, data });
}

export async function deleteRow(def: ResourceDef, id: string) {
  return delegate(def.model).delete({ where: { id } });
}

export async function setRowStatus(def: ResourceDef, id: string, status: string) {
  return delegate(def.model).update({ where: { id }, data: { status } });
}

// ---------------------------------------------------------------------------
// Relation pickers
// ---------------------------------------------------------------------------

/** Which column reads as the label in a picker, per model. */
const RELATION_LABEL: Record<RelationModel, string> = {
  vehicleCategory: "name",
  articleCategory: "name",
  faqCategory: "name",
  galleryCategory: "name",
  service: "name",
  vehicle: "name",
  destination: "name",
  package: "name",
};

export type RelationOptions = Record<string, Array<{ value: string; label: string }>>;

/**
 * Loads the options for every relation field on a resource, in one pass.
 *
 * Deduplicated by model so a form with four pickers onto four models issues
 * four queries, and one with two pickers onto the same model issues one.
 */
export async function relationOptions(def: ResourceDef): Promise<RelationOptions> {
  const models = new Set<RelationModel>();
  for (const field of allFields(def)) {
    if (field.t === "relation") models.add(field.model);
  }
  if (models.size === 0) return {};

  const entries = await Promise.all(
    [...models].map(async (model) => {
      const labelKey = RELATION_LABEL[model];
      const rows = await delegate(model).findMany({ orderBy: { [labelKey]: "asc" } });
      return [
        model,
        rows.map((row) => ({
          value: String(row.id),
          label: String(row[labelKey] ?? "").trim() || "(untitled)",
        })),
      ] as const;
    }),
  );

  return Object.fromEntries(entries);
}
