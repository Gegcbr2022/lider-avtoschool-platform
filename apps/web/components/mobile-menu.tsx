"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, MessageCircle, PhoneCall, Send, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type NavItem = {
  href: string;
  label: string;
};

export function MobileMenu({ navItems }: { navItems: readonly NavItem[] }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
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
        className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] border border-lider-line bg-white text-lider-graphite shadow-sm lg:hidden"
      >
        <Menu size={22} />
      </button>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-[70] bg-lider-graphite/60 px-4 py-4 backdrop-blur-md lg:hidden"
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
              className="ml-auto flex h-full max-w-sm flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_28px_90px_rgba(0,0,0,0.22)]"
              initial={{ opacity: 0, x: 34, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              aria-label="Мобільне меню"
            >
              <div className="flex items-center justify-between border-b border-lider-line p-5">
                <div>
                  <p className="text-sm font-bold text-lider-graphite">Автошкола Лідер</p>
                  <p className="mt-1 text-xs text-lider-muted">Швидка навігація</p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Закрити меню"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#f4f4f4] text-lider-graphite"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <div className="grid gap-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      className="rounded-[18px] border border-lider-line bg-white px-4 py-4 text-base font-bold text-lider-graphite transition hover:border-lider-red hover:bg-[#fff1f1]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="mt-5 grid gap-3">
                  <Link href="#signup" onClick={close} className="red-cta tap-target px-5 py-3">
                    Записатися
                    <Send size={18} />
                  </Link>
                  <a
                    href="tel:0507383033"
                    className="tap-target inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#1a1a1a] px-5 py-3 text-sm font-bold text-white"
                  >
                    <PhoneCall size={18} />
                    Подзвонити
                  </a>
                  <a
                    href="https://t.me/LiderDriveBot?start=AYYUTE"
                    className="tap-target inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#229ED9] px-5 py-3 text-sm font-bold text-white"
                  >
                    <MessageCircle size={18} />
                    Telegram
                  </a>
                </div>
              </div>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
