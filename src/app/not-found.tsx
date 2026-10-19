import Link from "next/link";
import { ArrowRight } from "lucide-react";
import "./globals.css";

/**
 * Root 404.
 *
 * This renders outside the (public) layout, so it carries its own minimal
 * chrome. It offers real routes rather than a dead end — a 404 is a navigation
 * problem, and the useful response is a way onward.
 */
const LINKS = [
  { label: "Our fleet", href: "/fleet", detail: "Vans and coaches, 9 to 35 seats" },
  { label: "Services", href: "/services", detail: "Weddings, corporate, airport and tours" },
  { label: "Outstation routes", href: "/outstation", detail: "Day trips and multi-day journeys" },
  { label: "Contact", href: "/contact", detail: "Request a written quote" },
];

export default function NotFound() {
  return (
    <main className="tone-ink flex min-h-screen items-center py-24">
      <div className="shell">
        <p className="eyebrow">Error 404</p>
        <h1 className="text-display-2 mt-6 max-w-3xl">
          We could not find that page.
        </h1>
        <p className="lede mt-6 max-w-xl">
          The link may be out of date, or the page may have moved. Here is where most people are
          heading.
        </p>

        <ul className="border-charcoal-line mt-14 grid gap-px border-t sm:grid-cols-2">
          {LINKS.map((link) => (
            <li key={link.href} className="border-charcoal-line border-b">
              <Link
                href={link.href}
                className="group hover:bg-charcoal flex items-center justify-between gap-6 py-6 transition-colors sm:px-2"
              >
                <span>
                  <span className="font-display block text-title">{link.label}</span>
                  <span className="text-on-dark-muted mt-1 block text-small">{link.detail}</span>
                </span>
                <ArrowRight
                  size={18}
                  aria-hidden="true"
                  className="text-gold shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </li>
          ))}
        </ul>

        <Link href="/" className="btn btn-gold mt-12">
          Back to the homepage
        </Link>
      </div>
    </main>
  );
}
