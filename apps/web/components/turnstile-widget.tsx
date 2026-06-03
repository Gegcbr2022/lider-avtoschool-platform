"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "flexible" | "compact";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type TurnstileWidgetProps = {
  label: string;
  missingLabel?: string;
  resetKey?: number;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
};

export function TurnstileWidget({ label, missingLabel, resetKey, onVerify, onExpire, onError }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const callbacksRef = useRef({ onVerify, onExpire, onError });

  useEffect(() => {
    callbacksRef.current = { onVerify, onExpire, onError };
  }, [onVerify, onExpire, onError]);

  useEffect(() => {
    if (!SITE_KEY) {
      return;
    }

    let cancelled = false;

    const renderWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => callbacksRef.current.onVerify(token),
        "expired-callback": () => callbacksRef.current.onExpire?.(),
        "error-callback": () => callbacksRef.current.onError?.(),
        theme: "light",
        size: "flexible"
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const existing = document.querySelector<HTMLScriptElement>('script[src*="turnstile"]');

      if (existing) {
        existing.addEventListener("load", renderWidget);
      } else {
        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        script.async = true;
        script.defer = true;
        script.onload = renderWidget;
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;

      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Widget may already be gone after navigation or modal close.
        }
      }

      widgetIdRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (resetKey === undefined || !widgetIdRef.current || !window.turnstile) {
      return;
    }

    try {
      window.turnstile.reset(widgetIdRef.current);
    } catch {
      callbacksRef.current.onError?.();
    }
  }, [resetKey]);

  if (!SITE_KEY) {
    return missingLabel ? <p className="text-sm font-semibold text-red-600">{missingLabel}</p> : null;
  }

  return (
    <div className="rounded-[16px] border border-lider-line bg-white p-3">
      <p className="mb-3 text-sm font-black text-lider-graphite">{label}</p>
      <div ref={containerRef} />
    </div>
  );
}
