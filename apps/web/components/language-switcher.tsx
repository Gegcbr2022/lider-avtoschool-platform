"use client";

import type { Locale } from "@lider/shared";
import { useEffect } from "react";

const options: Array<{ locale: Locale; label: string }> = [
  { locale: "uk", label: "UA" },
  { locale: "ru", label: "RU" },
  { locale: "en", label: "EN" }
];

export function LanguageSwitcher({ activeLocale, compact = false }: { activeLocale: Locale; compact?: boolean }) {
  useEffect(() => {
    window.localStorage.setItem("lider-locale", activeLocale);
    document.documentElement.lang = activeLocale;
  }, [activeLocale]);

  function changeLocale(locale: Locale) {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", locale);
    window.localStorage.setItem("lider-locale", locale);
    window.location.assign(`${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <div
      className={`grid grid-cols-3 gap-1 rounded-full border border-lider-line bg-white p-1 ${
        compact ? "w-full" : "w-[132px]"
      }`}
      aria-label="Перемикач мови"
    >
      {options.map((option) => (
        <button
          key={option.locale}
          type="button"
          onClick={() => changeLocale(option.locale)}
          aria-pressed={activeLocale === option.locale}
          className={`tap-target rounded-full px-2 py-2 text-xs font-black transition ${
            activeLocale === option.locale
              ? "bg-lider-red text-white shadow-[0_10px_24px_rgba(255,30,30,0.2)]"
              : "text-lider-muted hover:bg-[#fff1f1] hover:text-lider-red"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
