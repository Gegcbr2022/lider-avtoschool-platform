import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Label, ProgressBar, PrimaryButton, Screen } from "../../components/mobile-ui";
import { testCategories } from "../../lib/mobile-data";
import { colors } from "../../lib/theme";

export default function TestsTab() {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <Screen title="ПДР тренажер" subtitle="Екзаменаційний режим: 20 питань, таймер, історія спроб і категорії тем.">
      <Card tone="yellow">
        <Label>Режим</Label>
        <Text style={styles.examTitle}>Екзамен: 20 питань</Text>
        <Text style={styles.examText}>
          Останній результат: 34/40, 85%. Таймер і статистика готові до підключення API.
        </Text>
        <ProgressBar value={85} color={colors.green} />
      </Card>

      <Card>
        <Label>Категорії питань</Label>
        <View style={styles.tags}>
          {testCategories.map((category) => (
            <Pressable key={category} style={styles.tag}>
              <Text style={styles.tagText}>{category}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Label>Міні-ігри</Label>
        <Text style={styles.body}>
          Вікторина по знаках, реакція на світлофор, паркування, рейтинг, досягнення і рекорди.
        </Text>
      </Card>

      <Card>
        <Label>Пояснення помічника</Label>
        <Text style={styles.questionTitle}>Приклад: кому потрібно дати дорогу на нерегульованому перехресті?</Text>
        <Text style={styles.body}>
          Якщо відповідь неправильна, помічник пояснює правило простими словами і пропонує тему для повторення.
        </Text>
        {showExplanation ? (
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>Пояснення правила</Text>
            <Text style={styles.explanationText}>
              На нерегульованому перехресті діє правило пріоритету: спочатку перевіряємо знаки, потім перешкоду справа.
              Якщо знаків немає, пропустіть транспортний засіб, який наближається справа.
            </Text>
          </View>
        ) : null}
        <Pressable style={styles.aiButton} onPress={() => setShowExplanation((current) => !current)}>
          <Text style={styles.aiButtonText}>{showExplanation ? "Сховати пояснення" : "Пояснити помилку"}</Text>
        </Pressable>
      </Card>

      <PrimaryButton>Почати тренування</PrimaryButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  examTitle: {
    marginTop: 8,
    color: colors.graphite,
    fontSize: 24,
    fontWeight: "900"
  },
  examText: {
    marginVertical: 12,
    color: colors.graphite,
    lineHeight: 22
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14
  },
  tag: {
    borderRadius: 999,
    backgroundColor: "#edf5f2",
    paddingHorizontal: 13,
    paddingVertical: 9
  },
  tagText: {
    color: colors.green,
    fontWeight: "800"
  },
  body: {
    marginTop: 10,
    color: colors.muted,
    lineHeight: 22
  },
  questionTitle: {
    marginTop: 10,
    color: colors.graphite,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24
  },
  explanation: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: "#edf5f2",
    padding: 14
  },
  explanationTitle: {
    color: colors.green,
    fontWeight: "900"
  },
  explanationText: {
    marginTop: 8,
    color: colors.graphite,
    lineHeight: 22
  },
  aiButton: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: colors.green,
    paddingVertical: 13,
    alignItems: "center"
  },
  aiButtonText: {
    color: colors.white,
    fontWeight: "900"
  }
});
