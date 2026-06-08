// ─── Firebase App Check (Play Integrity on Android) ─────────────────────────────
// BlueStacks/emulators cannot use Play Integrity. For local emulator QA, pass a
// debug token through app.config.ts via FIREBASE_APP_CHECK_DEBUG_TOKEN. Do not
// commit real debug tokens or enable the debug provider for production builds.
import Constants from "expo-constants";

type AppCheckExtra = {
  firebaseAppCheckDebugProvider?: boolean;
  firebaseAppCheckDebugToken?: string;
};

let initialized = false;

function getAppCheckExtra(): AppCheckExtra {
  return (Constants.expoConfig?.extra ?? {}) as AppCheckExtra;
}

function debugProviderConfig(debugToken?: string): Record<string, string> {
  return debugToken ? { provider: "debug", debugToken } : { provider: "debug" };
}

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
    const extra = getAppCheckExtra();
    const debugToken = extra.firebaseAppCheckDebugToken?.trim();
    const useDebugProvider = Boolean(extra.firebaseAppCheckDebugProvider || debugToken);

    // 1) Native RNFirebase App Check. Release builds default to Play Integrity;
    // BlueStacks/dev builds opt into the debug provider through local config.
    const rnProvider = rnAppCheckModule().newReactNativeFirebaseAppCheckProvider();
    rnProvider.configure({
      android: useDebugProvider ? debugProviderConfig(debugToken) : { provider: "playIntegrity" },
      apple: useDebugProvider ? debugProviderConfig(debugToken) : { provider: "appAttestWithDeviceCheckFallback" },
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

    if (__DEV__) {
      console.log(`[AppCheck] Initialized with ${useDebugProvider ? "debug" : "production"} provider`);
    }
  } catch (error) {
    // Non-fatal — app continues without App Check; Firestore rules still protect data.
    console.warn("[AppCheck] Init skipped:", error instanceof Error ? error.message : String(error));
  }
}
