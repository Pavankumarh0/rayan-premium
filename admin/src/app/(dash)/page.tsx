import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Inbox, ShieldAlert } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings, missingLaunchSettings, settingBool } from "@/lib/settings";
import { formatDateTime } from "@/lib/utils";
import { PageHeader, StatCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const { denied } = await searchParams;

  const [
    settings,
    newEnquiries,
    totalEnquiries,
    recentEnquiries,
    pages,
    vehicles,
    services,
    destinations,
    packages,
    articles,
    faqs,
    gallery,
    testimonialsLive,
  ] = await Promise.all([
    getSettings(),
    db.enquiry.count({ where: { status: "NEW" } }),
    db.enquiry.count(),
    db.enquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, subject: true, status: true, createdAt: true },
    }),
    db.page.count({ where: { status: "PUBLISHED" } }),
    db.vehicle.count({ where: { status: "PUBLISHED" } }),
    db.service.count({ where: { status: "PUBLISHED" } }),
    db.destination.count({ where: { status: "PUBLISHED" } }),
    db.package.count({ where: { status: "PUBLISHED" } }),
    db.article.count({ where: { status: "PUBLISHED" } }),
    db.faq.count({ where: { status: "PUBLISHED" } }),
    db.galleryItem.count({ where: { status: "PUBLISHED" } }),
    db.testimonial.count({ where: { status: "PUBLISHED", isVerified: true } }),
  ]);

  const missing = missingLaunchSettings(settings);
  const indexingBlocked = settingBool(settings, "seo.robotsPolicy");

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Everything on the public website is edited from here."
      />

      {denied ? (
        <p className="notice notice-warn mb-5" role="status">
          <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          That area is restricted to administrators.
        </p>
      ) : null}

      {/* Launch blockers first: these are the things that keep the site from
          being publishable, so they outrank the counts. */}
      {indexingBlocked || missing.length > 0 ? (
        <div className="card card-pad mb-5">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <AlertTriangle size={16} className="text-warn" aria-hidden="true" />
            Before launch
          </h2>
          <ul className="mt-3 grid gap-2">
            {indexingBlocked ? (
              <li className="flex items-start justify-between gap-4 text-sm">
                <span>
                  <strong className="font-medium">Search engines are blocked.</strong>{" "}
                  <span className="text-ink-muted">
                    The whole site is set to noindex and the sitemap is empty. Turn this off when
                    you are ready to be found.
                  </span>
                </span>
                <Link href="/settings#seo" className="btn btn-secondary btn-sm shrink-0">
                  Fix
                </Link>
              </li>
            ) : null}

            {missing.map((def) => (
              <li key={def.key} className="flex items-start justify-between gap-4 text-sm">
                <span>
                  <strong className="font-medium">{def.label} is empty.</strong>{" "}
                  <span className="text-ink-muted">{def.help}</span>
                </span>
                <Link
                  href={`/settings#${def.group}`}
                  className="btn btn-secondary btn-sm shrink-0"
                >
                  Fix
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="notice notice-ok mb-5">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          Contact details are filled in and the site is open to search engines.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="New enquiries"
          value={newEnquiries}
          href="/enquiries?status=NEW"
          hint={`${totalEnquiries} in total`}
        />
        <StatCard label="Published pages" value={pages} href="/pages" />
        <StatCard label="Vehicles" value={vehicles} href="/fleet" />
        <StatCard label="Services" value={services} href="/services" />
        <StatCard label="Destinations" value={destinations} href="/destinations" />
        <StatCard label="Packages" value={packages} href="/packages" />
        <StatCard label="Travel guides" value={articles} href="/articles" />
        <StatCard label="FAQs" value={faqs} href="/faqs" />
        <StatCard label="Gallery images" value={gallery} href="/gallery" />
        <StatCard
          label="Testimonials live"
          value={testimonialsLive}
          href="/testimonials"
          hint={testimonialsLive === 0 ? "Section hidden until one is verified" : undefined}
        />
      </div>

      <div className="card mt-5">
        <div className="border-line flex items-center justify-between border-b px-4 py-3">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Inbox size={16} aria-hidden="true" />
            Latest enquiries
          </h2>
          <Link href="/enquiries" className="btn btn-ghost btn-sm">
            View all
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>

        {recentEnquiries.length === 0 ? (
          <p className="text-ink-muted px-4 py-8 text-center text-sm">
            No enquiries yet. They will appear here as soon as the form is used.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {recentEnquiries.map((enquiry) => (
                <tr key={enquiry.id}>
                  <td>
                    <Link href={`/enquiries/${enquiry.id}`} className="font-medium hover:underline">
                      {enquiry.name}
                    </Link>
                  </td>
                  <td className="text-ink-muted">{enquiry.subject ?? "—"}</td>
                  <td>
                    <span
                      className={`badge ${enquiry.status === "NEW" ? "badge-info" : "badge-muted"}`}
                    >
                      {enquiry.status.replace("_", " ").toLowerCase()}
                    </span>
                  </td>
                  <td className="text-ink-faint whitespace-nowrap">
                    {formatDateTime(enquiry.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
