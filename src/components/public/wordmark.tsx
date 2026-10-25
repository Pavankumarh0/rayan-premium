import { cn } from "@/lib/utils";

/**
 * Typographic wordmark used until the client supplies a logo file.
 *
 * It is deliberately an original letterform treatment — a serif first word
 * with a brand hairline and a tracked-out sans descriptor — rather than any
 * existing brand's mark.
 */
export function Wordmark({
  name,
  shortName,
  className,
  tone = "dark",
}: {
  name: string;
  shortName?: string;
  className?: string;
  tone?: "dark" | "light";
}) {
  const words = name.trim().split(/\s+/);
  const lead = words[0] ?? name;
  const rest = words.slice(1).join(" ");

  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-display text-[1.35rem] tracking-[-0.02em] lg:text-[1.6rem]",
            tone === "dark" ? "text-on-dark" : "text-on-light",
          )}
        >
          {lead}
        </span>
        {rest ? (
          <span
            className={cn(
              "font-display text-[1.35rem] tracking-[-0.02em] italic lg:text-[1.6rem]",
              tone === "dark" ? "text-brand-bright" : "text-brand-dim",
            )}
          >
            {rest.split(" ")[0]}
          </span>
        ) : null}
      </span>

      <span className="mt-1 flex items-center gap-1.5">
        <span
          className={cn("h-px w-4", tone === "dark" ? "bg-brand-bright" : "bg-brand-dim")}
          aria-hidden="true"
        />
        <span
          className={cn(
            "text-[0.5rem] font-medium tracking-[0.3em] uppercase lg:text-[0.5625rem]",
            tone === "dark" ? "text-on-dark-faint" : "text-on-light-faint",
          )}
        >
          {rest.split(" ").slice(1).join(" ") || shortName || "Chauffeur drive"}
        </span>
      </span>
    </span>
  );
}
