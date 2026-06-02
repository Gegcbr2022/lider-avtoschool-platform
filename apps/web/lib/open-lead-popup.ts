"use client";

export function openLeadPopup(source = "cta") {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("lider-open-lead-popup", { detail: { source } }));
}
