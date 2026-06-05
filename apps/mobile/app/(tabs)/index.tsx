import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Card, Label, Row, Screen } from "../../components/mobile-ui";
import { useAuth } from "../../lib/auth";
import { useTheme, radii, shadows, spacing } from "../../lib/theme";

// ─── Daily tip (rotates daily, no mock data) ──────────────────────────────────
const TIPS = [
  "Повтори знаки пріоритету та правило перешкоди справа — там найбільше помилок.",
  "Перевір, чи правильно відрегульовані дзеркала перед кожним заняттям.",
  "Категорія «Знаки» — база іспиту ПДР. Починай з неї.",
  "3 короткі сесії тестів на тиждень кращі за одну довгу.",
  "Стоп-лінія — зупинятися потрібно ПЕРЕД нею, а не на ній.",
  "Перед виїздом перевір тиск у шинах — займає 2 хвилини.",
  "На мокрій дорозі гальмівний шлях збільшується вдвічі.",
  "Знак «Головна дорога» діє до наступного перехрестя.",
];

function DailyTip({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const tip = TIPS[Math.floor(Date.now() / 86_400_000) % TIPS.length];

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.bgCard,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: "row",
        overflow: "hidden",
        ...shadows.card,
      }}
    >
      <View style={{ width: 4, backgroundColor: "#f59e0b" }} />
      <View style={{ flex: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text style={{ fontSize: 22 }}>💡</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: "900", color: "#f59e0b", letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>
            Порада дня
          </Text>
          <Text style={{ fontSize: 13, color: colors.textPrimary, lineHeight: 18, fontWeight: "600" }}>
            {tip}
          </Text>
        </View>
        <Text style={{ fontSize: 18, color: colors.textTertiary }}>›</Text>
      </View>
    </Pressable>
  );
}

// ─── Guest dashboard ───────────────────────────────────────────────────────────
function GuestHome() {
  const { colors } = useTheme();
  return (
    <Screen title="Вітаємо 👋" subtitle="Автошкола «Лідер» — почни знайомство.">
      <Card tone="red">
        <Label variant="inverse">З чого почати</Label>
        <Text style={{ marginTop: 8, color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.3 }}>
          Спробуй демо-тест ПДР
        </Text>
        <Text style={{ marginVertical: 10, color: "rgba(255,255,255,0.82)", lineHeight: 21 }}>
          200 реальних питань з поясненнями. Без реєстрації — просто спробуй.
        </Text>
        <Pressable
          onPress={() => router.push("/(tabs)/tests")}
          style={{ backgroundColor: "#fff", borderRadius: radii.sm, paddingVertical: 12, alignItems: "center", marginTop: 4 }}
        >
          <Text style={{ color: colors.red, fontWeight: "900", fontSize: 15 }}>🚀 Почати демо-тест</Text>
        </Pressable>
      </Card>

      <DailyTip onPress={() => router.push("/(tabs)/tests")} />

      <Card>
        <Label>Що можна зробити</Label>
        <Row title="Переглянути курси" detail="Категорії, ціни, програми" icon="📚" onPress={() => router.push("/(tabs)/learning")} />
        <Row title="Запитати Лідика" detail="AI-помічник 24/7" icon="🤖" onPress={() => router.push("/(tabs)/assistant")} />
        <Row title="Написати в автошколу" detail="Менеджер відповість" icon="💬" onPress={() => router.push("/(tabs)/chat")} />
      </Card>

      <Pressable
        onPress={() => router.push("/auth?mode=register")}
        style={{ backgroundColor: colors.redSoft, borderRadius: radii.md, padding: 18, borderWidth: 1.5, borderColor: colors.red + "44" }}
      >
        <Text style={{ color: colors.red, fontWeight: "900", fontSize: 16 }}>🔐 Зареєструватись безкоштовно</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
          Збережи прогрес, отримуй нагороди і доступ до всіх матеріалів.
        </Text>
      </Pressable>
    </Screen>
  );
}

// ─── Active student dashboard ──────────────────────────────────────────────────
// Shows real user name. Course progress / upcoming lesson will show once
// the school assigns a course — until then shows a clean "get started" state.
function StudentHome({ firstName }: { firstName: string }) {
  const { colors } = useTheme();

  return (
    <Screen title={`${firstName} 👋`} subtitle="Твій навчальний кабінет.">

      {/* 1. Daily tip */}
      <DailyTip onPress={() => router.push("/(tabs)/tests")} />

      {/* 2. Quick actions */}
      <Card>
        <Label>Швидкі дії</Label>
        <Row title="ПДР Тренажер" detail="Почати тест зараз" icon="🎯" onPress={() => router.push("/(tabs)/tests")} />
        <Row title="Запитати Лідика" detail="AI-помічник 24/7" icon="🤖" onPress={() => router.push("/(tabs)/assistant")} />
        <Row title="Написати в автошколу" detail="Менеджер відповість" icon="💬" onPress={() => router.push("/(tabs)/chat")} />
      </Card>

      {/* 3. Onboarding CTA — guides new student to start learning */}
      <View
        style={{
          backgroundColor: colors.bgCard,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.lg,
          gap: spacing.md,
          ...shadows.card,
        }}
      >
        <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" }}>
          Розпочати навчання
        </Text>
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "900", letterSpacing: -0.3 }}>
          Підготуйся до іспиту ПДР
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
          Тренажер, категорії знаків та Лідик — все в одному місці.
        </Text>
        <Pressable
          onPress={() => router.push("/(tabs)/learning")}
          style={{ backgroundColor: colors.red, borderRadius: radii.sm, paddingVertical: 13, alignItems: "center", marginTop: 4 }}
        >
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>До навчання →</Text>
        </Pressable>
      </View>

    </Screen>
  );
}

export default function HomeTab() {
  const { user, mode } = useAuth();
  const isGuest = mode !== "authenticated" || !user || user.isGuest;

  if (isGuest) return <GuestHome />;

  const displayName = user?.name ?? "Учень";
  return <StudentHome firstName={displayName.split(" ")[0]} />;
}
