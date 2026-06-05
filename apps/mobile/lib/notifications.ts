// ─── Push Notifications — Expo Notifications + Firebase Cloud Messaging ───────
// Android: FCM via google-services.json (project: lider-avtoschool)
// iOS: APNs via EAS credentials (requires apple developer account)
//
// Flow:
//  1. App starts → requestPermissions() + registerPushToken()
//  2. Push token saved in Firestore: userProfiles/{userId}.pushToken
//  3. Server (Cloud Functions) reads token → sends notification via FCM
//     when: manager replies in chat, new lesson reminder, daily tip

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { upsertUserProfile } from "./firestore";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }) as Notifications.NotificationBehavior,
});

export type NotificationPermissionStatus = "granted" | "denied" | "undetermined";

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  const existing = await Notifications.getPermissionsAsync();
  // PermissionResponse has `granted: boolean` and `canAskAgain: boolean`
  const existingResp = existing as unknown as { granted: boolean; canAskAgain: boolean };
  if (existingResp.granted) return "granted";

  const result = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  const resp = result as unknown as { granted: boolean; canAskAgain: boolean };
  if (resp.granted) return "granted";
  return resp.canAskAgain ? "undetermined" : "denied";
}

export async function registerPushToken(userId: string): Promise<string | null> {
  try {
    // Physical device only (emulators don't support push)
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: "74bb8f9a-fc35-4016-b110-a17da4dcd31c",
    });

    // Save to Firestore so server can find it
    await upsertUserProfile(userId, { pushToken: token });
    return token;
  } catch {
    // Emulator / permission denied / no projectId configured — silently ignore
    return null;
  }
}

export function setupNotificationListeners(
  onNotification?: (notification: Notifications.Notification) => void,
  onResponse?: (response: Notifications.NotificationResponse) => void
): () => void {
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    onNotification?.(notification);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    onResponse?.(response);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

// ─── Android notification channels ───────────────────────────────────────────
// Must be created before first notification on Android 8+

export async function createNotificationChannels(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("messages", {
    name: "Повідомлення",
    description: "Нові повідомлення від менеджера та інструктора",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: "default",
  });

  await Notifications.setNotificationChannelAsync("reminders", {
    name: "Нагадування",
    description: "Нагадування про заняття та тести",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: "default",
  });

  await Notifications.setNotificationChannelAsync("tips", {
    name: "Поради дня",
    description: "Щоденні поради для підготовки до іспиту",
    importance: Notifications.AndroidImportance.LOW,
  });
}
