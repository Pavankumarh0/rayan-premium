import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ExternalLink, Info } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings, settingBool, settingText } from "@/lib/settings";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "SEO" };
export const dynamic = "force-dynamic";

/**
 * A standing check of the things that quietly stop a site being found.
 *
 * Deliberately not a second copy of Settings → SEO. The values live there;
 * this answers the question that form cannot — whether what is set actually
 * adds up, and which pages are missing the parts search engines read.
 */

type Check = {
  label: string;
  state: "ok" | "warn" | "info";
  detail: string;
  fix?: { label: string; href: string };
};

export default async function SeoPage() {
  await requireAdmin();

  const settings = await getSettings();
  const siteUrl = settingText(settings, "seo.siteUrl");
  const blocked = settingBool(settings, "seo.robotsPolicy");

  const [vehicles, services, destinations, articles, packages, pages] = await Promise.all([
    db.vehicle.findMany({ where: { status: "PUBLISHED" }, select: { name: true, slug: true, metaDescription: true } }),
    db.service.findMany({ where: { status: "PUBLISHED" }, select: { name: true, slug: true, metaDescription: true } }),
    db.destination.findMany({ where: { status: "PUBLISHED" }, select: { name: true, slug: true, metaDescription: true } }),
    db.article.findMany({ where: { status: "PUBLISHED" }, select: { title: true, slug: true, metaDescription: true } }),
    db.package.findMany({ where: { status: "PUBLISHED" }, select: { name: true, slug: true, metaDescription: true } }),
    db.page.findMany({ where: { status: "PUBLISHED" }, select: { title: true, slug: true, metaDescription: true } }),
  ]);

  const everything = [
    ...vehicles.map((r) => ({ name: r.name, where: `/fleet/${r.slug}`, meta: r.metaDescription })),
    ...services.map((r) => ({ name: r.name, where: `/services/${r.slug}`, meta: r.metaDescription })),
    ...destinations.map((r) => ({ name: r.name, where: `/outstation/${r.slug}`, meta: r.metaDescription })),
    ...packages.map((r) => ({ name: r.name, where: `/packages/${r.slug}`, meta: r.metaDescription })),
    ...articles.map((r) => ({ name: r.title, where: `/guides/${r.slug}`, meta: r.metaDescription })),
    ...pages.map((r) => ({ name: r.title, where: `/${r.slug === "home" ? "" : r.slug}`, meta: r.metaDescription })),
  ];

  const missing = everything.filter((r) => !r.meta || r.meta.trim().length === 0);

  const looksLocal = /localhost|127\.0\.0\.1/.test(siteUrl);
  const checks: Check[] = [
    {
      label: "Search engines",
      state: blocked ? "warn" : "ok",
      detail: blocked
        ? "Blocked. robots.txt tells every crawler to stay out, so nothing on this site can appear in search results."
        : "Allowed. robots.txt lets crawlers in and the sitemap lists every published page.",
      fix: blocked ? { label: "Settings → SEO", href: "/settings#seo" } : undefined,
    },
    {
      label: "Canonical site address",
      state: !siteUrl ? "warn" : looksLocal ? "warn" : "ok",
      detail: !siteUrl
        ? "Not set. Canonical tags, share links and the sitemap have no address to use."
        : looksLocal
          ? `Set to ${siteUrl}, which is a local address. Every page is telling search engines it lives on localhost.`
          : `${siteUrl} — used for canonical tags, share links and the sitemap.`,
      fix: !siteUrl || looksLocal ? { label: "Settings → SEO", href: "/settings#seo" } : undefined,
    },
    {
      label: "Business details for local search",
      state: settingBool(settings, "seo.enableLocalBusiness") ? "ok" : "info",
      detail: settingBool(settings, "seo.enableLocalBusiness")
        ? "Published. The name, address, phone and opening hours are offered to search engines as structured data."
        : "Off. Turn this on once the address and phone in Settings are confirmed accurate — it is what puts a business into local results and map listings.",
      fix: settingBool(settings, "seo.enableLocalBusiness")
        ? undefined
        : { label: "Settings → SEO", href: "/settings#seo" },
    },
    {
      label: "Google Search Console",
      state: settingText(settings, "seo.googleSiteVerification") ? "ok" : "info",
      detail: settingText(settings, "seo.googleSiteVerification")
        ? "Verified. You can see what Google has indexed and what it could not reach."
        : "Not connected. Without it there is no way to see which pages Google has indexed, or why one was skipped.",
      fix: settingText(settings, "seo.googleSiteVerification")
        ? undefined
        : { label: "Settings → SEO", href: "/settings#seo" },
    },
    {
      label: "Analytics",
      state: settingText(settings, "seo.gaMeasurementId") ? "ok" : "info",
      detail: settingText(settings, "seo.gaMeasurementId")
        ? "Google Analytics is loaded on every page."
        : "Not set. Nothing is recording how many people visit or which pages they read.",
      fix: settingText(settings, "seo.gaMeasurementId")
        ? undefined
        : { label: "Settings → SEO", href: "/settings#seo" },
    },
    {
      label: "Default share image",
      state: settingText(settings, "seo.defaultOgImage") ? "ok" : "warn",
      detail: settingText(settings, "seo.defaultOgImage")
        ? "Set. A page without its own image still previews with a picture when shared."
        : "Not set. Links shared on WhatsApp or social media will show no picture.",
      fix: settingText(settings, "seo.defaultOgImage")
        ? undefined
        : { label: "Settings → SEO", href: "/settings#seo" },
    },
  ];

  const problems = checks.filter((c) => c.state === "warn").length;

  return (
    <>
      <PageHeader
        title="SEO"
        description="Whether this site can be found, and what is missing. The values themselves live in Settings → SEO."
        actions={
          siteUrl && !looksLocal ? (
            <a
              href={`${siteUrl}/sitemap.xml`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              <ExternalLink size={14} aria-hidden="true" />
              View sitemap
            </a>
          ) : null
        }
      />

      <p
        className={`notice mb-5 ${problems === 0 ? "notice-ok" : "notice-warn"}`}
        role="status"
      >
        {problems === 0 ? (
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        ) : (
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        )}
        {problems === 0
          ? "Nothing is blocking this site from being found."
          : `${problems} ${problems === 1 ? "thing is" : "things are"} holding this site back from search.`}
      </p>

      <section className="card mb-5 overflow-x-auto">
        <table className="table">
          <tbody>
            {checks.map((check) => (
              <tr key={check.label}>
                <td className="w-8 align-top">
                  {check.state === "ok" ? (
                    <CheckCircle2 size={16} className="text-ok mt-0.5" aria-label="Fine" />
                  ) : check.state === "warn" ? (
                    <AlertCircle size={16} className="text-danger mt-0.5" aria-label="Problem" />
                  ) : (
                    <Info size={16} className="text-ink-faint mt-0.5" aria-label="Suggestion" />
                  )}
                </td>
                <td>
                  <p className="font-medium">{check.label}</p>
                  <p className="text-ink-muted mt-0.5 text-sm">{check.detail}</p>
                </td>
                <td className="w-36 text-right align-middle">
                  {check.fix ? (
                    <Link href={check.fix.href} className="btn btn-secondary btn-sm">
                      {check.fix.label}
                    </Link>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card card-pad">
        <h2 className="text-base">Meta descriptions</h2>
        <p className="text-ink-faint mb-4 text-sm">
          The sentence under a result in Google. Without one, Google writes its own from whatever
          it finds on the page.
        </p>

        {missing.length === 0 ? (
          <p className="notice notice-ok">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            All {everything.length} published pages have one.
          </p>
        ) : (
          <>
            <p className="text-ink-muted mb-3 text-sm">
              {missing.length} of {everything.length} published pages have none.
            </p>
            <ul className="grid gap-1.5">
              {missing.slice(0, 20).map((row) => (
                <li
                  key={row.where}
                  className="border-line bg-surface flex items-center justify-between gap-3 rounded-md border p-2.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{row.name}</span>
                    <span className="text-ink-faint block truncate text-xs">{row.where}</span>
                  </span>
                </li>
              ))}
            </ul>
            {missing.length > 20 ? (
              <p className="text-ink-faint mt-3 text-sm">
                …and {missing.length - 20} more.
              </p>
            ) : null}
          </>
        )}
      </section>
    </>
  );
}
