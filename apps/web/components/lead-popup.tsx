"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { LeadForm } from "./lead-form";

const STORAGE_KEY = "lider-lead-popup-dismissed-at";
const DEFAULT_DELAY_MS = 60_000;
const DEFAULT_REOPEN_MS = 24 * 60 * 60 * 1000;

export function LeadPopup({
  delayMs = DEFAULT_DELAY_MS,
  reopenAfterMs = DEFAULT_REOPEN_MS
}: {
  delayMs?: number;
  reopenAfterMs?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const dismissedAt = Number(window.localStorage.getItem(STORAGE_KEY) ?? 0);
    const canShow = !dismissedAt || Date.now() - dismissedAt > reopenAfterMs;

    if (!canShow) {
      return;
    }

    const timer = window.setTimeout(() => setIsOpen(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, reopenAfterMs]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePopup();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function closePopup() {
    setIsClosing(true);
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 180);
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-[#071512]/70 px-4 py-4 backdrop-blur-sm transition-opacity sm:items-center ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closePopup();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-popup-title"
        className={`lead-popup-panel w-full max-w-5xl overflow-hidden rounded-[24px] border border-white/20 bg-white shadow-[0_32px_100px_rgba(0,0,0,0.32)] ${
          isClosing ? "lead-popup-panel--closing" : ""
        }`}
      >
        <div className="grid lg:grid-cols-[0.85fr_1fr]">
          <div className="relative bg-lider-green p-6 text-white sm:p-8">
            <button
              type="button"
              aria-label="Закрити форму"
              onClick={closePopup}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/20"
            >
              <X size={18} />
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lider-yellow">
              Консультація за 1 хвилину
            </p>
            <h2 id="lead-popup-title" className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Підібрати категорію, філію і старт навчання?
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/74">
              Залиште телефон, а менеджер підкаже ціну теорії, формат занять, документи і найближчий набір у вашому
              місті.
            </p>
            <div className="mt-8 grid gap-3 text-sm">
              {["A, A1, B, C, CE", "Онлайн-теорія і практика", "Київ, Дніпро, Донеччина"].map((item) => (
                <div key={item} className="rounded-[14px] border border-white/15 bg-white/8 px-4 py-3 font-semibold">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <LeadForm
              variant="popup"
              title="Залиште заявку"
              description="Ми не передаємо контакти стороннім сервісам. Дзвінок потрібен тільки для консультації щодо навчання."
              submitLabel="Передзвоніть мені"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
