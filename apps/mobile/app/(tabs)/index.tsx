import { View, Text, StyleSheet } from "react-native";
import { Card, Label, PrimaryButton, ProgressBar, Row, Screen } from "../../components/mobile-ui";
import { courseProgress, notifications, student, upcomingSlot } from "../../lib/mobile-data";
import { colors } from "../../lib/theme";

export default function HomeTab() {
  const progressPercent = Math.round((courseProgress.completedLessons / courseProgress.totalLessons) * 100);

  return (
    <Screen title={`Вітаємо, ${student.name}`} subtitle="Усі важливі дії навчання в одному мобільному кабінеті.">
      <Card tone="green">
        <Label inverse>Поточний курс</Label>
        <Text style={styles.heroTitle}>Категорія {student.category}</Text>
        <Text style={styles.heroText}>
          {courseProgress.completedLessons} з {courseProgress.totalLessons} уроків завершено. Результат тестів:{" "}
          {courseProgress.testScore}%.
        </Text>
        <View style={styles.heroProgress}>
          <ProgressBar value={progressPercent} />
        </View>
        <Text style={styles.heroMeta}>{progressPercent}% курсу</Text>
      </Card>

      <View style={styles.grid}>
        <Card>
          <Label>Практика</Label>
          <Text style={styles.metric}>03 червня</Text>
          <Text style={styles.muted}>{upcomingSlot.instructor}</Text>
        </Card>
        <Card>
          <Label>ПДР</Label>
          <Text style={styles.metric}>20 питань</Text>
          <Text style={styles.muted}>Екзамен з таймером</Text>
        </Card>
      </View>

      <Card tone="yellow">
        <Label>Наступна дія</Label>
        <Text style={styles.yellowTitle}>Запис на практичне заняття</Text>
        <Text style={styles.yellowText}>
          Найближчий слот: {upcomingSlot.branch?.city}, {upcomingSlot.vehicle}, інструктор {upcomingSlot.instructor}.
        </Text>
      </Card>

      <Card>
        <Label>Сповіщення</Label>
        {notifications.map((item) => (
          <Row key={item} title={item} detail="Активне нагадування" />
        ))}
      </Card>

      <PrimaryButton>Записатися на практику</PrimaryButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroTitle: {
    marginTop: 10,
    color: colors.white,
    fontSize: 30,
    fontWeight: "900"
  },
  heroText: {
    marginTop: 8,
    color: "rgba(255,255,255,0.78)",
    lineHeight: 22
  },
  heroProgress: {
    marginTop: 22
  },
  heroMeta: {
    marginTop: 10,
    color: colors.yellow,
    fontWeight: "900"
  },
  grid: {
    flexDirection: "row",
    gap: 12
  },
  metric: {
    marginTop: 8,
    color: colors.graphite,
    fontSize: 20,
    fontWeight: "900"
  },
  muted: {
    marginTop: 4,
    color: colors.muted
  },
  yellowTitle: {
    marginTop: 8,
    color: colors.graphite,
    fontSize: 20,
    fontWeight: "900"
  },
  yellowText: {
    marginTop: 6,
    color: colors.graphite,
    lineHeight: 22
  }
});
