import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Link-based pagination: every page is a real, crawlable URL with no client
 * JavaScript involved.
 */
export function Pagination({
  basePath,
  current,
  totalPages,
  tone = "light",
}: {
  basePath: string;
  current: number;
  totalPages: number;
  tone?: "light" | "dark";
}) {
  if (totalPages <= 1) return null;

  const href = (n: number) => (n === 1 ? basePath : `${basePath}?page=${n}`);
  const border = tone === "light" ? "border-ivory-line" : "border-charcoal-line";
  const hover = tone === "light" ? "hover:border-gold-dim" : "hover:border-gold";
  const activeStyle =
    tone === "light" ? "border-ink bg-ink text-on-dark" : "border-gold bg-gold text-ink";

  return (
    <nav aria-label="Pagination" className={cn("mt-16 border-t pt-8", border)}>
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          <Link
            href={href(Math.max(1, current - 1))}
            aria-disabled={current === 1}
            tabIndex={current === 1 ? -1 : undefined}
            className={cn(
              "inline-flex min-h-10 items-center rounded-sm border px-4 text-small transition-colors",
              border,
              current === 1 ? "pointer-events-none opacity-45" : hover,
            )}
          >
            Previous
          </Link>
        </li>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            <Link
              href={href(n)}
              aria-current={n === current ? "page" : undefined}
              aria-label={`Page ${n}`}
              className={cn(
                "tabular inline-flex h-10 min-w-10 items-center justify-center rounded-sm border px-3 text-small transition-colors",
                n === current ? activeStyle : cn(border, hover),
              )}
            >
              {n}
            </Link>
          </li>
        ))}

        <li>
          <Link
            href={href(Math.min(totalPages, current + 1))}
            aria-disabled={current === totalPages}
            tabIndex={current === totalPages ? -1 : undefined}
            className={cn(
              "inline-flex min-h-10 items-center rounded-sm border px-4 text-small transition-colors",
              border,
              current === totalPages ? "pointer-events-none opacity-45" : hover,
            )}
          >
            Next
          </Link>
        </li>
      </ul>
    </nav>
  );
}
