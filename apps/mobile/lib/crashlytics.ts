// ─── Crashlytics safe wrapper ──────────────────────────────────────────────────
// Lazy-requires the native module so JS-only builds (web/tests) don't break.
// All exports are no-ops when the native module is unavailable.

type NativeCrashlytics = {
  log(msg: string): void;
  recordError(e: Error, jsErrorContext?: string): void;
  setUserId(id: string): Promise<null>;
  setAttribute(name: string, value: string): Promise<null>;
};

function get(): NativeCrashlytics | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    return (require("@react-native-firebase/crashlytics") as any).default() as NativeCrashlytics;
  } catch {
    return null;
  }
}

/** Low-level breadcrumb — visible in Crashlytics crash reports */
export function crashLog(msg: string): void {
  get()?.log(msg);
}

/** Record a non-fatal error with optional context label */
export function crashError(error: unknown, context?: string): void {
  const err = error instanceof Error ? error : new Error(String(error));
  get()?.recordError(err, context);
}

/** Associate current session with an authenticated user id */
export function crashSetUser(userId: string): void {
  get()?.setUserId(userId).catch(() => {});
}

/** Attach a string attribute to the crash session */
export function crashAttr(key: string, value: string): void {
  get()?.setAttribute(key, value).catch(() => {});
}
