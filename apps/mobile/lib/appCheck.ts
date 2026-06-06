// ─── Firebase App Check (Play Integrity on Android) ─────────────────────────────
// Bridges the native @react-native-firebase/app-check attestation token into the
// Firebase JS SDK (which this app uses for Auth/Firestore), so direct Firestore
// requests (aiLogs, clubPosts, stories, chat) carry a verifiable App Check token.
//
// Everything is wrapped in try/catch and lazy-required: if the native module is
// missing or init fails, the app keeps working normally (App Check is defense-in-
// depth — Firestore rules already require auth). Do NOT enable Firestore
// "Enforce" in Firebase Console until this is verified live on a real device.

let initialized = false;

export function initAppCheck(): void {
  if (initialized) return;
  initialized = true;

  try {
    // Lazy require so nothing breaks at JS bundle import time.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { initializeAppCheck, CustomProvider } = require("firebase/app-check");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rnAppCheckModule = require("@react-native-firebase/app-check").default;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { firebaseApp } = require("./firebase");

    const isDev = typeof __DEV__ !== "undefined" && __DEV__;

    // 1) Native RNFirebase App Check — obtains a Play Integrity (Android) /
    //    App Attest (iOS) token. Debug provider in dev builds.
    const rnProvider = rnAppCheckModule().newReactNativeFirebaseAppCheckProvider();
    rnProvider.configure({
      android: { provider: isDev ? "debug" : "playIntegrity" },
      apple: { provider: isDev ? "debug" : "appAttest" },
    });
    rnAppCheckModule().initializeAppCheck({ provider: rnProvider, isTokenAutoRefreshEnabled: true });

    // 2) Bridge that token into the Firebase JS SDK via a CustomProvider.
    initializeAppCheck(firebaseApp, {
      provider: new CustomProvider({
        getToken: async () => {
          const result = await rnAppCheckModule().getToken();
          return { token: result.token, expireTimeMillis: Date.now() + 30 * 60 * 1000 };
        },
      }),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    // Non-fatal — app continues without App Check; rules still protect data.
    console.warn("App Check init skipped:", error instanceof Error ? error.message : String(error));
  }
}
