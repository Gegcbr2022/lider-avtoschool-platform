"use client";

import { defaultLocale, type Locale } from "@lider/shared";
import { Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const ctaLabel: Record<Locale, string> = {
  uk: "Залишити заявку",
  ru: "Оставить заявку",
  en: "Apply now"
};

export function MobileQuickActions({ activeLocale = defaultLocale }: { activeLocale?: Locale }) {
  const [isSignupVisible, setIsSignupVisible] = useState(false);

  useEffect(() => {
    const signupSection = document.querySelector("#signup");

    if (!signupSection) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSignupVisible(Boolean(entry?.isIntersecting && (entry.intersectionRatio ?? 0) > 0.16));
      },
      { threshold: [0, 0.16, 0.36] }
    );

    observer.observe(signupSection);
    return () => observer.disconnect();
  }, []);

  const label = ctaLabel[activeLocale] ?? ctaLabel.uk;

  return (
    <div
      className={`safe-bottom fixed inset-x-3 bottom-3 z-40 rounded-[20px] border border-white/70 bg-white/95 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl transition duration-200 md:hidden ${
        isSignupVisible ? "pointer-events-none translate-y-4 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="flex items-center gap-2">
        <Link
          href="#signup"
          className="tap-target red-cta flex flex-1 items-center justify-center gap-2 rounded-[14px] px-4 py-3 text-sm font-black"
        >
          {label}
        </Link>
        <a
          href="https://t.me/LiderDriveBot?start=AYYUTE"
          target="_blank"
          rel="noreferrer"
          aria-label="Telegram"
          className="tap-target inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#229ED9] text-white"
        >
          <Send size={18} aria-hidden />
        </a>
      </div>
    </div>
  );
}
