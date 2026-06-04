// ─── Network status hook ──────────────────────────────────────────────────────
// Uses a fast, reliable connectivity check (NOT the API endpoint)
// Firebase Functions cold-start takes 2-5s — using it as a "is internet online" check
// produces false-positive "offline" results.
import { useEffect, useRef, useState } from "react";

type NetworkState = "online" | "offline" | "unknown";

// Google's generate_204 endpoint: ~10ms response, no body, designed for connectivity checks
// Used by Android OS itself for network validation
const CONNECTIVITY_CHECK_URL = "https://clients3.google.com/generate_204";
const FALLBACK_CHECK_URL = "https://www.google.com";
const CHECK_TIMEOUT_MS = 6000;
const RECHECK_INTERVAL_MS = 20_000;
// Require 2 consecutive failures before declaring "offline" (avoids flapping)
const FAILURES_TO_OFFLINE = 2;

export function useNetworkStatus(): NetworkState {
  const [status, setStatus] = useState<NetworkState>("online"); // optimistic default
  const failCount = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let interval: ReturnType<typeof setInterval>;

    async function check() {
      const isUp = await pingAny([CONNECTIVITY_CHECK_URL, FALLBACK_CHECK_URL]);
      if (!mounted.current) return;

      if (isUp) {
        failCount.current = 0;
        setStatus("online");
      } else {
        failCount.current += 1;
        if (failCount.current >= FAILURES_TO_OFFLINE) {
          setStatus("offline");
        }
        // 1 failure: stay in current state (could be transient)
      }
    }

    check();
    interval = setInterval(check, RECHECK_INTERVAL_MS);

    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, []);

  return status;
}

async function pingAny(urls: string[]): Promise<boolean> {
  for (const url of urls) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), CHECK_TIMEOUT_MS);
      const res = await fetch(url, { method: "GET", signal: ctrl.signal });
      clearTimeout(t);
      // Any HTTP response (including 204, 200, 301) means internet works
      if (res.status < 600) return true;
    } catch {
      // Try next URL
    }
  }
  return false;
}

// ─── API availability check (separate from internet) ─────────────────────────
// Use this when you specifically need to know if the Lider API is reachable.
// Returns { internet: bool, api: bool }
export async function checkApiAvailability(apiBase: string): Promise<{ internet: boolean; api: boolean }> {
  const internet = await pingAny([CONNECTIVITY_CHECK_URL, FALLBACK_CHECK_URL]);
  if (!internet) return { internet: false, api: false };

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);
    const res = await fetch(`${apiBase}/health`, { signal: ctrl.signal });
    clearTimeout(t);
    return { internet: true, api: res.ok };
  } catch {
    return { internet: true, api: false };
  }
}
