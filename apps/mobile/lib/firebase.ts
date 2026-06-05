// ─── Firebase client for mobile ───────────────────────────────────────────────
// Project: lider-avtoschool (PRODUCTION)
// Auth: email/password + Google (optional)
// Persistence: AsyncStorage (survives app restarts)

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { type Persistence, initializeAuth } from "firebase/auth";
// firebase v12 TS types omit getReactNativePersistence; the symbol still exists at runtime.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const getReactNativePersistence: (storage: unknown) => Persistence = (require("firebase/auth") as any).getReactNativePersistence;

// Production Firebase config — matches google-services.json (lider-avtoschool)
// Project number: 111711727739
const firebaseConfig = {
  apiKey:            "AIzaSyCvNtROKFtF-wQPHbiUKxcxVnHlN26R0oI",
  authDomain:        "lider-avtoschool.firebaseapp.com",
  projectId:         "lider-avtoschool",
  storageBucket:     "lider-avtoschool.firebasestorage.app",
  messagingSenderId: "111711727739",
  appId:             "1:111711727739:web:fc4b00ba23303c28fd32de",
};

// Singleton — safe to call multiple times
const firebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

// initializeAuth must be called only once; after that use getAuth()
let _auth: ReturnType<typeof initializeAuth>;
try {
  _auth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  const { getAuth } = require("firebase/auth");
  _auth = getAuth(firebaseApp);
}

export const firebaseAuth = _auth;
export { firebaseApp };
