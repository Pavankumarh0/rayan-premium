import { Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A wall of reviews that drifts past on a slight 3D tilt.
 *
 * Built on this site's own tokens rather than on a component library: the
 * reference implementation wanted shadcn's Card and Avatar and Radix, which
 * would have meant a second design system living alongside this one for the
 * sake of one section.
 *
 * The movement is pure CSS — two columns translating on a loop — so nothing
 * ships to the browser to run it and the section stays a server component.
 * `prefers-reduced-motion` stops the drift entirely, leaving a readable
 * static wall, which matters because text that moves is text some people
 * cannot read at all.
 */

export type WallReview = {
  id: string;
  authorName: string;
  authorRole: string | null;
  quote: string;
  rating: number | null;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function ReviewCard({ review }: { review: WallReview }) {
  return (
    <figure className="border-mist-line bg-ivory w-[19rem] shrink-0 rounded-md border p-6 sm:w-[21rem]">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="bg-brand-wash text-brand-dim font-display inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-small"
        >
          {initials(review.authorName)}
        </span>
        <div className="min-w-0">
          <figcaption className="font-display text-on-light truncate text-small">
            {review.authorName}
          </figcaption>
          {review.authorRole ? (
            <p className="text-on-light-faint truncate text-micro">{review.authorRole}</p>
          ) : null}
        </div>
        <Quote
          size={18}
          aria-hidden="true"
          className="text-brand-dim/35 ml-auto shrink-0"
        />
      </div>

      {review.rating ? (
        <p className="mt-3 flex items-center gap-0.5" aria-label={`${review.rating} out of 5`}>
          {Array.from({ length: review.rating }, (_, i) => (
            <Star key={i} size={13} aria-hidden="true" className="text-brand fill-current" />
          ))}
        </p>
      ) : null}

      <blockquote className="text-on-light-muted mt-3 text-small">{review.quote}</blockquote>
    </figure>
  );
}

/** One looping column. The content is repeated so the seam never shows. */
function Column({
  reviews,
  reverse,
  duration,
}: {
  reviews: WallReview[];
  reverse?: boolean;
  duration: string;
}) {
  return (
    <div className="marquee-col flex max-h-full flex-col gap-4" style={{ ["--duration" as string]: duration }}>
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1}
          className={cn("flex shrink-0 flex-col gap-4", reverse ? "marquee-up" : "marquee-down")}
        >
          {reviews.map((review) => (
            <ReviewCard key={`${copy}-${review.id}`} review={review} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function TestimonialWall({ reviews }: { reviews: WallReview[] }) {
  if (reviews.length === 0) return null;

  // Two columns drifting opposite ways. With a handful of reviews that reads
  // as a wall; a third column would just repeat the same faces again.
  const left = reviews;
  const right = reviews.length > 1 ? [...reviews.slice(1), reviews[0]!] : reviews;

  return (
    <div className="testimonial-wall">
      <div className="testimonial-wall-stage">
        <Column reviews={left} duration="52s" />
        <Column reviews={right} duration="64s" reverse />
      </div>

      {/* Feathered edges, so cards enter and leave instead of being clipped. */}
      <div aria-hidden="true" className="testimonial-wall-fade-top" />
      <div aria-hidden="true" className="testimonial-wall-fade-bottom" />
    </div>
  );
}
