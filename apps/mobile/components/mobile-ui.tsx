import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii } from "../lib/theme";

export function Screen({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "green" | "yellow" }) {
  return (
    <View style={[styles.card, tone === "green" && styles.greenCard, tone === "yellow" && styles.yellowCard]}>
      {children}
    </View>
  );
}

export function Label({ children, inverse = false }: { children: ReactNode; inverse?: boolean }) {
  return <Text style={[styles.label, inverse && styles.inverseLabel]}>{children}</Text>;
}

export function ProgressBar({ value, color = colors.yellow }: { value: number; color?: string }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressBar, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} />
    </View>
  );
}

export function PrimaryButton({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>{children}</Text>
    </Pressable>
  );
}

export function Row({ title, detail, right }: { title: string; detail: string; right?: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      {right}
    </View>
  );
}

export function Pill({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  return (
    <View style={[styles.pill, tone === "success" && styles.successPill, tone === "warning" && styles.warningPill]}>
      <Text
        style={[styles.pillText, tone === "success" && styles.successText, tone === "warning" && styles.warningText]}
      >
        {children}
      </Text>
    </View>
  );
}

export function InsightCard({
  title,
  detail,
  accent = "green"
}: {
  title: string;
  detail: string;
  accent?: "green" | "yellow";
}) {
  return (
    <View style={[styles.insight, accent === "yellow" && styles.yellowInsight]}>
      <Text style={[styles.insightTitle, accent === "yellow" && styles.yellowInsightTitle]}>{title}</Text>
      <Text style={[styles.insightDetail, accent === "yellow" && styles.yellowInsightDetail]}>{detail}</Text>
    </View>
  );
}

export function SkeletonBlock() {
  return (
    <View style={styles.skeletonCard}>
      <View style={[styles.skeletonLine, styles.skeletonWide]} />
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, styles.skeletonShort]} />
    </View>
  );
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>+</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDetail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    padding: 20,
    paddingBottom: 110,
    gap: 16
  },
  title: {
    color: colors.graphite,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5
  },
  subtitle: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22
  },
  card: {
    borderRadius: radii.md,
    padding: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line
  },
  greenCard: {
    backgroundColor: colors.green,
    borderColor: colors.green
  },
  yellowCard: {
    backgroundColor: colors.yellow,
    borderColor: colors.yellow
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  inverseLabel: {
    color: "rgba(255,255,255,0.68)"
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#edf5f2",
    overflow: "hidden"
  },
  progressBar: {
    height: "100%",
    borderRadius: 999
  },
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: colors.yellow,
    alignItems: "center"
  },
  buttonText: {
    color: colors.graphite,
    fontSize: 16,
    fontWeight: "900"
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#edf5f2"
  },
  rowText: {
    flex: 1,
    gap: 4
  },
  rowTitle: {
    color: colors.graphite,
    fontWeight: "800"
  },
  rowDetail: {
    color: colors.muted,
    lineHeight: 20
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#edf5f2"
  },
  successPill: {
    backgroundColor: "#e2f7ea"
  },
  warningPill: {
    backgroundColor: "#fff5be"
  },
  pillText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "800"
  },
  successText: {
    color: colors.success
  },
  warningText: {
    color: colors.warning
  },
  insight: {
    flex: 1,
    borderRadius: radii.md,
    padding: 16,
    backgroundColor: colors.green
  },
  yellowInsight: {
    backgroundColor: colors.yellow
  },
  insightTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900"
  },
  yellowInsightTitle: {
    color: colors.graphite
  },
  insightDetail: {
    marginTop: 8,
    color: "rgba(255,255,255,0.74)",
    lineHeight: 20
  },
  yellowInsightDetail: {
    color: colors.graphite
  },
  skeletonCard: {
    borderRadius: radii.md,
    padding: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10
  },
  skeletonLine: {
    height: 12,
    width: "72%",
    borderRadius: 999,
    backgroundColor: "#edf5f2"
  },
  skeletonWide: {
    width: "88%"
  },
  skeletonShort: {
    width: "48%"
  },
  emptyState: {
    borderRadius: radii.md,
    padding: 18,
    alignItems: "center",
    backgroundColor: "#edf5f2"
  },
  emptyIcon: {
    height: 36,
    width: 36,
    borderRadius: 18,
    textAlign: "center",
    textAlignVertical: "center",
    overflow: "hidden",
    backgroundColor: colors.white,
    color: colors.green,
    fontSize: 24,
    fontWeight: "900"
  },
  emptyTitle: {
    marginTop: 12,
    color: colors.graphite,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center"
  },
  emptyDetail: {
    marginTop: 6,
    color: colors.muted,
    lineHeight: 22,
    textAlign: "center"
  }
});
