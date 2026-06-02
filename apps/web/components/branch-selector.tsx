"use client";

import { branches } from "@lider/shared";
import { AnimatePresence, motion } from "framer-motion";
import { Clock3, MapPinned, MessageCircle, Route, Send } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export function BranchSelector() {
  const [activeId, setActiveId] = useState(branches[0]?.id ?? "kyiv");
  const activeBranch = useMemo(() => branches.find((branch) => branch.id === activeId) ?? branches[0], [activeId]);

  return (
    <div className="rounded-[30px] bg-[#1a1a1a] p-4 text-white shadow-[0_28px_90px_rgba(0,0,0,0.18)] sm:p-6 lg:p-8">
      <div className="grid gap-8 lg:grid-cols-[0.72fr_1.08fr] lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/58">Філіали</p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] md:text-6xl">
            Оберіть місто, а ми покажемо адресу, карту і контакт
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/68">
            Найближчу філію можна знайти за кілька секунд: адреса, графік, маршрут і запис на консультацію
            зібрані в одному місці.
          </p>
          <div className="mt-8 grid gap-2 sm:grid-cols-2">
            {branches.map((branch) => (
              <button
                key={branch.id}
                type="button"
                onClick={() => setActiveId(branch.id)}
                className={`tap-target rounded-[18px] border px-4 py-3 text-left text-sm font-bold transition ${
                  activeId === branch.id
                    ? "border-[#0b5c4a] bg-[#0b5c4a] text-white shadow-[0_16px_42px_rgba(11,92,74,0.2)]"
                    : "border-white/12 bg-white/8 text-white/78 hover:border-white/30"
                }`}
              >
                {branch.city}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white p-3 text-lider-graphite shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeBranch.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2 }}
            >
              <iframe
                title={`Карта філії ${activeBranch.city}`}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(activeBranch.mapQuery)}&output=embed`}
                className="h-[320px] w-full rounded-[22px] border-0 md:h-[420px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="grid gap-4 p-3 md:grid-cols-[1fr_auto] md:items-end md:p-5">
                <div>
                  <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-[#0b5c4a]">
                    <MapPinned size={14} />
                    Обрана філія
                  </p>
                  <h3 className="mt-3 text-3xl font-black tracking-[-0.03em]">{activeBranch.city}</h3>
                  <p className="mt-2 text-sm leading-6 text-lider-muted">{activeBranch.address}</p>
                  <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-lider-graphite">
                    <Clock3 size={16} className="text-[#0b5c4a]" />
                    {activeBranch.workingHours}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3 md:min-w-[360px]">
                  <a
                    href={activeBranch.routeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="tap-target inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#f4f4f4] px-4 py-3 text-sm font-bold text-lider-graphite"
                  >
                    <Route size={17} />
                    Маршрут
                  </a>
                  <Link
                    href="#signup"
                    className="tap-target inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#1a1a1a] px-4 py-3 text-sm font-bold text-white"
                  >
                    <MessageCircle size={17} />
                    Зворотний зв'язок
                  </Link>
                  <Link href="#signup" className="red-cta tap-target px-4 py-3 text-sm">
                    Запис
                    <Send size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
