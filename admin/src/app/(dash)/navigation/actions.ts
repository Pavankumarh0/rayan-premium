"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { navItemSchema, parseForm } from "@/lib/validation";
import { fail, invalid, ok, type FormState } from "@/lib/form-state";

/**
 * Menu items. Administrator-only: navigation decides what the whole site
 * looks like it offers, which is a different kind of change from editing a
 * paragraph.
 */

export async function saveNavItem(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const idRaw = formData.get("id");
  const id = typeof idRaw === "string" && idRaw.length > 0 ? idRaw : null;

  const parsed = parseForm(navItemSchema, formData);
  if (!parsed.success) return invalid(parsed.errors);

  const data = { ...parsed.data } as Record<string, unknown>;

  // A child belongs to the same menu as its parent, and cannot be its own
  // parent. Both are cheap to get wrong from a form and confusing to debug.
  const parentId = typeof data.parentId === "string" ? data.parentId : null;
  if (parentId) {
    if (parentId === id) {
      return fail("An item cannot sit inside itself.", {
        parentId: "Choose a different parent, or none.",
      });
    }
    const parent = await db.navItem.findUnique({
      where: { id: parentId },
      select: { menu: true, parentId: true },
    });
    if (!parent) return fail("That parent item no longer exists.");
    if (parent.parentId) {
      return fail("Menus are only one level deep.", {
        parentId: "That item is already inside another one.",
      });
    }
    data.menu = parent.menu;
  }
  data.parentId = parentId;

  try {
    if (id) {
      await db.navItem.update({ where: { id }, data });
    } else {
      const last = await db.navItem.findFirst({
        where: { menu: data.menu as string, parentId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      const created = await db.navItem.create({
        data: { ...data, sortOrder: (last?.sortOrder ?? -1) + 1 } as never,
        select: { id: true },
      });
      revalidatePath("/navigation");
      redirect(`/navigation/${created.id}?created=1`);
    }
  } catch (error) {
    const detail =
      error instanceof Error ? (error.message.split(/\r?\n/)[0] ?? error.message) : "Unknown error";
    return fail(`Could not save: ${detail}`);
  }

  revalidatePath("/navigation");
  return ok("Saved. The website updates immediately.");
}

export async function moveNavItem(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id");
  const direction = formData.get("direction");
  if (typeof id !== "string") return;

  const item = await db.navItem.findUnique({
    where: { id },
    select: { menu: true, parentId: true, sortOrder: true },
  });
  if (!item) return;

  const up = direction === "up";
  const neighbour = await db.navItem.findFirst({
    where: {
      menu: item.menu,
      parentId: item.parentId,
      sortOrder: up ? { lt: item.sortOrder } : { gt: item.sortOrder },
    },
    orderBy: { sortOrder: up ? "desc" : "asc" },
    select: { id: true, sortOrder: true },
  });
  if (!neighbour) return;

  // Via a free slot, so a failure mid-swap cannot leave two items sharing a
  // position and the order turning on whatever the database returns first.
  await db.navItem.update({ where: { id }, data: { sortOrder: -1 } });
  await db.navItem.update({ where: { id: neighbour.id }, data: { sortOrder: item.sortOrder } });
  await db.navItem.update({ where: { id }, data: { sortOrder: neighbour.sortOrder } });

  revalidatePath("/navigation");
}

export async function toggleNavItem(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const item = await db.navItem.findUnique({ where: { id }, select: { isVisible: true } });
  if (!item) return;

  await db.navItem.update({ where: { id }, data: { isVisible: !item.isVisible } });
  revalidatePath("/navigation");
}

export async function deleteNavItem(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  // Children cascade in the schema, so say how many are going with it.
  await db.navItem.delete({ where: { id } });
  revalidatePath("/navigation");
  redirect("/navigation?deleted=1");
}
