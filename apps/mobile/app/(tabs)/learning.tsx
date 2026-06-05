import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import {
  Card,
  Label,
  LidykBanner,
  Pill,
  ProgressBar,
  Row,
  Screen,
  SectionHeader,
} from "../../components/mobile-ui";
import { courseProgress, mobileServices } from "../../lib/mobile-data";
import { PDR_QUESTIONS } from "../../lib/pdr-questions";
import { useTheme, radii } from "../../lib/theme";
import { useAuth } from "../../lib/auth";

const lessons = [
  { title: "Тема 12. Проїзд перехресть", detail: "Домашнє завдання до п'ятниці", progress: 72 },
  { title: "Безпечна дистанція", detail: "Відео та короткий тест", progress: 45 },
  { title: "Підготовка до сервісного центру", detail: "Екзаменаційний модуль", progress: 84 },
];

const PDR_CATEGORIES = ["Знаки", "Перехрестя", "Безпека", "Швидкість", "Зупинка", "Розмітка", "Стоянка"];

// Each tile points to a screen that actually exists and works.
const HUB_TILES = [
  { icon: "🎯", title: "Тренажер ПДР", sub: `${PDR_QUESTIONS.length} питань`, route: "/(tabs)/tests" as const, accent: true },
  { icon: "🎓", title: "Екзамен", sub: "20 питань", route: "/(tabs)/tests" as const, accent: false },
  { icon: "📖", title: "Уроки", sub: "Теорія та відео", route: null, accent: false },
  { icon: "🚗", title: "Запитати Лідика", sub: "AI-помічник", route: "/(tabs)/assistant" as const, accent: false },
];

export default function LearningTab() {
  const { colors } = useTheme();
  const { mode } = useAuth();
  const isAuth = mode === "authenticated";
  const overall = Math.round(
    (courseProgress.completedLessons / courseProgress.totalLessons) * 100
  );

  return (
    <Screen title="Навчання" subtitle="Курс, уроки, тести ПДР та тренажери — все в одному місці.">
      {/* ─── Мій курс (тільки зареєстровані) ────────────────────────────── */}
      {isAuth ? (
        <Card tone="red">
          <Label variant="inverse">Мій курс</Label>
          <Text style={{ marginTop: 8, color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.3 }}>
            {courseProgress.title}
          </Text>
          <Text style={{ marginVertical: 10, color: "rgba(255,255,255,0.78)", lineHeight: 22 }}>
            {courseProgress.completedLessons}/{courseProgress.totalLessons} уроків · середній результат тестів {courseProgress.testScore}%
          </Text>
          <ProgressBar value={overall} color="rgba(255,255,255,0.9)" />
          <Text style={{ marginTop: 8, color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: "700" }}>
            {overall}% пройдено
          </Text>
        </Card>
      ) : (
        <Pressable onPress={() => router.push("/auth?mode=register")}>
          <Card>
            <Text style={{ fontSize: 16, fontWeight: "900", color: colors.textPrimary }}>📚 Мій курс</Text>
            <Text style={{ marginTop: 6, fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
              Зареєструйся, щоб бачити прогрес курсу, уроки та оцінки.
            </Text>
            <Text style={{ marginTop: 10, fontSize: 14, fontWeight: "800", color: colors.red }}>Зареєструватись →</Text>
          </Card>
        </Pressable>
      )}

      {/* ─── Hub tiles ────────────────────────────────────────────────────── */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {HUB_TILES.map((tile) => (
          <Pressable
            key={tile.title}
            onPress={() => (tile.route ? router.push(tile.route) : undefined)}
            disabled={!tile.route}
            style={{
              width: "47%",
              flexGrow: 1,
              backgroundColor: tile.accent ? colors.red : colors.bgCard,
              borderRadius: radii.md,
              padding: 16,
              borderWidth: 1,
              borderColor: tile.accent ? colors.red : colors.border,
              opacity: tile.route ? 1 : 0.55,
            }}
          >
            <Text style={{ fontSize: 26 }}>{tile.icon}</Text>
            <Text style={{ color: tile.accent ? "#fff" : colors.textPrimary, fontWeight: "800", fontSize: 15, marginTop: 8 }}>
              {tile.title}
            </Text>
            <Text style={{ color: tile.accent ? "rgba(255,255,255,0.8)" : colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              {tile.route ? tile.sub : "Незабаром"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ─── Тести ПДР за категоріями ─────────────────────────────────────── */}
      <Card>
        <SectionHeader title="Тести ПДР за категоріями" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {PDR_CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => router.push("/(tabs)/tests")}
              style={{
                borderRadius: radii.full,
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: colors.bgElevated,
                borderWidth: 1.5,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 14 }}>{cat}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* ─── Активні уроки ────────────────────────────────────────────────── */}
      <Card>
        <Label>Активні уроки</Label>
        {lessons.map(({ title, detail, progress }) => (
          <Row
            key={title}
            title={title}
            detail={detail}
            right={
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={{ color: colors.red, fontWeight: "900", fontSize: 13 }}>{progress}%</Text>
                <View style={{ width: 48, height: 4, borderRadius: 4, backgroundColor: colors.border, overflow: "hidden" }}>
                  <View style={{ height: 4, width: `${progress}%` as any, backgroundColor: colors.red, borderRadius: 4 }} />
                </View>
              </View>
            }
          />
        ))}
      </Card>

      {/* ─── Lidyk tip ────────────────────────────────────────────────────── */}
      <LidykBanner
        state="thinking"
        message="Щоб краще запам'ятати ПДР — читай вголос і поясни правило уявному другові. Це підвищує засвоєння на 40%."
        action="Запитати Лідика"
        onAction={() => router.push("/(tabs)/assistant")}
      />

      {/* ─── Програми автошколи ───────────────────────────────────────────── */}
      <Card>
        <SectionHeader title="Програми автошколи" />
        {mobileServices.slice(0, 5).map((service) => (
          <Row
            key={service.id}
            title={service.title}
            detail={`${service.duration} · від ${service.priceFrom.toLocaleString("uk-UA")} грн`}
            right={<Pill tone="red">Записатись</Pill>}
            onPress={() => router.push("/auth?mode=register")}
          />
        ))}
      </Card>
    </Screen>
  );
}
