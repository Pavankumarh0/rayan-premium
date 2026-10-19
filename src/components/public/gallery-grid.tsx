"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GalleryEntry } from "@/lib/content";

/**
 * Masonry-ish gallery with an accessible lightbox.
 *
 * The dialog traps focus, closes on Escape and on backdrop click, restores
 * focus to the thumbnail that opened it, and supports arrow-key paging. Video
 * entries link out rather than autoplaying.
 */
export function GalleryGrid({ items }: { items: GalleryEntry[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const close = useCallback(() => {
    const previous = openIndex;
    setOpenIndex(null);
    if (previous !== null) {
      requestAnimationFrame(() => triggerRefs.current[previous]?.focus());
    }
  }, [openIndex]);

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) => {
        if (current === null) return current;
        return (current + delta + items.length) % items.length;
      });
    },
    [items.length],
  );

  useEffect(() => {
    if (openIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "Tab") {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href]",
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openIndex, close, step]);

  if (items.length === 0) return null;

  const active = openIndex === null ? null : items[openIndex]!;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {items.map((item, index) => (
          <li
            key={item.id}
            className={cn(
              // A repeating 2-3-1 rhythm keeps the grid editorial rather than
              // a flat wall of identical squares.
              index % 6 === 0 && "col-span-2 lg:col-span-2 lg:row-span-2",
              index % 6 === 4 && "lg:col-span-2",
            )}
          >
            <button
              type="button"
              ref={(element) => {
                triggerRefs.current[index] = element;
              }}
              onClick={() => setOpenIndex(index)}
              className="media-frame group relative block h-full w-full overflow-hidden rounded-md"
              aria-haspopup="dialog"
            >
              <Image
                src={item.url}
                alt={item.alt}
                width={item.width ?? 900}
                height={item.height ?? 700}
                loading="lazy"
                sizes="(min-width: 1024px) 420px, 48vw"
                className={cn(
                  "h-full w-full object-cover",
                  index % 6 === 0 ? "aspect-[4/3] lg:aspect-[3/2]" : "aspect-square",
                )}
              />
              {item.kind === "VIDEO" ? (
                <span
                  aria-hidden="true"
                  className="bg-ink/70 text-on-dark absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full"
                >
                  <Play size={18} fill="currentColor" />
                </span>
              ) : null}
              <span className="sr-only">
                {item.kind === "VIDEO" ? "Play video" : "Enlarge image"}: {item.alt}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {active ? (
        <div
          className="bg-ink/95 fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm sm:p-8"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={active.alt}
            className="relative flex max-h-full w-full max-w-5xl flex-col"
          >
            <div className="flex items-center justify-between gap-4 pb-4">
              <p className="text-on-dark-muted text-micro tabular">
                {openIndex! + 1} / {items.length}
              </p>
              <button
                type="button"
                onClick={close}
                className="border-charcoal-line text-on-dark hover:border-gold hover:text-gold inline-flex h-10 w-10 items-center justify-center rounded-xs border transition-colors"
              >
                <X size={18} aria-hidden="true" />
                <span className="sr-only">Close gallery</span>
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              {active.kind === "VIDEO" && active.videoUrl ? (
                <div className="aspect-video w-full">
                  <iframe
                    src={active.videoUrl}
                    title={active.title || active.alt}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full rounded-md"
                  />
                </div>
              ) : (
                <Image
                  src={active.url}
                  alt={active.alt}
                  width={active.width ?? 1600}
                  height={active.height ?? 1100}
                  sizes="(min-width: 1024px) 1024px, 100vw"
                  className="max-h-[70vh] w-auto rounded-md object-contain"
                />
              )}
            </div>

            <div className="flex items-center justify-between gap-4 pt-4">
              <button
                type="button"
                onClick={() => step(-1)}
                className="border-charcoal-line text-on-dark hover:border-gold hover:text-gold inline-flex h-10 w-10 items-center justify-center rounded-xs border transition-colors"
              >
                <ChevronLeft size={18} aria-hidden="true" />
                <span className="sr-only">Previous</span>
              </button>

              <p className="text-on-dark-muted flex-1 text-center text-micro">
                {active.title || active.alt}
              </p>

              <button
                type="button"
                onClick={() => step(1)}
                className="border-charcoal-line text-on-dark hover:border-gold hover:text-gold inline-flex h-10 w-10 items-center justify-center rounded-xs border transition-colors"
              >
                <ChevronRight size={18} aria-hidden="true" />
                <span className="sr-only">Next</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
