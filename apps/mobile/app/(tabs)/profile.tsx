import { Text, StyleSheet, View } from "react-native";
import { Card, Label, Pill, Row, Screen } from "../../components/mobile-ui";
import { documents, payments, student } from "../../lib/mobile-data";
import { colors } from "../../lib/theme";

export default function ProfileTab() {
  return (
    <Screen title="Кабінет" subtitle="Профіль, документи, історія заявок, платежі, налаштування і менеджер.">
      <Card>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{student.initials}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name}>{student.name}</Text>
            <Text style={styles.meta}>
              Категорія {student.category} · менеджер {student.manager}
            </Text>
          </View>
        </View>
      </Card>

      <Card>
        <Label>Документи</Label>
        {documents.map((document) => (
          <Row
            key={document.id}
            title={document.title}
            detail={document.detail}
            right={
              <Pill
                tone={
                  document.status === "Перевірено"
                    ? "success"
                    : document.status === "Потрібно додати"
                      ? "warning"
                      : "neutral"
                }
              >
                {document.status}
              </Pill>
            }
          />
        ))}
      </Card>

      <Card>
        <Label>Платежі</Label>
        {payments.map((payment) => (
          <Row
            key={payment.id}
            title={`${payment.amount.toLocaleString("uk-UA")} грн`}
            detail={`${payment.provider} · ${payment.id} · ${payment.studentName}`}
            right={<Pill tone={payment.status === "paid" ? "success" : "warning"}>{payment.status}</Pill>}
          />
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  avatar: {
    height: 58,
    width: 58,
    borderRadius: 20,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    color: colors.yellow,
    fontSize: 18,
    fontWeight: "900"
  },
  profileText: {
    flex: 1
  },
  name: {
    color: colors.graphite,
    fontSize: 21,
    fontWeight: "900"
  },
  meta: {
    marginTop: 4,
    color: colors.muted,
    lineHeight: 20
  }
});
