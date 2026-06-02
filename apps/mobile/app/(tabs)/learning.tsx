import { Text, StyleSheet } from "react-native";
import { Card, Label, ProgressBar, Row, Screen } from "../../components/mobile-ui";
import { courseProgress, mobileServices } from "../../lib/mobile-data";
import { colors } from "../../lib/theme";

const lessons = [
  ["Тема 12. Проїзд перехресть", "Домашнє завдання до п'ятниці", 72],
  ["Безпечна дистанція", "Відео та короткий тест", 45],
  ["Підготовка до сервісного центру", "Екзаменаційний модуль", 84]
] as const;

export default function LearningTab() {
  return (
    <Screen title="Навчання" subtitle="LMS: уроки, відео, теорія, домашні завдання, прогрес і статистика.">
      <Card>
        <Label>Курс</Label>
        <Text style={styles.title}>{courseProgress.title}</Text>
        <Text style={styles.text}>
          {courseProgress.completedLessons}/{courseProgress.totalLessons} уроків, середній результат тестів{" "}
          {courseProgress.testScore}%.
        </Text>
        <ProgressBar
          value={(courseProgress.completedLessons / courseProgress.totalLessons) * 100}
          color={colors.green}
        />
      </Card>

      <Card>
        <Label>Активні уроки</Label>
        {lessons.map(([title, detail, progress]) => (
          <Row key={title} title={title} detail={detail} right={<Text style={styles.percent}>{progress}%</Text>} />
        ))}
      </Card>

      <Card>
        <Label>Програми автошколи</Label>
        {mobileServices.slice(0, 5).map((service) => (
          <Row
            key={service.id}
            title={service.title}
            detail={`${service.duration} · від ${service.priceFrom.toLocaleString("uk-UA")} грн`}
          />
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: 8,
    color: colors.graphite,
    fontSize: 24,
    fontWeight: "900"
  },
  text: {
    marginVertical: 12,
    color: colors.muted,
    lineHeight: 22
  },
  percent: {
    color: colors.green,
    fontWeight: "900"
  }
});
