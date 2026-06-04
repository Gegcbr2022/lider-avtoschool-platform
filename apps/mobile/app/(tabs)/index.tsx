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
              style={{ backgroundColor: "#fff", borderRadius: radii.sm, paddingVertical: 8, paddingHorizontal: 16 }}
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
        <View style={{ flexDirection: "row", marginTop: 14, gap: 8 }}>
          {([
            { icon: "📖", title: "Теорія",   done: true  },
            { icon: "✅", title: "Тести",    done: true  },
            { icon: "🚗", title: "Практика", done: false },
            { icon: "🎓", title: "Іспит",    done: false },
          ] as const).map((step) => (
            <View key={step.title} style={{ flex: 1, alignItems: "center", gap: 6 }}>
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: step.done ? colors.red : colors.bgElevated,
                alignItems: "center", justifyContent: "center",
                borderWidth: step.done ? 0 : 1.5, borderColor: colors.border,
              }}>
                <Text style={{ fontSize: step.done ? 20 : 18, opacity: step.done ? 1 : 0.4 }}>{step.icon}</Text>
              </View>
              <Text style={{ color: step.done ? colors.red : colors.textTertiary, fontSize: 11, fontWeight: "800", textAlign: "center" }}>
                {step.title}
              </Text>
            </View>
          ))}
        </View>
        {/* Progress connector line */}
        <View style={{ flexDirection: "row", position: "absolute", top: 58, left: 56, right: 56 }}>
          <View style={{ flex: 1, height: 2, backgroundColor: colors.red }} />
          <View style={{ flex: 1, height: 2, backgroundColor: colors.border }} />
          <View style={{ flex: 1, height: 2, backgroundColor: colors.border }} />
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
