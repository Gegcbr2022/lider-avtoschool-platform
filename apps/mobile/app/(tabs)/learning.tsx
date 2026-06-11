import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { Screen } from "../../components/mobile-ui";
import { LidikGuide } from "../../components/lidik-guide";
import { useTheme, radii, shadows } from "../../lib/theme";
import { useAuth } from "../../lib/auth";
import { getUserStats, EMPTY_STATS, type UserStats } from "../../lib/firestore";
import {
  buildPdrCoachPlan,
  loadPdrProgress,
  type PdrProgressState,
} from "../../lib/pdr-progress";
import { getContextualLidikTip } from "../../lib/lidik-context";
import type { DrivingLicenseCategory } from "../../lib/pdr-questions";

const EMPTY_PROGRESS: PdrProgressState = { mistakes: {}, topicProgress: {} };

// Чотири фази дороги до посвідчення. Етап обчислюється з реальних даних учня,
// а не задається жорстко — ніяких мок-значень на проді.
const ROADMAP_STEPS = ["Вивчення теорії", "Тренування ПДР", "Готовність до іспиту", "Практика та іспит"] as const;
const PDR_TRAINING_ROUTE = { pathname: "/(tabs)/tests", params: { mode: "training" } } as Href;
const PDR_EXAM_ROUTE = { pathname: "/(tabs)/tests", params: { mode: "exam" } } as Href;
const PDR_MISTAKES_ROUTE = { pathname: "/(tabs)/tests", params: { mode: "mistakes" } } as Href;
const LESSONS_ROUTE = "/lessons" as Href;

