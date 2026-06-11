import { useCallback, useEffect, useState } from "react";
import { updateProfile } from "firebase/auth";
import {
  Alert, Image, Linking, Modal, Pressable, ScrollView, Switch, Text, TextInput, View,
} from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "../../lib/auth";
import { GhostButton, Label, Pill, Row, Screen } from "../../components/mobile-ui";
import { useTheme, radii, type ThemePreference, spacing, shadows } from "../../lib/theme";
import { useNetworkStatus } from "../../lib/useNetwork";
import { getUserProfile, upsertUserProfile, getUserStats, type UserStats } from "../../lib/firestore";
import {
  clearNotificationInbox,
  getNotificationInbox,
  markAllNotificationsRead,
  requestNotificationPermission,
  scheduleLocalNotification,
  type NotificationInboxItem,
} from "../../lib/notifications";
import { DEFAULT_APP_SETTINGS, loadAppSettings, saveAppSettings, type AppSettings } from "../../lib/app-settings";
import { firebaseAuth } from "../../lib/firebase";

const APP_VERSION = (Constants.expoConfig?.version as string | undefined) ?? "1.0.0";

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: "dark",  label: "Темна",  icon: "🌙" },
  { value: "light", label: "Світла", icon: "☀️" },
  { value: "auto",  label: "Авто",   icon: "⚙️" },
];

const AVATAR_EMOJIS = [
  "🚗", "🏎️", "🚦", "🛞", "🏁", "🚘", "🧭", "⭐",
  "🔥", "😎", "🚙", "🛣️", "🎓", "📚", "🏆", "✅",
];

const CATEGORIES = ["A", "A1", "B", "C", "CE"];
const CITIES = ["Київ", "Харків", "Одеса", "Дніпро", "Запоріжжя", "Львів", "Кривий Ріг", "Миколаїв", "Маріуполь", "Вінниця"];


// ─── Bottom sheet wrapper ─────────────────────────────────────────────────────

function BottomSheet({ visible, title, onClose, children }: {
  visible: boolean; title: string; onClose: () => void; children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }} onPress={onClose}>
        <View style={{ backgroundColor: colors.bgSheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 20 }} />
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900", marginBottom: 20 }}>{title}</Text>
          {children}
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Field sheet ──────────────────────────────────────────────────────────────

function FieldSheet({ visible, title, value, placeholder, onSave, onClose, keyboard = "default", secure = false }: {
  visible: boolean; title: string; value: string; placeholder?: string;
  onSave: (v: string) => void; onClose: () => void;
  keyboard?: "default" | "email-address" | "phone-pad"; secure?: boolean;
}) {
  const { colors } = useTheme();
  const [text, setText] = useState(value);
  useEffect(() => { if (visible) setText(value); }, [visible, value]);
  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      <TextInput
        style={{ backgroundColor: colors.bgCard, borderRadius: radii.sm, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 14, color: colors.textPrimary, fontSize: 16, fontWeight: "600" }}
        value={text} onChangeText={setText} autoFocus
        placeholder={placeholder} placeholderTextColor={colors.textTertiary}
        keyboardType={keyboard} secureTextEntry={secure}
        autoCapitalize={keyboard === "default" ? "words" : "none"}
      />
      <Pressable
        onPress={() => { onSave(text.trim()); onClose(); }}
        disabled={!text.trim()}
        style={{ marginTop: 14, backgroundColor: text.trim() ? colors.red : colors.bgElevated, borderRadius: radii.md, paddingVertical: 16, alignItems: "center" }}
      >
        <Text style={{ color: text.trim() ? "#fff" : colors.textTertiary, fontWeight: "800", fontSize: 16 }}>Зберегти</Text>
      </Pressable>
    </BottomSheet>
  );
}

// ─── Avatar picker ────────────────────────────────────────────────────────────

