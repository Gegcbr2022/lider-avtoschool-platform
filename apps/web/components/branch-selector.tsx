"use client";

import { branches } from "@lider/shared";
import { AnimatePresence, motion } from "framer-motion";
import { Clock3, MapPinned, Route, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { openLeadPopup } from "../lib/open-lead-popup";

export function BranchSelector() {
  const [activeId, setActiveId] = useState(branches[0]?.id ?? "kyiv");
  const activeBranch = useMemo(() => branches.find((branch) => branch.id === activeId) ?? branches[0], [activeId]);

  return (
    <div className="rounded-[30px] bg-lider-graphite p-4 text-white shadow-[0_28px_90px_rgba(26,26,26,0.18)] sm:p-6 lg:p-8">
      <div className="grid gap-8 lg:grid-cols-[0.72fr_1.08fr] lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/58">Філіали</p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] md:text-6xl">
            Оберіть місто, а ми покажемо адресу, карту і контакт
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/68">
            Адреса, графік і маршрут зібрані в одному місці. Для запису залиште заявку, а менеджер підкаже
            найближчий старт.
          </p>
          <div className="mt-8 grid gap-2 sm:grid-cols-2">
            {branches.map((branch) => (
              <button
                key={branch.id}
                type="button"
                onClick={() => setActiveId(branch.id)}
                className={`tap-target rounded-[18px] border px-4 py-3 text-left text-sm font-bold transition ${
                  activeId === branch.id
                    ? "border-lider-red bg-lider-red text-white shadow-[0_16px_42px_rgba(255,30,30,0.22)]"
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
                  <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-lider-red">
                    <MapPinned size={14} />
                    Обрана філія
                  </p>
                  <h3 className="mt-3 text-3xl font-black tracking-[-0.03em]">{activeBranch.city}</h3>
                  <p className="mt-2 text-sm leading-6 text-lider-muted">{activeBranch.address}</p>
                  <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-lider-graphite">
                    <Clock3 size={16} className="text-lider-red" />
                    {activeBranch.workingHours}
                  </p>
                  <p className="mt-2 text-sm font-bold text-lider-muted">{activeBranch.phone}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-[0.9fr_1.1fr] md:min-w-[300px]">
                  <a
                    href={activeBranch.routeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="tap-target inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#f4f4f4] px-4 py-3 text-sm font-bold text-lider-graphite transition hover:bg-lider-graphite hover:text-white"
                  >
                    <Route size={17} />
                    Маршрут
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      openLeadPopup({
                        source: "branch_card",
                        city: activeBranch.city,
                        branchId: activeBranch.id,
                        branch: activeBranch.city
                      })
                    }
                    className="red-cta tap-target px-4 py-3 text-sm"
                  >
                    Залишити заявку
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