export default function LearningTab() {
  const { colors } = useTheme();
  const { user, mode } = useAuth();
  const isAuth = mode === "authenticated";
  const scopeId = user?.id ?? "guest";
  const licenseCategory = ((user?.category as DrivingLicenseCategory | undefined) ?? "B");

  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  const [progress, setProgress] = useState<PdrProgressState>(EMPTY_PROGRESS);

  const load = useCallback(async () => {
    const [s, p] = await Promise.all([
      user?.id ? getUserStats(user.id).catch(() => EMPTY_STATS) : Promise.resolve(EMPTY_STATS),
      loadPdrProgress(scopeId).catch(() => EMPTY_PROGRESS),
    ]);
    setStats(s);
    setProgress(p);
  }, [user?.id, scopeId]);

  useEffect(() => { void load(); }, [load]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const plan = useMemo(() => buildPdrCoachPlan(progress, licenseCategory), [progress, licenseCategory]);

  // ─── Реальний етап дороги ───────────────────────────────────────────────────
  const started = stats.testsCompleted > 0 || plan.seen > 0;
  const examReady = stats.bestScorePct >= 75;
  const stepIndex = !started ? 0 : !examReady ? 1 : 2; // 4-та фаза (практика) — поза теоретичним треком
  const stepLabel = ROADMAP_STEPS[stepIndex];
  const readinessPct = started ? Math.min(100, Math.max(stats.bestScorePct, plan.overallPercent)) : 0;

  // Один зрозумілий наступний крок + текст CTA — залежить від етапу.
  const nextStep = !started
    ? { cta: "Почати перше тренування", route: PDR_TRAINING_ROUTE, hint: "Пройди свій перший тест — і Лідик складе твій маршрут." }
    : !examReady
      ? {
          cta: "Продовжити тренування",
          route: PDR_TRAINING_ROUTE,
          hint: plan.recommendedCategory
            ? `Підтягни тему «${plan.recommendedCategory}» — там зараз найбільший приріст.`
            : "Потрібно ≥75% на екзамені МВС. Тренуйся короткими сесіями.",
        }
      : { cta: "Пройти пробний іспит", route: PDR_EXAM_ROUTE, hint: "Ти готовий! Спробуй повний екзамен МВС і переходь до практики." };

  const lidikLine = getContextualLidikTip("learning", { stats, coachPlan: plan });
  const weakTopicCount = plan.weakTopics.length;
  const statTiles = [
    { label: "Тести", value: String(stats.testsCompleted), tone: colors.redSoft, text: colors.red },
    { label: "Рекорд", value: `${stats.bestScorePct}%`, tone: colors.successSoft, text: colors.success },
    { label: "Слабкі", value: String(weakTopicCount), tone: colors.warningSoft, text: colors.warning },
  ];

  return (
    <Screen title="Навчання" subtitle="Твоя дорожня карта до посвідчення водія.">

      {/* ─── Hero: реальний прогрес ───────────────────────────────────────────── */}
      <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadows.card, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: examReady ? colors.success : started ? colors.warning : colors.textTertiary }} />
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "800" }}>{stepLabel}</Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "700" }}>Крок {stepIndex + 1} з 4</Text>
        </View>

        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: "hidden", marginBottom: 8 }}>
          <View style={{ width: `${readinessPct}%`, height: "100%", backgroundColor: examReady ? colors.success : colors.red, borderRadius: 3 }} />
        </View>
        <Text style={{ color: colors.textTertiary, fontSize: 12, fontWeight: "600", marginBottom: 16 }}>
          {started ? `Найкращий результат: ${stats.bestScorePct}%` : "Ще немає результатів — почни перший тест"}
        </Text>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
          {statTiles.map((item) => (
            <View key={item.label} style={{ flex: 1, backgroundColor: item.tone, borderRadius: radii.md, padding: 10 }}>
              <Text style={{ color: item.text, fontSize: 18, fontWeight: "900", lineHeight: 22 }}>{item.value}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "800", marginTop: 2 }}>{item.label}</Text>
            </View>
          ))}
        </View>

        <LidikGuide
          variant="inline"
          text={lidikLine}
          style={{ marginBottom: 12 }}
        />

        <View style={{ backgroundColor: colors.bgElevated, borderRadius: radii.md, padding: 12, marginBottom: 12 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "900", marginBottom: 4 }}>Наступний крок</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>{nextStep.hint}</Text>
        </View>

        <Pressable
          onPress={() => router.push(nextStep.route)}
          style={{ backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" }}
        >
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>{nextStep.cta}</Text>
        </Pressable>
      </View>

      {/* ─── Слабкі теми: тільки коли є реальні дані ───────────────────────────── */}
      {plan.weakTopics.length > 0 ? (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "800", marginLeft: 4, marginBottom: 8 }}>Слабкі теми</Text>
          <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden", ...shadows.card }}>
            {plan.weakTopics.map((topic, i) => (
              <Pressable
                key={topic.category}
                onPress={() => router.push(PDR_MISTAKES_ROUTE)}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.border }}
              >
                <View style={{ width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.warningSoft, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: colors.warning, fontSize: 15, fontWeight: "900" }}>{topic.percent}%</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "800" }}>{topic.category}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{topic.reason}</Text>
                </View>
                <Text style={{ color: colors.textTertiary, fontSize: 20 }}>›</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <View style={{ marginBottom: 16, backgroundColor: colors.bgElevated, borderRadius: radii.lg, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 22 }}>🔍</Text>
          <Text style={{ flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
            Лідик покаже теми, де ти помиляєшся, після кількох тестів — і підкаже, що підтягнути.
          </Text>
        </View>
      )}

      <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "800", marginLeft: 4, marginBottom: 8 }}>Швидкі дії</Text>

      <View style={{ gap: 10 }}>
        <Pressable
          onPress={() => router.push(LESSONS_ROUTE)}
          style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 14, ...shadows.card }}
        >
          <View style={{ width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.infoSoft, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 22 }}>📚</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "800" }}>Відео та конспекти</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Матеріали автошколи безпосередньо в додатку</Text>
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 20 }}>›</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push(PDR_TRAINING_ROUTE)}
          style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 14, ...shadows.card }}
        >
          <View style={{ width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 22 }}>🎯</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "800" }}>Тренування ПДР</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              {started ? `Пройдено ${stats.testsCompleted} тестів` : "Теми, міні-ігри та марафон"}
            </Text>
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 20 }}>›</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push(PDR_EXAM_ROUTE)}
          style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 14, ...shadows.card }}
        >
          <View style={{ width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 22 }}>🎓</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "800" }}>Пробний іспит</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>20 питань за 20 хвилин</Text>
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 20 }}>›</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(tabs)/assistant")}
          style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 14, ...shadows.card }}
        >
          <View style={{ width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.infoSoft, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 22 }}>🤖</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "800" }}>Поставити питання Лідику</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>AI-помічник 24/7</Text>
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 20 }}>›</Text>
        </Pressable>
      </View>

      {/* ─── Практичне водіння ─────────────────────────────────────────────── */}
      {isAuth && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "800", marginLeft: 4, marginBottom: 8 }}>Практика</Text>
          <Pressable onPress={() => router.push("/booking" as Href)}>
            <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, ...shadows.card }}>
              <View style={{ width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.bgElevated, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 22 }}>🚗</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textPrimary }}>Практичне водіння</Text>
                <Text style={{ marginTop: 3, fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>Обери інструктора та запишись</Text>
              </View>
              <Text style={{ fontSize: 20, color: colors.textTertiary }}>›</Text>
            </View>
          </Pressable>
        </View>
      )}

      <View style={{ height: 40 }} />
    </Screen>
  );
}
