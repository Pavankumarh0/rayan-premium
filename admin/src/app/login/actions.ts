"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSessionCookie, destroySessionCookie } from "@/lib/auth";
import { verifyPasswordConstantTime, hashPassword } from "@/lib/password";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { hashIp } from "@/lib/password";
import { loginSchema, parseForm, userCreateSchema } from "@/lib/validation";
import type { LoginState } from "./state";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = parseForm(loginSchema, formData);
  const email = String(formData.get("email") ?? "");

  if (!parsed.success) {
    return { status: "error", message: "Enter your email address and password.", email };
  }

  // Two buckets: one per account and one per IP. The first stops a single
  // account being ground down; the second stops one client spraying many
  // addresses. Both are needed.
  const ip = await clientIp();
  const [byAccount, byIp] = await Promise.all([
    rateLimit(`login:acct:${parsed.data.email}`, 8, 15 * 60),
    rateLimit(`login:ip:${hashIp(ip)}`, 25, 15 * 60),
  ]);

  if (!byAccount.ok || !byIp.ok) {
    const wait = Math.ceil(Math.max(byAccount.retryAfterSeconds, byIp.retryAfterSeconds) / 60);
    return {
      status: "error",
      message: `Too many sign-in attempts. Try again in ${wait} minute${wait === 1 ? "" : "s"}.`,
      email,
    };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, name: true, role: true, isActive: true, passwordHash: true },
  });

  // Always compare against something, so a missing account and a wrong
  // password take the same time and cannot be told apart.
  const ok = await verifyPasswordConstantTime(parsed.data.password, user?.passwordHash);

  // One message for every failure: never reveal whether the address exists,
  // or that it exists but is deactivated.
  if (!ok || !user || !user.isActive) {
    return { status: "error", message: "Those details were not recognised.", email };
  }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  await createSessionCookie({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role === "ADMIN" ? "ADMIN" : "EDITOR",
  });

  redirect("/");
}

export async function logout(): Promise<void> {
  await destroySessionCookie();
  redirect("/login");
}

/**
 * First-run setup: creates the first administrator when the database has no
 * users at all. It refuses once any account exists, so it cannot be used to
 * add a second one.
 */
export async function createFirstAdmin(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if ((await db.user.count()) > 0) {
    return { status: "error", message: "An account already exists. Sign in instead.", email: "" };
  }

  const parsed = parseForm(userCreateSchema, formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: Object.values(parsed.errors)[0] ?? "Check the form and try again.",
      email: String(formData.get("email") ?? ""),
      errors: parsed.errors,
    };
  }

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      role: "ADMIN",
      isActive: true,
    },
  });

  await createSessionCookie({
    id: user.id,
    email: user.email,
    name: user.name,
    role: "ADMIN",
  });

  redirect("/");
}
