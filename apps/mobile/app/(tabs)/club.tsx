import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  Card,
  InsightCard,
  Label,
  Pill,
  PrimaryButton,
  Row,
  Screen
} from "../../components/mobile-ui";
import {
  clubBadges,
  driverChecklist,
  driverClubStreak,
  roadTips,
  todayChallenge
} from "../../lib/mobile-data";
import { colors } from "../../lib/theme";

export default function ClubTab() {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [tipIndex] = useState(Math.floor(Date.now() / 86_400_000) % roadTips.length);

  const isAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === todayChallenge.correctIndex;

  return (
    <Screen title="Клуб водія" subtitle="Щоденні тести, бейджі, чек-листи та підказки для впевненого водія.">

      {/* Streak */}
      <Card tone="green">
        <Label inverse>Ваша серія</Label>
        <View style={styles.streakRow}>
          <View style={styles.streakBlock}>
            <Text style={styles.streakNumber}>{driverClubStreak.current}</Text>
            <Text style={styles.streakLabel}>днів поспіль</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakBlock}>
            <Text style={styles.streakNumber}>{driverClubStreak.best}</Text>
            <Text style={styles.streakLabel}>найкраща серія</Text>
          </View>
        </View>
        <Text style={styles.streakHint}>
          Проходьте щоденний тест щоб підтримувати серію 🔥
        </Text>
      </Card>

      {/* Daily challenge */}
      <Card>
        <View style={styles.challengeHeader}>
          <Label>Тест дня</Label>
          <Pill tone={isAnswered ? (isCorrect ? "success" : "warning") : "neutral"}>
            {isAnswered ? (isCorrect ? "Правильно!" : "Не вірно") : todayChallenge.category}
          </Pill>
        </View>
        <Text style={styles.question}>{todayChallenge.question}</Text>
        <View style={styles.options}>
          {todayChallenge.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isRight = index === todayChallenge.correctIndex;
            let bg = colors.background;
            if (isAnswered && isRight) bg = "#e8f5ee";
            if (isAnswered && isSelected && !isRight) bg = "#fef3f2";
            return (
              <TouchableOpacity
                key={option}
                style={[styles.option, { backgroundColor: bg }]}
                onPress={() => !isAnswered && setSelectedAnswer(index)}
                disabled={isAnswered}
              >
                <Text style={[styles.optionLetter, isAnswered && isRight && styles.correctLetter]}>
                  {String.fromCharCode(65 + index)}
                </Text>
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {isAnswered && (
          <View style={[styles.explanation, { backgroundColor: isCorrect ? "#e8f5ee" : "#fff8ec" }]}>
            <Text style={styles.explanationText}>{todayChallenge.explanation}</Text>
          </View>
        )}
      </Card>

      {/* Tip of the day */}
      <Card tone="yellow">
        <Label>Підказка дня</Label>
        <Text style={styles.tipText}>{roadTips[tipIndex]}</Text>
      </Card>

      {/* Driver checklist */}
      <Card>
        <Label>Чек-лист водія</Label>
        {driverChecklist.map((item) => (
          <Row
            key={item.id}
            title={item.title}
            detail={item.detail}
            right={<Pill tone={item.done ? "success" : "neutral"}>{item.done ? "✓" : "—"}</Pill>}
          />
        ))}
      </Card>

      {/* Badges */}
      <Card>
        <Label>Мої бейджі</Label>
        <View style={styles.badges}>
          {clubBadges.map((badge) => (
            <View key={badge.id} style={[styles.badge, !badge.earned && styles.badgeLocked]}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <Text style={[styles.badgeTitle, !badge.earned && styles.badgeLockedText]}>{badge.title}</Text>
              <Text style={styles.badgeDesc}>{badge.description}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Insights */}
      <View style={styles.grid}>
        <InsightCard title="Реферал" detail="Запросіть друга — бонус за кожного" />
        <InsightCard title="Знижки" detail="Додаткові заняття для випускників" accent="yellow" />
      </View>

      <PrimaryButton>Поділитися кодом {"→"}</PrimaryButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  streakRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  streakBlock: { flex: 1, alignItems: "center" },
  streakNumber: { fontSize: 40, fontWeight: "900", color: colors.white },
  streakLabel: { marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.72)", fontWeight: "700" },
  streakDivider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.2)" },
  streakHint: { marginTop: 14, fontSize: 13, color: "rgba(255,255,255,0.72)", fontWeight: "600", textAlign: "center" },
  challengeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  question: { marginTop: 12, fontSize: 16, fontWeight: "800", color: colors.graphite, lineHeight: 24 },
  options: { marginTop: 14, gap: 8 },
  option: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.line },
  optionLetter: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.line, textAlign: "center", textAlignVertical: "center", fontWeight: "900", fontSize: 13, color: colors.graphite, overflow: "hidden" },
  correctLetter: { backgroundColor: "#14733d", color: colors.white },
  optionText: { flex: 1, fontSize: 14, fontWeight: "700", color: colors.graphite, lineHeight: 20 },
  explanation: { marginTop: 12, borderRadius: 14, padding: 12 },
  explanationText: { fontSize: 13, fontWeight: "600", color: colors.graphite, lineHeight: 20 },
  tipText: { marginTop: 8, fontSize: 14, fontWeight: "700", color: colors.graphite, lineHeight: 22 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  badge: { width: "47%", borderRadius: 16, padding: 14, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line },
  badgeLocked: { opacity: 0.45 },
  badgeIcon: { fontSize: 26 },
  badgeTitle: { marginTop: 6, fontSize: 13, fontWeight: "900", color: colors.graphite },
  badgeLockedText: { color: colors.muted },
  badgeDesc: { marginTop: 3, fontSize: 11, fontWeight: "600", color: colors.muted, lineHeight: 16 },
  grid: { flexDirection: "row", gap: 12 }
});
