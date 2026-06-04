import { Text, StyleSheet, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../lib/auth";
import { Card, GhostButton, Label, Pill, Row, Screen } from "../../components/mobile-ui";
import { documents, payments, student } from "../../lib/mobile-data";
import { useTheme, radii, type ThemePreference } from "../../lib/theme";
import { useNetworkStatus } from "../../lib/useNetwork";

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: "dark",  label: "Темна",           icon: "🌙" },
  { value: "light", label: "Світла",          icon: "☀️" },
  { value: "auto",  label: "Автоматично",     icon: "⚙️" },
];

export default function ProfileTab() {
  const { mode, user, signOut } = useAuth();
  const { colors, preference, setPreference } = useTheme();
  const networkStatus = useNetworkStatus();
  const isGuest = mode === "guest";

  const displayName = user?.name ?? student.name;
  const displayInitials = user?.avatarInitials ?? student.initials;
  const displayCategory = user?.category ?? student.category;

  return (
    <Screen title="Профіль" subtitle="Налаштування, документи та платежі.">
      {/* Offline banner */}
      {networkStatus === "offline" ? (
        <View style={{ backgroundColor: colors.warningSoft, borderRadius: radii.md, padding: 12, borderWidth: 1, borderColor: colors.warning + "44", flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 20 }}>🚗</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.warning, fontWeight: "800", fontSize: 13 }}>Лідик offline 📡</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Немає з'єднання. Деякі функції недоступні.</Text>
          </View>
        </View>
      ) : null}

      {/* Profile header */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{ height: 60, width: 60, borderRadius: 20, backgroundColor: colors.red, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: colors.white, fontSize: 20, fontWeight: "900" }}>{displayInitials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900" }}>{displayName}</Text>
            {isGuest ? (
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>Гість · вхід не виконано</Text>
            ) : (
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                Категорія {displayCategory} · {student.manager}
              </Text>
            )}
          </View>
          {isGuest ? (
            <View style={{ backgroundColor: colors.bgElevated, borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 5 }}>
              <Text style={{ color: colors.textTertiary, fontSize: 12, fontWeight: "700" }}>Гість</Text>
            </View>
          ) : null}
        </View>

        {isGuest ? (
          <Pressable
            style={{ marginTop: 14, backgroundColor: colors.redSoft, borderRadius: radii.sm, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.red + "40" }}
            onPress={() => router.push("/auth?mode=register")}
          >
            <Text style={{ color: colors.red, fontWeight: "700", fontSize: 14, textAlign: "center" }}>
              🔐 Увійдіть, щоб зберегти прогрес
            </Text>
          </Pressable>
        ) : null}
      </Card>

      {/* Documents */}
      {!isGuest ? (
        <Card>
          <Label>Документи</Label>
          {documents.map((document) => (
            <Row
              key={document.id}
              title={document.title}
              detail={document.detail}
              right={
                <Pill
                  tone={
                    document.status === "Перевірено" ? "success"
                    : document.status === "Потрібно додати" ? "warning"
                    : "default"
                  }
                >
                  {document.status}
                </Pill>
              }
            />
          ))}
        </Card>
      ) : (
        <Card tone="dark">
          <Label variant="muted">Документи</Label>
          <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginTop: 10 }}>
            🔒 Вхід потрібен для перегляду документів та платежів
          </Text>
        </Card>
      )}

      {/* Payments */}
      {!isGuest ? (
        <Card>
          <Label>Платежі</Label>
          {payments.map((payment) => (
            <Row
              key={payment.id}
              title={`${payment.amount.toLocaleString("uk-UA")} грн`}
              detail={`${payment.provider} · ${payment.id}`}
              right={<Pill tone={payment.status === "paid" ? "success" : "warning"}>{payment.status}</Pill>}
            />
          ))}
        </Card>
      ) : null}

      {/* Theme switcher */}
      <Card>
        <Label>Тема оформлення</Label>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          {THEME_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setPreference(opt.value)}
              style={{
                flex: 1,
                alignItems: "center",
                padding: 12,
                borderRadius: radii.sm,
                backgroundColor: preference === opt.value ? colors.redSoft : colors.bgElevated,
                borderWidth: 1.5,
                borderColor: preference === opt.value ? colors.red : colors.border,
                gap: 4,
              }}
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
        <Label>Налаштування</Label>
        <Row title="Діагностика" detail="Стан API та Firebase" icon="🔧" onPress={() => router.push("/diagnostic")} />
        <Row title="Підтримка" detail="Написати в чат" icon="💬" onPress={() => {}} />
        <Row title="FAQ" detail="Часті запитання" icon="❓" onPress={() => {}} />
        <Row title="Умови використання" detail="Правила та конфіденційність" icon="📄" onPress={() => {}} />
      </Card>

      {/* Network status */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: networkStatus === "online" ? colors.success : networkStatus === "offline" ? colors.red : colors.warning }} />
        <Text style={{ color: colors.textTertiary, fontSize: 12, fontWeight: "600" }}>
          {networkStatus === "online" ? "API доступний" : networkStatus === "offline" ? "Офлайн режим" : "Перевіряємо з'єднання..."}
        </Text>
      </View>

      <GhostButton onPress={signOut}>
        {isGuest ? "Вийти / Увійти як учень" : "Вийти з акаунту"}
      </GhostButton>
    </Screen>
  );
}
