"use client";

import type { Locale } from "@lider/shared";
import { AnimatePresence, motion } from "framer-motion";
import { PhoneCall, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { trackEvent } from "../lib/analytics";
import type { LeadPopupContext } from "../lib/open-lead-popup";
import { LeadForm } from "./lead-form";

const NEXT_SHOW_KEY = "lider-lead-popup-next-show-at";
const LEAD_SUBMITTED_KEY = "lider-lead-submitted";
const SESSION_SHOWS_KEY = "lider-lead-popup-session-shows";
const DEFAULT_DELAY_MS = 30_000;
const DEFAULT_REOPEN_MS = 15 * 60_000;
const MAX_SESSION_SHOWS = 1;

type PopupTrigger = "timer" | "section-depth" | "exit-intent" | "manual" | "repeat";

const popupCopy: Record<
  Locale,
  {
    title: string;
    text: string;
    note: string;
    submit: string;
    close: string;
  }
> = {
  uk: {
    title: "Залиште номер",
    text: "Ми передзвонимо, підкажемо категорію і найближчий набір.",
    note: "Телефон потрібен тільки для консультації щодо навчання.",
    submit: "Залишити заявку",
    close: "Закрити форму"
  },
  ru: {
    title: "Оставьте номер",
    text: "Мы перезвоним, подскажем категорию и ближайший набор.",
    note: "Телефон нужен только для консультации по обучению.",
    submit: "Оставить заявку",
    close: "Закрыть форму"
  },
  en: {
    title: "Leave your number",
    text: "We will call back, suggest a category and the nearest group.",
    note: "Your phone is used only for a training consultation.",
    submit: "Apply now",
    close: "Close form"
  }
};

export function LeadPopup({
  locale,
  delayMs = DEFAULT_DELAY_MS,
  reopenAfterMs = DEFAULT_REOPEN_MS
}: {
  locale: Locale;
  delayMs?: number;
  reopenAfterMs?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [leadContext, setLeadContext] = useState<LeadPopupContext>({});
  const triggerRef = useRef<PopupTrigger>("timer");
  const viewedSectionsRef = useRef(new Set<string>());
  const copy = popupCopy[locale] ?? popupCopy.uk;

  useEffect(() => {
    const timer = window.setTimeout(() => tryOpen("timer"), delayMs);
    const repeatTimer = window.setInterval(() => tryOpen("repeat"), reopenAfterMs);

    function onLeadCreated() {
      setIsOpen(false);
    }

    function onOpenRequest(event: Event) {
      const customEvent = event as CustomEvent<LeadPopupContext>;
      const context = customEvent.detail ?? {};
      setLeadContext(context);
      tryOpen("manual", true, context.source);
    }

    function onMenuState(event: Event) {
      const customEvent = event as CustomEvent<{ open?: boolean }>;
      const isMobileMenuOpen = Boolean(customEvent.detail?.open);

      setIsMenuOpen(isMobileMenuOpen);

      if (isMobileMenuOpen) {
        setIsOpen(false);
      }
    }

    window.addEventListener("lider-lead-created", onLeadCreated);
    window.addEventListener("lider-open-lead-popup", onOpenRequest);
    window.addEventListener("lider-mobile-menu-state", onMenuState);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(repeatTimer);
      window.removeEventListener("lider-lead-created", onLeadCreated);
      window.removeEventListener("lider-open-lead-popup", onOpenRequest);
      window.removeEventListener("lider-mobile-menu-state", onMenuState);
    };
  }, [delayMs, reopenAfterMs, isMenuOpen, isOpen]);

  useEffect(() => {
    function onScroll() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;

      document.querySelectorAll("section[id]").forEach((section) => {
        const rect = section.getBoundingClientRect();

        if (rect.top < window.innerHeight * 0.62 && rect.bottom > window.innerHeight * 0.2) {
          viewedSectionsRef.current.add(section.id);
        }
      });

      if (progress > 0.55 || viewedSectionsRef.current.size >= 4) {
        tryOpen("section-depth");
      }
    }

    function onMouseLeave(event: MouseEvent) {
      if (event.clientY <= 0) {
        tryOpen("exit-intent");
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [isMenuOpen, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePopup("escape");
      }
    }

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      if (document.body.dataset.liderMobileMenuOpen !== "true") {
        document.body.style.overflow = "";
        document.body.style.overscrollBehavior = "";
      }
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function tryOpen(trigger: PopupTrigger, force = false, source?: string) {
    if (isOpen || isMenuOpen || (!force && hasSubmittedLead())) {
      return;
    }

    if (!force) {
      const nextAllowedAt = Number(window.localStorage.getItem(NEXT_SHOW_KEY) ?? 0);
      const sessionShows = Number(window.sessionStorage.getItem(SESSION_SHOWS_KEY) ?? 0);

      if (Date.now() < nextAllowedAt || sessionShows >= MAX_SESSION_SHOWS) {
        return;
      }

      window.sessionStorage.setItem(SESSION_SHOWS_KEY, String(sessionShows + 1));
    }

    if (!force) {
      setLeadContext(source ? { source } : {});
    }

    triggerRef.current = trigger;
    setIsOpen(true);
    trackEvent("popup_shown", { trigger, source: source ?? trigger, forced: force });
  }

  function closePopup(reason: string) {
    window.localStorage.setItem(NEXT_SHOW_KEY, String(Date.now() + reopenAfterMs));
    trackEvent("popup_closed", { reason, trigger: triggerRef.current });
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        data-lider-lead-popup-root
        aria-hidden="true"
        tabIndex={-1}
        onClick={() => tryOpen("manual", true, "hidden-trigger")}
        className="pointer-events-none fixed left-0 top-0 h-px w-px opacity-0"
      />
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-[#171b1a]/58 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closePopup("backdrop");
              }
            }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="lead-popup-title"
              className="safe-bottom relative flex w-full max-w-[460px] flex-col overflow-hidden rounded-[26px] border border-white/70 bg-white shadow-[0_28px_90px_rgba(0,0,0,0.22)] max-h-[calc(100dvh-24px)] sm:max-h-[calc(100vh-48px)]"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative flex-1 overflow-y-auto">
                <button
                  type="button"
                  aria-label={copy.close}
                  onClick={() => closePopup("button")}
                  className="tap-target absolute right-4 top-4 z-10 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f4f4f4] text-lider-graphite transition hover:bg-[#e7ecea]"
                >
                  <X size={18} />
                </button>
                <div className="px-5 pb-2 pt-5 pr-14">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#fff1f1] text-lider-red">
                    <PhoneCall size={20} aria-hidden />
                  </div>
                  <h2 id="lead-popup-title" className="mt-4 text-3xl font-black tracking-[-0.03em] text-lider-graphite">
                    {copy.title}
                  </h2>
                  <p className="mt-3 text-base font-semibold leading-7 text-lider-muted">{copy.text}</p>
                </div>

                <div className="px-5 pb-5">
                  <div className="mb-4 flex items-center gap-2 rounded-[16px] bg-lider-background px-4 py-3 text-sm font-semibold text-lider-muted">
                    <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                    {copy.note}
                  </div>
                  <LeadForm
                    variant="popup"
                    analyticsSource="popup"
                    initialContext={leadContext}
                    locale={locale}
                    submitLabel={copy.submit}
                    onSuccess={() => closePopup("lead-created")}
                  />
                </div>
              </div>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function hasSubmittedLead() {
  return window.localStorage.getItem(LEAD_SUBMITTED_KEY) === "true";
}
