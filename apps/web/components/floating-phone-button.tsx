"use client";

import type { Locale } from "@lider/shared";
import { PhoneCall } from "lucide-react";
import { openLeadPopup } from "../lib/open-lead-popup";

const phoneCopy: Record<Locale, { label: string; title: string }> = {
  uk: { label: "Відкрити коротку форму заявки", title: "Залишити номер" },
  ru: { label: "Открыть короткую форму заявки", title: "Оставить номер" },
  en: { label: "Open short request form", title: "Leave phone" }
};

export function FloatingPhoneButton({ locale }: { locale: Locale }) {
  const copy = phoneCopy[locale] ?? phoneCopy.uk;

  return (
    <button
      type="button"
      aria-label={copy.label}
      title={copy.title}
      onClick={() => openLeadPopup("floating-phone")}
      className="floating-phone-button fixed bottom-7 right-7 z-40 hidden h-16 w-16 items-center justify-center rounded-[22px] bg-lider-red text-white shadow-[0_18px_46px_rgba(255,30,30,0.28)] transition hover:-translate-y-0.5 hover:bg-lider-redDark focus:outline-none focus:ring-2 focus:ring-lider-red focus:ring-offset-2 md:inline-flex"
    >
      <PhoneCall className="h-7 w-7" aria-hidden />
    </button>
  );
}
