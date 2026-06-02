"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BrainCircuit, CalendarCheck, HelpCircle, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "../lib/analytics";
import { LeadForm } from "./lead-form";

const NEXT_SHOW_KEY = "lider-lead-popup-next-show-at";
const VARIANT_KEY = "lider-lead-popup-variant";
const LEAD_SUBMITTED_KEY = "lider-lead-submitted";
const SESSION_SHOWS_KEY = "lider-lead-popup-session-shows";
const DEFAULT_DELAY_MS = 25_000;
const DEFAULT_REOPEN_MS = 35_000;
const MAX_SESSION_SHOWS = 3;

const popupVariants = [
  {
    id: "consultation",
    icon: HelpCircle,
    title: "Потрібна консультація щодо прав?",
    eyebrow: "Консультація за 1 хвилину",
    text: "Залиште контакт, і менеджер підкаже ціну теорії, документи, філію та найближчий старт у вашому місті.",
    bullets: ["A, A1, B, C, CE", "Ціна і графік без очікування", "Київ, Дніпро, Донеччина"],
    submitLabel: "Зв'яжіться зі мною"
  },
  {
    id: "category-picker",
    icon: BrainCircuit,
    title: "Не знаєте, яка категорія потрібна?",
    eyebrow: "Підбір категорії",
    text: "Менеджер або онлайн-помічник допоможе обрати між A, A1, B, C і CE за досвідом, метою та містом навчання.",
    bullets: ["3-5 уточнюючих питань", "Рекомендація категорії", "План старту навчання"],
    submitLabel: "Підібрати категорію"
  },
  {
    id: "first-lesson",
    icon: CalendarCheck,
    title: "Запланувати перше заняття?",
    eyebrow: "Перший урок",
    text: "Підкажемо, як почати теорію онлайн, що підготувати з документів і коли можна вийти на практику.",
    bullets: ["Онлайн-теорія", "Документи без хаосу", "Практика за графіком"],
    submitLabel: "Уточнити перший урок"
  },
  {
    id: "ai-help",
    icon: Sparkles,
    title: "Онлайн-помічник уже на зв'язку",
    eyebrow: "Швидка відповідь",
    text: "Можете поставити питання про ціну, категорії, філії, документи або ПДР прямо в чаті, а заявку залишити після відповіді.",
    bullets: ["Працює 24/7", "Пояснює простими словами", "Передає заявку менеджеру"],
    submitLabel: "Отримати консультацію"
  }
] as const;

type PopupTrigger = "timer" | "section-depth" | "middle-scroll" | "exit-intent" | "repeat";

