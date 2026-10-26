"use client";

import { useEffect } from "react";

/**
 * Watches every `[data-reveal]` element and reveals it once.
 *
 * Mounted once in the public layout. One observer for the whole document is
 * cheaper than a hook per component, and because elements are unobserved as
 * soon as they appear, a long page settles to zero ongoing work.
 *
 * A MutationObserver picks up nodes added after navigation, since the App
 * Router swaps content without remounting the layout.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("reveal-ready")) return;

    // Without IntersectionObserver, reveal everything rather than hide it.
    if (typeof IntersectionObserver === "undefined") {
      root.classList.remove("reveal-ready");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      },
      {
        // Start a little before the element reaches the viewport so the
        // transition is already underway by the time it is properly in view.
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.08,
      },
    );

    const observe = (scope: ParentNode) => {
      for (const el of scope.querySelectorAll("[data-reveal]:not(.is-revealed)")) {
        // Anything already on screen is revealed straight away rather than
        // waiting for a scroll. It still animates: this runs after first
        // paint, so the hidden state has been rendered and the class change
        // transitions from it, giving the first viewport an entrance.
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
          el.classList.add("is-revealed");
        } else {
          observer.observe(el);
        }
      }
    };

    observe(document);

    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === 1) observe(node as Element);
        }
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  return null;
}
