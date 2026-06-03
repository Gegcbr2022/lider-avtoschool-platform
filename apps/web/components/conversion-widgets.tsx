"use client";

import type { Locale } from "@lider/shared";
import { useEffect } from "react";
import { openLeadPopup } from "../lib/open-lead-popup";
import { FloatingPhoneButton } from "./floating-phone-button";
import { LeadPopup } from "./lead-popup";
import { MobileQuickActions } from "./mobile-quick-actions";
import { MotionReveal } from "./motion-reveal";

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
      openLeadPopup({
        source: target.dataset.leadSource ?? "cta_link",
        city: target.dataset.leadCity,
        branchId: target.dataset.leadBranchId,
        branch: target.dataset.leadBranch,
        category: toLeadCategory(target.dataset.leadCategory)
      });
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <>
      <MotionReveal />
      <LeadPopup locale={activeLocale} delayMs={leadPopupDelayMs} reopenAfterMs={reopenAfterMs} />
      <FloatingPhoneButton locale={activeLocale} />
      <MobileQuickActions activeLocale={activeLocale} />
    </>
  );
}

function toLeadCategory(value?: string) {
  return value === "A" || value === "A1" || value === "B" || value === "C" || value === "CE" ? value : undefined;
}