function AvatarPickerModal({ current, onSave, onClose }: { current: string; onSave: (e: string) => void; onClose: () => void }) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState(current);
  return (
    <BottomSheet visible title="Оберіть аватар" onClose={onClose}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        {AVATAR_EMOJIS.map((emoji) => (
          <Pressable
            key={emoji} onPress={() => setSelected(emoji)}
            style={{ width: 56, height: 56, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: selected === emoji ? colors.redSoft : colors.bgCard, borderWidth: 2, borderColor: selected === emoji ? colors.red : colors.border }}
          >
            <Text style={{ fontSize: 26 }}>{emoji}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => { onSave(selected); onClose(); }} style={{ marginTop: 20, backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 16, alignItems: "center" }}>
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Зберегти</Text>
      </Pressable>
    </BottomSheet>
  );
}

// ─── Personal Info Sheet ──────────────────────────────────────────────────────

type PersonalInfoState = {
  name: string; phone: string; city: string; category: string;
};

function PersonalInfoSheet({ visible, data, onSave, onClose }: {
  visible: boolean;
  data: PersonalInfoState;
  onSave: (d: Partial<PersonalInfoState>) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const [editField, setEditField] = useState<"name" | "phone" | "city" | "category" | null>(null);
  const [local, setLocal] = useState<PersonalInfoState>(data);

  useEffect(() => { if (visible) setLocal(data); }, [visible]);

  function saveField(field: keyof PersonalInfoState, value: string) {
    const updated = { ...local, [field]: value };
    setLocal(updated);
    onSave({ [field]: value });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: colors.bgSheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44, maxHeight: "85%" }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 20 }} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900" }}>Особиста інформація</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={{ color: colors.textTertiary, fontSize: 22 }}>✕</Text>
            </Pressable>
          </View>

          <FieldSheet visible={editField === "name"} title="Ваше ім'я" value={local.name} placeholder="Ім'я та прізвище"
            onSave={(v) => saveField("name", v)} onClose={() => setEditField(null)} />
          <FieldSheet visible={editField === "phone"} title="Номер телефону" value={local.phone} placeholder="+380 xx xxx xx xx"
            onSave={(v) => saveField("phone", v)} onClose={() => setEditField(null)} keyboard="phone-pad" />

          <Modal visible={editField === "city"} animationType="slide" transparent onRequestClose={() => setEditField(null)}>
            <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }} onPress={() => setEditField(null)}>
              <View style={{ backgroundColor: colors.bgSheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 20 }} />
                <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900", marginBottom: 16 }}>Ваше місто</Text>
                <ScrollView>
                  {CITIES.map(c => (
                    <Pressable key={c} onPress={() => { saveField("city", c); setEditField(null); }}
                      style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 16, fontWeight: "600", color: local.city === c ? colors.red : colors.textPrimary }}>{c}</Text>
                      {local.city === c ? <Text style={{ color: colors.red, fontSize: 16 }}>✓</Text> : null}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </Pressable>
          </Modal>

          <Modal visible={editField === "category"} animationType="slide" transparent onRequestClose={() => setEditField(null)}>
            <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }} onPress={() => setEditField(null)}>
              <View style={{ backgroundColor: colors.bgSheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 20 }} />
                <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900", marginBottom: 16 }}>Категорія прав</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {CATEGORIES.map(cat => (
                    <Pressable key={cat} onPress={() => { saveField("category", cat); setEditField(null); }}
                      style={{ flex: 1, minWidth: 72, alignItems: "center", padding: 16, borderRadius: radii.md, backgroundColor: local.category === cat ? colors.redSoft : colors.bgCard, borderWidth: 2, borderColor: local.category === cat ? colors.red : colors.border }}>
                      <Text style={{ fontSize: 22, fontWeight: "900", color: local.category === cat ? colors.red : colors.textPrimary }}>{cat}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </Pressable>
          </Modal>

          {/* Rows */}
          <ScrollView showsVerticalScrollIndicator={false}>
            <Pressable onPress={() => setEditField("name")}
              style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Text style={{ fontSize: 20 }}>👤</Text>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 }}>Ім'я</Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: local.name ? colors.textPrimary : colors.textTertiary, marginTop: 2 }}>{local.name || "Вкажіть ім'я"}</Text>
                </View>
              </View>
              <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>
            </Pressable>

            <Pressable onPress={() => setEditField("phone")}
              style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Text style={{ fontSize: 20 }}>📱</Text>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 }}>Телефон</Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: local.phone ? colors.textPrimary : colors.textTertiary, marginTop: 2 }}>{local.phone || "Вкажіть телефон"}</Text>
                </View>
              </View>
              <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>
            </Pressable>

            <Pressable onPress={() => setEditField("city")}
              style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Text style={{ fontSize: 20 }}>🏙️</Text>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 }}>Місто</Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: local.city ? colors.textPrimary : colors.textTertiary, marginTop: 2 }}>{local.city || "Вкажіть місто"}</Text>
                </View>
              </View>
              <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>
            </Pressable>

            <Pressable onPress={() => setEditField("category")}
              style={{ paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Text style={{ fontSize: 20 }}>🚗</Text>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 }}>Категорія прав</Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: local.category ? colors.textPrimary : colors.textTertiary, marginTop: 2 }}>{local.category || "Оберіть категорію"}</Text>
                </View>
              </View>
              <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Settings Sheet ───────────────────────────────────────────────────────────

function SettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, preference, setPreference } = useTheme();
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);

  useEffect(() => {
    if (!visible) return;
    loadAppSettings().then(setAppSettings).catch(() => {});
  }, [visible]);

  function updateSetting(key: keyof AppSettings, value: boolean) {
    const next = { ...appSettings, [key]: value };
    setAppSettings(next);
    saveAppSettings(next).catch(() => {});
  }

  function SettingRow({ title, subtitle, value, onChange }: { title: string; subtitle: string; value: boolean; onChange: (value: boolean) => void }) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 14, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "900" }}>{title}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3, lineHeight: 17 }}>{subtitle}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: colors.bgElevated, true: colors.redSoft }}
          thumbColor={value ? colors.red : colors.textTertiary}
        />
      </View>
    );
  }

  return (
    <BottomSheet visible={visible} title="Налаштування" onClose={onClose}>
      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 12 }}>Тема оформлення</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {THEME_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setPreference(opt.value)}
            style={{ flex: 1, alignItems: "center", padding: 14, borderRadius: radii.sm, backgroundColor: preference === opt.value ? colors.redSoft : colors.bgElevated, borderWidth: 1.5, borderColor: preference === opt.value ? colors.red : colors.border, gap: 4 }}
          >
            <Text style={{ fontSize: 22 }}>{opt.icon}</Text>
            <Text style={{ color: preference === opt.value ? colors.red : colors.textSecondary, fontSize: 11, fontWeight: "800" }}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ marginTop: 20, gap: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary }}>Навчання і Лідик</Text>
        <SettingRow
          title="Підказки Лідика"
          subtitle="Маскот частіше підкаже, що робити далі."
          value={appSettings.mascotGuide}
          onChange={(value) => updateSetting("mascotGuide", value)}
        />
        <SettingRow
          title="Візуальні підказки в тестах"
          subtitle="Показувати схеми та зображення у ПДР-тренажері."
          value={appSettings.visualHints}
          onChange={(value) => updateSetting("visualHints", value)}
        />
        <SettingRow
          title="Ділитися результатами"
          subtitle="Після тесту показувати швидку дію для шерингу."
          value={appSettings.shareResults}
          onChange={(value) => updateSetting("shareResults", value)}
        />
      </View>
    </BottomSheet>
  );
}

// ─── Notifications Sheet ──────────────────────────────────────────────────────

function formatNotificationDate(value: string): string {
  try {
    return new Date(value).toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function NotificationsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const [items, setItems] = useState<NotificationInboxItem[]>([]);

  const refresh = useCallback(async () => {
    const inbox = await getNotificationInbox();
    setItems(inbox);
  }, []);

  useEffect(() => {
    if (!visible) return;
    refresh().catch(() => {});
    markAllNotificationsRead().then(refresh).catch(() => {});
  }, [visible, refresh]);

  return (
    <BottomSheet visible={visible} title="Сповіщення" onClose={onClose}>
      <View style={{ gap: 12 }}>
        <Pressable
          onPress={async () => {
            const status = await requestNotificationPermission();
            if (status !== "granted") {
              Alert.alert("Дозвіл потрібен", "Увімкніть сповіщення в Налаштуваннях → Застосунки → Автошкола Лідер.", [{ text: "OK" }]);
              return;
            }
            await scheduleLocalNotification({
              id: "manual-test-notification",
              title: "🧪 Тест-сповіщення",
              body: "Push notifications працюють. Натисни, щоб повернутися в застосунок.",
              channelId: "reminders",
              delaySeconds: 2,
              data: { type: "system" },
            });
            Alert.alert("Нагадування встановлено", "Отримаєш сповіщення через 2 секунди.");
            refresh().catch(() => {});
          }}
          style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border }}
        >
          <Text style={{ fontSize: 28 }}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textPrimary }}>Перевірити push</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>Тестове сповіщення через 2 секунди</Text>
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>
        </Pressable>

        <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "900" }}>Центр сповіщень</Text>
            {items.length > 0 ? (
              <Pressable
                onPress={async () => {
                  await clearNotificationInbox();
                  setItems([]);
                }}
                hitSlop={10}
              >
                <Text style={{ color: colors.red, fontSize: 12, fontWeight: "800" }}>Очистити</Text>
              </Pressable>
            ) : null}
          </View>

          {items.length === 0 ? (
            <View style={{ paddingHorizontal: 20, paddingVertical: 24, alignItems: "center", gap: 10 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.bgElevated, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 26 }}>🔔</Text>
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "800", textAlign: "center" }}>
                Поки тихо
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: "center", maxWidth: 260 }}>
                Тут зʼявляться нагадування про заняття, щоденний тест і відповіді від школи.
              </Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {items.map((item, index) => (
                <View
                  key={item.id}
                  style={{
                    padding: 14,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                    gap: 4,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                    <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: "900" }} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "700" }}>
                      {formatNotificationDate(item.createdAt)}
                    </Text>
                  </View>
                  {item.body ? (
                    <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17 }} numberOfLines={2}>
                      {item.body}
                    </Text>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </BottomSheet>
  );
}

