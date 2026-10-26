import { cn } from "@/lib/utils";

/**
 * A dashed route that draws itself when scrolled into view, with a marker
 * travelling along it.
 *
 * This is the site's one piece of literal travel iconography. It is an SVG
 * stroke rather than an illustration, so it inherits the brand colour, scales
 * to any width and costs nothing to load.
 *
 * The marker is a `<circle>` *inside* the SVG rather than a positioned DOM
 * node: `offset-path` resolves in the element's own coordinate system, so
 * keeping it in the viewBox means it stays glued to the line at every width.
 * A sibling element would be laid out in CSS pixels and drift as the SVG
 * stretched.
 *
 * Both the draw and the travel are plain CSS transitions keyed off the
 * `.is-revealed` class that the shared RevealObserver adds.
 */
const PATH =
  "M4,34 C140,34 170,10 300,10 C430,10 470,54 600,54 C730,54 770,14 900,14 C1010,14 1060,34 1196,34";

/** Comfortably over the true arc length, so the dash fully hides the stroke. */
const PATH_LENGTH = 1340;

export function RouteLine({
  tone = "dark",
  className,
  showMarker = true,
}: {
  tone?: "light" | "dark";
  className?: string;
  showMarker?: boolean;
}) {
  const stroke = tone === "dark" ? "var(--color-brand-bright)" : "var(--color-brand-dim)";
  const rail = tone === "dark" ? "var(--color-charcoal-line)" : "var(--color-mist-line)";

  return (
    <div
      data-reveal="fade"
      className={cn("route-line w-full", className)}
      style={{ "--route-length": PATH_LENGTH } as React.CSSProperties}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 68"
        fill="none"
        preserveAspectRatio="none"
        className="h-14 w-full lg:h-16"
        role="presentation"
      >
        {/* Static rail underneath, so the shape reads before it is drawn. */}
        <path d={PATH} stroke={rail} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />

        {/* The drawn route. */}
        <path d={PATH} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />

        {/* Endpoints, like stops on a route. */}
        <circle cx="4" cy="34" r="4" fill={stroke} />
        <circle cx="1196" cy="34" r="4" fill={stroke} />

        {showMarker ? (
          <circle
            className="route-marker"
            r="5"
            fill={stroke}
            style={{ offsetPath: `path("${PATH}")`, offsetRotate: "0deg" }}
          />
        ) : null}
      </svg>
    </div>
  );
}
