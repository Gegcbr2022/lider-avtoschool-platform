import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging, { type FirebaseMessagingTypes } from "@react-native-firebase/messaging";
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  EventType,
  RepeatFrequency,
  TriggerType,
  type Notification,
  type TimestampTrigger,
} from "@notifee/react-native";
import { Platform } from "react-native";
import { getMyBookings, getUserStats, upsertUserProfile, type BookingDoc } from "./firestore";

export type NotificationPermissionStatus = "granted" | "denied" | "undetermined";

export type NotificationKind = "chat" | "booking" | "daily-test" | "streak" | "system";

export type NotificationInboxItem = {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
  createdAt: string;
  readAt?: string;
  data?: Record<string, string>;
};

export type NotificationResponsePayload = {
  data: Record<string, string>;
  kind: NotificationKind;
};

const INBOX_KEY = "lider-notification-inbox-v1";
const MAX_INBOX_ITEMS = 50;
const DAILY_TEST_ID = "daily-test-reminder";
const STREAK_ID = "streak-reminder";

const CHANNELS = {
  chat: "chat",
  booking: "booking",
  training: "training",
  reminders: "reminders",
} as const;

const inboxListeners = new Set<(items: NotificationInboxItem[]) => void>();
let backgroundHandlersRegistered = false;

function normalizeData(data?: Record<string, string | object>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(data ?? {})) {
    out[key] = typeof value === "string" ? value : JSON.stringify(value);
  }
  return out;
}

function kindFromData(data: Record<string, string>): NotificationKind {
  const type = data.type ?? data.kind;
  if (type === "chat") return "chat";
  if (type === "booking" || type === "booking-reminder") return "booking";
  if (type === "daily-test") return "daily-test";
  if (type === "streak") return "streak";
  return "system";
}

function channelForKind(kind: NotificationKind): string {
  if (kind === "chat") return CHANNELS.chat;
  if (kind === "booking") return CHANNELS.booking;
  if (kind === "daily-test" || kind === "streak") return CHANNELS.training;
  return CHANNELS.reminders;
}

function pressAction() {
  return { id: "default" };
}

function nextLocalTime(hour: number, minute: number): number {
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  return next.getTime();
}

function formatBookingTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

async function emitInbox(): Promise<void> {
  const items = await getNotificationInbox();
  for (const listener of inboxListeners) listener(items);
  await notifee.setBadgeCount(items.filter((item) => !item.readAt).length).catch(() => {});
}

async function recordNotification(params: {
  id?: string;
  title?: string;
  body?: string;
  data?: Record<string, string>;
  kind?: NotificationKind;
}): Promise<void> {
  const data = params.data ?? {};
  const kind = params.kind ?? kindFromData(data);
  const id = params.id ?? data.messageId ?? data.conversationId ?? `${kind}-${Date.now()}`;
  const title = params.title ?? data.title ?? "Автошкола Лідер";
  const body = params.body ?? data.body ?? "";

  const current = await getNotificationInbox();
  const existing = current.find((item) => item.id === id);
  const nextItem: NotificationInboxItem = existing
    ? { ...existing, title, body, kind, data: { ...existing.data, ...data } }
    : { id, title, body, kind, data, createdAt: new Date().toISOString() };

  const next = [nextItem, ...current.filter((item) => item.id !== id)].slice(0, MAX_INBOX_ITEMS);
  await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(next));
  await emitInbox();
}

async function recordRemoteMessage(message: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
  const data = normalizeData(message.data);
  await recordNotification({
    id: message.messageId ?? data.messageId,
    title: message.notification?.title ?? data.title,
    body: message.notification?.body ?? data.body,
    data,
  });
}

async function recordNotifeeNotification(notification?: Notification): Promise<void> {
  if (!notification) return;
  const data = normalizeData(notification.data as Record<string, string | object> | undefined);
  await recordNotification({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    data,
  });
}

async function displayRemoteMessage(message: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
  const data = normalizeData(message.data);
  const kind = kindFromData(data);
  await notifee.displayNotification({
    id: message.messageId ?? data.messageId,
    title: message.notification?.title ?? data.title ?? "Автошкола Лідер",
    body: message.notification?.body ?? data.body ?? "",
    data,
    android: {
      channelId: channelForKind(kind),
      pressAction: pressAction(),
    },
  });
}

