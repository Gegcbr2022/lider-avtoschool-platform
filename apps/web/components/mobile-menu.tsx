"use client";

import { siteBrand, socialLinks } from "@lider/shared";
import { AnimatePresence, motion } from "framer-motion";
import { Languages, Menu, MessageCircle, PhoneCall, Send, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BrandLogo } from "./brand-logo";

type NavItem = {
  href: string;
  label: string;
};

export function MobileMenu({ navItems }: { navItems: readonly NavItem[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const telegram = socialLinks.find((item) => item.id === "telegram");
  const whatsapp = socialLinks.find((item) => item.id === "whatsapp");
  const primaryPhoneHref = siteBrand.phoneLabel.replace(/\s+/g, "");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    document.body.dataset.liderMobileMenuOpen = String(isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
    window.dispatchEvent(new CustomEvent("lider-mobile-menu-state", { detail: { open: isOpen } }));

    return () => {
      delete document.body.dataset.liderMobileMenuOpen;
      document.body.style.overflow = "";
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
        aria-label="Відкрити меню"
        className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] border border-lider-line bg-white text-lider-graphite shadow-sm transition hover:border-lider-red hover:text-lider-red lg:hidden"
      >
        <Menu size={22} />
      </button>
      {isMounted
        ? createPortal(
            <AnimatePresence>
              {isOpen ? (
                <motion.div
                  className="fixed inset-0 z-[70] overflow-hidden bg-lider-graphite/60 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-4 lg:hidden"
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
                    className="safe-bottom ml-auto flex h-full w-[min(92vw,400px)] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_28px_90px_rgba(0,0,0,0.22)]"
                    initial={{ opacity: 0, x: 34, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 24, scale: 0.98 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    aria-label="Мобільне меню"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-lider-line p-4">
                      <BrandLogo imageClassName="w-24 sm:w-[112px]" onClick={close} />
                      <button
                        type="button"
                        onClick={close}
                        aria-label="Закрити меню"
                        className="tap-target inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f4f4f4] text-lider-graphite transition hover:bg-lider-graphite hover:text-white"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-lider-muted">
                        Швидка навігація
                      </p>
                      <div className="grid gap-2">
                        {navItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={close}
                            className="tap-target rounded-[18px] border border-lider-line bg-white px-4 py-4 text-base font-black text-lider-graphite transition hover:border-lider-red hover:bg-[#fff1f1]"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                      <div className="mt-5 grid gap-3">
                        <Link href="#signup" onClick={close} className="red-cta tap-target px-5 py-4 text-base">
                          Залишити заявку
                          <Send size={18} />
                        </Link>
                        <a
                          href={`tel:${primaryPhoneHref}`}
                          onClick={close}
                          className="tap-target inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#1a1a1a] px-5 py-3 text-sm font-black text-white transition hover:bg-[#2a2a2a]"
                        >
                          <PhoneCall size={18} />
                          Подзвонити
                        </a>
                        <div className="grid grid-cols-2 gap-2">
                          {telegram ? (
                            <a
                              href={telegram.href}
                              target="_blank"
                              rel="noreferrer"
                              onClick={close}
                              className="tap-target inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#229ED9] px-4 py-3 text-sm font-black text-white transition hover:brightness-105"
                            >
                              <Send size={18} />
                              Telegram
                            </a>
                          ) : null}
                          {whatsapp ? (
                            <a
                              href={whatsapp.href}
                              onClick={close}
                              className="tap-target inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#25D366] px-4 py-3 text-sm font-black text-white transition hover:brightness-105"
                            >
                              <MessageCircle size={18} />
                              WhatsApp
                            </a>
                          ) : null}
                        </div>
                        <div className="rounded-[18px] border border-lider-line bg-lider-background p-3">
                          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-lider-muted">
                            <Languages size={16} aria-hidden />
                            Мова
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {["UA", "RU", "EN"].map((lang) => (
                              <button
                                key={lang}
                                type="button"
                                aria-pressed={lang === "UA"}
                                className={`tap-target rounded-[14px] px-3 py-2 text-sm font-black transition ${
                                  lang === "UA"
                                    ? "bg-lider-red text-white shadow-[0_12px_28px_rgba(255,30,30,0.22)]"
                                    : "bg-white text-lider-graphite hover:bg-[#fff1f1] hover:text-lider-red"
                                }`}
                              >
                                {lang}
                              </button>
                            ))}
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
