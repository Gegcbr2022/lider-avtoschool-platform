// ─── Push Notifications — stub ────────────────────────────────────────────────
// expo-notifications (v0.30.x / v0.31.x) has a binary incompatibility with
// expo-modules-core 2.5.0 (Expo SDK 53) — BadgeModule crashes at startup.
// Until a compatible version ships, we implement a no-op stub so the rest
// of the app compiles and runs. The push-token registration path is preserved
// so that once a working expo-notifications build is available the stub can
// be swapped back for the real implementation with minimal changes.
//
// FCM architecture (already in place, just needs the token path unblocked):
//  1. App starts → requestPermissions() + registerPushToken()
//  2. Token saved to Firestore: userProfiles/{userId}.pushToken
//  3. Cloud Functions reads token → FCM → device notification
//     triggers: manager reply in chat, new lesson reminder, daily tip

import { Alert } from "react-native";
import { upsertUserProfile } from "./firestore";

export type NotificationPermissionStatus = "granted" | "denied" | "undetermined";

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  // On a real physical device this would request the OS permission dialog.
  // In the emulator we simulate "granted" so the test flow works.
  return "granted";
}

export async function registerPushToken(userId: string): Promise<string | null> {
  try {
    // When expo-notifications is re-enabled, call getExpoPushTokenAsync here.
    // For now, clear any stale pushToken to avoid sending to wrong device.
    await upsertUserProfile(userId, { pushToken: undefined });
  } catch {
    // Non-critical
  }
  return null;
}

export function setupNotificationListeners(
  _onNotification?: (notification: unknown) => void,
  _onResponse?: (response: unknown) => void
): () => void {
  return () => {};
}

export async function createNotificationChannels(): Promise<void> {
  // No-op — channels will be created once expo-notifications is re-added.
}

export async function scheduleLocalNotification(params: {
  title: string;
  body: string;
  channelId?: string;
  delaySeconds?: number;
}): Promise<string> {
  // Simulate a local notification with an Alert so the UX flow is testable.
  const { title, body, delaySeconds = 0 } = params;
  const showIt = () => Alert.alert(title, body);
  if (delaySeconds > 0) {
    setTimeout(showIt, delaySeconds * 1000);
  } else {
    showIt();
  }
  return "stub-notification-id";
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  // No-op
}
