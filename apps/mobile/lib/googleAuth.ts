// ─── Google Sign-In — Production implementation ───────────────────────────────
// Uses @react-native-google-signin/google-signin + Firebase Auth
// Web Client ID comes from google-services.json (client_type: 3)
// SHA-1 + SHA-256 must be registered in Firebase Console (done)

import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { firebaseAuth } from "./firebase";

export const GOOGLE_WEB_CLIENT_ID =
  "111711727739-hsmelc7ch68627g80j7me7f9nvgnrg16.apps.googleusercontent.com";

// Call once at app startup (safe to call multiple times)
export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
}

export type GoogleSignInResult =
  | { success: true }
  | { success: false; cancelled: boolean; error?: string };

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (isSuccessResponse(response)) {
      const idToken = response.data?.idToken;
      if (!idToken) {
        return { success: false, cancelled: false, error: "Google не повернув ID Token" };
      }
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(firebaseAuth, credential);
      return { success: true };
    }

    // type === 'cancelled'
    return { success: false, cancelled: true };
  } catch (error: unknown) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          return { success: false, cancelled: true };
        case statusCodes.IN_PROGRESS:
          return { success: false, cancelled: false, error: "Вхід вже виконується" };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return {
            success: false,
            cancelled: false,
            error: "Google Play Services недоступний або застарілий. Оновіть Play Services.",
          };
        default:
          return {
            success: false,
            cancelled: false,
            error: `Google помилка: ${error.code}`,
          };
      }
    }
    const msg = error instanceof Error ? error.message : "Невідома помилка";
    return { success: false, cancelled: false, error: `Помилка Google Sign-In: ${msg}` };
  }
}

export async function signOutFromGoogle() {
  try {
    await GoogleSignin.signOut();
  } catch {
    // ignore — Firebase sign-out is the authoritative one
  }
}
