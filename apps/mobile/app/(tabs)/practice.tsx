import { Text, StyleSheet, View } from "react-native";
import { Card, Label, Pill, PrimaryButton, Row, Screen } from "../../components/mobile-ui";
import { upcomingSlot } from "../../lib/mobile-data";
import { darkColors as colors, radii } from "../../lib/theme";

const slots = [
  { id: "1", time: "03.06, 17:00", detail: "Hyundai i30 · Київ",    seats: "1 місце" },
  { id: "2", time: "04.06, 14:30", detail: "Renault Logan · Дніпро", seats: "2 місця" },
  { id: "3", time: "06.06, 10:00", detail: "Skoda Octavia · Київ",   seats: "3 місця" },
] as const;

export default function PracticeTab() {
  return (
    <Screen
      title="Практика"
      subtitle="Календар інструкторів, авто, вільні слоти та підтвердження."
    >
      <Card tone="red">
        <Label variant="inverse">Найближче заняття</Label>
        <Text style={styles.heroTitle}>{upcomingSlot.branch?.city ?? "—"}</Text>
        <Text style={styles.heroText}>
          {upcomingSlot.instructor}, {upcomingSlot.vehicle}. Підтвердження — push-сповіщенням.
        </Text>
      </Card>

      <Card>
        <Label>Доступні слоти</Label>
        {slots.map((slot) => (
          <Row
            key={slot.id}
            title={slot.time}
            detail={slot.detail}
            right={<Pill tone="success">{slot.seats}</Pill>}
            onPress={() => {}}
          />
        ))}
      </Card>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>🔔 Автоматичні нагадування</Text>
        <Text style={styles.noticeText}>
          Push-сповіщення за 24 та 2 години до заняття. Підключаться після Firebase Notifications.
        </Text>
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
    fontWeight: "900",
  },
  heroText: {
    marginTop: 8,
    color: "rgba(255,255,255,0.78)",
    lineHeight: 22,
  },
  notice: {
    borderRadius: radii.md,
    padding: 18,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  noticeTitle: { color: colors.textPrimary, fontWeight: "900", fontSize: 16 },
  noticeText: { color: colors.textSecondary, lineHeight: 22, fontSize: 14 },
});
