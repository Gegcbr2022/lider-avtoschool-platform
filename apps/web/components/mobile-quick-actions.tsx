"use client";

import { defaultLocale, type Locale } from "@lider/shared";
import { PhoneCall } from "lucide-react";
import { useEffect, useState } from "react";
import { openLeadPopup } from "../lib/open-lead-popup";

const ctaLabel: Record<Locale, string> = {
  uk: "Залишити заявку",
  ru: "Оставить заявку",
  en: "Apply now"
};

// Appears only after the user scrolls past the hero, and steps aside near the
// final CTA / footer so it never covers them. Opens the lead popup directly
// (no scroll-to-form). Mobile only.
const SHOW_AFTER_PX = 340;

export function MobileQuickActions({ activeLocale = defaultLocale }: { activeLocale?: Locale }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const visibleEnds = new Set<Element>();
    const endTargets = Array.from(document.querySelectorAll("#signup, #application, footer"));

    function update() {
      const scrolledEnough = window.scrollY > SHOW_AFTER_PX;
      setShow(scrolledEnough && visibleEnds.size === 0);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleEnds.add(entry.target);
          } else {
            visibleEnds.delete(entry.target);
          }
        }
        update();
      },
      { threshold: 0 }
    );
    endTargets.forEach((target) => observer.observe(target));

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const label = ctaLabel[activeLocale] ?? ctaLabel.uk;

  return (
    <div
      className={`safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-3 transition-all duration-300 md:hidden ${
        show ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      aria-hidden={!show}
    >
      <button
        type="button"
        onClick={() => openLeadPopup("mobile-sticky")}
        tabIndex={show ? 0 : -1}
        className={`red-cta tap-target w-full max-w-sm rounded-[16px] px-5 py-3.5 text-sm font-black shadow-[0_12px_36px_rgba(255,30,30,0.34)] ${
          show ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <PhoneCall className="h-4 w-4" aria-hidden />
        {label}
      </button>
    </div>
  );
}
