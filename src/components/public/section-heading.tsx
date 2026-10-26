import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The standard section opener: eyebrow, heading, intro and an optional link.
 *
 * Centralised so every section across the site shares one rhythm — editors
 * cannot accidentally produce three different heading treatments on one page.
 */
export function SectionHeading({
  eyebrow,
  heading,
  intro,
  ctaLabel,
  ctaUrl,
  align = "left",
  level = 2,
  className,
}: {
  eyebrow?: string | null;
  heading?: string | null;
  intro?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  align?: "left" | "center" | "split";
  level?: 1 | 2 | 3;
  className?: string;
}) {
  if (!eyebrow && !heading && !intro) return null;
  const Heading = `h${level}` as "h1" | "h2" | "h3";
  const hasCta = Boolean(ctaLabel && ctaUrl);

  const headingBlock = (
    <div data-reveal className={cn(align === "center" && "mx-auto text-center", "max-w-3xl")}>
      {eyebrow ? <p className={cn("eyebrow", align === "center" && "eyebrow-plain")}>{eyebrow}</p> : null}
      {heading ? (
        <Heading className={cn("text-display-3", eyebrow && "mt-5")}>{heading}</Heading>
      ) : null}
      {intro ? <p className={cn("lede mt-5 max-w-2xl", align === "center" && "mx-auto")}>{intro}</p> : null}
    </div>
  );

  if (align === "split" && hasCta) {
    return (
      <div className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}>
        {headingBlock}
        <Link href={ctaUrl!} className="link-arrow shrink-0 md:pb-2">
          {ctaLabel}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className={className}>
      {headingBlock}
      {hasCta ? (
        <Link
          href={ctaUrl!}
          className={cn("link-arrow mt-7", align === "center" && "mx-auto flex w-fit")}
        >
          {ctaLabel}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
