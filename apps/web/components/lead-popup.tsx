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
    text: "Залиште телефон, і менеджер підкаже ціну теорії, документи, філію та найближчий старт у вашому місті.",
    bullets: ["A, A1, B, C, CE", "Ціна і графік без очікування", "Київ, Дніпро, Донеччина"],
    submitLabel: "Передзвоніть мені"
  },
  {
    id: "category-picker",
    icon: BrainCircuit,
    title: "Не знаєте, яка категорія потрібна?",
    eyebrow: "Підбір категорії",
    text: "Менеджер або AI-помічник допоможе обрати між A, A1, B, C і CE за досвідом, метою та містом навчання.",
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
    title: "AI-помічник уже на зв'язку",
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

    window.addEventListener("lider-lead-created", onLeadCreated);
    window.addEventListener("lider-ai-chat-state", onAiState);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(repeatTimer);
      window.removeEventListener("lider-lead-created", onLeadCreated);
      window.removeEventListener("lider-ai-chat-state", onAiState);
    };
  }, [delayMs, reopenAfterMs]);

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
  }, [isAiOpen]);

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
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function tryOpen(trigger: PopupTrigger) {
    if (isOpen || isAiOpen || hasSubmittedLead()) {
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
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#071512]/70 px-4 py-4 backdrop-blur-sm sm:items-center"
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
            className="w-full max-w-5xl overflow-hidden rounded-[24px] border border-white/20 bg-white shadow-[0_32px_100px_rgba(0,0,0,0.32)]"
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="grid lg:grid-cols-[0.85fr_1fr]">
              <div className="relative bg-lider-green p-6 text-white sm:p-8">
                <button
                  type="button"
                  aria-label="Закрити форму"
                  onClick={() => closePopup("button")}
                  className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/20"
                >
                  <X size={18} />
                </button>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-lider-yellow text-lider-graphite">
                  <Icon size={22} />
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-lider-yellow">
                  {variant.eyebrow}
                </p>
                <h2 id="lead-popup-title" className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  {variant.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/74">{variant.text}</p>
                <div className="mt-8 grid gap-3 text-sm">
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
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-lider-yellow transition hover:text-white"
                >
                  Запитати AI-помічника
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <LeadForm
                  variant="popup"
                  analyticsSource="popup"
                  title="Залиште заявку"
                  description="Контакти потрібні тільки для консультації щодо навчання. Після заявки popup більше не показується."
                  submitLabel={variant.submitLabel}
                  onSuccess={() => closePopup("lead-created")}
                />
              </div>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
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
