import type { ReactNode } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, darkColors as colors, radii, shadows, spacing } from "../lib/theme";

// colors = darkColors for StyleSheet.create (static, module init)
// useTheme() for dynamic theme in component renders

// ─── Screen wrapper ──────────────────────────────────────────────────────────

export function Screen({
  title,
  subtitle,
  children,
  noPadding = false,
  headerRight,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  noPadding?: boolean;
  headerRight?: ReactNode;
}) {
  const { colors: tc } = useTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.container, noPadding && styles.noPaddingContainer]}
      >
        {title ? (
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: tc.textPrimary }]}>{title}</Text>
              {subtitle ? <Text style={[styles.subtitle, { color: tc.textSecondary }]}>{subtitle}</Text> : null}
            </View>
            {headerRight ? <View>{headerRight}</View> : null}
          </View>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Cards ───────────────────────────────────────────────────────────────────

export function Card({
  children,
  tone = "default",
  style,
}: {
  children: ReactNode;
  tone?: "default" | "red" | "success" | "warning" | "dark";
  style?: object;
}) {
  const { colors: tc } = useTheme();
  const toneStyle =
    tone === "red"     ? styles.cardRed :
    tone === "success" ? { backgroundColor: tc.successSoft, borderWidth: 1, borderColor: tc.success + "44" } :
    tone === "warning" ? { backgroundColor: tc.warningSoft, borderWidth: 1, borderColor: tc.warning + "44" } :
    tone === "dark"    ? { backgroundColor: tc.bgElevated, borderWidth: 1, borderColor: tc.border } :
    { backgroundColor: tc.bgCard, borderWidth: 1, borderColor: tc.border };
  const toneShadow = tone === "red" ? shadows.red : shadows.card;

  return (
    <View style={[styles.card, toneStyle, toneShadow, style]}>
      {children}
    </View>
  );
}

export function GradientCard({
  children,
  colors: gradColors = [colors.red, colors.redDark],
  style,
}: {
  children: ReactNode;
  colors?: string[];
  style?: object;
}) {
  // Simulate gradient with dark red card
  return (
    <View style={[styles.card, { backgroundColor: gradColors[0] }, shadows.red, style]}>
      {children}
    </View>
  );
}

// ─── Typography ──────────────────────────────────────────────────────────────

export function Label({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "inverse" | "red" | "muted";
}) {
  const { colors: tc } = useTheme();
  const dynamicColor =
    variant === "inverse" ? "rgba(255,255,255,0.6)" :
    variant === "red" ? tc.red :
    tc.textTertiary;
  return (
    <Text style={[styles.label, { color: dynamicColor }]}>
      {children}
    </Text>
  );
}

export function Heading({
  children,
  size = "md",
  color,
}: {
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
}) {
  const { colors: tc } = useTheme();
  const sizeStyle =
    size === "xl" ? styles.headingXl :
    size === "lg" ? styles.headingLg :
    size === "sm" ? styles.headingSm :
    styles.headingMd;
  return (
    <Text style={[sizeStyle, { color: color ?? tc.textPrimary }]}>{children}</Text>
  );
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

export function PrimaryButton({
  children,
  onPress,
  disabled,
  style,
  size = "md",
}: {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: object;
  size?: "sm" | "md" | "lg";
}) {
  const sizeStyle =
    size === "lg" ? styles.btnLg :
    size === "sm" ? styles.btnSm :
    styles.btnMd;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn, styles.btnRed, sizeStyle, style,
        pressed && styles.btnPressed,
        disabled && styles.btnDisabled,
      ]}
    >
      <Text style={[styles.btnText, size === "sm" && styles.btnTextSm]}>
        {children}
      </Text>
    </Pressable>
  );
}

export function SecondaryButton({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: object;
}) {
  const { colors: tc } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn, styles.btnMd,
        { borderWidth: 1.5, borderColor: tc.border, backgroundColor: "transparent" },
        style, pressed && styles.btnPressed,
      ]}
    >
      <Text style={{ color: tc.textSecondary, fontSize: 15, fontWeight: "700" }}>{children}</Text>
    </Pressable>
  );
}

export function GhostButton({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: object;
}) {
  const { colors: tc } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.ghostBtn, style]}>
      <Text style={{ color: tc.textSecondary, fontSize: 14, fontWeight: "600" }}>{children}</Text>
    </Pressable>
  );
}