export function LeadPopup({
  delayMs = DEFAULT_DELAY_MS,
  reopenAfterMs = DEFAULT_REOPEN_MS
}: {
  delayMs?: number;
  reopenAfterMs?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const triggerRef = useRef<PopupTrigger>("timer");
  const viewedSectionsRef = useRef(new Set<string>());
  const variant = useMemo(() => popupVariants[getVariantIndex()], []);
  const Icon = variant.icon;

  useEffect(() => {
    const timer = window.setTimeout(() => tryOpen("timer"), delayMs);
    const repeatTimer = window.setInterval(() => tryOpen("repeat"), reopenAfterMs);

    function onLeadCreated() {
      setIsOpen(false);
    }

    function onAiState(event: Event) {
      const customEvent = event as CustomEvent<{ open?: boolean }>;
      setIsAiOpen(Boolean(customEvent.detail?.open));
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
    window.addEventListener("lider-ai-chat-state", onAiState);
    window.addEventListener("lider-mobile-menu-state", onMenuState);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(repeatTimer);
      window.removeEventListener("lider-lead-created", onLeadCreated);
      window.removeEventListener("lider-ai-chat-state", onAiState);
      window.removeEventListener("lider-mobile-menu-state", onMenuState);
    };
  }, [delayMs, reopenAfterMs, isAiOpen, isMenuOpen, isOpen]);

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

      if (progress > 0.45) {
        tryOpen("middle-scroll");
      }

      if (viewedSectionsRef.current.size >= 3) {
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
  }, [isAiOpen, isMenuOpen]);

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
    window.addEventListener("keydown", onKeyDown);

    return () => {
      if (document.body.dataset.liderMobileMenuOpen !== "true") {
        document.body.style.overflow = "";
      }
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function tryOpen(trigger: PopupTrigger) {
    if (isOpen || isAiOpen || isMenuOpen || hasSubmittedLead()) {
      return;
    }

    const nextAllowedAt = Number(window.localStorage.getItem(NEXT_SHOW_KEY) ?? 0);
    const sessionShows = Number(window.sessionStorage.getItem(SESSION_SHOWS_KEY) ?? 0);

    if (Date.now() < nextAllowedAt || sessionShows >= MAX_SESSION_SHOWS) {
      return;
    }

    triggerRef.current = trigger;
    window.sessionStorage.setItem(SESSION_SHOWS_KEY, String(sessionShows + 1));
    setIsOpen(true);
    trackEvent("popup_shown", { trigger, variant: variant.id, count: sessionShows + 1 });

    if (trigger === "exit-intent") {
      trackEvent("exit_popup_shown", { variant: variant.id });
    }
  }

  function closePopup(reason: string) {
    window.localStorage.setItem(NEXT_SHOW_KEY, String(Date.now() + reopenAfterMs));
    trackEvent("popup_closed", { reason, trigger: triggerRef.current, variant: variant.id });
    setIsOpen(false);
  }

  function openAiChat() {
    closePopup("open-ai-chat");
    window.dispatchEvent(new CustomEvent("lider-open-ai-chat", { detail: { source: "popup", variant: variant.id } }));
  }

  return (
    <>
      <button
        type="button"
        data-lider-lead-popup-root
        aria-hidden="true"
        tabIndex={-1}
        onClick={() => tryOpen("timer")}
        className="pointer-events-none fixed left-0 top-0 h-px w-px opacity-0"
      />
      <AnimatePresence>
        {isOpen ? (
          <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-[#1a1a1a]/70 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4"
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
            className="safe-bottom flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-white/30 bg-white shadow-[0_32px_100px_rgba(0,0,0,0.32)] sm:max-h-[calc(100vh-2rem)]"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b border-lider-line bg-white px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-lider-red">{variant.eyebrow}</p>
                <p className="truncate text-sm font-black text-lider-graphite">Автошкола «Лідер»</p>
              </div>
              <button
                type="button"
                aria-label="Закрити форму"
                onClick={() => closePopup("button")}
                className="tap-target inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lider-graphite text-white transition hover:bg-[#2a2a2a]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto">
              <div className="grid lg:grid-cols-[0.85fr_1fr]">
                <div className="relative bg-lider-red p-4 text-white sm:p-6 lg:p-8">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/15 text-white">
                  <Icon size={22} />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                  {variant.eyebrow}
                </p>
                <h2 id="lead-popup-title" className="mt-3 text-2xl font-black tracking-[-0.03em] sm:text-4xl">
                  {variant.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/78 sm:leading-7">{variant.text}</p>
                <div className="mt-5 grid gap-2 text-sm sm:mt-7 sm:gap-3">
                  {variant.bullets.map((item) => (
                    <div
                      key={item}
                      className="rounded-[14px] border border-white/15 bg-white/8 px-4 py-3 font-semibold"
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={openAiChat}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-black text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
                >
                  Запитати онлайн-помічника
                </button>
              </div>
              <div className="p-3 sm:p-5 lg:p-6">
                <LeadForm
                  variant="popup"
                  analyticsSource="popup"
                  title="Залиште заявку"
                  description="Контакти потрібні тільки для консультації щодо навчання. Після заявки форма більше не турбуватиме."
                  submitLabel={variant.submitLabel}
                  onSuccess={() => closePopup("lead-created")}
                />
              </div>
              </div>
            </div>
          </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function getVariantIndex() {
  if (typeof window === "undefined") {
    return 0;
  }

  const saved = Number(window.localStorage.getItem(VARIANT_KEY));

  if (Number.isInteger(saved) && saved >= 0 && saved < popupVariants.length) {
    return saved;
  }

  const next = Math.floor(Math.random() * popupVariants.length);
  window.localStorage.setItem(VARIANT_KEY, String(next));
  return next;
}

function hasSubmittedLead() {
  return window.localStorage.getItem(LEAD_SUBMITTED_KEY) === "true";
}
