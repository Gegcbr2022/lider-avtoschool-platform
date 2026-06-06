"use client";

import type { Locale } from "@lider/shared";
import { AnimatePresence, motion } from "framer-motion";
import { Languages, Menu, Send, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BrandLogo } from "./brand-logo";
import { LanguageSwitcher } from "./language-switcher";

type NavItem = {
  href: string;
  label: string;
};

const menuCopy: Record<Locale, { quickNav: string; apply: string; language: string; close: string; open: string }> = {
  uk: { quickNav: "Швидка навігація", apply: "Залишити заявку", language: "Мова", close: "Закрити меню", open: "Відкрити меню" },
  ru: { quickNav: "Быстрая навигация", apply: "Оставить заявку", language: "Язык", close: "Закрыть меню", open: "Открыть меню" },
  en: { quickNav: "Navigation", apply: "Send request", language: "Language", close: "Close menu", open: "Open menu" }
};

export function MobileMenu({ navItems, activeLocale }: { navItems: readonly NavItem[]; activeLocale: Locale }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const mc = menuCopy[activeLocale] ?? menuCopy.uk;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.dataset.liderMobileMenuOpen = "true";
      document.body.style.overflow = "hidden";
      document.body.style.overscrollBehavior = "none";
    } else {
      delete document.body.dataset.liderMobileMenuOpen;
      document.body.style.overflow = "";
      document.body.style.overscrollBehavior = "";
    }
    window.dispatchEvent(new CustomEvent("lider-mobile-menu-state", { detail: { open: isOpen } }));

    return () => {
      delete document.body.dataset.liderMobileMenuOpen;
      document.body.style.overflow = "";
      document.body.style.overscrollBehavior = "";
    };
  }, [isOpen]);

  function close() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={mc.open}
        className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] border border-lider-line bg-white text-lider-graphite shadow-sm transition hover:border-lider-red hover:text-lider-red lg:hidden"
      >
        <Menu size={22} />
      </button>
      {isMounted
        ? createPortal(
            <AnimatePresence>
              {isOpen ? (
                <motion.div
                  className="fixed inset-0 z-[100] flex justify-end overflow-hidden bg-lider-graphite/60 backdrop-blur-sm lg:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                      close();
                    }
                  }}
                >
                  <motion.nav
                    className="safe-bottom flex h-full w-[min(90vw,400px)] flex-col overflow-hidden bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.15)]"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    aria-label="Мобільне меню"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-lider-line p-4 sm:p-5">
                      <BrandLogo imageClassName="w-24 sm:w-[112px]" onClick={close} />
                      <button
                        type="button"
                        onClick={close}
                        aria-label={mc.close}
                        className="tap-target inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f4f4f4] text-lider-graphite transition hover:bg-lider-graphite hover:text-white"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
                      <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-lider-muted">
                        {mc.quickNav}
                      </p>
                      <div className="grid gap-2">
                        {navItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={close}
                            className="tap-target rounded-[18px] border border-lider-line bg-white px-5 py-4 text-base font-black text-lider-graphite transition hover:border-lider-red hover:bg-[#fff1f1]"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                      <div className="mt-8 grid gap-3">
                        <Link href="#signup" data-lead-source="sticky_mobile" onClick={close} className="red-cta tap-target px-5 py-4 text-base">
                          {mc.apply}
                          <Send size={18} />
                        </Link>
                        <div className="rounded-[18px] border border-lider-line bg-lider-background p-4">
                          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-lider-muted">
                            <Languages size={16} aria-hidden />
                            {mc.language}
                          </div>
                          <div className="mt-4">
                            <LanguageSwitcher activeLocale={activeLocale} compact />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.nav>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </>
  );
}
