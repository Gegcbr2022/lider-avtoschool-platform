import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Label, Row, Screen } from "../../components/mobile-ui";
import { useAuth } from "../../lib/auth";
import { useTheme, radii, shadows, spacing } from "../../lib/theme";
import {
  getInstructorBookings,
  getUserBonusBalance,
  getUserStats,
  subscribeToConversations,
  type BookingDoc,
  type ConversationDoc,
  type UserBonusDoc,
  type UserStats,
  EMPTY_BONUS,
  EMPTY_STATS,
} from "../../lib/firestore";
import { getContextualLidikTip } from "../../lib/lidik-context";

// ─── ScalePressable — spring micro-interaction + haptic ───────────────────────
function ScalePressable({
  onPress,
  children,
  style,
  haptic = false,
}: {
  onPress: () => void;
  children: React.ReactNode;
  style?: object;
  haptic?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.97,
          useNativeDriver: true,
          speed: 20,
          bounciness: 4,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
          bounciness: 4,
        }).start()
      }
      onPress={() => {
        if (haptic) Vibration.vibrate(10);
        onPress();
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ─── Daily tip (manually refreshable, changes once/day by default) ─────────────
const TIPS = [
  "Повтори знаки пріоритету та правило перешкоди справа.",
  "Відрегулюй дзеркала перед кожним заняттям.",
  "Знаки — база іспиту ПДР. Починай з неї.",
  "3 короткі сесії тестів кращі за одну довгу.",
  "Стоп-лінія: зупиняйся ПЕРЕД нею.",
  "Перед поворотом — сигнал, дзеркала, сліпа зона.",
  "Швидкість у місті: 50 км/год, якщо не вказано інше.",
  "На пішохідному переході — поступись пішоходу завжди.",
  "Дистанція — мінімум 2 секунди до авто попереду.",
  "Паркуйся лише там, де не заважаєш іншим і знакам.",
];

function DailyTip({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const defaultIdx = Math.floor(Date.now() / 86_400_000) % TIPS.length;
  const [tipIdx, setTipIdx] = useState(defaultIdx);
  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    setRefreshing(true);
    const next = (tipIdx + 1) % TIPS.length;
    setTipIdx(next);
    setTimeout(() => setRefreshing(false), 300);
  }

  return (
    <View
      style={{
        backgroundColor: colors.bgCard,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
        ...shadows.card,
      }}
    >
      <ScalePressable onPress={onPress}>
        <View style={{ padding: 20, paddingBottom: 14, flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <Text style={{ fontSize: 24, marginTop: 2 }}>💡</Text>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: "900",
                color: colors.red,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Порада дня
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: colors.textPrimary,
                lineHeight: 23,
                fontWeight: "700",
              }}
            >
              {TIPS[tipIdx]}
            </Text>
          </View>
        </View>
      </ScalePressable>
      {/* Refresh strip */}
      <Pressable
        onPress={handleRefresh}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.bgElevated,
          opacity: refreshing ? 0.5 : 1,
        }}
      >
        <Text style={{ fontSize: 13, color: colors.red, fontWeight: "800" }}>
          {refreshing ? "⏳" : "🔄"} Інша порада
        </Text>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GUEST HOME
// ─────────────────────────────────────────────────────────────────────────────
function GuestHome() {
  const { colors } = useTheme();
  const lidikTip = getContextualLidikTip("home", { isGuest: true });
  return (
    <Screen title="Вітаємо." subtitle="Автошкола Лідер.">
      <Card tone="red" style={{ padding: 24, borderRadius: radii.lg }}>
        <Label variant="inverse">Для старту</Label>
        <Text
          style={{
            marginTop: 12,
            color: "#fff",
            fontSize: 26,
            fontWeight: "900",
            letterSpacing: -0.8,
          }}
        >
          Тренажер ПДР
        </Text>
        <Text
          style={{
            marginVertical: 12,
            color: "rgba(255,255,255,0.7)",
            lineHeight: 22,
            fontSize: 15,
          }}
        >
          {lidikTip}
        </Text>
        <ScalePressable
          onPress={() => router.push("/(tabs)/tests")}
          style={{
            backgroundColor: "#fff",
            borderRadius: radii.md,
            paddingVertical: 16,
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <Text style={{ color: colors.red, fontWeight: "900", fontSize: 15 }}>
            Почати демо-тест
          </Text>
        </ScalePressable>
      </Card>

      <DailyTip onPress={() => router.push("/(tabs)/tests")} />

      <Card style={{ borderRadius: radii.lg }}>
        <Label>Екосистема</Label>
        <Row
          title="Курси та ціни"
          detail="Програми навчання"
          icon="📚"
          onPress={() => router.push("/(tabs)/learning")}
        />
        <Row
          title="AI Лідик"
          detail="Помічник 24/7"
          icon="🤖"
          onPress={() => router.push("/(tabs)/assistant")}
        />
        <Row
          title="Підтримка"
          detail="Чат з автошколою"
          icon="💬"
          onPress={() => router.push("/(tabs)/chat")}
        />
        <Row
          title="Страховка"
          detail="ОСЦПВ та КАСКО"
          icon="🛡️"
          onPress={() => router.push("/insurance" as Href)}
        />
      </Card>

      <ScalePressable
        onPress={() => router.push("/auth?mode=register" as Href)}
        style={{
          backgroundColor: colors.bgCard,
          borderRadius: radii.lg,
          padding: 24,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: colors.red, fontWeight: "900", fontSize: 16 }}>
          Реєстрація
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 14,
            marginTop: 6,
            lineHeight: 20,
          }}
        >
          Збереження прогресу та доступ до всіх матеріалів.
        </Text>
      </ScalePressable>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT HOME — E1 Monobank-UX hub
// ─────────────────────────────────────────────────────────────────────────────
// ─── Stagger animation hook ────────────────────────────────────────────────────
function useStaggerAnim(count: number, delay = 60) {
  const anims = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(
      delay,
      anims.map((a) =>
        Animated.spring(a, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 6 })
      )
    ).start();
  }, []);
  return anims;
}

function StudentHome() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  const [bonus, setBonus] = useState<UserBonusDoc>(EMPTY_BONUS);
  const [refreshing, setRefreshing] = useState(false);
  // 5 elements: hero card + 3 small action cards + hints card
  const cardAnims = useStaggerAnim(5, 55);

  const load = async () => {
    if (!user?.id) return;
    const [s, b] = await Promise.all([
      getUserStats(user.id).catch(() => EMPTY_STATS),
      getUserBonusBalance(user.id).catch(() => EMPTY_BONUS),
    ]);
    setStats(s);
    setBonus(b);
  };

  useEffect(() => { void load(); }, [user?.id]);

  useFocusEffect(useCallback(() => { void load(); }, [user?.id]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  // Determine funnel stage for smart hints
  const stage: "new" | "learning" | "ready" | "advanced" =
    stats.testsCompleted === 0 ? "new" :
    stats.bestScorePct >= 75 ? "ready" :
    stats.testsCompleted >= 10 ? "advanced" : "learning";

  const STAGE_LABELS: Record<typeof stage, { label: string; color: string; hint: string }> = {
    new:      { label: "Щойно записався", color: colors.textSecondary, hint: "Пройди перший тест — Лідик складе твій маршрут" },
    learning: { label: "Навчаюсь", color: colors.warning, hint: "Потрібно ≥75% на екзамені МВС. Попрацюй зі слабкими темами" },
    ready:    { label: "Готовий до іспиту", color: colors.success, hint: "Відмінно! Переходь до повного екзамену і практики" },
    advanced: { label: "Прокачуюсь", color: colors.info, hint: "Спробуй марафон — всі питання підряд без втрати місця" },
  };

  const stageInfo = STAGE_LABELS[stage];
  const name = user?.name ?? "Учень";
  const firstName = name.split(" ")[0];
  const category = user?.category ?? "B";
  const accuracyPct = stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;
  
  // Розрахунок днів до іспиту
  const examDateStr = (user as any)?.examDate;
  let daysToExam = null;
  if (examDateStr) {
    const msDiff = new Date(examDateStr).getTime() - new Date().getTime();
    const days = Math.ceil(msDiff / 86400000);
    if (days >= 0) daysToExam = days;
  }

  const SIDE_ACTIONS: {
    icon: string; label: string; subtitle: string; route: Href; tint: string; tintSoft: string;
  }[] = [
    {
      icon: "🤖",
      label: "Лідик",
      subtitle: "AI 24/7",
      route: "/(tabs)/assistant" as Href,
      tint: colors.info,
      tintSoft: colors.infoSoft,
    },
    {
      icon: "💬",
      label: "Чат",
      subtitle: "Підтримка",
      route: "/(tabs)/chat" as Href,
      tint: colors.success,
      tintSoft: colors.successSoft,
    },
    {
      icon: "🏆",
      label: "Клуб",
      subtitle: "Рейтинг",
      route: "/(tabs)/club" as Href,
      tint: colors.warning,
      tintSoft: colors.warningSoft,
    },
    {
      icon: "🚗",
      label: "Заняття",
      subtitle: "Практика",
      route: "/booking" as Href,
      tint: colors.red,
      tintSoft: colors.redSoft,
    },
  ];

  const heroProgress = stats.testsCompleted > 0 ? Math.min(100, stats.bestScorePct) : 0;
  const heroHint = getContextualLidikTip("home", { stats, role: user?.role, name, daysToExam });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Dashboard Hero ─────────────────────────────────────── */}
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
            <View>
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Привіт, {firstName}!
              </Text>
              <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "900", letterSpacing: -0.5, marginTop: 2 }}>
                {stageInfo.label}
              </Text>
            </View>
            {daysToExam !== null && (
              <View style={{ backgroundColor: colors.redSoft, borderRadius: radii.md, paddingHorizontal: 10, paddingVertical: 6 }}>
                <Text style={{ color: colors.red, fontSize: 11, fontWeight: "900" }}>До іспиту {daysToExam} дн.</Text>
              </View>
            )}
          </View>

          <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadows.card, marginTop: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.infoSoft, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 26 }}>🤖</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "600", lineHeight: 20 }}>
                  "{heroHint}"
                </Text>
              </View>
            </View>
            <ScalePressable
              haptic
              onPress={() => router.push("/(tabs)/tests")}
              style={{ backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 14, alignItems: "center", marginTop: 16 }}
            >
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>Продовжити навчання</Text>
            </ScalePressable>
          </View>
        </View>

        {/* ── Сьогодні для тебе ─────────────────────────────────────────── */}
        <Animated.View style={{
          opacity: cardAnims[0],
          transform: [{ scale: (cardAnims[0] as Animated.Value).interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
        }}>
          <View style={{ gap: spacing.xs, marginTop: 4 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "800", marginLeft: 4, marginBottom: 4 }}>Сьогодні для тебе</Text>
            <ScalePressable
              onPress={() => router.push("/(tabs)/tests")}
              style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, ...shadows.card }}
            >
              <View style={{ width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.warningSoft, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 22 }}>⚡</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "800" }}>Коротке тренування</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "500", marginTop: 2 }}>10 питань за 5 хвилин</Text>
              </View>
              <Text style={{ color: colors.textTertiary, fontSize: 20 }}>›</Text>
            </ScalePressable>
          </View>
        </Animated.View>

        {/* ── Action Cards ──────────────────────────────────────────── */}
        <Animated.View style={{
          opacity: cardAnims[1],
          transform: [{ scale: (cardAnims[1] as Animated.Value).interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
        }}>
          <View style={{ gap: 10 }}>
            {/* Тренажер — широка featured-рядок */}
            <ScalePressable
              haptic
              onPress={() => router.push("/(tabs)/tests")}
              style={{
                backgroundColor: colors.bgCard,
                borderRadius: radii.lg,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                borderLeftWidth: 3,
                borderLeftColor: colors.red,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                ...shadows.card,
              }}
            >
              <View style={{ width: 46, height: 46, borderRadius: radii.md, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 24 }}>🎯</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "900" }}>Тренажер ПДР</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "500", marginTop: 2 }}>
                  {stats.testsCompleted > 0 ? `Пройдено ${stats.testsCompleted} тестів` : "Всі офіційні питання ПДР"}
                </Text>
              </View>
              <Text style={{ color: colors.red, fontSize: 22, fontWeight: "300" }}>›</Text>
            </ScalePressable>

            {/* 3 рядки в згрупованій картці */}
            <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden", ...shadows.card }}>
              {([
                { icon: "📚", label: "Навчання",  sub: "Твій план до іспиту", route: "/(tabs)/learning",  iconBg: colors.successSoft,  iconColor: colors.success },
                { icon: "🤖", label: "Лідик",     sub: "AI-помічник 24/7",    route: "/(tabs)/assistant", iconBg: colors.infoSoft,     iconColor: colors.info },
                { icon: "🏆", label: "Клуб",      sub: "Рейтинг та спільнота",route: "/(tabs)/club",      iconBg: colors.warningSoft,  iconColor: colors.warning },
              ] as const).map((a, i) => (
                <ScalePressable
                  key={a.label}
                  haptic
                  onPress={() => router.push(a.route as Href)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 13, paddingHorizontal: 16, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.border }}
                >
                  <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: a.iconBg, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 20 }}>{a.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "800" }}>{a.label}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "500", marginTop: 1 }}>{a.sub}</Text>
                  </View>
                  <Text style={{ color: colors.textTertiary, fontSize: 20, fontWeight: "300" }}>›</Text>
                </ScalePressable>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ── Stats strip ───────────────────────────────────────────────── */}
        {stats.testsCompleted > 0 ? (
          <Animated.View style={{
            opacity: cardAnims[2],
            transform: [{ scale: (cardAnims[2] as Animated.Value).interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }],
          }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[
                { label: "Тестів", value: String(stats.testsCompleted), icon: "✅" },
                { label: "Відповідей", value: String(stats.totalAnswered), icon: "🧠" },
                { label: "Найкращий", value: `${stats.bestScorePct}%`, icon: "🔥" },
              ].map((s) => (
                <View key={s.label} style={{ flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border, gap: 4 }}>
                  <Text style={{ fontSize: 18 }}>{s.icon}</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "900" }}>{s.value}</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 10, fontWeight: "700", textTransform: "uppercase" }}>{s.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}

        {/* ── Services ──────────────────────────────────────────────────── */}
        <Animated.View style={{
          opacity: cardAnims[3],
          transform: [{ scale: (cardAnims[3] as Animated.Value).interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }],
        }}>
          <Card style={{ borderRadius: radii.lg }}>
            <Label>Сервіси</Label>
            <Row title="Практичне водіння" detail="Обери інструктора" icon="🚗" onPress={() => router.push("/booking" as Href)} />
            <Row title="Страховка" detail="ОСЦПВ онлайн" icon="🛡️" onPress={() => router.push("/insurance" as Href)} />
            <Row title="Сервісні центри" detail="Маршрути МВС" icon="🏛️" onPress={() => router.push("/service-centers" as Href)} />
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INSTRUCTOR HOME — Повноцінний інтерфейс інструктора з tab bar
// ─────────────────────────────────────────────────────────────────────────────
function formatDateTime(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("uk-UA", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusLabel(status: string, colors: ReturnType<typeof useTheme>["colors"]): { label: string; color: string } {
  switch (status) {
    case "confirmed":  return { label: "Підтверджено", color: colors.success };
    case "cancelled":  return { label: "Скасовано",    color: colors.red };
    case "completed":  return { label: "Завершено",    color: colors.textTertiary };
    default:           return { label: "Очікується",   color: colors.warning };
  }
}

function InstructorHome({ name }: { name: string }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const s = makeInstructorStyles(colors);

  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [convs, setConvs] = useState<ConversationDoc[]>([]);
  const [loadingB, setLoadingB] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadBookings() {
    if (!user) return;
    try {
      const data = await getInstructorBookings(user.id);
      setBookings(data);
    } catch {
      // handle silently
    } finally {
      setLoadingB(false);
    }
  }

  useEffect(() => {
    void loadBookings();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToConversations(user.id, (list) => {
      setConvs(list);
    });
    return unsub;
  }, [user?.id]);

  async function onRefresh() {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  }

  const upcoming = bookings
    .filter((b) => b.status !== "cancelled" && b.status !== "completed")
    .sort((a, b) => (a.startsAt > b.startsAt ? 1 : -1));

  const firstName = name.split(" ")[0];
  const instructorTip = getContextualLidikTip("home", { role: "instructor", name });

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.red}
          />
        }
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>Вітаємо,</Text>
            <Text style={s.name}>{firstName} 🚗</Text>
            <Text style={s.role}>Інструктор · Автошкола Лідер</Text>
            <Text style={s.instructorTip}>{instructorTip}</Text>
          </View>
          <ScalePressable
            onPress={() => router.push("/instructor-students" as Href)}
            style={s.studentsBtn}
          >
            <Text style={s.studentsBtnText}>Мої учні</Text>
          </ScalePressable>
        </View>

        {/* ── Quick stats ─────────────────────────────────────────────────── */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: colors.bgCard }]}>
            <Text style={s.statValue}>{upcoming.length}</Text>
            <Text style={s.statLabel}>Занять{"\n"}заплановано</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: colors.bgCard }]}>
            <Text style={s.statValue}>{convs.length}</Text>
            <Text style={s.statLabel}>Активних{"\n"}чатів</Text>
          </View>
          <ScalePressable
            onPress={() => router.push("/instructor-students" as Href)}
            style={[s.statCard, { backgroundColor: colors.red }]}
          >
            <Text style={[s.statValue, { color: "#fff" }]}>→</Text>
            <Text style={[s.statLabel, { color: "rgba(255,255,255,0.8)" }]}>
              Учні{"\n"}та заняття
            </Text>
          </ScalePressable>
        </View>

        {/* ── Upcoming schedule ───────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>📅 Найближчі заняття</Text>

        {loadingB ? (
          <ActivityIndicator
            color={colors.red}
            style={{ marginVertical: 24 }}
          />
        ) : upcoming.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyTitle}>Немає запланованих занять</Text>
            <Text style={s.emptyText}>
              Нові записи учнів з'являться тут автоматично
            </Text>
          </View>
        ) : (
          upcoming.map((b) => {
            const st = statusLabel(b.status, colors);
            return (
              <View key={b.id} style={s.bookingCard}>
                <View style={s.bookingRow}>
                  <Text style={s.studentName}>{b.studentName || "Учень"}</Text>
                  <View
                    style={[
                      s.statusBadge,
                      { backgroundColor: st.color + "22" },
                    ]}
                  >
                    <Text style={[s.statusText, { color: st.color }]}>
                      {st.label}
                    </Text>
                  </View>
                </View>
                <Text style={s.bookingTime}>🕐 {formatDateTime(b.startsAt)}</Text>
              </View>
            );
          })
        )}

        {/* ── Student chats ─────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>💬 Чати з учнями</Text>

        {convs.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyEmoji}>💬</Text>
            <Text style={s.emptyTitle}>Поки що немає чатів</Text>
            <Text style={s.emptyText}>
              Учні можуть написати вам через вкладку Чат
            </Text>
          </View>
        ) : (
          convs.map((c) => (
            <Pressable
              key={c.id}
              style={s.chatRow}
              onPress={() =>
                router.push("/instructor-students" as Href)
              }
            >
              <View style={s.chatAvatar}>
                <Text style={{ fontSize: 20 }}>👤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.chatName}>{c.title}</Text>
                {c.lastMessage ? (
                  <Text style={s.chatLast} numberOfLines={1}>
                    {c.lastMessage}
                  </Text>
                ) : (
                  <Text style={[s.chatLast, { fontStyle: "italic" }]}>
                    Немає повідомлень
                  </Text>
                )}
              </View>
              <Text style={s.chevron}>›</Text>
            </Pressable>
          ))
        )}

        {/* ── Quick tools ─────────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>⚡ Швидкий доступ</Text>
        <Card style={{ marginHorizontal: spacing.md, borderRadius: radii.lg }}>
          <Row
            title="ПДР Тренажер"
            detail="Матеріали для учнів"
            icon="🎯"
            onPress={() => router.push("/(tabs)/tests")}
          />
          <Row
            title="AI Лідик"
            detail="Асистент автошколи"
            icon="🤖"
            onPress={() => router.push("/(tabs)/assistant")}
          />
          <Row
            title="Клуб"
            detail="Спільнота водіїв"
            icon="🏆"
            onPress={() => router.push("/(tabs)/club")}
          />
          <Row
            title="Сервісні центри"
            detail="МВС та адреси"
            icon="🏛️"
            onPress={() => router.push("/service-centers" as Href)}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeInstructorStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },

    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      gap: 12,
    },
    greeting: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: 0.2,
    },
    name: {
      color: colors.textPrimary,
      fontSize: 26,
      fontWeight: "900",
      letterSpacing: -0.5,
    },
    role: {
      color: colors.textTertiary,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 2,
    },
    instructorTip: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 18,
      marginTop: 8,
    },
    studentsBtn: {
      backgroundColor: colors.red,
      borderRadius: radii.md,
      paddingHorizontal: 16,
      paddingVertical: 12,
      ...shadows.red,
    },
    studentsBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },

    statsRow: {
      flexDirection: "row",
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    statCard: {
      flex: 1,
      borderRadius: radii.md,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      gap: 4,
    },
    statValue: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: "900",
      letterSpacing: -0.5,
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: "700",
      textAlign: "center",
      lineHeight: 14,
    },

    sectionTitle: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      marginHorizontal: spacing.md,
    },

    bookingCard: {
      backgroundColor: colors.bgCard,
      borderRadius: radii.md,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bookingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    studentName: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "800",
    },
    statusBadge: {
      borderRadius: radii.xs,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    statusText: { fontSize: 11, fontWeight: "700" },
    bookingTime: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "500",
    },
    bookingNotes: {
      color: colors.textTertiary,
      fontSize: 12,
      marginTop: 4,
      fontStyle: "italic",
    },

    emptyCard: {
      alignItems: "center",
      paddingVertical: 32,
      marginHorizontal: spacing.md,
      backgroundColor: colors.bgCard,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    emptyEmoji: { fontSize: 36, marginBottom: 10 },
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 4,
    },
    emptyText: {
      color: colors.textTertiary,
      fontSize: 13,
      textAlign: "center",
      paddingHorizontal: 24,
    },

    chatRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: spacing.md,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.bg,
    },
    chatAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.redSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    chatName: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "800",
    },
    chatLast: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
    chevron: { color: colors.textTertiary, fontSize: 18 },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT — Role-based router
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeTab() {
  const { user, mode } = useAuth();
  const isGuest = mode !== "authenticated" || !user || user.isGuest;

  if (isGuest) return <GuestHome />;

  if (user?.role === "instructor") {
    return <InstructorHome name={user.name ?? "Інструктор"} />;
  }

  return <StudentHome />;
}
