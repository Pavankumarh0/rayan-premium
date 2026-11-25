"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { parseForm, userCreateSchema, userUpdateSchema } from "@/lib/validation";
import { fail, invalid, ok, type FormState } from "@/lib/form-state";

/**
 * Accounts that can sign in to this dashboard.
 *
 * Two rules are enforced here rather than left to care, because getting
 * either wrong locks somebody out of their own site:
 *
 *  - the last active administrator cannot be demoted, deactivated or deleted;
 *  - you cannot demote, deactivate or delete yourself.
 *
 * The second is narrower than the first but catches the likelier accident:
 * an administrator tidying up their own row.
 */

async function otherActiveAdmins(excludeId: string): Promise<number> {
  return db.user.count({
    where: { role: "ADMIN", isActive: true, id: { not: excludeId } },
  });
}

export async function createUser(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = parseForm(userCreateSchema, formData);
  if (!parsed.success) return invalid(parsed.errors);

  const { password, ...rest } = parsed.data;

  try {
    const created = await db.user.create({
      data: { ...rest, passwordHash: await hashPassword(password) },
      select: { id: true },
    });
    revalidatePath("/users");
    redirect(`/users/${created.id}?created=1`);
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "P2002") {
      return fail("That email address is already in use.", {
        email: "Another account already uses this address.",
      });
    }
    const detail =
      error instanceof Error ? (error.message.split(/\r?\n/)[0] ?? error.message) : "Unknown error";
    return fail(`Could not create the account: ${detail}`);
  }
}

export async function updateUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return fail("Unknown account.");

  const target = await db.user.findUnique({
    where: { id },
    select: { role: true, isActive: true },
  });
  if (!target) return fail("That account no longer exists.");

  const parsed = parseForm(userUpdateSchema, formData);
  if (!parsed.success) return invalid(parsed.errors);

  const { password, ...rest } = parsed.data;
  const losingAdmin = target.role === "ADMIN" && (rest.role !== "ADMIN" || !rest.isActive);

  if (losingAdmin) {
    if (id === me.id) {
      return fail(
        "You cannot remove your own administrator access — ask another administrator to do it.",
      );
    }
    if ((await otherActiveAdmins(id)) === 0) {
      return fail(
        "This is the only active administrator. Promote somebody else first, or nobody will be able to manage the site.",
      );
    }
  }

  try {
    await db.user.update({
      where: { id },
      data: {
        ...rest,
        // Blank means "leave the password alone". Treating it as a new
        // password would clear the account on every unrelated save.
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      },
    });
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "P2002") {
      return fail("That email address is already in use.", {
        email: "Another account already uses this address.",
      });
    }
    const detail =
      error instanceof Error ? (error.message.split(/\r?\n/)[0] ?? error.message) : "Unknown error";
    return fail(`Could not save: ${detail}`);
  }

  revalidatePath("/users");
  revalidatePath(`/users/${id}`);
  return ok(password ? "Saved, and the password was changed." : "Saved.");
}

export async function deleteUser(formData: FormData): Promise<void> {
  const me = await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string") return;
  if (id === me.id) redirect(`/users/${id}?error=self`);

  const target = await db.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) redirect("/users");

  if (target.role === "ADMIN" && (await otherActiveAdmins(id)) === 0) {
    redirect(`/users/${id}?error=lastadmin`);
  }

  await db.user.delete({ where: { id } });
  revalidatePath("/users");
  redirect("/users?deleted=1");
}
