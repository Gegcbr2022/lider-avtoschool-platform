// ─── Google Sign-In Architecture ─────────────────────────────────────────────
//
// TODO для власника проекту:
//
// 1. Отримати Google Web Client ID:
//    → Firebase Console → Authentication → Sign-in method → Google → Enable
//    → Скопіювати "Web client ID"
//
// 2. Отримати Android Client ID:
//    → Google Cloud Console → APIs & Credentials
//    → Create OAuth 2.0 Client ID → Android
//    → Package name: ua.lider.avtoschool
//    → SHA-1: run `keytool -keystore debug.keystore -list -v`
//
// 3. Оновити google-services.json в android/app/
//    → Firebase Console → Project Settings → Android → Download google-services.json
//
// 4. Встановити: npx expo install expo-auth-session expo-web-browser
//
// 5. Розкоментувати код нижче

export const GOOGLE_WEB_CLIENT_ID = ""; // TODO: вставити ваш Web Client ID
export const GOOGLE_ANDROID_CLIENT_ID = ""; // TODO: вставити Android Client ID

export async function signInWithGoogle(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!GOOGLE_WEB_CLIENT_ID) {
    return { success: false, error: "Google Web Client ID не налаштовано" };
  }

  // TODO: Розкоментувати після встановлення expo-auth-session:
  //
  // import * as Google from "expo-auth-session/providers/google";
  // import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
  // import { firebaseAuth } from "./firebase";
  //
  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   webClientId: GOOGLE_WEB_CLIENT_ID,
  //   androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  // });
  //
  // if (response?.type === "success") {
  //   const { id_token } = response.params;
  //   const credential = GoogleAuthProvider.credential(id_token);
  //   await signInWithCredential(firebaseAuth, credential);
  //   return { success: true };
  // }

  return { success: false, error: "Google Sign-In не налаштовано — дивись lib/googleAuth.ts" };
}

// ─── Phone Auth Architecture ──────────────────────────────────────────────────
//
// TODO для власника проекту:
//
// 1. Firebase Console → Authentication → Sign-in method → Phone → Enable
//
// 2. Додати тестові номери для розробки:
//    → Firebase Console → Authentication → Phone → Test phone numbers
//    → Напр.: +380500000000 / code: 123456
//
// 3. Для production додати SafetyNet/reCAPTCHA:
//    → Android: потрібен SHA-256 fingerprint у Firebase
//    → iOS: потрібен APNs certificate
//
// Поточна архітектура: phone login через email-proxy
// user enters phone → app creates email: {phone_digits}@phone.lider.ua
// This allows password login without SMS, with optional OTP later

export async function sendPhoneOTP(phone: string): Promise<{ success: boolean; verificationId?: string }> {
  // TODO: implement Firebase Phone Auth OTP
  // const { PhoneAuthProvider, signInWithPhoneNumber } = await import("firebase/auth");
  // const provider = new PhoneAuthProvider(firebaseAuth);
  // const verificationId = await provider.verifyPhoneNumber(phone, recaptchaVerifier);
  return { success: false };
}

export async function verifyPhoneOTP(verificationId: string, code: string): Promise<boolean> {
  // TODO: verify OTP and sign in
  return false;
}
