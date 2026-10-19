import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeRichText } from "@/lib/sanitize";

/**
 * Built on native <details>/<summary>.
 *
 * This gives correct keyboard behaviour, screen-reader semantics and
 * open/close state for free, works before hydration, and needs no JavaScript —
 * which matters more on a content page than a bespoke ARIA widget would.
 */
export function FaqAccordion({
  items,
  tone = "light",
  headingLevel = 3,
}: {
  items: Array<{ id: string; question: string; answer: string }>;
  tone?: "light" | "dark";
  headingLevel?: 2 | 3 | 4;
}) {
  if (items.length === 0) return null;
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  return (
    <div
      className={cn(
        "border-t",
        tone === "light" ? "border-ivory-line" : "border-charcoal-line",
      )}
    >
      {items.map((item) => (
        <details
          key={item.id}
          name="faq"
          className={cn(
            "group border-b",
            tone === "light" ? "border-ivory-line" : "border-charcoal-line",
          )}
        >
          <summary
            className={cn(
              "flex cursor-pointer list-none items-start justify-between gap-6 py-6 transition-colors",
              "[&::-webkit-details-marker]:hidden",
              tone === "light" ? "hover:text-gold-dim" : "hover:text-gold",
            )}
          >
            <Heading className="font-display text-title">{item.question}</Heading>
            <span
              aria-hidden="true"
              className={cn(
                "mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xs border transition-colors",
                tone === "light"
                  ? "border-ivory-line text-gold-dim"
                  : "border-charcoal-line text-gold",
              )}
            >
              <Plus size={15} strokeWidth={1.75} className="group-open:hidden" />
              <Minus size={15} strokeWidth={1.75} className="hidden group-open:block" />
            </span>
          </summary>

          <div
            className={cn(
              "prose-editorial pb-7 text-small",
              tone === "light" ? "text-on-light-muted" : "text-on-dark-muted",
              "max-w-2xl",
            )}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.answer) }}
          />
        </details>
      ))}
    </div>
  );
}
