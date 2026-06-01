import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Label, ProgressBar, PrimaryButton, Screen } from "../../components/mobile-ui";
import { testCategories } from "../../lib/mobile-data";
import { colors } from "../../lib/theme";

export default function TestsTab() {
  return (
    <Screen title="ПДР тренажер" subtitle="Екзаменаційний режим: 20 питань, таймер, історія спроб і категорії тем.">
      <Card tone="yellow">
        <Label>Режим</Label>
        <Text style={styles.examTitle}>Екзамен: 20 питань</Text>
        <Text style={styles.examText}>Останній результат: 34/40, 85%. Таймер і статистика готові до підключення API.</Text>
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
        <Text style={styles.body}>Вікторина по знаках, реакція на світлофор, паркування, рейтинг, досягнення і рекорди.</Text>
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
  }
});
