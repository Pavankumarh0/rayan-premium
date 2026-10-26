import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-reveal wrapper.
 *
 * This stays a server component — it only emits a `data-reveal` attribute and
 * an optional delay. A single `RevealObserver` mounted once in the layout
 * watches for the attribute, so adding motion to a section costs no extra
 * client JavaScript.
 *
 * The hidden state lives behind `.reveal-ready` on <html>, which is set before
 * first paint and only when JS is running and reduced motion is not requested.
 * Nothing can end up permanently invisible.
 */
export function Reveal({
  children,
  delay = 0,
  variant = "rise",
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  /** Stagger, in milliseconds. Keep cumulative delays under ~400ms. */
  delay?: number;
  /** "rise" fades and lifts; "fade" only fades, for large media. */
  variant?: "rise" | "fade";
  as?: "div" | "li" | "section" | "article";
  className?: string;
}) {
  return (
    <Tag
      data-reveal={variant === "fade" ? "fade" : ""}
      style={delay > 0 ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}

/**
 * Inline script that runs before paint.
 *
 * It opts the document into the hidden-by-default reveal state only when
 * motion is wanted, so a visitor with JS disabled or reduced motion enabled
 * sees the finished page immediately with no flash.
 */
export function RevealInit() {
  return (
    <script
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html:
          "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('reveal-ready')}}catch(e){}",
      }}
    />
  );
}
