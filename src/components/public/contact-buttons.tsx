import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSiteSettings, contactLinks } from "@/lib/site";

/**
 * Call and WhatsApp buttons.
 *
 * Both are omitted entirely until the numbers are filled in under Settings →
 * Contact details. When neither exists, a single enquiry-page button is shown
 * instead, so the call to action never dead-ends on a fake number.
 */
export async function ContactButtons({
  message,
  variant = "dark",
  className,
  fallbackLabel = "Send an enquiry",
  fallback = "button",
}: {
  /** Prefills the WhatsApp message with page context. */
  message?: string;
  variant?: "dark" | "light";
  className?: string;
  fallbackLabel?: string;
  /**
   * What to show when no phone or WhatsApp number is configured yet.
   * Pass "none" where the surrounding block already offers an enquiry link,
   * so the page does not end up with two identical primary buttons.
   */
  fallback?: "button" | "none";
}) {
  const settings = await getSiteSettings();
  const contact = contactLinks(settings, message);

  if (!contact.phoneHref && !contact.whatsappHref) {
    if (fallback === "none") return null;
    return (
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        <Link href="/contact" className="btn btn-brand">
          {fallbackLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {contact.phoneHref ? (
        <a href={contact.phoneHref} className="btn btn-brand">
          <Phone size={16} strokeWidth={1.75} aria-hidden="true" />
          <span className="tabular">{contact.phone}</span>
        </a>
      ) : null}

      {contact.whatsappHref ? (
        <a
          href={contact.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn("btn", variant === "dark" ? "btn-outline-light" : "btn-outline-dark")}
        >
          <MessageCircle size={16} strokeWidth={1.75} aria-hidden="true" />
          WhatsApp
        </a>
      ) : null}
    </div>
  );
}

/** Persistent WhatsApp affordance on small screens. */
export async function FloatingWhatsApp({ message }: { message?: string }) {
  const settings = await getSiteSettings();
  const contact = contactLinks(settings, message);
  if (!contact.whatsappHref) return null;

  return (
    <a
      href={contact.whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      className="no-print bg-brand text-on-dark hover:bg-brand-bright fixed right-5 bottom-5 z-40 inline-flex h-13 w-13 items-center justify-center rounded-full shadow-[0_14px_34px_-12px_rgb(0_0_0/0.7)] transition-colors lg:hidden"
      style={{ height: "3.25rem", width: "3.25rem" }}
    >
      <MessageCircle size={23} strokeWidth={1.75} aria-hidden="true" />
      <span className="sr-only">Enquire on WhatsApp</span>
    </a>
  );
}
