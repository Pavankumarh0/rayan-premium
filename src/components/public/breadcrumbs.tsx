import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Crumb } from "@/lib/seo";

/**
 * Breadcrumb trail. The matching BreadcrumbList JSON-LD is emitted separately
 * by each page via `breadcrumbJsonLd`, from the same crumb array.
 */
export function Breadcrumbs({ crumbs, tone = "dark" }: { crumbs: Crumb[]; tone?: "dark" | "light" }) {
  if (crumbs.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-1.5">
              {index > 0 ? (
                <ChevronRight
                  size={13}
                  aria-hidden="true"
                  className={cn(tone === "dark" ? "text-on-dark-faint" : "text-on-light-faint")}
                />
              ) : null}
              {isLast ? (
                <span
                  aria-current="page"
                  className={cn(
                    "text-micro",
                    tone === "dark" ? "text-on-dark-muted" : "text-on-light-muted",
                  )}
                >
                  {crumb.name}
                </span>
              ) : (
                <Link
                  href={crumb.path}
                  className={cn(
                    "text-micro transition-colors",
                    tone === "dark"
                      ? "text-on-dark-faint hover:text-gold"
                      : "text-on-light-faint hover:text-gold-dim",
                  )}
                >
                  {crumb.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