// ─── Security Sheet ───────────────────────────────────────────────────────────

function SecuritySheet({ visible, userEmail, onForgotPassword, onSignOut, onClose }: {
  visible: boolean; userEmail?: string | null;
  onForgotPassword: () => void; onSignOut: () => void; onClose: () => void;
}) {
  const { colors } = useTheme();
  const [twoFaEnabled] = useState(false);

  function handle2FAPress() {
    Alert.alert(
      "Двофакторна автентифікація",
      "Для підключення 2FA вам буде надіслано SMS-код на прив'язаний номер телефону.\n\nЦя функція знаходиться в розробці. Очікуйте оновлення.",
      [
        { text: "Зрозуміло", style: "default" },
        {
          text: "Написати підтримці",
          onPress: () => {
            Linking.openURL("mailto:support@lider-avtoschool.ua?subject=Запит%202FA").catch(() => {});
            onClose();
          }
        },
      ]
    );
  }

  return (
    <BottomSheet visible={visible} title="Безпека та вхід" onClose={onClose}>
      <View style={{ gap: 12 }}>
        {userEmail ? (
          <Pressable
            onPress={() => { onForgotPassword(); onClose(); }}
            style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border }}
          >
            <Text style={{ fontSize: 24 }}>🔐</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "800", color: colors.textPrimary }}>Змінити пароль</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>Надіслати посилання на {userEmail}</Text>
            </View>
            <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>
          </Pressable>
        ) : null}

        {/* 2FA block */}
        <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16 }}>
            <Text style={{ fontSize: 24 }}>🛡️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "800", color: colors.textPrimary }}>Двофакторна автентифікація</Text>
              <Text style={{ fontSize: 13, color: twoFaEnabled ? colors.success : colors.textSecondary, marginTop: 2, fontWeight: "700" }}>
                {twoFaEnabled ? "✓ Увімкнено" : "Вимкнено"}
              </Text>
            </View>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.bgElevated }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginBottom: 12 }}>
              Захистіть акаунт додатковим кодом при вході. SMS-підтвердження на ваш номер телефону.
            </Text>
            <Pressable
              onPress={handle2FAPress}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.red, borderRadius: radii.sm, paddingVertical: 12 }}
            >
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>
                {twoFaEnabled ? "Вимкнути 2FA" : "Підключити 2FA"}
              </Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={() => { onSignOut(); onClose(); }}
          style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.redSoft, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.red + "44" }}
        >
          <Text style={{ fontSize: 24 }}>🚪</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: colors.red }}>Вийти з акаунту</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>Завершити сесію</Text>
          </View>
          <Text style={{ color: colors.red, fontSize: 18 }}>›</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

// ─── Support Sheet ────────────────────────────────────────────────────────────

function SupportSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();

  function openEmail() {
    Linking.openURL("mailto:support@lider-avtoschool.ua?subject=Підтримка%20з%20додатку").catch(() => {
      Alert.alert("Підтримка", "Email: support@lider-avtoschool.ua");
    });
  }

  return (
    <BottomSheet visible={visible} title="Підтримка" onClose={onClose}>
      <View style={{ gap: 12 }}>
        <Pressable onPress={openEmail}
          style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 24 }}>💬</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: colors.textPrimary }}>Написати в підтримку</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>support@lider-avtoschool.ua</Text>
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL("https://lider-avtoschool.ua/terms").catch(() => {})}
          style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 24 }}>📄</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: colors.textPrimary }}>Умови використання</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>Правила та угода</Text>
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL("https://lider-avtoschool.ua/privacy").catch(() => {})}
          style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 24 }}>🔒</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: colors.textPrimary }}>Політика конфіденційності</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>Обробка персональних даних</Text>
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

// ─── Nav item component ───────────────────────────────────────────────────────

function NavItem({ icon, title, subtitle, onPress, accent }: {
  icon: string; title: string; subtitle?: string; onPress: () => void; accent?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 16 }}
    >
      <View style={{
        width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center",
        backgroundColor: accent ? colors.redSoft : colors.bgElevated,
      }}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "800", color: accent ? colors.red : colors.textPrimary }}>{title}</Text>
        {subtitle ? <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>{subtitle}</Text> : null}
      </View>
      <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type Sheet = "personal" | "settings" | "security" | "notifications" | "support" | "avatar" | null;

