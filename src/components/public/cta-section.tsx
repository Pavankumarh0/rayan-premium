import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ContactButtons } from "./contact-buttons";

/**
 * Closing conversion block. Two variants so a page that already ends on a dark
 * band can use the inset panel instead and avoid two identical full-width
 * bands stacking.
 */
export async function CtaSection({
  eyebrow,
  heading,
  body,
  primaryLabel,
  primaryUrl,
  secondaryLabel,
  secondaryUrl,
  image,
  imageAlt,
  variant = "band",
  showContactButtons = true,
  whatsappMessage,
}: {
  eyebrow?: string | null;
  heading?: string | null;
  body?: string | null;
  primaryLabel?: string | null;
  primaryUrl?: string | null;
  secondaryLabel?: string | null;
  secondaryUrl?: string | null;
  image?: string | null;
  imageAlt?: string | null;
  variant?: "band" | "panel";
  showContactButtons?: boolean;
  whatsappMessage?: string;
}) {
  const title = heading?.trim() || "Plan your next journey";
  const hasPrimary = Boolean(primaryLabel && primaryUrl);
  const hasSecondary = Boolean(secondaryLabel && secondaryUrl);

  const content = (
    <div className={cn("relative z-10", variant === "band" ? "max-w-2xl" : "max-w-xl")}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className={cn("text-on-dark mt-5", variant === "band" ? "text-display-2" : "text-display-3")}>
        {title}
      </h2>
      {body ? <p className="lede mt-6">{body}</p> : null}

      <div className="mt-9 flex flex-wrap items-center gap-3">
        {hasPrimary ? (
          <Link href={primaryUrl!} className="btn btn-brand">
            {primaryLabel}
          </Link>
        ) : null}
        {hasSecondary ? (
          <Link href={secondaryUrl!} className="btn btn-outline-light">
            {secondaryLabel}
          </Link>
        ) : null}
      </div>

      {showContactButtons ? (
        <ContactButtons
          message={whatsappMessage}
          variant="dark"
          className={cn(hasPrimary || hasSecondary ? "mt-4" : "mt-9")}
          // The buttons above already route to the enquiry form, so suppress
          // the "no number configured yet" fallback rather than repeating it.
          fallback={hasPrimary || hasSecondary ? "none" : "button"}
          emphasis={hasPrimary || hasSecondary ? "secondary" : "primary"}
        />
      ) : null}
    </div>
  );

  if (variant === "panel") {
    return (
      <section className="tone-light section-tight">
        <div className="shell">
          <div className="bg-ink relative isolate overflow-hidden rounded-lg px-7 py-14 lg:px-16 lg:py-20">
            {image ? (
              <div className="scrim-even absolute inset-0 -z-10 opacity-60">
                <Image src={image} alt={imageAlt || ""} fill sizes="100vw" className="object-cover" aria-hidden={imageAlt ? undefined : true} />
              </div>
            ) : null}
            {content}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-ink relative isolate overflow-hidden">
      {image ? (
        <div className="scrim-even absolute inset-0 -z-10">
          <Image
            src={image}
            alt={imageAlt || ""}
            fill
            sizes="100vw"
            className="object-cover"
            aria-hidden={imageAlt ? undefined : true}
          />
        </div>
      ) : (
        <div
          className="absolute inset-0 -z-10"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(90% 120% at 85% 110%, #18502e 0%, #061409 60%), linear-gradient(180deg, #061409 0%, #0a2113 100%)",
          }}
        />
      )}

      <div className="shell section">{content}</div>
    </section>
  );
}
