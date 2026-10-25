import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { sList, sText } from "@/lib/sections";
import { ContactButtons } from "./contact-buttons";

/**
 * The homepage hero.
 *
 * Deliberately a different composition from `PageHero`: full viewport height,
 * no breadcrumbs, and a spec rail pinned to the bottom edge so the fold has a
 * horizon line rather than ending on empty space.
 */
export async function HomeHero({
  data,
  priority,
}: {
  data: Record<string, unknown>;
  priority: boolean;
}) {
  const image = sText(data, "image");
  const eyebrow = sText(data, "eyebrow");
  const heading = sText(data, "heading");
  const body = sText(data, "body");
  const centred = sText(data, "align") === "center";
  const stats = sList<{ label: string; value: string }>(data, "stats");

  const primaryLabel = sText(data, "primaryLabel");
  const primaryUrl = sText(data, "primaryUrl");
  const secondaryLabel = sText(data, "secondaryLabel");
  const secondaryUrl = sText(data, "secondaryUrl");

  return (
    <section className="bg-ink relative isolate flex min-h-[86svh] flex-col justify-end overflow-hidden pt-32 lg:min-h-[94svh] lg:pt-40">
      {image ? (
        <div className="absolute inset-0 -z-10">
          <Image
            src={image}
            alt={sText(data, "imageAlt")}
            fill
            priority={priority}
            fetchPriority={priority ? "high" : undefined}
            sizes="100vw"
            quality={82}
            className="object-cover object-center"
            aria-hidden={sText(data, "imageAlt") ? undefined : true}
          />
          {/* Two stacked scrims: a vertical one for the copy, a soft vignette
              so the vehicle stays the brightest thing in frame. */}
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                "linear-gradient(180deg, rgb(10 11 13 / 0.78) 0%, rgb(10 11 13 / 0.34) 32%, rgb(10 11 13 / 0.55) 68%, rgb(10 11 13 / 0.94) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(120% 80% at 50% 40%, transparent 30%, rgb(10 11 13 / 0.55) 100%)",
            }}
          />
        </div>
      ) : (
        <div
          className="absolute inset-0 -z-10"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(100% 80% at 20% 10%, #16452a 0%, #061409 62%), linear-gradient(180deg, #0a2113 0%, #061409 100%)",
          }}
        />
      )}

      <div className="shell pb-14 lg:pb-16">
        <div className={cn("max-w-4xl", centred && "mx-auto text-center")}>
          {eyebrow ? (
            <p className={cn("eyebrow", centred && "eyebrow-plain justify-center")}>{eyebrow}</p>
          ) : null}

          {heading ? (
            <h1 className="text-on-dark mt-6 text-display-1">{heading}</h1>
          ) : null}

          {body ? (
            <p className={cn("lede mt-7 max-w-xl", centred && "mx-auto")}>{body}</p>
          ) : null}

          <div
            className={cn(
              "mt-10 flex flex-wrap items-center gap-3",
              centred && "justify-center",
            )}
          >
            {primaryLabel && primaryUrl ? (
              <Link href={primaryUrl} className="btn btn-brand">
                {primaryLabel}
              </Link>
            ) : null}
            {secondaryLabel && secondaryUrl ? (
              <Link href={secondaryUrl} className="btn btn-outline-light">
                {secondaryLabel}
              </Link>
            ) : null}
          </div>

          {!primaryLabel && !secondaryLabel ? (
            <ContactButtons className={cn("mt-10", centred && "justify-center")} />
          ) : null}
        </div>
      </div>

      {stats.length > 0 ? (
        <div className="border-charcoal-line/70 border-t backdrop-blur-[2px]">
          <div className="shell">
            <dl className="grid grid-cols-2 divide-x divide-[color:var(--color-charcoal-line)]/70 sm:grid-cols-4">
              {stats.slice(0, 4).map((stat, index) => (
                <div
                  key={stat.label}
                  className={cn(
                    "py-6 lg:py-7",
                    index === 0 ? "pr-5" : "px-5",
                    index === 0 && "pl-0",
                  )}
                >
                  <dt className="text-on-dark-faint text-micro tracking-[0.16em] uppercase">
                    {stat.label}
                  </dt>
                  <dd className="font-display text-on-dark mt-2 text-title">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : null}
    </section>
  );
}
