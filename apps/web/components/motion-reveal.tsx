"use client";

import { useEffect } from "react";

/**
 * Lightweight scroll-reveal driver.
 *
 * Works across all browsers (no CSS scroll-timeline dependency). It opts the page
 * into the reveal styles only when JS + motion are available, so users without JS
 * or with `prefers-reduced-motion: reduce` always see fully visible content.
 *
 * Markup contract (see globals.css):
 *  - `.motion-section`  → fades/slides in when scrolled into view
 *  - `.stagger > *`     → children of a revealed section animate with a small stagger
 */
export function MotionReveal() {
  useEffect(() => {
    const root = document.documentElement;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const supportsObserver = typeof IntersectionObserver !== "undefined";
    if (reduceMotion || !supportsObserver) {
      return;
    }

    root.classList.add("reveal-on");

    const sections = Array.from(document.querySelectorAll<HTMLElement>(".motion-section"));
    const viewportHeight = window.innerHeight || 800;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      // Already (mostly) on screen at load → reveal immediately, no flash, no animation.
      if (rect.top < viewportHeight * 0.88 && rect.bottom > 0) {
        section.classList.add("in-view");
      } else {
        observer.observe(section);
      }
    }

    return () => {
      observer.disconnect();
      root.classList.remove("reveal-on");
    };
  }, []);

  return null;
}
