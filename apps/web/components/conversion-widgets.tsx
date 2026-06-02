"use client";

import type { Locale } from "@lider/shared";
import { useEffect } from "react";
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
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>(
              "a[href='#signup'], a[href$='#signup'], a[href='#application'], a[href$='#application']"
            )
          : null;

      if (!target) {
        return;
      }

      event.preventDefault();
      window.dispatchEvent(
        new CustomEvent("lider-open-lead-popup", {
          detail: { source: target.dataset.leadSource ?? "cta-link" }
        })
      );
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <>
      <LeadPopup locale={activeLocale} delayMs={leadPopupDelayMs} reopenAfterMs={reopenAfterMs} />
      <AiChatWidget />
      <MobileQuickActions activeLocale={activeLocale} />
    </>
  );
}