function responseFromData(data: Record<string, string>): NotificationResponsePayload {
  return { data, kind: kindFromData(data) };
}

function notificationData(notification?: Notification): Record<string, string> {
  return normalizeData(notification?.data as Record<string, string | object> | undefined);
}

export function setupNotificationBackgroundHandlers(): void {
  if (backgroundHandlersRegistered) return;
  backgroundHandlersRegistered = true;

  messaging().setBackgroundMessageHandler(async (message) => {
    await recordRemoteMessage(message);
  });

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.DELIVERED) {
      await recordNotifeeNotification(detail.notification);
    }
  });
}

setupNotificationBackgroundHandlers();

export function subscribeNotificationInbox(listener: (items: NotificationInboxItem[]) => void): () => void {
  inboxListeners.add(listener);
  void getNotificationInbox().then(listener).catch(() => listener([]));
  return () => inboxListeners.delete(listener);
}

export async function getNotificationInbox(): Promise<NotificationInboxItem[]> {
  try {
    const raw = await AsyncStorage.getItem(INBOX_KEY);
    return raw ? (JSON.parse(raw) as NotificationInboxItem[]) : [];
  } catch {
    return [];
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  const items = await getNotificationInbox();
  return items.filter((item) => !item.readAt).length;
}

export async function markAllNotificationsRead(): Promise<void> {
  const now = new Date().toISOString();
  const items = await getNotificationInbox();
  await AsyncStorage.setItem(
    INBOX_KEY,
    JSON.stringify(items.map((item) => item.readAt ? item : { ...item, readAt: now }))
  );
  await emitInbox();
}

export async function clearNotificationInbox(): Promise<void> {
  await AsyncStorage.removeItem(INBOX_KEY);
  await emitInbox();
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  try {
    await createNotificationChannels();
    const settings = await notifee.requestPermission();
    if (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    ) {
      await messaging().requestPermission().catch(() => undefined);
      return "granted";
    }
    if (settings.authorizationStatus === AuthorizationStatus.DENIED) return "denied";
    return "undetermined";
  } catch {
    return Platform.OS === "android" && Platform.Version < 33 ? "granted" : "denied";
  }
}

export async function registerPushToken(userId: string): Promise<string | null> {
  try {
    await messaging().registerDeviceForRemoteMessages();
    const pushToken = await messaging().getToken();
    if (!pushToken) return null;
    await upsertUserProfile(userId, { pushToken });
    return pushToken;
  } catch {
    return null;
  }
}

export function setupPushTokenRefresh(userId: string): () => void {
  return messaging().onTokenRefresh((pushToken) => {
    void upsertUserProfile(userId, { pushToken }).catch(() => {});
  });
}

export function setupNotificationListeners(
  onNotification?: (notification: FirebaseMessagingTypes.RemoteMessage) => void,
  onResponse?: (response: NotificationResponsePayload) => void
): () => void {
  const unsubscribers: Array<() => void> = [];

  unsubscribers.push(
    messaging().onMessage(async (message) => {
      await recordRemoteMessage(message);
      await displayRemoteMessage(message);
      onNotification?.(message);
    })
  );

  unsubscribers.push(
    messaging().onNotificationOpenedApp((message) => {
      const data = normalizeData(message.data);
      onResponse?.(responseFromData(data));
    })
  );

  unsubscribers.push(
    notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.DELIVERED) {
        await recordNotifeeNotification(detail.notification);
      }
      if (type === EventType.PRESS) {
        onResponse?.(responseFromData(notificationData(detail.notification)));
      }
    })
  );

  void messaging().getInitialNotification().then((message) => {
    if (message) onResponse?.(responseFromData(normalizeData(message.data)));
  }).catch(() => {});

  void notifee.getInitialNotification().then((initial) => {
    if (initial?.notification) {
      onResponse?.(responseFromData(notificationData(initial.notification)));
    }
  }).catch(() => {});

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

