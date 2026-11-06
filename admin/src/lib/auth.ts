import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifySession,
  type SessionPayload,
} from "./session";

/**
 * Admin authentication.
 *
 * Mirrors the public app's session format but redirects to this app's own
 * routes — the dashboard is deployed on its own domain, so login lives at `/`
 * rather than `/admin/login`.
 */

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR";
};

export async function createSessionCookie(user: AdminUser): Promise<void> {
  const token = await signSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

async function readSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

/**
 * Data Access Layer entry point. The cookie alone is never trusted: the user
 * is re-read from the database on every request, so deactivating or deleting
 * an account revokes access immediately rather than at session expiry.
 */
export async function getCurrentUser(): Promise<AdminUser | null> {
  const session = await readSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role === "ADMIN" ? "ADMIN" : "EDITOR",
  };
}

export async function requireUser(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Settings, users, navigation and redirects are administrator-only. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/?denied=1");
  return user;
}

export function isAdmin(user: AdminUser | null): boolean {
  return user?.role === "ADMIN";
}

/** True when no account exists yet, so the app can offer first-run setup. */
export async function needsInitialSetup(): Promise<boolean> {
  return (await db.user.count()) === 0;
}
