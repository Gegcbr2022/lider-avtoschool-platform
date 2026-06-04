// ─── Network status hook ──────────────────────────────────────────────────────
import { useEffect, useState } from "react";

type NetworkState = "online" | "offline" | "unknown";

export function useNetworkStatus(): NetworkState {
  const [status, setStatus] = useState<NetworkState>("unknown");

  useEffect(() => {
    let mounted = true;
    let interval: ReturnType<typeof setInterval>;

    async function check() {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        await fetch("https://api-jd6b6vy57a-ew.a.run.app/health", {
          signal: controller.signal,
          method: "HEAD",
        });
        clearTimeout(timer);
        if (mounted) setStatus("online");
      } catch {
        if (mounted) setStatus("offline");
      }
    }

    check();
    interval = setInterval(check, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return status;
}
