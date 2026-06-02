"use client";

import type { Locale } from "@lider/shared";
import { AiChatWidget } from "./ai-chat-widget";
import { LeadPopup } from "./lead-popup";
import { MobileQuickActions } from "./mobile-quick-actions";

export function ConversionWidgets({
  activeLocale,
  leadPopupDelayMs,
  reopenAfterMs
}: {
  activeLocale: Locale;
  leadPopupDelayMs: number;
  reopenAfterMs: number;
}) {
  return (
    <>
      <LeadPopup locale={activeLocale} delayMs={leadPopupDelayMs} reopenAfterMs={reopenAfterMs} />
      <AiChatWidget />
      <MobileQuickActions activeLocale={activeLocale} />
    </>
  );
}
