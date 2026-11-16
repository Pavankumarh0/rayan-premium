import { Quote, Star } from "lucide-react";

/**
 * Reviews on a single row that drifts left to right, and that can be swiped
 * or scrolled by hand.
 *
 * Built on this site's own tokens rather than on a component library: the
 * reference implementation wanted shadcn's Card and Avatar plus Radix, which
 * would have put a second design system alongside this one for one section.
 *
 * The drift is CSS, so the section stays a server component and nothing
 * ships to run it. The track is also a real horizontal scroller, so a touch
 * swipe, a trackpad or the keyboard all move it; hovering or focusing pauses
 * the animation so a card can actually be read. With reduced motion asked
 * for, the drift never starts and it is simply a swipeable row.
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
    <figure className="border-mist-line bg-ivory flex w-[18rem] shrink-0 flex-col rounded-md border p-6 sm:w-[22rem]">
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
        <Quote size={18} aria-hidden="true" className="text-brand-dim/35 ml-auto shrink-0" />
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

export function TestimonialWall({ reviews }: { reviews: WallReview[] }) {
  if (reviews.length === 0) return null;

  return (
    <div className="review-rail">
      {/*
        The track is scrollable in its own right, so the drift is a nicety
        rather than the only way to reach a card. tabIndex makes it focusable,
        which is what gives keyboard users the arrow keys here.
      */}
      <div
        className="review-rail-track"
        tabIndex={0}
        role="region"
        aria-label="Customer reviews, scrollable"
      >
        {/*
          Two passes of the same reviews: the animation travels exactly one
          pass, so the loop lands on an identical frame and has no seam. The
          duplicate is hidden from assistive tech so the quotes are not
          announced twice.
        */}
        {[0, 1].map((copy) => (
          <div key={copy} className="review-rail-run" aria-hidden={copy === 1}>
            {reviews.map((review) => (
              <ReviewCard key={`${copy}-${review.id}`} review={review} />
            ))}
          </div>
        ))}
      </div>

      <div aria-hidden="true" className="review-rail-fade-left" />
      <div aria-hidden="true" className="review-rail-fade-right" />
    </div>
  );
}
