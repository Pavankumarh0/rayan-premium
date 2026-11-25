import { notFound, permanentRedirect, redirect } from "next/navigation";
import { findRedirect } from "@/lib/redirects";

/**
 * The last route Next tries.
 *
 * Every real page — including the single-segment `(public)/[slug]` — is more
 * specific than a catch-all, so nothing reaches here that already resolves.
 * That makes it the right place to check for a stored redirect: an old
 * address that no longer matches a page.
 *
 * This replaced an attempt to do the same work from `proxy.ts`. The proxy
 * built but was never registered in the middleware manifest, so it silently
 * never ran — and the convention warns it may be hoisted to a CDN, which
 * rules out the database query anyway. A route needs neither.
 */
export const dynamic = "force-dynamic";

export default async function CatchAll({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  const pathname = `/${path.join("/")}`;

  const moved = await findRedirect(pathname);
  if (moved) {
    if (moved.permanent) permanentRedirect(moved.destination);
    redirect(moved.destination);
  }

  // No rule: fall through to the 404 this would have been anyway.
  notFound();
}
