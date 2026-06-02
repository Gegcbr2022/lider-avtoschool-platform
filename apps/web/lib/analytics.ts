"use client";

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    posthog?: {
      capture: (eventName: string, payload?: AnalyticsPayload) => void;
    };
  }
}

export function trackEvent(eventName: string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: eventName, ...payload });
  window.posthog?.capture(eventName, payload);

  if (process.env.NODE_ENV !== "production") {
    console.debug(`[analytics] ${eventName}`, payload);
  }
}