export async function createNotificationChannels(): Promise<void> {
  if (Platform.OS !== "android") return;
  await notifee.createChannels([
    {
      id: CHANNELS.chat,
      name: "Чат з автошколою",
      importance: AndroidImportance.HIGH,
      sound: "default",
      vibration: true,
    },
    {
      id: CHANNELS.booking,
      name: "Практичні заняття",
      importance: AndroidImportance.HIGH,
      sound: "default",
      vibration: true,
    },
    {
      id: CHANNELS.training,
      name: "Навчання та серія",
      importance: AndroidImportance.DEFAULT,
      sound: "default",
      vibration: true,
    },
    {
      id: CHANNELS.reminders,
      name: "Нагадування",
      importance: AndroidImportance.DEFAULT,
      sound: "default",
      vibration: true,
    },
  ]);
}

export async function scheduleLocalNotification(params: {
  id?: string;
  title: string;
  body: string;
  channelId?: string;
  delaySeconds?: number;
  data?: Record<string, string>;
}): Promise<string> {
  await createNotificationChannels();
  const id = params.id ?? `local-${Date.now()}`;
  const data = params.data ?? { type: "system" };
  const kind = kindFromData(data);
  const notification: Notification = {
    id,
    title: params.title,
    body: params.body,
    data,
    android: {
      channelId: params.channelId ?? channelForKind(kind),
      pressAction: pressAction(),
    },
  };

  if (params.delaySeconds && params.delaySeconds > 0) {
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: Date.now() + params.delaySeconds * 1000,
    };
    await notifee.createTriggerNotification(notification, trigger);
  } else {
    await notifee.displayNotification(notification);
    await recordNotification({ id, title: params.title, body: params.body, data, kind });
  }

  return id;
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  await notifee.cancelTriggerNotifications();
}

async function scheduleTimestampNotification(
  notification: Notification,
  timestamp: number,
  repeatFrequency?: RepeatFrequency
): Promise<void> {
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp,
    repeatFrequency,
  };
  await notifee.createTriggerNotification(notification, trigger);
}

async function scheduleBookingReminder(booking: BookingDoc, hoursBefore: number): Promise<void> {
  const startsAt = new Date(booking.startsAt).getTime();
  if (!Number.isFinite(startsAt)) return;
  const timestamp = startsAt - hoursBefore * 60 * 60 * 1000;
  if (timestamp <= Date.now() + 5 * 60 * 1000) return;

  await scheduleTimestampNotification(
    {
      id: `booking-${booking.id}-${hoursBefore}h`,
      title: "Нагадування про заняття",
      body: `${booking.instructorName}: ${formatBookingTime(booking.startsAt)}`,
      data: { type: "booking-reminder", bookingId: booking.id },
      android: {
        channelId: CHANNELS.booking,
        pressAction: pressAction(),
      },
    },
    timestamp
  );
}

export async function syncEngagementNotifications(userId: string): Promise<void> {
  await createNotificationChannels();
  await notifee.cancelTriggerNotifications([DAILY_TEST_ID, STREAK_ID]);

  await scheduleTimestampNotification(
    {
      id: DAILY_TEST_ID,
      title: "Тест дня",
      body: "Пройди короткий ПДР-тест і тримай темп підготовки.",
      data: { type: "daily-test" },
      android: {
        channelId: CHANNELS.training,
        pressAction: pressAction(),
      },
    },
    nextLocalTime(19, 0),
    RepeatFrequency.DAILY
  );

  const stats = await getUserStats(userId).catch(() => null);
  await scheduleTimestampNotification(
    {
      id: STREAK_ID,
      title: "Серія навчання",
      body: stats?.streakDays
        ? `У тебе ${stats.streakDays} дн. поспіль. Закріпи результат сьогодні.`
        : "Почни серію сьогодні: один тест, і Лідик зарахує прогрес.",
      data: { type: "streak" },
      android: {
        channelId: CHANNELS.training,
        pressAction: pressAction(),
      },
    },
    nextLocalTime(20, 30),
    RepeatFrequency.DAILY
  );

  const bookings = await getMyBookings(userId).catch(() => []);
  const upcoming = bookings
    .filter((booking) => booking.status !== "cancelled" && new Date(booking.startsAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 3);

  await Promise.all(
    upcoming.flatMap((booking) => [
      scheduleBookingReminder(booking, 24),
      scheduleBookingReminder(booking, 2),
    ])
  );
}
