"use client";

import { MapPinned, MessageCircle, PhoneCall, Send } from "lucide-react";
import Link from "next/link";

export function MobileQuickActions() {
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 rounded-[22px] border border-white/70 bg-white/94 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5 gap-1.5">
        <a
          href="tel:0507383033"
          className="tap-target inline-flex flex-col items-center justify-center gap-1 rounded-[15px] bg-[#1a1a1a] px-1 py-2 text-[10px] font-bold text-white"
        >
          <PhoneCall size={17} />
          Дзвінок
        </a>
        <a
          href="https://t.me/LiderDriveBot?start=AYYUTE"
          className="tap-target inline-flex flex-col items-center justify-center gap-1 rounded-[15px] bg-[#229ED9] px-1 py-2 text-[10px] font-bold text-white"
        >
          <MessageCircle size={17} />
          TG
        </a>
        <a
          href="whatsapp://send/?phone=380504233022"
          className="tap-target inline-flex flex-col items-center justify-center gap-1 rounded-[15px] bg-[#25D366] px-1 py-2 text-[10px] font-bold text-white"
        >
          <MessageCircle size={17} />
          WA
        </a>
        <Link
          href="#branches"
          className="tap-target inline-flex flex-col items-center justify-center gap-1 rounded-[15px] bg-[#f4f4f4] px-1 py-2 text-[10px] font-bold text-lider-graphite"
        >
          <MapPinned size={17} />
          Філіал
        </Link>
        <Link
          href="#signup"
          className="tap-target inline-flex flex-col items-center justify-center gap-1 rounded-[15px] bg-lider-red px-1 py-2 text-[10px] font-bold text-white"
        >
          <Send size={17} />
          Запис
        </Link>
      </div>
    </div>
  );
}
