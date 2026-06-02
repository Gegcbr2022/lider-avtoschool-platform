import { View, Text, StyleSheet } from "react-native";
import {
  Card,
  EmptyState,
  InsightCard,
  Label,
  PrimaryButton,
  ProgressBar,
  Row,
  Screen,
  SkeletonBlock
} from "../../components/mobile-ui";
import {
  courseProgress,
  notifications,
  onboardingSteps,
  quickActions,
  retentionRoadmap,
  student,
  upcomingSlot
} from "../../lib/mobile-data";
import { colors } from "../../lib/theme";

export default function HomeTab() {
  const progressPercent = Math.round((courseProgress.completedLessons / courseProgress.totalLessons) * 100);

  return (
    <Screen title={`Вітаємо, ${student.name}`} subtitle="Усі важливі дії навчання в одному мобільному кабінеті.">
      <View style={styles.onboarding}>
        {onboardingSteps.map((step, index) => (
          <View key={step.title} style={[styles.step, index === 0 && styles.activeStep]}>
            <Text style={[styles.stepIndex, index === 0 && styles.activeStepIndex]}>{index + 1}</Text>
            <Text style={[styles.stepTitle, index === 0 && styles.activeStepTitle]}>{step.title}</Text>
            <Text style={[styles.stepDetail, index === 0 && styles.activeStepDetail]}>{step.detail}</Text>
          </View>
        ))}
      </View>

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
        <InsightCard title="03 червня" detail={`${upcomingSlot.instructor} · ${upcomingSlot.vehicle}`} />
        <InsightCard title="20 питань" detail="Екзамен з ПДР з таймером" accent="yellow" />
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

      <Card>
        <Label>Швидкі дії</Label>
        {quickActions.map((item) => (
          <Row key={item.title} title={item.title} detail={item.detail} />
        ))}
      </Card>

      <Card tone="yellow">
        <Label>Після отримання прав</Label>
        <Text style={styles.yellowTitle}>Кабінет не закінчується на іспиті</Text>
        <Text style={styles.yellowText}>
          Тут з'являться механіки повернення: ПДР-повторення, клуб випускників, бонуси за друзів і корисні
          підказки для дороги.
        </Text>
        {retentionRoadmap.slice(0, 4).map((item) => (
          <Row key={item} title={item} detail="Основа для майбутньої функції" />
        ))}
      </Card>

      <SkeletonBlock />

      <EmptyState
        title="Нових бронювань поки немає"
        detail="Коли інструктор підтвердить наступний слот, він з'явиться у календарі і push-нагадуваннях."
      />

      <PrimaryButton>Записатися на практику</PrimaryButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  onboarding: {
    flexDirection: "row",
    gap: 10
  },
  step: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
    backgroundColor: "#edf5f2"
  },
  activeStep: {
    backgroundColor: colors.green
  },
  stepIndex: {
    height: 26,
    width: 26,
    borderRadius: 13,
    textAlign: "center",
    textAlignVertical: "center",
    overflow: "hidden",
    backgroundColor: colors.white,
    color: colors.green,
    fontWeight: "900"
  },
  activeStepIndex: {
    color: colors.graphite,
    backgroundColor: colors.yellow
  },
  stepTitle: {
    marginTop: 10,
    color: colors.graphite,
    fontWeight: "900"
  },
  activeStepTitle: {
    color: colors.white
  },
  stepDetail: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  activeStepDetail: {
    color: "rgba(255,255,255,0.72)"
  },
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
