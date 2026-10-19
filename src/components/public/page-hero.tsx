import Image from "next/image";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "./breadcrumbs";
import type { Crumb } from "@/lib/seo";

/**
 * Hero for listing, detail and informational pages.
 *
 * Distinct from the homepage hero (`HomeHero`): shorter, with breadcrumbs, a
 * measured intro column and an optional facts rail — so a fleet page and the
 * homepage never read as the same template.
 */
export function PageHero({
  eyebrow,
  title,
  intro,
  image,
  imageAlt,
  crumbs,
  facts,
  actions,
  size = "default",
  priority = false,
}: {
  eyebrow?: string | null;
  title: string;
  intro?: string | null;
  image?: string | null;
  imageAlt?: string | null;
  crumbs?: Crumb[];
  facts?: Array<{ label: string; value: string }>;
  actions?: React.ReactNode;
  size?: "default" | "compact" | "tall";
  /** Set on the first hero of a page so the LCP image is not lazy-loaded. */
  priority?: boolean;
}) {
  const hasImage = Boolean(image);

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden bg-ink",
        size === "compact" && "pt-32 pb-14 lg:pt-40 lg:pb-16",
        size === "default" && "pt-32 pb-16 lg:pt-44 lg:pb-24",
        size === "tall" && "pt-36 pb-20 lg:pt-52 lg:pb-32",
      )}
    >
      {hasImage ? (
        <div className="scrim-even absolute inset-0 -z-10">
          <Image
            src={image!}
            alt={imageAlt || ""}
            fill
            priority={priority}
            sizes="100vw"
            className="object-cover"
            // Decorative: the heading already names the subject.
            aria-hidden={imageAlt ? undefined : true}
          />
        </div>
      ) : (
        <div
          className="absolute inset-0 -z-10"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(120% 90% at 15% 0%, #1b1f25 0%, #0a0b0d 62%), linear-gradient(180deg, #101317 0%, #0a0b0d 100%)",
          }}
        />
      )}

      <div className="shell">
        {crumbs && crumbs.length > 1 ? (
          <div className="mb-8">
            <Breadcrumbs crumbs={crumbs} tone="dark" />
          </div>
        ) : null}

        <div className="max-w-3xl">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1
            className={cn(
              "mt-5 text-on-dark",
              size === "compact" ? "text-display-3" : "text-display-2",
            )}
          >
            {title}
          </h1>
          {intro ? <p className="lede mt-6 max-w-2xl">{intro}</p> : null}
          {actions ? <div className="mt-9 flex flex-wrap items-center gap-3">{actions}</div> : null}
        </div>

        {facts && facts.length > 0 ? (
          <dl className="border-charcoal-line mt-14 grid grid-cols-2 gap-x-8 gap-y-7 border-t pt-8 sm:grid-cols-3 lg:mt-16 lg:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-on-dark-faint text-micro tracking-[0.16em] uppercase">
                  {fact.label}
                </dt>
                <dd className="font-display text-on-dark mt-2 text-title">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}
