import { Text, StyleSheet, View } from "react-native";
import { Card, Label, Pill, PrimaryButton, Row, Screen } from "../../components/mobile-ui";
import { upcomingSlot } from "../../lib/mobile-data";
import { colors } from "../../lib/theme";

const slots = [
  ["03.06, 17:00", "Hyundai i30 · Київ", "1 місце"],
  ["04.06, 14:30", "Renault Logan · Дніпро", "2 місця"],
  ["06.06, 10:00", "Skoda Octavia · Київ", "3 місця"]
] as const;

export default function PracticeTab() {
  return (
    <Screen title="Практика" subtitle="Календар інструкторів, авто, вільні слоти, підтвердження і нагадування.">
      <Card tone="green">
        <Label inverse>Найближче заняття</Label>
        <Text style={styles.heroTitle}>{upcomingSlot.branch?.city}</Text>
        <Text style={styles.heroText}>
          {upcomingSlot.instructor}, {upcomingSlot.vehicle}. Підтвердження буде надіслано push-сповіщенням.
        </Text>
      </Card>

      <Card>
        <Label>Доступні слоти</Label>
        {slots.map(([title, detail, seats]) => (
          <Row key={title} title={title} detail={detail} right={<Pill tone="success">{seats}</Pill>} />
        ))}
      </Card>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Автоматичні нагадування</Text>
        <Text style={styles.noticeText}>Android, iOS і Web Push для подій заявки, оплати, уроку та практики.</Text>
      </View>

      <PrimaryButton>Підтвердити запис</PrimaryButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroTitle: {
    marginTop: 10,
    color: colors.white,
    fontSize: 28,
    fontWeight: "900"
  },
  heroText: {
    marginTop: 8,
    color: "rgba(255,255,255,0.78)",
    lineHeight: 22
  },
  notice: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: "#edf5f2"
  },
  noticeTitle: {
    color: colors.green,
    fontWeight: "900",
    fontSize: 18
  },
  noticeText: {
    marginTop: 6,
    color: colors.muted,
    lineHeight: 22
  }
});
