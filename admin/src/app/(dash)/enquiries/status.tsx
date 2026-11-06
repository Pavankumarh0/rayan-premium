import { cn } from "@/lib/utils";

/** Status presentation, shared by the enquiry list and the detail page. */

export const STATUS_LABELS = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  QUOTED: "Quoted",
  CLOSED: "Closed",
  SPAM: "Spam",
} as const;

const STATUS_TONES: Record<string, string> = {
  NEW: "badge-info",
  IN_PROGRESS: "badge-warn",
  QUOTED: "badge-ok",
  CLOSED: "badge-muted",
  SPAM: "badge-danger",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status;
}

export function EnquiryStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("badge", STATUS_TONES[status] ?? "badge-muted")}>
      {statusLabel(status)}
    </span>
  );
}

/**
 * A fixed locale and the business's own timezone, not the viewer's.
 *
 * Formatting with the viewer's locale in a server component is what causes
 * hydration mismatches on dates, and an enquiry's time only means anything in
 * the timezone the business actually works in.
 */
export function formatEnquiryDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }).format(date);
}
