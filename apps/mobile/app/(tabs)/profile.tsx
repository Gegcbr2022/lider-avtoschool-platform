import { useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../lib/auth";
import { Card, GhostButton, Label, Pill, Row, Screen } from "../../components/mobile-ui";
import { useTheme, radii, type ThemePreference, spacing } from "../../lib/theme";
import { useNetworkStatus } from "../../lib/useNetwork";

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: "dark",  label: "Темна",      icon: "🌙" },
  { value: "light", label: "Світла",     icon: "☀️" },
  { value: "auto",  label: "Авто",       icon: "⚙️" },
];

const AVATAR_EMOJIS = ["🚗", "🏎️", "🚦", "🛞", "🏁", "🚘", "🧭", "⭐", "🔥", "😎", "🚙", "🛣️", "🎓", "📚", "🏆", "✅"];

// ─── Edit Name Modal ──────────────────────────────────────────────────────────

function EditNameModal({ current, onSave, onClose }: { current: string; onSave: (n: string) => void; onClose: () => void }) {
  const { colors } = useTheme();
  const [value, setValue] = useState(current);
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }} onPress={onClose}>
        <View style={{ backgroundColor: colors.bgSheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 20 }} />
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900", marginBottom: 16 }}>Змінити ім'я</Text>
          <TextInput
            style={{ backgroundColor: colors.bgCard, borderRadius: radii.sm, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 14, color: colors.textPrimary, fontSize: 16, fontWeight: "600" }}
            value={value} onChangeText={setValue} autoFocus autoCapitalize="words"
            placeholder="Ваше ім'я" placeholderTextColor={colors.textTertiary}
          />
          <Pressable
            onPress={() => { if (value.trim()) onSave(value.trim()); onClose(); }}
            style={{ marginTop: 14, backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 16, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Зберегти</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Avatar picker ────────────────────────────────────────────────────────────

function AvatarPickerModal({ current, onSave, onClose }: { current: string; onSave: (e: string) => void; onClose: () => void }) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState(current);
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }} onPress={onClose}>
        <View style={{ backgroundColor: colors.bgSheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 20 }} />
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900", marginBottom: 16 }}>Оберіть аватар</Text>
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
          <Pressable
            onPress={() => { onSave(selected); onClose(); }}
            style={{ marginTop: 20, backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 16, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Зберегти</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileTab() {
  const { mode, user, signOut } = useAuth();
  const { colors, preference, setPreference } = useTheme();
  const networkStatus = useNetworkStatus();
  const isGuest = mode === "guest";

  const [showEditName, setShowEditName] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [localName, setLocalName] = useState<string | null>(null);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  const displayName = localName ?? user?.name ?? "Учень";
  const displayEmoji = localAvatar ?? user?.avatarEmoji ?? "🚗";
  const displayInitials = displayName.slice(0, 2).toUpperCase();
  const isEmailVerified = user?.emailVerified ?? false;
  const isPhoneUser = !user?.email && !user?.isGuest;

  return (
    <Screen title="Профіль" subtitle="Ваш акаунт та налаштування.">

      {showEditName ? (
        <EditNameModal
          current={displayName}
          onSave={(n) => setLocalName(n)}
          onClose={() => setShowEditName(false)}
        />
      ) : null}

      {showAvatarPicker ? (
        <AvatarPickerModal
          current={displayEmoji}
          onSave={(e) => setLocalAvatar(e)}
          onClose={() => setShowAvatarPicker(false)}
        />
      ) : null}

      {/* Offline banner */}
      {networkStatus === "offline" ? (
        <View style={{ backgroundColor: colors.warningSoft, borderRadius: radii.md, padding: 12, borderWidth: 1, borderColor: colors.warning + "44", flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 20 }}>📡</Text>
          <Text style={{ color: colors.warning, fontWeight: "800", fontSize: 13, flex: 1 }}>
            Офлайн режим — деякі функції недоступні
          </Text>
        </View>
      ) : null}

      {/* Email verification banner */}
      {!isGuest && user?.email && !isEmailVerified ? (
        <View style={{ backgroundColor: colors.warningSoft, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.warning + "44" }}>
          <Text style={{ color: colors.warning, fontWeight: "800", fontSize: 14 }}>📧 Підтвердіть email</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
            Перевірте {user.email} та натисніть посилання підтвердження.
          </Text>
          <Pressable style={{ marginTop: 10, alignSelf: "flex-start" }}>
            <Text style={{ color: colors.warning, fontWeight: "700", fontSize: 13 }}>Надіслати ще раз →</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Profile header */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          {/* Avatar */}
          <Pressable
            onPress={() => !isGuest && setShowAvatarPicker(true)}
            style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.red + "44" }}
          >
            <Text style={{ fontSize: 32 }}>{displayEmoji}</Text>
            {!isGuest ? (
              <View style={{ position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.border }}>
                <Text style={{ fontSize: 10 }}>✏️</Text>
              </View>
            ) : null}
          </Pressable>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900" }}>{displayName}</Text>
              {!isGuest ? (
                <Pressable onPress={() => setShowEditName(true)}>
                  <Text style={{ color: colors.textTertiary, fontSize: 13 }}>✏️</Text>
                </Pressable>
              ) : null}
            </View>

            {isGuest ? (
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>Гість · реєстрація займе 30 секунд</Text>
            ) : (
              <View style={{ gap: 2, marginTop: 4 }}>
                {user?.email ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{user.email}</Text>
                ) : null}
                {isPhoneUser ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>📱 Вхід за телефоном</Text>
                ) : null}
              </View>
            )}
          </View>

          {isGuest ? (
            <View style={{ backgroundColor: colors.bgElevated, borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 5 }}>
              <Text style={{ color: colors.textTertiary, fontSize: 12, fontWeight: "700" }}>Гість</Text>
            </View>
          ) : (
            <View style={{ gap: 4 }}>
              {isEmailVerified ? (
                <Pill tone="success">✓ Verified</Pill>
              ) : user?.email ? (
                <Pill tone="warning">Не підтв.</Pill>
              ) : null}
            </View>
          )}
        </View>

        {isGuest ? (
          <Pressable
            style={{ marginTop: 16, backgroundColor: colors.red, borderRadius: radii.sm, paddingVertical: 14, alignItems: "center", shadowColor: colors.red, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 }}
            onPress={() => router.push("/auth?mode=register")}
          >
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>
              🚗 Зареєструватися безкоштовно
            </Text>
          </Pressable>
        ) : null}
      </Card>

      {/* Stats */}
      {!isGuest ? (
        <View style={{ flexDirection: "row", gap: 12 }}>
          {[
            { value: "0", label: "Тестів" },
            { value: "—", label: "Найкращий" },
            { value: "1", label: "Днів поспіль" },
          ].map((stat) => (
            <View key={stat.label} style={{ flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.red, fontSize: 22, fontWeight: "900" }}>{stat.value}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, textAlign: "center" }}>{stat.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Theme switcher */}
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
              <Text style={{ color: preference === opt.value ? colors.red : colors.textSecondary, fontSize: 11, fontWeight: "800" }}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Settings */}
      <Card>
        <Label>Розділи</Label>
        <Row title="ПДР Тренажер" detail="Пройти тест зараз" icon="✅" onPress={() => router.push("/(tabs)/tests")} />
        <Row title="Курси" detail="Матеріали та уроки" icon="📚" onPress={() => router.push("/(tabs)/learning")} />
        <Row title="Чат з Лідиком" detail="AI-помічник" icon="🚗" onPress={() => router.push("/(tabs)/club")} />
        <Row title="Діагностика" detail="Стан API та Firebase" icon="🔧" onPress={() => router.push("/diagnostic")} />
      </Card>

      {/* Network indicator */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: networkStatus === "online" ? colors.success : networkStatus === "offline" ? colors.red : colors.warning }} />
        <Text style={{ color: colors.textTertiary, fontSize: 12, fontWeight: "600" }}>
          {networkStatus === "online" ? "API доступний" : networkStatus === "offline" ? "Офлайн режим" : "Перевіряємо з'єднання..."}
        </Text>
      </View>

      <GhostButton onPress={signOut}>
        {isGuest ? "Увійти або зареєструватись" : "Вийти з акаунту"}
      </GhostButton>

    </Screen>
  );
}
