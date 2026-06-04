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
import { useTheme } from "../../lib/theme";

const lessons = [
  { title: "Тема 12. Проїзд перехресть", detail: "Домашнє завдання до п'ятниці", progress: 72 },
  { title: "Безпечна дистанція", detail: "Відео та короткий тест", progress: 45 },
  { title: "Підготовка до сервісного центру", detail: "Екзаменаційний модуль", progress: 84 },
];

export default function LearningTab() {
  const { colors } = useTheme();
  const overall = Math.round(
    (courseProgress.completedLessons / courseProgress.totalLessons) * 100
  );

  return (
    <Screen
      title="Навчання"
      subtitle="Уроки, відео, теорія та домашні завдання."
    >
      {/* Course progress hero */}
      <Card tone="red">
        <Label variant="inverse">Загальний прогрес</Label>
        <Text style={{ marginTop: 8, color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.3 }}>
          {courseProgress.title}
        </Text>
        <Text style={{ marginVertical: 10, color: "rgba(255,255,255,0.78)", lineHeight: 22 }}>
          {courseProgress.completedLessons}/{courseProgress.totalLessons} уроків
          · середній результат тестів {courseProgress.testScore}%
        </Text>
        <ProgressBar value={overall} color="rgba(255,255,255,0.9)" />
        <Text style={{ marginTop: 8, color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: "700" }}>
          {overall}% пройдено
        </Text>
      </Card>

      {/* Active lessons */}
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

      {/* Mascot tip */}
      <LidykBanner
        state="thinking"
        message="Щоб краще запам'ятати ПДР — читай вголос і поясни правило уявному другові. Це підвищує засвоєння на 40%."
      />

      {/* School programs */}
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