// ─── Progress ────────────────────────────────────────────────────────────────

export function ProgressBar({
  value,
  color,
  height = 8,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  const { colors: tc } = useTheme();
  return (
    <View style={[styles.progressTrack, { height, backgroundColor: tc.border }]}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${Math.max(0, Math.min(100, value))}%`,
            backgroundColor: color ?? tc.red,
            height,
          },
        ]}
      />
    </View>
  );
}

export function CircleProgress({
  value,
  size = 72,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  return (
    <View style={[styles.circleProgress, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.circleProgressValue}>{value}%</Text>
      {label ? <Text style={styles.circleProgressLabel}>{label}</Text> : null}
    </View>
  );
}

// ─── Rows & Lists ────────────────────────────────────────────────────────────

export function Row({
  title,
  detail,
  right,
  icon,
  onPress,
}: {
  title: string;
  detail?: string;
  right?: ReactNode;
  icon?: string;
  onPress?: () => void;
}) {
  const { colors: tc } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderBottomColor: tc.divider }, pressed && onPress && { backgroundColor: tc.bgElevated }]}
    >
      {icon ? <Text style={styles.rowIcon}>{icon}</Text> : null}
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: tc.textPrimary }]}>{title}</Text>
        {detail ? <Text style={[styles.rowDetail, { color: tc.textSecondary }]}>{detail}</Text> : null}
      </View>
      {right}
      {onPress && !right ? <Text style={[styles.rowChevron, { color: tc.textTertiary }]}>›</Text> : null}
    </Pressable>
  );
}

// ─── Badges & Pills ──────────────────────────────────────────────────────────

export function Pill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "red" | "success" | "warning" | "info";
}) {
  const toneStyle =
    tone === "red"     ? styles.pillRed :
    tone === "success" ? styles.pillSuccess :
    tone === "warning" ? styles.pillWarning :
    tone === "info"    ? styles.pillInfo :
    styles.pillDefault;
  const textStyle =
    tone === "red"     ? styles.pillTextRed :
    tone === "success" ? styles.pillTextSuccess :
    tone === "warning" ? styles.pillTextWarning :
    tone === "info"    ? styles.pillTextInfo :
    styles.pillTextDefault;
  return (
    <View style={[styles.pill, toneStyle]}>
      <Text style={[styles.pillText, textStyle]}>{children}</Text>
    </View>
  );
}

export function Badge({ value, color = colors.red }: { value: string | number; color?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{value}</Text>
    </View>
  );
}

// ─── Stat cards ──────────────────────────────────────────────────────────────

export function StatCard({
  value,
  label,
  icon,
  accent = false,
}: {
  value: string;
  label: string;
  icon?: string;
  accent?: boolean;
}) {
  const { colors: tc } = useTheme();
  return (
    <View style={[
      styles.statCard,
      accent
        ? { backgroundColor: tc.redSoft, borderColor: tc.red + "40" }
        : { backgroundColor: tc.bgCard, borderColor: tc.border },
      shadows.card,
    ]}>
      {icon ? <Text style={styles.statIcon}>{icon}</Text> : null}
      <Text style={[styles.statValue, { color: accent ? tc.red : tc.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: tc.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ─── Mascot ──────────────────────────────────────────────────────────────────

const MASCOT = require("../assets/mascot.png") as number;

// Lidyk emotional states
export type LidykState =
  | "happy"        // ✅ test passed, success
  | "sad"          // ❌ test failed, error
  | "thinking"     // 🤔 loading, AI processing
  | "excited"      // 🎉 new record, achievement
  | "offline"      // 📡 no internet
  | "error"        // 🔴 critical error
  | "sleeping"     // 💤 idle, no activity
  | "nervous"      // 😰 exam mode
  | "celebrating"; // 🏆 graduation, milestone

export const LIDYK_EMOJI: Record<LidykState, string> = {
  happy:       "🚗💨",
  sad:         "🚗😢",
  thinking:    "🚗🤔",
  excited:     "🚗✨",
  offline:     "🚗📡",
  error:       "🚗🔴",
  sleeping:    "🚗💤",
  nervous:     "🚗😰",
  celebrating: "🚗🏆",
};

export const LIDYK_MESSAGES: Record<LidykState, { title: string; sub: string }> = {
  happy:       { title: "Лідик радіє!",          sub: "Так тримати! 💪" },
  sad:         { title: "Лідик засмучений",       sub: "Але не здавайся! Спробуй ще." },
  thinking:    { title: "Лідик думає...",         sub: "Зачекай трохи, готую відповідь" },
  excited:     { title: "Новий рекорд!",          sub: "Ти переміг! Лідик пишається 🎉" },
  offline:     { title: "Лідик offline 📡",       sub: "Немає з'єднання. Функції обмежені." },
  error:       { title: "Щось пішло не так",      sub: "Лідик вже повідомив команду 🔧" },
  sleeping:    { title: "Лідик дрімає 💤",        sub: "Час повернутися до навчання!" },
  nervous:     { title: "Спокійно, ти зможеш!",  sub: "Лідик вірить у тебе 🚗" },
  celebrating: { title: "Вітаємо!",              sub: "Ти отримав права! Вітання від Лідика 🏆" },
};

export function MascotCard({
  title,
  message,
  tone = "default",
  state,
  action,
  onAction,
}: {
  title: string;
  message: string;
  tone?: "default" | "success" | "warning" | "error";
  state?: LidykState;
  action?: string;
  onAction?: () => void;
}) {
  const { colors: tc } = useTheme();
  const bg =
    tone === "success" ? tc.successSoft :
    tone === "warning" ? tc.warningSoft :
    tone === "error"   ? tc.redSoft :
    tc.bgCard;

  const displayTitle = state ? LIDYK_MESSAGES[state].title : title;
  const displayMsg   = state ? (message || LIDYK_MESSAGES[state].sub) : message;

  return (
    <View style={[styles.mascotCard, { backgroundColor: bg, borderColor: tc.border }, shadows.card]}>
      {state ? (
        <Text style={{ fontSize: 36 }}>{LIDYK_EMOJI[state]}</Text>
      ) : (
        <Image source={MASCOT} style={styles.mascotImg} resizeMode="contain" />
      )}
      <View style={styles.mascotBody}>
        <Text style={[styles.mascotTitle, { color: tc.textPrimary }]}>{displayTitle}</Text>
        <Text style={[styles.mascotMessage, { color: tc.textSecondary }]}>{displayMsg}</Text>
        {action && onAction ? (
          <Pressable onPress={onAction} style={styles.mascotBtn}>
            <Text style={styles.mascotBtnText}>{action}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// ─── Standalone Lidyk state banner ───────────────────────────────────────────

export function LidykBanner({
  state,
  message,
  action,
  onAction,
}: {
  state: LidykState;
  message?: string;
  action?: string;
  onAction?: () => void;
}) {
  const { colors: tc } = useTheme();
  const info = LIDYK_MESSAGES[state];
  const bg =
    state === "happy" || state === "excited" || state === "celebrating"
      ? tc.successSoft
      : state === "offline" || state === "error" || state === "sad"
      ? tc.redSoft
      : state === "nervous"
      ? tc.warningSoft
      : tc.bgCard;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: bg, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: tc.border, ...shadows.card }}>
      <Text style={{ fontSize: 36 }}>{LIDYK_EMOJI[state]}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: tc.textPrimary, fontWeight: "800", fontSize: 15 }}>{info.title}</Text>
        <Text style={{ color: tc.textSecondary, fontSize: 13, marginTop: 3, lineHeight: 18 }}>
          {message || info.sub}
        </Text>
        {action && onAction ? (
          <Pressable onPress={onAction} style={{ marginTop: 10, backgroundColor: tc.red, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignSelf: "flex-start" }}>
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800" }}>{action}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function MascotMessage({
  emoji,
  title,
  message,
  tone = "neutral",
}: {
  emoji: string;
  title: string;
  message: string;
  tone?: "neutral" | "success" | "warning" | "error";
}) {
  const { colors: tc } = useTheme();
  const bg =
    tone === "success" ? tc.successSoft :
    tone === "warning" ? tc.warningSoft :
    tone === "error"   ? tc.redSoft :
    tc.bgCard;

  return (
    <View style={[styles.mascotMsg, { backgroundColor: bg, borderColor: tc.border }, shadows.card]}>
      <Text style={styles.mascotMsgEmoji}>{emoji}</Text>
      <View style={styles.mascotMsgText}>
        <Text style={[styles.mascotMsgTitle, { color: tc.textPrimary }]}>{title}</Text>
        <Text style={[styles.mascotMsgBody, { color: tc.textSecondary }]}>{message}</Text>
      </View>
    </View>
  );
}

// ─── Empty & loading states ──────────────────────────────────────────────────

export function EmptyState({
  title,
  detail,
  emoji = "🚘",
  action,
  onAction,
}: {
  title: string;
  detail: string;
  emoji?: string;
  action?: string;
  onAction?: () => void;
}) {
  const { colors: tc } = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>{title}</Text>
      <Text style={[styles.emptyDetail, { color: tc.textSecondary }]}>{detail}</Text>
      {action && onAction ? (
        <PrimaryButton onPress={onAction} style={{ marginTop: 16 }}>
          {action}
        </PrimaryButton>
      ) : null}
    </View>
  );
}

export function SkeletonBlock() {
  const { colors: tc } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: tc.bgCard, borderWidth: 1, borderColor: tc.border, gap: 10 }]}>
      <View style={[styles.skeletonLine, { backgroundColor: tc.bgElevated, width: "80%" }]} />
      <View style={[styles.skeletonLine, { backgroundColor: tc.bgElevated, width: "60%" }]} />
      <View style={[styles.skeletonLine, { backgroundColor: tc.bgElevated, width: "40%" }]} />
    </View>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const { colors: tc } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction}>
          <Text style={[styles.sectionAction, { color: tc.red }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function Divider() {
  const { colors: tc } = useTheme();
  return <View style={[styles.divider, { backgroundColor: tc.divider }]} />;
}

// ─── Insight / mini-stat ─────────────────────────────────────────────────────

export function InsightCard({
  title,
  detail,
  accent = "default",
}: {
  title: string;
  detail: string;
  accent?: "default" | "red" | "success" | "warning";
}) {
  const { colors: tc } = useTheme();
  const bg =
    accent === "red"     ? tc.redSoft :
    accent === "success" ? tc.successSoft :
    accent === "warning" ? tc.warningSoft :
    tc.bgCard;
  return (
    <View style={[styles.insight, { backgroundColor: bg, borderColor: tc.border }, shadows.card]}>
      <Text style={[styles.insightTitle, { color: accent === "red" ? tc.red : tc.textPrimary }]}>{title}</Text>
      <Text style={[styles.insightDetail, { color: tc.textSecondary }]}>{detail}</Text>
    </View>
  );
}

// ─── ProgressBar (legacy alias) ──────────────────────────────────────────────

export function ProgressRing({ value, label }: { value: number; label?: string }) {
  return <CircleProgress value={value} label={label} />;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Screen
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md, paddingBottom: 120, gap: spacing.md },
  noPaddingContainer: { padding: 0, paddingBottom: 120 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  headerText: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 32, fontWeight: "900", letterSpacing: -0.8 },
  subtitle: { marginTop: 6, color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontWeight: "500" },

  // Cards
  card: { borderRadius: radii.md, padding: 18, overflow: "hidden" },
  cardDefault: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  cardRed: { backgroundColor: colors.red },
  cardSuccess: { backgroundColor: colors.successSoft, borderWidth: 1, borderColor: colors.success + "44" },
  cardWarning: { backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warning + "44" },
  cardDark: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border },

  // Labels
  label: { color: colors.textTertiary, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  labelInverse: { color: "rgba(255,255,255,0.6)" },
  labelRed: { color: colors.red },
  labelMuted: { color: colors.textTertiary },

  // Headings
  headingXl: { color: colors.textPrimary, fontSize: 36, fontWeight: "900", letterSpacing: -1.2 },
  headingLg: { color: colors.textPrimary, fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  headingMd: { color: colors.textPrimary, fontSize: 18, fontWeight: "700" },
  headingSm: { color: colors.textPrimary, fontSize: 15, fontWeight: "700" },

  // Buttons
  btn: { alignItems: "center", justifyContent: "center", borderRadius: radii.sm },
  btnRed: { backgroundColor: colors.red },
  btnOutline: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.border },
  btnLg: { paddingVertical: 18, paddingHorizontal: 24 },
  btnMd: { paddingVertical: 14, paddingHorizontal: 20 },
  btnSm: { paddingVertical: 10, paddingHorizontal: 16 },
  btnPressed: { opacity: 0.8 },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: colors.white, fontSize: 16, fontWeight: "800" },
  btnTextSm: { fontSize: 14 },
  btnOutlineText: { color: colors.textSecondary, fontSize: 15, fontWeight: "700" },
  ghostBtn: { alignItems: "center", paddingVertical: 12 },
  ghostBtnText: { color: colors.textSecondary, fontSize: 14, fontWeight: "600" },

  // Progress
  progressTrack: { borderRadius: radii.full, backgroundColor: colors.border, overflow: "hidden" },
  progressFill: { borderRadius: radii.full },
  circleProgress: {
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.redSoft, borderWidth: 3, borderColor: colors.red,
  },
  circleProgressValue: { color: colors.red, fontSize: 18, fontWeight: "900" },
  circleProgressLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: "600" },

  // Rows
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowPressed: { backgroundColor: colors.bgElevated },
  rowIcon: { fontSize: 20, width: 28, textAlign: "center" },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: "700" },
  rowDetail: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  rowChevron: { color: colors.textTertiary, fontSize: 20, fontWeight: "300" },

  // Pills
  pill: { borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start" },
  pillDefault: { backgroundColor: colors.bgElevated },
  pillRed: { backgroundColor: colors.redSoft },
  pillSuccess: { backgroundColor: colors.successSoft },
  pillWarning: { backgroundColor: colors.warningSoft },
  pillInfo: { backgroundColor: colors.infoSoft },
  pillText: { fontSize: 12, fontWeight: "700" },
  pillTextDefault: { color: colors.textSecondary },
  pillTextRed: { color: colors.red },
  pillTextSuccess: { color: colors.success },
  pillTextWarning: { color: colors.warning },
  pillTextInfo: { color: colors.info },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "800" },

  // Stat cards
  statCard: { flex: 1, alignItems: "center", padding: 14, borderRadius: radii.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  statCardAccent: { backgroundColor: colors.redSoft, borderColor: colors.red + "40" },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statValue: { color: colors.textPrimary, fontSize: 24, fontWeight: "900", fontVariant: ["tabular-nums"], letterSpacing: -0.5 },
  statValueAccent: { color: colors.red },
  statLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: "600", textAlign: "center", marginTop: 2 },

  // Mascot
  mascotCard: { flexDirection: "row", borderRadius: radii.md, padding: 16, alignItems: "center", gap: 12, borderWidth: 1, borderColor: colors.border },
  mascotImg: { width: 60, height: 60 },
  mascotBody: { flex: 1 },
  mascotTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: "800" },
  mascotMessage: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 3 },
  mascotBtn: { marginTop: 10, backgroundColor: colors.red, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignSelf: "flex-start" },
  mascotBtnText: { color: colors.white, fontSize: 13, fontWeight: "800" },
  mascotMsg: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: radii.md, padding: 14, borderWidth: 1, borderColor: colors.border },
  mascotMsgEmoji: { fontSize: 32 },
  mascotMsgText: { flex: 1 },
  mascotMsgTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "800" },
  mascotMsgBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 3 },

  // Empty
  empty: { alignItems: "center", padding: spacing.xl },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: "800", textAlign: "center" },
  emptyDetail: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 6 },

  // Skeleton
  skeletonLine: { height: 12, borderRadius: radii.full, backgroundColor: colors.bgElevated },

  // Section header
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  sectionAction: { color: colors.red, fontSize: 14, fontWeight: "700" },

  // Divider
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 4 },

  // Insight
  insight: { flex: 1, borderRadius: radii.md, padding: 14, borderWidth: 1, borderColor: colors.border },
  insightTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "900" },
  insightDetail: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 4 },

  // successSoft / warningSoft / infoSoft / redSoft
  successSoft: { backgroundColor: colors.successSoft },
  warningSoft: { backgroundColor: colors.warningSoft },
  infoSoft: { backgroundColor: colors.infoSoft },
  redSoft: { backgroundColor: colors.redSoft },
});
