"use client";

import { AiChatWidget } from "./ai-chat-widget";
import { LeadPopup } from "./lead-popup";
import { MobileQuickActions } from "./mobile-quick-actions";

export function ConversionWidgets({
  leadPopupDelayMs,
  reopenAfterMs
}: {
  leadPopupDelayMs: number;
  reopenAfterMs: number;
}) {
  return (
    <>
      <LeadPopup delayMs={leadPopupDelayMs} reopenAfterMs={reopenAfterMs} />
      <AiChatWidget />
      <MobileQuickActions />
    </>
  );
}
