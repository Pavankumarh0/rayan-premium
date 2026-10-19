import { Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TestimonialItem } from "@/lib/content";

/**
 * Testimonials.
 *
 * Returns null when there is nothing verified to show — the brief requires the
 * section to stay hidden until the client supplies real testimonials, and
 * `listTestimonials` only ever returns published + verified rows. No rating
 * aggregate is emitted as structured data, because self-published review
 * markup is not eligible for rich results.
 */
export function Testimonials({
  items,
  tone = "dark",
}: {
  items: TestimonialItem[];
  tone?: "light" | "dark";
}) {
  if (items.length === 0) return null;

  return (
    <ul
      className={cn(
        "grid gap-px",
        items.length === 1 ? "max-w-3xl" : "sm:grid-cols-2 lg:grid-cols-3",
        tone === "light" ? "bg-ivory-line" : "bg-charcoal-line",
        "overflow-hidden rounded-md",
      )}
    >
      {items.map((item) => (
        <li
          key={item.id}
          className={cn("flex flex-col p-7 lg:p-8", tone === "light" ? "bg-paper" : "bg-ink-raised")}
        >
          <Quote
            size={22}
            strokeWidth={1.5}
            aria-hidden="true"
            className={cn("shrink-0", tone === "light" ? "text-gold-dim" : "text-gold")}
          />

          {item.rating ? (
            <p className="mt-5 flex items-center gap-0.5">
              <span className="sr-only">{item.rating} out of 5</span>
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  size={13}
                  aria-hidden="true"
                  className={cn(
                    index < item.rating! ? "text-gold fill-gold" : "text-on-light-faint/40",
                  )}
                />
              ))}
            </p>
          ) : null}

          <blockquote className="mt-5 flex-1">
            <p className="font-display text-title leading-[1.45]">“{item.quote}”</p>
          </blockquote>

          <footer
            className={cn(
              "mt-7 border-t pt-5",
              tone === "light" ? "border-ivory-line" : "border-charcoal-line",
            )}
          >
            <p className="text-small font-medium">{item.authorName}</p>
            {item.authorRole ? (
              <p
                className={cn(
                  "mt-0.5 text-micro",
                  tone === "light" ? "text-on-light-faint" : "text-on-dark-faint",
                )}
              >
                {item.authorRole}
              </p>
            ) : null}
          </footer>
        </li>
      ))}
    </ul>
  );
}
