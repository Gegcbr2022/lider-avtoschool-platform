import { Pressable, Text, View } from "react-native";
import { router, type Href } from "expo-router";
import {
  Card,
  Label,
  LidykBanner,
  Pill,
  Row,
  Screen,
  SectionHeader,
} from "../../components/mobile-ui";
import { mobileServices } from "../../lib/mobile-data";
import { PDR_QUESTIONS } from "../../lib/pdr-questions";
import { useTheme, radii } from "../../lib/theme";
import { useAuth } from "../../lib/auth";

const PDR_CATEGORIES = [
  { icon: "🎯", title: "Дорожні знаки", detail: "Попереджувальні, заборонні, інформаційні" },
  { icon: "🚦", title: "Перехрестя", detail: "Пріоритет, світлофори, круговий рух" },
  { icon: "🛡️", title: "Безпека руху", detail: "Дистанція, обгін, аварійні ситуації" },
  { icon: "🅿️", title: "Паркування", detail: "Стоянка, зупинка, заборони" },
];

// Each tile points to a screen that actually exists and works.
const HUB_TILES = [
  { icon: "🎯", title: "Тренажер ПДР", sub: `${PDR_QUESTIONS.length} питань`, route: "/(tabs)/tests" as const, accent: true },
  { icon: "🎓", title: "Екзамен", sub: "20 питань", route: "/(tabs)/tests" as const, accent: false },
  { icon: "📖", title: "Уроки", sub: "Теорія та відео", route: "/lessons", accent: false },
  { icon: "🚗", title: "Запитати Лідика", sub: "AI-помічник", route: "/(tabs)/assistant" as const, accent: false },
];

export default function LearningTab() {
  const { colors } = useTheme();
  const { mode } = useAuth();
  const isAuth = mode === "authenticated";

  return (
    <Screen title="Навчання" subtitle="Курс, уроки, тести ПДР та тренажери — все в одному місці.">

      {/* ─── Мій курс ────────────────────────────────────────────────────── */}
      {isAuth ? (
        // Course not yet assigned — clean empty state instead of fake mock data
        <View
          style={{
            backgroundColor: colors.bgCard,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 20,
          }}
        >
          <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
            Мій курс
          </Text>
          <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "800" }}>
            Курс ще не призначено
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 6, lineHeight: 20 }}>
            Менеджер автошколи призначить курс після запису. Поки що тренуйся в ПДР Тренажері.
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/chat")}
            style={{ marginTop: 14, backgroundColor: colors.redSoft, borderRadius: radii.sm, paddingVertical: 11, alignItems: "center", borderWidth: 1.5, borderColor: colors.red + "44" }}
          >
            <Text style={{ color: colors.red, fontWeight: "800", fontSize: 14 }}>Написати менеджеру →</Text>
          </Pressable>
        </View>
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
            onPress={() => (tile.route ? router.push(tile.route as Href) : undefined)}
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

      {/* ─── Практичне водіння ─────────────────────────────────────────────── */}
      {isAuth ? (
        <Pressable onPress={() => router.push("/booking" as Href)}>
          <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Text style={{ fontSize: 30 }}>🚗</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: colors.textPrimary }}>Практичне водіння</Text>
              <Text style={{ marginTop: 3, fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>Обери інструктора та запишись на заняття</Text>
            </View>
            <Text style={{ fontSize: 20, color: colors.textTertiary }}>›</Text>
          </View>
        </Pressable>
      ) : null}

      {/* ─── Сервісні центри МВС ───────────────────────────────────────────── */}
      <Pressable onPress={() => router.push("/service-centers" as Href)}>
        <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Text style={{ fontSize: 30 }}>🏛️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "900", color: colors.textPrimary }}>Сервісні центри МВС</Text>
            <Text style={{ marginTop: 3, fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>Де отримати права + маршрут на карті</Text>
          </View>
          <Text style={{ fontSize: 20, color: colors.textTertiary }}>›</Text>
        </View>
      </Pressable>

      {/* ─── Тести ПДР за категоріями ─────────────────────────────────────── */}
      <Card>
        <SectionHeader title="Тести ПДР за категоріями" action="Всі теми" onAction={() => router.push("/(tabs)/tests")} />
        <View style={{ gap: 10, marginTop: 12 }}>
          {PDR_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.title}
              onPress={() => router.push("/(tabs)/tests")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderRadius: radii.md,
                padding: 14,
                backgroundColor: colors.bgElevated,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 24 }}>{cat.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 15 }}>{cat.title}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, lineHeight: 17 }}>{cat.detail}</Text>
              </View>
              <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>
            </Pressable>
          ))}
        </View>
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
