"use client";

export type LeadPopupContext = {
  source?: string;
  city?: string;
  branchId?: string;
  branch?: string;
  category?: "A" | "A1" | "B" | "C" | "CE";
};

export function openLeadPopup(context: string | LeadPopupContext = "cta") {
  if (typeof window === "undefined") {
    return;
  }

  const detail = typeof context === "string" ? { source: context } : context;

  window.dispatchEvent(new CustomEvent("lider-open-lead-popup", { detail }));
}