export default function ProfileTab() {
  const { mode, user, signOut, forgotPassword } = useAuth();
  const { colors } = useTheme();
  const networkStatus = useNetworkStatus();
  const isGuest = mode === "guest";

  // Local state for profile fields
  const [localName, setLocalName] = useState<string>("");
  const [localAvatar, setLocalAvatar] = useState<string>("");
  const [localPhone, setLocalPhone] = useState<string>("");
  const [localCity, setLocalCity] = useState<string>("");
  const [localCategory, setLocalCategory] = useState<string>("");

  const [activeSheet, setActiveSheet] = useState<Sheet>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [devTapCount, setDevTapCount] = useState(0);
  const [devUnlocked, setDevUnlocked] = useState(false);

  const displayName = localName || user?.name || "Учень";
  const displayEmoji = localAvatar || user?.avatarEmoji || "🚗";
  const displayPhotoURL = localAvatar || user?.avatarEmoji ? undefined : user?.photoURL;
  const isEmailVerified = user?.emailVerified ?? false;

  // Load profile from Firestore on mount
  useEffect(() => {
    if (!user?.id || isGuest) return;
    getUserProfile(user.id).then(profile => {
      if (!profile) return;
      if (profile.name) setLocalName(profile.name);
      if (profile.avatarEmoji) setLocalAvatar(profile.avatarEmoji);
      if (profile.phone) setLocalPhone(profile.phone);
      if (profile.city) setLocalCity(profile.city);
      if (profile.category) setLocalCategory(profile.category);
    }).catch(() => {});
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id || isGuest) return;
      getUserStats(user.id).then(setStats).catch(() => {});
      markAllNotificationsRead().catch(() => {});
    }, [user?.id, isGuest])
  );

  async function saveField(field: string, value: string) {
    if (!user?.id || !value.trim()) return;
    try {
      const nextValue = value.trim();
      await upsertUserProfile(user.id, { [field]: nextValue });
      if (field === "name" && firebaseAuth.currentUser && firebaseAuth.currentUser.displayName !== nextValue) {
        await updateProfile(firebaseAuth.currentUser, { displayName: nextValue }).catch(() => {});
      }
    } catch { /* non-critical */ }
  }

  async function handleForgotPassword() {
    if (!user?.email) return;
    const result = await forgotPassword(user.email);
    if (result.sent) {
      Alert.alert("Листа надіслано", `Інструкція зі зміни пароля надіслана на ${user.email}`);
    } else {
      Alert.alert("Помилка", result.error ?? "Не вдалось надіслати листа. Спробуй пізніше.");
    }
  }

  function handleSignOut() {
    Alert.alert("Вийти?", "Ваш прогрес збережено.", [
      { text: "Скасувати", style: "cancel" },
      { text: "Вийти", style: "destructive", onPress: signOut },
    ]);
  }

  const personalData: PersonalInfoState = {
    name: localName, phone: localPhone, city: localCity, category: localCategory,
  };

  return (
    <Screen title="Профіль" subtitle="Ваш акаунт">

      {/* Sheets */}
      {activeSheet === "avatar" ? (
        <AvatarPickerModal
          current={displayEmoji}
          onSave={(e) => { setLocalAvatar(e); void saveField("avatarEmoji", e); }}
          onClose={() => setActiveSheet(null)}
        />
      ) : null}

      <PersonalInfoSheet
        visible={activeSheet === "personal"}
        data={personalData}
        onSave={(patch) => {
          if (patch.name !== undefined) { setLocalName(patch.name); void saveField("name", patch.name); }
          if (patch.phone !== undefined) { setLocalPhone(patch.phone); void saveField("phone", patch.phone); }
          if (patch.city !== undefined) { setLocalCity(patch.city); void saveField("city", patch.city); }
          if (patch.category !== undefined) { setLocalCategory(patch.category); void saveField("category", patch.category); }
        }}
        onClose={() => setActiveSheet(null)}
      />
      <SettingsSheet visible={activeSheet === "settings"} onClose={() => setActiveSheet(null)} />
      <NotificationsSheet visible={activeSheet === "notifications"} onClose={() => setActiveSheet(null)} />
      <SecuritySheet
        visible={activeSheet === "security"}
        userEmail={user?.email}
        onForgotPassword={handleForgotPassword}
        onSignOut={handleSignOut}
        onClose={() => setActiveSheet(null)}
      />
      <SupportSheet visible={activeSheet === "support"} onClose={() => setActiveSheet(null)} />

      {/* Offline banner */}
      {networkStatus === "offline" ? (
        <View style={{ backgroundColor: colors.warningSoft, borderRadius: radii.md, padding: 12, borderWidth: 1, borderColor: colors.warning + "44", flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 18 }}>📡</Text>
          <Text style={{ color: colors.warning, fontWeight: "800", fontSize: 13, flex: 1 }}>Офлайн — деякі функції недоступні</Text>
        </View>
      ) : null}

      {/* Email verification banner */}
      {!isGuest && user?.email && !isEmailVerified ? (
        <View style={{ backgroundColor: colors.warningSoft, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.warning + "44" }}>
          <Text style={{ color: colors.warning, fontWeight: "800", fontSize: 14 }}>📧 Підтвердіть email</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
            Перевірте {user.email} та натисніть посилання підтвердження.
          </Text>
        </View>
      ) : null}

      {/* Profile hero */}
      <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 20, flexDirection: "row", alignItems: "center", gap: 16, ...shadows.card }}>
        <Pressable
          onPress={() => !isGuest && setActiveSheet("avatar")}
          style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.red + "44", overflow: "hidden" }}
        >
          {displayPhotoURL ? (
            <Image source={{ uri: displayPhotoURL }} style={{ width: 72, height: 72 }} />
          ) : (
            <Text style={{ fontSize: 36 }}>{displayEmoji}</Text>
          )}
          {!isGuest && !displayPhotoURL ? (
            <View style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.border }}>
              <Text style={{ fontSize: 10 }}>✏️</Text>
            </View>
          ) : null}
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900" }}>{displayName}</Text>
          {isGuest ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 3 }}>Гість · реєстрація займе 30 сек</Text>
          ) : (
            <>
              {user?.email ? <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 3 }}>{user.email}</Text> : null}
              {user?.role === "instructor" ? (
                <View style={{ marginTop: 6, alignSelf: "flex-start", backgroundColor: colors.red, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>Інструктор</Text>
                </View>
              ) : null}
            </>
          )}
        </View>

        {isGuest ? (
          <View style={{ backgroundColor: colors.bgElevated, borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 5 }}>
            <Text style={{ color: colors.textTertiary, fontSize: 12, fontWeight: "700" }}>Гість</Text>
          </View>
        ) : isEmailVerified ? (
          <Pill tone="success">✓</Pill>
        ) : user?.email ? (
          <Pill tone="warning">!</Pill>
        ) : null}
      </View>

      {/* Guest CTA */}
      {isGuest ? (
        <Pressable
          style={{ backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 16, alignItems: "center", ...shadows.red }}
          onPress={() => router.push("/auth?mode=register")}
        >
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>🚗 Зареєструватися безкоштовно</Text>
        </Pressable>
      ) : null}

      {/* Stats — auth users only */}
      {!isGuest ? (
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { value: String(stats?.testsCompleted ?? 0), label: "Тестів" },
            { value: stats && stats.bestScorePct > 0 ? `${stats.bestScorePct}%` : "—", label: "Найкращий" },
            { value: String(stats?.streakDays ?? 0), label: "Поспіль" },
          ].map((stat) => (
            <View key={stat.label} style={{ flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.red, fontSize: 22, fontWeight: "900" }}>{stat.value}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, textAlign: "center" }}>{stat.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Main navigation menu — grouped sections */}

      {/* Акаунт */}
      {!isGuest ? (
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", paddingLeft: 4 }}>Акаунт</Text>
          <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
            <NavItem icon="👤" title="Особиста інформація" subtitle={localName || "Ім'я, телефон, місто, категорія"} onPress={() => setActiveSheet("personal")} />
            <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 70 }} />
            <NavItem icon="🪪" title="Документи" subtitle="Дані та фото для НАІС МВС" onPress={() => router.push("/documents" as Href)} />
          </View>
        </View>
      ) : null}

      {/* Налаштування */}
      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", paddingLeft: 4 }}>Налаштування</Text>
        <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
          <NavItem icon="⚙️" title="Налаштування" subtitle="Тема оформлення та підказки" onPress={() => setActiveSheet("settings")} />
          {!isGuest ? (
            <>
              <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 70 }} />
              <NavItem icon="🔔" title="Сповіщення" subtitle="Нагадування та push" onPress={() => setActiveSheet("notifications")} />
              <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 70 }} />
              <NavItem icon="🔐" title="Безпека та вхід" subtitle="Пароль, вихід з акаунту" onPress={() => setActiveSheet("security")} />
            </>
          ) : null}
        </View>
      </View>

      {/* Підтримка */}
      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", paddingLeft: 4 }}>Підтримка</Text>
        <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
          <NavItem icon="💬" title="Підтримка" subtitle="Email, умови, конфіденційність" onPress={() => setActiveSheet("support")} />
        </View>
      </View>

      {/* Instructor section */}
      {user?.role === "instructor" ? (
        <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.red + "33", overflow: "hidden" }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: colors.red, letterSpacing: 0.8, textTransform: "uppercase" }}>Інструктор</Text>
          </View>
          <NavItem icon="👥" title="Мої учні" subtitle="Список учнів та заняття" onPress={() => router.push("/instructor-students" as Href)} accent />
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 70 }} />
          <NavItem icon="📅" title="Розклад занять" subtitle="Перейти до головної" onPress={() => router.push("/(tabs)" as Href)} />
        </View>
      ) : null}

      {/* Version — dev tap entry */}
      <Pressable onPress={() => {
        const next = devTapCount + 1;
        setDevTapCount(next);
        if (next >= 10) { setDevTapCount(0); setDevUnlocked(true); }
      }} style={{ alignItems: "center", paddingVertical: 16 }}>
        <Text style={{ color: colors.textTertiary, fontSize: 12, fontWeight: "600" }}>
          Автошкола Лідер · v{APP_VERSION}
        </Text>
      </Pressable>

      {/* Dev panel */}
      {devUnlocked ? (
        <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: colors.red, letterSpacing: 0.8, textTransform: "uppercase" }}>Розробник</Text>
          </View>
          <NavItem icon="🔧" title="Діагностика" subtitle="API та Firebase" onPress={() => router.push("/diagnostic")} />
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 70 }} />
          <NavItem icon="🧪" title="Тест-сповіщення" subtitle="Надіслати local push зараз" onPress={async () => {
            const status = await requestNotificationPermission();
            if (status !== "granted") { Alert.alert("Немає дозволу", "Увімкніть сповіщення в налаштуваннях."); return; }
            await scheduleLocalNotification({ title: "🧪 Тест-сповіщення", body: "Push notifications працюють!", channelId: "reminders", delaySeconds: 2 });
            Alert.alert("OK", "Сповіщення через 2 сек.");
          }} />
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 70 }} />
          <NavItem icon="🙈" title="Приховати" subtitle="Вийти з режиму розробника" onPress={() => setDevUnlocked(false)} />
        </View>
      ) : null}

      {/* Guest sign-in CTA */}
      {isGuest ? (
        <GhostButton onPress={() => router.push("/auth?mode=login")}>
          Увійти або зареєструватись
        </GhostButton>
      ) : null}

    </Screen>
  );
}
