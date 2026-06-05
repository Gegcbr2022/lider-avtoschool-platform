import { useEffect, useState } from "react";
import { Alert, Image, Linking, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "../../lib/auth";
import { Card, GhostButton, Label, Pill, Row, Screen } from "../../components/mobile-ui";
import { useTheme, radii, type ThemePreference, spacing } from "../../lib/theme";
import { useNetworkStatus } from "../../lib/useNetwork";
import { getUserProfile, upsertUserProfile } from "../../lib/firestore";
import { requestNotificationPermission, scheduleLocalNotification } from "../../lib/notifications";

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

// ─── Modals ───────────────────────────────────────────────────────────────────

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

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileTab() {
  const { mode, user, signOut, forgotPassword } = useAuth();
  const { colors, preference, setPreference } = useTheme();
  const networkStatus = useNetworkStatus();
  const isGuest = mode === "guest";

  // Local state for profile fields
  const [localName, setLocalName] = useState<string | null>(null);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [localPhone, setLocalPhone] = useState<string | null>(null);
  const [localCity, setLocalCity] = useState<string | null>(null);
  const [localCategory, setLocalCategory] = useState<string | null>(null);

  // Sheet visibility
  const [editField, setEditField] = useState<"name" | "phone" | "city" | "category" | "avatar" | null>(null);

  // Hidden dev mode
  const [devTapCount, setDevTapCount] = useState(0);
  const [devUnlocked, setDevUnlocked] = useState(false);

  const displayName = localName ?? user?.name ?? "Учень";
  const displayEmoji = localAvatar ?? user?.avatarEmoji ?? "🚗";
  const displayPhone = localPhone ?? "";
  const displayCity = localCity ?? "";
  const displayCategory = localCategory ?? "";
  const isEmailVerified = user?.emailVerified ?? false;

  // Load profile from Firestore on mount
  useEffect(() => {
    if (!user?.id || isGuest) return;
    getUserProfile(user.id).then(profile => {
      if (!profile) return;
      if (profile.name && !localName) setLocalName(profile.name);
      if (profile.avatarEmoji && !localAvatar) setLocalAvatar(profile.avatarEmoji);
      if (profile.phone && !localPhone) setLocalPhone(profile.phone);
      if (profile.city && !localCity) setLocalCity(profile.city);
      if (profile.category && !localCategory) setLocalCategory(profile.category);
    }).catch(() => {});
  }, [user?.id]);

  async function saveField(field: string, value: string) {
    if (!user?.id || !value.trim()) return;
    try {
      await upsertUserProfile(user.id, { [field]: value.trim() });
    } catch {
      // Non-critical, local state already updated
    }
  }

  function handleVersionTap() {
    const next = devTapCount + 1;
    setDevTapCount(next);
    if (next >= 10) {
      setDevTapCount(0);
      setDevUnlocked(true);
    }
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

  function handleSupport() {
    Linking.openURL("mailto:support@lider-avtoschool.ua?subject=Підтримка%20з%20додатку").catch(() => {
      Alert.alert("Підтримка", "Email: support@lider-avtoschool.ua");
    });
  }

  return (
    <Screen title="Профіль" subtitle="Ваш акаунт та налаштування">

      {/* Field modals */}
      {editField === "avatar" ? (
        <AvatarPickerModal
          current={displayEmoji}
          onSave={(e) => { setLocalAvatar(e); void saveField("avatarEmoji", e); }}
          onClose={() => setEditField(null)}
        />
      ) : null}

      <FieldSheet
        visible={editField === "name"} title="Ваше ім'я"
        value={displayName} placeholder="Ім'я та прізвище"
        onSave={(v) => { setLocalName(v); void saveField("name", v); }}
        onClose={() => setEditField(null)}
      />
      <FieldSheet
        visible={editField === "phone"} title="Номер телефону"
        value={displayPhone} placeholder="+380 xx xxx xx xx"
        onSave={(v) => { setLocalPhone(v); void saveField("phone", v); }}
        onClose={() => setEditField(null)}
        keyboard="phone-pad"
      />

      {/* City picker */}
      <Modal visible={editField === "city"} animationType="slide" transparent onRequestClose={() => setEditField(null)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }} onPress={() => setEditField(null)}>
          <View style={{ backgroundColor: colors.bgSheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 20 }} />
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900", marginBottom: 16 }}>Ваше місто</Text>
            {CITIES.map(c => (
              <Pressable key={c} onPress={() => { setLocalCity(c); void saveField("city", c); setEditField(null); }}
                style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: displayCity === c ? colors.red : colors.textPrimary }}>{c}</Text>
                {displayCity === c ? <Text style={{ color: colors.red, fontSize: 16 }}>✓</Text> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Category picker */}
      <Modal visible={editField === "category"} animationType="slide" transparent onRequestClose={() => setEditField(null)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }} onPress={() => setEditField(null)}>
          <View style={{ backgroundColor: colors.bgSheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 20 }} />
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900", marginBottom: 16 }}>Категорія прав</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {CATEGORIES.map(cat => (
                <Pressable key={cat} onPress={() => { setLocalCategory(cat); void saveField("category", cat); setEditField(null); }}
                  style={{ flex: 1, minWidth: 72, alignItems: "center", padding: 16, borderRadius: radii.md, backgroundColor: displayCategory === cat ? colors.redSoft : colors.bgCard, borderWidth: 2, borderColor: displayCategory === cat ? colors.red : colors.border }}>
                  <Text style={{ fontSize: 22, fontWeight: "900", color: displayCategory === cat ? colors.red : colors.textPrimary }}>{cat}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

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

      {/* Profile card */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Pressable
            onPress={() => !isGuest && setEditField("avatar")}
            style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.red + "44", overflow: "hidden" }}
          >
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={{ width: 72, height: 72 }} />
            ) : (
              <Text style={{ fontSize: 36 }}>{displayEmoji}</Text>
            )}
            {!isGuest && !user?.photoURL ? (
              <View style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.border }}>
                <Text style={{ fontSize: 10 }}>✏️</Text>
              </View>
            ) : null}
          </Pressable>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900" }}>{displayName}</Text>
              {!isGuest ? (
                <Pressable onPress={() => setEditField("name")}>
                  <Text style={{ color: colors.textTertiary, fontSize: 13 }}>✏️</Text>
                </Pressable>
              ) : null}
            </View>
            {isGuest ? (
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>Гість · реєстрація займе 30 сек</Text>
            ) : (
              <View style={{ gap: 2, marginTop: 4 }}>
                {user?.email ? <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{user.email}</Text> : null}
              </View>
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

        {isGuest ? (
          <Pressable
            style={{ marginTop: 16, backgroundColor: colors.red, borderRadius: radii.sm, paddingVertical: 14, alignItems: "center", shadowColor: colors.red, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 }}
            onPress={() => router.push("/auth?mode=register")}
          >
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>🚗 Зареєструватися безкоштовно</Text>
          </Pressable>
        ) : null}
      </Card>

      {/* Stats */}
      {!isGuest ? (
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { value: "0",  label: "Тестів" },
            { value: "—",  label: "Найкращий" },
            { value: "1",  label: "Днів поспіль" },
          ].map((stat) => (
            <View key={stat.label} style={{ flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.red, fontSize: 22, fontWeight: "900" }}>{stat.value}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, textAlign: "center" }}>{stat.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Personal data (only for auth users) */}
      {!isGuest ? (
        <Card>
          <Label>Особисті дані</Label>
          <Row
            title="Ім'я" detail={displayName || "Вкажіть ім'я"} icon="👤"
            onPress={() => setEditField("name")}
          />
          <Row
            title="Телефон" detail={displayPhone || "Вкажіть телефон"} icon="📱"
            onPress={() => setEditField("phone")}
          />
          <Row
            title="Місто" detail={displayCity || "Вкажіть місто"} icon="🏙️"
            onPress={() => setEditField("city")}
          />
          <Row
            title="Категорія прав" detail={displayCategory || "Оберіть категорію"} icon="🚗"
            onPress={() => setEditField("category")}
          />
        </Card>
      ) : null}

      {/* Theme */}
      <Card>
        <Label>Тема оформлення</Label>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          {THEME_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setPreference(opt.value)}
              style={{ flex: 1, alignItems: "center", padding: 12, borderRadius: radii.sm, backgroundColor: preference === opt.value ? colors.redSoft : colors.bgElevated, borderWidth: 1.5, borderColor: preference === opt.value ? colors.red : colors.border, gap: 4 }}
            >
              <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
              <Text style={{ color: preference === opt.value ? colors.red : colors.textSecondary, fontSize: 11, fontWeight: "800" }}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Navigation */}
      <Card>
        <Label>Навчання</Label>
        <Row title="ПДР Тренажер" detail="Пройти тест зараз" icon="✅" onPress={() => router.push("/(tabs)/tests")} />
        <Row title="Курси та уроки" detail="Матеріали для підготовки" icon="📚" onPress={() => router.push("/(tabs)/learning")} />
        <Row title="Клуб та Лідик" detail="Спільнота та AI-помічник" icon="🏆" onPress={() => router.push("/(tabs)/club")} />
      </Card>

      {/* Security (auth only) */}
      {!isGuest ? (
        <Card>
          <Label>Безпека</Label>
          {user?.email ? (
            <Row
              title="Змінити пароль"
              detail="Надіслати посилання на email"
              icon="🔐"
              onPress={handleForgotPassword}
            />
          ) : null}
          <Row
            title="Вийти з акаунту"
            detail="Завершити сесію"
            icon="🚪"
            onPress={() => {
              Alert.alert("Вийти?", "Ваш прогрес збережено.", [
                { text: "Скасувати", style: "cancel" },
                { text: "Вийти", style: "destructive", onPress: signOut },
              ]);
            }}
          />
        </Card>
      ) : null}

      {/* Notifications */}
      <Card>
        <Label>Сповіщення</Label>
        <Row
          title="Щоденне нагадування"
          detail="Тест дня та серія"
          icon="🔔"
          onPress={async () => {
            const status = await requestNotificationPermission();
            if (status !== "granted") {
              Alert.alert(
                "Дозвіл потрібен",
                "Увімкніть сповіщення в Налаштуваннях → Застосунки → Автошкола Лідер.",
                [{ text: "OK" }]
              );
              return;
            }
            await scheduleLocalNotification({
              title: "⏰ Час тренуватися!",
              body: "Пройди тест дня — підтримуй серію та готуйся до іспиту.",
              channelId: "reminders",
              delaySeconds: 5,
            });
            Alert.alert("Нагадування встановлено", "Отримаєш сповіщення через 5 секунд — перевір!");
          }}
        />
      </Card>

      {/* Support */}
      <Card>
        <Label>Підтримка</Label>
        <Row title="Написати в підтримку" detail="support@lider-avtoschool.ua" icon="💬" onPress={handleSupport} />
        <Row title="Умови використання" detail="Правила та угода" icon="📄" onPress={() => Linking.openURL("https://lider-avtoschool.ua/terms").catch(() => {})} />
        <Row title="Політика конфіденційності" detail="Обробка даних" icon="🔒" onPress={() => Linking.openURL("https://lider-avtoschool.ua/privacy").catch(() => {})} />
      </Card>

      {/* Version footer — hidden dev entry (no hints) */}
      <Pressable onPress={handleVersionTap} style={{ alignItems: "center", paddingVertical: 16 }}>
        <Text style={{ color: colors.textTertiary, fontSize: 12, fontWeight: "600" }}>
          Автошкола Лідер · v{APP_VERSION}
        </Text>
      </Pressable>

      {/* Dev panel (unlocked silently) */}
      {devUnlocked ? (
        <Card>
          <Label variant="red">Розробник</Label>
          <Row title="Діагностика" detail="API та Firebase" icon="🔧" onPress={() => router.push("/diagnostic")} />
          <Row
            title="Тест-сповіщення"
            detail="Надіслати local push зараз"
            icon="🧪"
            onPress={async () => {
              const status = await requestNotificationPermission();
              if (status !== "granted") {
                Alert.alert("Немає дозволу", "Увімкніть сповіщення в налаштуваннях.");
                return;
              }
              await scheduleLocalNotification({
                title: "🧪 Тест-сповіщення",
                body: "Push notifications працюють! Канал: reminders.",
                channelId: "reminders",
                delaySeconds: 2,
              });
              Alert.alert("OK", "Сповіщення через 2 сек.");
            }}
          />
          <Row title="Приховати" detail="Вийти з режиму розробника" icon="🙈" onPress={() => setDevUnlocked(false)} />
        </Card>
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
