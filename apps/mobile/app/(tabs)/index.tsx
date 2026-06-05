import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Card, Label, Pill, ProgressBar, Row, Screen } from "../../components/mobile-ui";
import { courseProgress, retentionSignals, student, upcomingSlot } from "../../lib/mobile-data";
import { useAuth } from "../../lib/auth";
import { useTheme, radii, shadows, spacing } from "../../lib/theme";

// ─── Monobank-style tip card ───────────────────────────────────────────────────
const TIPS = [
  "Повтори знаки пріоритету та правило перешкоди справа — там найбільше помилок.",
  "Перевір, чи правильно відрегульовані дзеркала перед кожним заняттям.",
  "Категорія «Знаки» — база іспиту ПДР. Починай з неї.",
  "3 короткі сесії тестів на тиждень кращі за одну довгу.",
  "Стоп-лінія — зупинятися потрібно ПЕРЕД нею, а не на ній.",
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
function StudentHome({ firstName }: { firstName: string }) {
  const { colors } = useTheme();
  const progressPercent = Math.round(
    (courseProgress.completedLessons / courseProgress.totalLessons) * 100
  );

  return (
    <Screen title={`${firstName} 👋`} subtitle="Твій навчальний кабінет.">

      {/* 1. Де я? — current course */}
      <Card tone="red">
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" }}>
              Поточний курс
            </Text>
            <Text style={{ marginTop: 6, color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 }}>
              Категорія {student.category}
            </Text>
          </View>
          <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "900" }}>{progressPercent}%</Text>
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          <ProgressBar value={progressPercent} color="rgba(255,255,255,0.95)" height={8} />
        </View>

        <View style={{ flexDirection: "row", marginTop: 14, gap: 20 }}>
          <View>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "700" }}>УРОКІВ</Text>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900", marginTop: 2 }}>
              {courseProgress.completedLessons}/{courseProgress.totalLessons}
            </Text>
          </View>
          <View>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "700" }}>ТЕСТИ</Text>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900", marginTop: 2 }}>{courseProgress.testScore}%</Text>
          </View>
          <View style={{ flex: 1, alignItems: "flex-end", justifyContent: "flex-end" }}>
            <Pressable
              onPress={() => router.push("/(tabs)/learning")}
              style={{ backgroundColor: "#fff", borderRadius: radii.sm, paddingVertical: 8, paddingHorizontal: 16 }}
            >
              <Text style={{ color: colors.red, fontWeight: "900", fontSize: 13 }}>Навчання →</Text>
            </Pressable>
          </View>
        </View>
      </Card>

      {/* 2. Що робити далі? — daily tip */}
      <DailyTip onPress={() => router.push("/(tabs)/tests")} />

      {/* 3. Наступне заняття */}
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" }}>
            Наступне заняття
          </Text>
          <Pill tone="success">Підтверджено</Pill>
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900", marginTop: 10, letterSpacing: -0.5 }}>
          {upcomingSlot.branch?.city ?? "Київ"} · {upcomingSlot.vehicle}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>
          Інструктор: {upcomingSlot.instructor}
        </Text>
        <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: 14 }} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => router.push("/(tabs)/learning")}
            style={{ flex: 1, backgroundColor: colors.red, borderRadius: radii.sm, paddingVertical: 12, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>Курс</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(tabs)/chat")}
            style={{ flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.sm, paddingVertical: 12, alignItems: "center" }}
          >
            <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 14 }}>Написати</Text>
          </Pressable>
        </View>
      </Card>

      {/* 4. Швидкі дії — 2 most-used only */}
      <Card>
        <Label>Швидкі дії</Label>
        <Row title="ПДР Тренажер" detail="Почати тест зараз" icon="🎯" onPress={() => router.push("/(tabs)/tests")} />
        <Row title="Запитати Лідика" detail="AI-помічник 24/7" icon="🤖" onPress={() => router.push("/(tabs)/assistant")} />
      </Card>
    </Screen>
  );
}

export default function HomeTab() {
  const { user, mode } = useAuth();
  const isGuest = mode !== "authenticated" || !user || user.isGuest;

  if (isGuest) return <GuestHome />;

  const displayName = user?.name ?? student.name;
  return <StudentHome firstName={displayName.split(" ")[0]} />;
}
