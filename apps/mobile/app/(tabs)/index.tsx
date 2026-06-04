import { View, Text } from "react-native";
import {
  Card,
  Label,
  LidykBanner,
  MascotCard,
  Pill,
  PrimaryButton,
  ProgressBar,
  Row,
  Screen,
  StatCard,
} from "../../components/mobile-ui";
import {
  courseProgress,
  notifications,
  quickActions,
  retentionSignals,
  retentionRoadmap,
  student,
  upcomingSlot,
} from "../../lib/mobile-data";
import { useAuth } from "../../lib/auth";
import { useTheme } from "../../lib/theme";

export default function HomeTab() {
  const { user, mode } = useAuth();
  const { colors } = useTheme();
  const progressPercent = Math.round(
    (courseProgress.completedLessons / courseProgress.totalLessons) * 100
  );

  const displayName = user?.isGuest ? "Гість" : user?.name ?? student.name;
  const greeting = mode === "guest"
    ? "Вітаємо, Гість!"
    : `Вітаємо, ${displayName.split(" ")[0]} 👋`;

  return (
    <Screen
      title={greeting}
      subtitle={
        mode === "guest"
          ? "Переглядай курси і пройди демо-тест без реєстрації."
          : "Твій навчальний кабінет. Всі важливі дії в одному місці."
      }
    >
      {/* Hero — course progress card */}
      <Card tone="red">
        <Label variant="inverse">Поточний курс</Label>
        <Text style={{ marginTop: 10, color: "#fff", fontSize: 30, fontWeight: "900", letterSpacing: -0.5 }}>
          Категорія {student.category}
        </Text>
        <Text style={{ marginTop: 8, color: "rgba(255,255,255,0.78)", lineHeight: 22 }}>
          {courseProgress.completedLessons} з {courseProgress.totalLessons}{" "}
          уроків завершено · тести {courseProgress.testScore}%
        </Text>
        <View style={{ marginTop: 22 }}>
          <ProgressBar value={progressPercent} color="rgba(255,255,255,0.9)" />
        </View>
        <Text style={{ marginTop: 10, color: "rgba(255,255,255,0.65)", fontWeight: "700", fontSize: 13 }}>
          {progressPercent}% курсу пройдено
        </Text>
      </Card>

      {/* Quick stats */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <StatCard value="03 червня" label="Наступне заняття" accent />
        <StatCard value="85%" label="Результат тестів" />
      </View>

      {/* Mascot hint */}
      <MascotCard
        title="Лідик радить"
        message="До іспиту залишилось ще трохи — повтори знаки пріоритету та правило перешкоди справа. 🚗"
        state="thinking"
        action="Почати тест"
      />

      {/* Next step */}
      <Card tone="dark">
        <Label variant="red">Наступна дія</Label>
        <Text style={{ marginTop: 8, color: colors.textPrimary, fontSize: 20, fontWeight: "900" }}>
          Запис на практичне заняття
        </Text>
        <Text style={{ marginTop: 6, color: colors.textSecondary, lineHeight: 22 }}>
          Найближчий слот: {upcomingSlot.branch?.city},{" "}
          {upcomingSlot.vehicle}, інструктор {upcomingSlot.instructor}.
        </Text>
        <PrimaryButton style={{ marginTop: 16 }}>Записатися</PrimaryButton>
      </Card>

      {/* Student journey steps */}
      <Card>
        <Label>Шлях учня</Label>
        <View style={{ flexDirection: "row", marginTop: 12, gap: 6 }}>
          {[
            { title: "Теорія", detail: "Вивчи ПДР", done: true },
            { title: "Тести", detail: "Здай онлайн", done: true },
            { title: "Практика", detail: "За кермом", done: false },
            { title: "Іспит", detail: "Офіційний", done: false },
          ].map((step, index) => (
            <View
              key={step.title}
              style={{
                flex: 1,
                alignItems: "center",
                padding: 10,
                borderRadius: 14,
                backgroundColor: step.done ? colors.redSoft : colors.bgElevated,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 6,
                  backgroundColor: step.done ? colors.red : colors.bgCard,
                  borderWidth: step.done ? 0 : 1.5,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: step.done ? "#fff" : colors.textTertiary, fontSize: 11, fontWeight: "900" }}>
                  {step.done ? "✓" : index + 1}
                </Text>
              </View>
              <Text style={{ color: step.done ? colors.red : colors.textSecondary, fontSize: 11, fontWeight: "800", textAlign: "center" }}>
                {step.title}
              </Text>
              <Text style={{ color: colors.textTertiary, fontSize: 10, textAlign: "center", marginTop: 2 }}>
                {step.detail}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Notifications */}
      <Card>
        <Label>Сповіщення</Label>
        {notifications.map((item) => (
          <Row key={item} title={item} detail="Активне нагадування" icon="🔔" />
        ))}
      </Card>

      {/* Quick actions */}
      <Card>
        <Label>Швидкі дії</Label>
        {quickActions.map((item) => (
          <Row
            key={item.title}
            title={item.title}
            detail={item.detail}
            icon="→"
            onPress={() => {}}
          />
        ))}
      </Card>

      {/* After licence */}
      <Card tone="dark">
        <Label>Після отримання прав</Label>
        <Text style={{ marginTop: 8, color: colors.textPrimary, fontSize: 18, fontWeight: "900" }}>
          Кабінет не закінчується на іспиті
        </Text>
        <Text style={{ marginTop: 6, color: colors.textSecondary, lineHeight: 22, marginBottom: 10 }}>
          Повторення ПДР, клуб випускників, бонуси за друзів, підказки для дороги.
        </Text>
        {retentionRoadmap.slice(0, 3).map((item) => (
          <Row key={item} title={item} detail="Незабаром" />
        ))}
      </Card>

      {/* Retention signals */}
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
    </Screen>
  );
}
