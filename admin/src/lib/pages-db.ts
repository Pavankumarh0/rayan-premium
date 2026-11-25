import "server-only";

import { db } from "./db";
import { getSectionDef, isRepeater, parseSectionData, SECTION_DEFS } from "./sections";

/**
 * Reads and writes for the page and section editors.
 *
 * Sections are ordered by an integer `sortOrder` that is renumbered from zero
 * on every structural change. Leaving gaps would work, but gaps accumulate
 * until two sections share a number and the order turns on whatever the
 * database returns first.
 */

export type PageRow = {
  id: string;
  slug: string;
  title: string;
  template: string;
  isSystem: boolean;
  status: string;
  sortOrder: number;
  sectionCount: number;
  hiddenCount: number;
  updatedAt: Date;
};

export async function listPages(): Promise<PageRow[]> {
  const rows = await db.page.findMany({
    orderBy: [{ isSystem: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      template: true,
      isSystem: true,
      status: true,
      sortOrder: true,
      updatedAt: true,
      sections: { select: { isVisible: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    template: row.template,
    isSystem: row.isSystem,
    status: row.status,
    sortOrder: row.sortOrder,
    sectionCount: row.sections.length,
    hiddenCount: row.sections.filter((s) => !s.isVisible).length,
    updatedAt: row.updatedAt,
  }));
}

export async function findPage(id: string) {
  return db.page.findUnique({
    where: { id },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function findSection(id: string) {
  return db.section.findUnique({
    where: { id },
    include: { page: { select: { id: true, title: true, slug: true } } },
  });
}

/**
 * A one-line summary of what a section actually says, for the list.
 *
 * Without it every row reads "Hero", "Image and text", "Image and text" and
 * an editor has to open each one to find the paragraph they meant to change.
 * Falls back through the fields most likely to carry the visible words.
 */
export function describeSection(type: string, rawData: string): string {
  const def = getSectionDef(type);
  if (!def) return "";

  const data = parseSectionData(type, rawData);
  for (const key of ["heading", "title", "eyebrow", "body", "intro", "label"]) {
    const value = data[key];
    if (typeof value === "string" && value.trim().length > 0) {
      const text = value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text.length > 0) return text.length > 90 ? `${text.slice(0, 90)}…` : text;
    }
  }

  // Nothing headline-ish: say how much is in it instead of nothing at all.
  for (const field of def.fields) {
    if (isRepeater(field)) {
      const items = data[field.name];
      if (Array.isArray(items) && items.length > 0) {
        return `${items.length} ${items.length === 1 ? "item" : "items"}`;
      }
    }
  }
  return "";
}

/** The "add a section" picker, grouped as the registry declares. */
export function sectionChoices() {
  const groups = new Map<string, Array<{ type: string; label: string; description: string }>>();
  for (const def of SECTION_DEFS) {
    const list = groups.get(def.group) ?? [];
    list.push({ type: def.type, label: def.label, description: def.description });
    groups.set(def.group, list);
  }
  return [...groups.entries()].map(([group, items]) => ({ group, items }));
}

// ---------------------------------------------------------------------------
// Ordering
// ---------------------------------------------------------------------------

/** Renumber a page's sections 0..n-1 in their current order. */
async function renumber(pageId: string): Promise<void> {
  const rows = await db.section.findMany({
    where: { pageId },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  // Sequential rather than parallel: the pool holds one connection on
  // serverless, so firing these at once only queues them.
  for (const [index, row] of rows.entries()) {
    await db.section.update({ where: { id: row.id }, data: { sortOrder: index } });
  }
}

export async function moveSection(sectionId: string, direction: -1 | 1): Promise<void> {
  const section = await db.section.findUnique({
    where: { id: sectionId },
    select: { id: true, pageId: true, sortOrder: true },
  });
  if (!section) return;

  const neighbour = await db.section.findFirst({
    where: {
      pageId: section.pageId,
      sortOrder: direction === -1 ? { lt: section.sortOrder } : { gt: section.sortOrder },
    },
    orderBy: { sortOrder: direction === -1 ? "desc" : "asc" },
    select: { id: true, sortOrder: true },
  });
  if (!neighbour) return;

  // Swap through a free slot: sortOrder has no unique constraint, but going
  // via -1 keeps the pair from colliding if one update fails.
  await db.section.update({ where: { id: section.id }, data: { sortOrder: -1 } });
  await db.section.update({ where: { id: neighbour.id }, data: { sortOrder: section.sortOrder } });
  await db.section.update({ where: { id: section.id }, data: { sortOrder: neighbour.sortOrder } });
}

export async function addSection(pageId: string, type: string): Promise<string | null> {
  if (!getSectionDef(type)) return null;

  const last = await db.section.findFirst({
    where: { pageId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const created = await db.section.create({
    data: {
      pageId,
      type,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      isVisible: true,
      // Starts from the type's own defaults, so a new section renders
      // immediately rather than as an empty band.
      data: JSON.stringify(sectionDefaultsFor(type)),
    },
    select: { id: true },
  });
  return created.id;
}

function sectionDefaultsFor(type: string): Record<string, unknown> {
  return parseSectionData(type, null);
}

export async function deleteSection(sectionId: string): Promise<string | null> {
  const section = await db.section.findUnique({
    where: { id: sectionId },
    select: { pageId: true },
  });
  if (!section) return null;

  await db.section.delete({ where: { id: sectionId } });
  await renumber(section.pageId);
  return section.pageId;
}

export async function toggleSectionVisibility(sectionId: string): Promise<void> {
  const section = await db.section.findUnique({
    where: { id: sectionId },
    select: { isVisible: true },
  });
  if (!section) return;
  await db.section.update({
    where: { id: sectionId },
    data: { isVisible: !section.isVisible },
  });
}
