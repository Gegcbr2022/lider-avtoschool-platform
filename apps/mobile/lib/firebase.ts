// ─── Firebase client for mobile ───────────────────────────────────────────────
// Project: lider-avtoschool-dev
// Auth: email/password + Google (optional)
// Persistence: AsyncStorage (survives app restarts)

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey:            "AIzaSyB3LZzjUwY9pIHROPmRVWHeRddXm2ZW2l8",
  authDomain:        "lider-avtoschool-dev.firebaseapp.com",
  projectId:         "lider-avtoschool-dev",
  storageBucket:     "lider-avtoschool-dev.firebasestorage.app",
  messagingSenderId: "128703486160",
  appId:             "1:128703486160:web:40e75f7bd37ae87d1d66d5",
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
  // Already initialized (hot reload)
  const { getAuth } = require("firebase/auth");
  _auth = getAuth(firebaseApp);
}

export const firebaseAuth = _auth;
export { firebaseApp };
