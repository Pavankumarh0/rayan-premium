import { cn } from "@/lib/utils";

/**
 * Seamless scrolling ticker.
 *
 * The track is rendered twice and translated by exactly -50%, so the second
 * copy is in the first one's place when the loop restarts and the seam is
 * invisible. That keeps it pure CSS — no measuring, no JavaScript, and no
 * layout thrash on resize.
 *
 * The duplicate is `aria-hidden`, so a screen reader reads the list once.
 * Hovering or tabbing into it pauses the animation, and reduced motion stops
 * it entirely (see globals.css).
 */
export function Marquee({
  items,
  tone = "dark",
  speed = 42,
  reverse = false,
  className,
}: {
  items: string[];
  tone?: "light" | "dark";
  /** Seconds for one full cycle. Longer is calmer. */
  speed?: number;
  reverse?: boolean;
  className?: string;
}) {
  if (items.length === 0) return null;

  const Track = ({ hidden }: { hidden?: boolean }) => (
    <ul
      className="flex shrink-0 items-center"
      aria-hidden={hidden ? true : undefined}
      {...(hidden ? { role: "presentation" } : {})}
    >
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex items-center whitespace-nowrap">
          <span
            className={cn(
              "px-6 text-micro font-medium tracking-[0.2em] uppercase lg:px-8",
              tone === "dark" ? "text-on-dark-muted" : "text-on-light-muted",
            )}
          >
            {item}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "h-1 w-1 rounded-full",
              tone === "dark" ? "bg-brand-bright" : "bg-brand-dim",
            )}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className={cn(
        "marquee-viewport border-y py-4",
        tone === "dark" ? "border-charcoal-line" : "border-mist-line",
        className,
      )}
    >
      <div
        className={cn("marquee", reverse && "marquee-reverse")}
        style={{ "--marquee-duration": `${speed}s` } as React.CSSProperties}
      >
        <Track />
        <Track hidden />
      </div>
    </div>
  );
}
