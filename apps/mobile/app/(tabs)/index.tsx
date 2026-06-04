import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Card, Label, MascotCard, Pill, ProgressBar, Row, Screen } from "../../components/mobile-ui";
import { courseProgress, retentionSignals, student, upcomingSlot } from "../../lib/mobile-data";
import { useAuth } from "../../lib/auth";
import { useTheme, radii, spacing } from "../../lib/theme";

export default function HomeTab() {
  const { user, mode } = useAuth();
  const { colors } = useTheme();
  const progressPercent = Math.round(
    (courseProgress.completedLessons / courseProgress.totalLessons) * 100
  );
  const displayName = user?.isGuest ? "Гість" : user?.name ?? student.name;
  const firstName = displayName.split(" ")[0];

  return (
    <Screen
      title={mode === "guest" ? "Вітаємо 👋" : `${firstName} 👋`}
      subtitle={mode === "guest" ? "Переглядай курси і пройди демо-тест." : "Твій навчальний кабінет."}
    >

      {/* ─── HERO: Course progress ─────────────────────────────────────────── */}
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
              onPress={() => router.push("/(tabs)/tests")}
              style={{ backgroundColor: colors.white, borderRadius: radii.sm, paddingVertical: 8, paddingHorizontal: 16 }}
            >
              <Text style={{ color: colors.red, fontWeight: "900", fontSize: 13 }}>Тест →</Text>
            </Pressable>
          </View>
        </View>
      </Card>

      {/* ─── NEXT SESSION: Premium card ────────────────────────────────────── */}
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" }}>
            Наступне заняття
          </Text>
          <Pill tone="success">Підтверджено</Pill>
        </View>

        <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "900", marginTop: 10, letterSpacing: -0.5 }}>
          03 червня, вт
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>
          {upcomingSlot.branch?.city ?? "Київ"} · {upcomingSlot.vehicle} · {upcomingSlot.instructor}
        </Text>

        <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: 14 }} />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => router.push("/(tabs)/learning")}
            style={{ flex: 1, backgroundColor: colors.red, borderRadius: radii.sm, paddingVertical: 12, alignItems: "center", shadowColor: colors.red, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
          >
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>Курс</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(tabs)/tests")}
            style={{ flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.sm, paddingVertical: 12, alignItems: "center" }}
          >
            <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 14 }}>Тест ПДР</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(tabs)/club")}
            style={{ flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.sm, paddingVertical: 12, alignItems: "center" }}
          >
            <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 14 }}>Чат</Text>
          </Pressable>
        </View>
      </Card>

      {/* ─── STUDENT JOURNEY ──────────────────────────────────────────────── */}
      <Card>
        <Label>Шлях учня</Label>
        <View style={{ marginTop: 20 }}>
          {([
            { icon: "📖", title: "Теорія",   subtitle: "ПДР та правила",    done: true,  current: false },
            { icon: "✅", title: "Тести",    subtitle: "Онлайн-тренажер",   done: true,  current: false },
            { icon: "🚗", title: "Практика", subtitle: "За кермом з інструктором", done: false, current: true  },
            { icon: "🎓", title: "Іспит",    subtitle: "Офіційний в ТСЦ",  done: false, current: false },
          ] as const).map((step, idx, arr) => (
            <View key={step.title} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: idx < arr.length - 1 ? 0 : 0 }}>
              {/* Left column: dot + line */}
              <View style={{ width: 44, alignItems: "center" }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: step.done ? colors.red : step.current ? colors.bgCard : colors.bgElevated,
                  borderWidth: step.current ? 2.5 : step.done ? 0 : 1.5,
                  borderColor: step.current ? colors.red : colors.border,
                  alignItems: "center", justifyContent: "center",
                  shadowColor: step.done ? colors.red : "transparent",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: step.done ? 0.3 : 0,
                  shadowRadius: 6,
                  elevation: step.done ? 4 : 0,
                }}>
                  {step.done ? (
                    <Text style={{ fontSize: 18, color: "#fff" }}>✓</Text>
                  ) : (
                    <Text style={{ fontSize: 18, opacity: step.current ? 1 : 0.35 }}>{step.icon}</Text>
                  )}
                </View>
                {/* Vertical connector */}
                {idx < arr.length - 1 ? (
                  <View style={{ width: 3, flex: 1, minHeight: 20, marginTop: 2, marginBottom: 2, borderRadius: 2, backgroundColor: step.done ? colors.red : colors.border }} />
                ) : null}
              </View>

              {/* Right column: text */}
              <View style={{ flex: 1, paddingLeft: 14, paddingBottom: idx < arr.length - 1 ? 20 : 0, paddingTop: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: "900", color: step.done ? colors.textPrimary : step.current ? colors.textPrimary : colors.textTertiary }}>
                    {step.title}
                  </Text>
                  {step.done ? (
                    <View style={{ backgroundColor: colors.successSoft, borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: colors.success, fontSize: 10, fontWeight: "800" }}>ГОТОВО</Text>
                    </View>
                  ) : step.current ? (
                    <View style={{ backgroundColor: colors.redSoft, borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: colors.red, fontSize: 10, fontWeight: "800" }}>ЗАРАЗ</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ fontSize: 13, color: step.current ? colors.textSecondary : colors.textTertiary, marginTop: 2, lineHeight: 18 }}>
                  {step.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* ─── LIDYK HINT ──────────────────────────────────────────────────── */}
      <MascotCard
        title="Лідик радить"
        message="Повтори знаки пріоритету та правило перешкоди справа — саме там найбільше помилок на іспиті."
        state="thinking"
        action="Почати тест"
        onAction={() => router.push("/(tabs)/tests")}
      />

      {/* ─── LEARNING STATUS ────────────────────────────────────────────── */}
      <Card>
        <Label>Стан навчання</Label>
        {retentionSignals.map((item) => (
          <Row
            key={item.title}
            title={item.title}
            detail={item.detail}
            right={<Pill tone={item.tone}>{item.status}</Pill>}
          />
        ))}
      </Card>

      {/* ─── QUICK ACTIONS ────────────────────────────────────────────────── */}
      <Card>
        <Label>Швидкі дії</Label>
        <Row title="ПДР Тренажер" detail="Почати тест зараз" icon="✅" onPress={() => router.push("/(tabs)/tests")} />
        <Row title="Курси та навчання" detail="Матеріали та уроки" icon="📚" onPress={() => router.push("/(tabs)/learning")} />
        <Row title="Запитати Лідика" detail="AI-помічник" icon="🚗" onPress={() => router.push("/(tabs)/club")} />
        <Row title="Профіль та налаштування" detail="Тема, документи, вихід" icon="👤" onPress={() => router.push("/(tabs)/profile")} />
      </Card>

      {/* ─── GUEST PROMO ─────────────────────────────────────────────────── */}
      {mode === "guest" ? (
        <Pressable
          onPress={() => router.push("/auth?mode=register")}
          style={{ backgroundColor: colors.redSoft, borderRadius: radii.md, padding: 18, borderWidth: 1.5, borderColor: colors.red + "44" }}
        >
          <Text style={{ color: colors.red, fontWeight: "900", fontSize: 16 }}>🔐 Зареєструватись</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
            Збережи прогрес, отримуй нагороди і доступ до всіх матеріалів.
          </Text>
        </Pressable>
      ) : null}

    </Screen>
  );
}
