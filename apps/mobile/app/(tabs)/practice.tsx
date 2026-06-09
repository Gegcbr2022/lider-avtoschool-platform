// ─── Практика: реальні бронювання з Firestore ────────────────────────────────
// Показує наступне заняття та список всіх бронювань студента.
// Дані з колекції `bookings` (Firestore) — без mock.
import { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, Pressable, Text, View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, type Href } from "expo-router";
import { useAuth } from "../../lib/auth";
import { getMyBookings, type BookingDoc } from "../../lib/firestore";
import { useTheme, radii, spacing } from "../../lib/theme";

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusLabel(status: string): { text: string; color: string } {
  switch (status) {
    case "confirmed": return { text: "Підтверджено ✅", color: "#22c55e" };
    case "completed": return { text: "Проведено", color: "#6b7280" };
    case "cancelled": return { text: "Скасовано ❌", color: "#ef4444" };
    default: return { text: "Очікує підтвердження ⏳", color: "#f59e0b" };
  }
}

export default function PracticeTab() {
  const { colors } = useTheme();
  const { user, mode } = useAuth();
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getMyBookings(user.id);
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Refresh on focus (e.g., after creating a new booking)
  useFocusEffect(useCallback(() => { loadBookings(); }, [loadBookings]));

  const s = makeStyles(colors);
  const isAuth = mode === "authenticated";

  // Next upcoming booking (soonest in future)
  const now = new Date().toISOString();
  const upcoming = bookings
    .filter((b) => b.status !== "cancelled" && b.status !== "completed" && b.startsAt >= now)
    .sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1))[0] ?? null;

  // ─── Guest state ──────────────────────────────────────────────────────────
  if (!isAuth) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Практика</Text>
          <Text style={s.headerSubtitle}>Запис до інструктора та розклад</Text>
        </View>
        <View style={s.emptyWrap}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🚗</Text>
          <Text style={s.emptyTitle}>Увійдіть в акаунт</Text>
          <Text style={s.emptyText}>
            Після входу ви побачите своє розкладання занять та зможете записатися до інструктора.
          </Text>
          <Pressable style={s.ctaButton} onPress={() => router.push("/auth")}>
            <Text style={s.ctaText}>Увійти / Зареєструватись</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Практика</Text>
        <Text style={s.headerSubtitle}>Ваші заняття з інструктором</Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.red} size="large" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, gap: 16 }}>

          {/* ─── Next booking hero ──────────────────────────────────────── */}
          {upcoming ? (
            <View style={[s.heroCard, { backgroundColor: colors.red }]}>
              <Text style={s.heroLabel}>НАЙБЛИЖЧЕ ЗАНЯТТЯ</Text>
              <Text style={s.heroInstructor}>{upcoming.instructorName}</Text>
              <Text style={s.heroDate}>{formatDate(upcoming.startsAt)}</Text>
              <View style={s.heroStatusWrap}>
                <Text style={[s.heroStatus, { color: statusLabel(upcoming.status).color === "#22c55e" ? "#bbf7d0" : "#fde68a" }]}>
                  {statusLabel(upcoming.status).text}
                </Text>
              </View>
            </View>
          ) : (
            <View style={s.noUpcoming}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>📅</Text>
              <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
                Немає запланованих занять
              </Text>
              <Text style={s.emptyText}>Запишіться до інструктора — оберіть зручний час.</Text>
            </View>
          )}

          {/* ─── Book new lesson CTA ────────────────────────────────────── */}
          <Pressable style={s.ctaButton} onPress={() => router.push("/booking" as Href)}>
            <Text style={s.ctaText}>➕ Записатися на заняття</Text>
          </Pressable>

          {/* ─── All bookings list ──────────────────────────────────────── */}
          {bookings.length > 0 && (
            <View style={s.card}>
              <Text style={s.sectionTitle}>Всі бронювання</Text>
              {bookings.map((b) => {
                const st = statusLabel(b.status);
                return (
                  <View key={b.id} style={s.bookingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.bookingInstructor}>{b.instructorName}</Text>
                      <Text style={s.bookingDate}>{formatDate(b.startsAt)}</Text>
                    </View>
                    <Text style={[s.bookingStatus, { color: st.color }]}>{st.text}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* ─── Push reminder note ─────────────────────────────────────── */}
          <View style={s.noticeCard}>
            <Text style={s.noticeTitle}>🔔 Нагадування</Text>
            <Text style={s.noticeText}>
              Ви отримаєте сповіщення за 24 та 2 години до заняття після підключення push-сповіщень.
            </Text>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: ReturnType<typeof import("../../lib/theme").useTheme>["colors"]) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: {
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bgCard,
    },
    headerTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "900" },
    headerSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    emptyWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xl,
    },
    emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.textPrimary, textAlign: "center", marginBottom: 8 },
    emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20 },
    heroCard: {
      borderRadius: radii.lg,
      padding: 20,
    },
    heroLabel: {
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1,
      color: "rgba(255,255,255,0.7)",
      textTransform: "uppercase",
      marginBottom: 6,
    },
    heroInstructor: { color: "#fff", fontSize: 24, fontWeight: "900", marginBottom: 4 },
    heroDate: { color: "rgba(255,255,255,0.85)", fontSize: 15, fontWeight: "600" },
    heroStatusWrap: { marginTop: 10 },
    heroStatus: { fontSize: 13, fontWeight: "700" },
    noUpcoming: {
      alignItems: "center",
      backgroundColor: colors.bgCard,
      borderRadius: radii.lg,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ctaButton: {
      backgroundColor: colors.red,
      borderRadius: radii.md,
      paddingVertical: 14,
      alignItems: "center",
    },
    ctaText: { color: "#fff", fontSize: 15, fontWeight: "800" },
    card: {
      backgroundColor: colors.bgCard,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 12,
    },
    sectionTitle: {
      color: colors.textTertiary,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    bookingRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    bookingInstructor: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
    bookingDate: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
    bookingStatus: { fontSize: 12, fontWeight: "700" },
    noticeCard: {
      borderRadius: radii.md,
      padding: 16,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    noticeTitle: { color: colors.textPrimary, fontWeight: "900", fontSize: 15 },
    noticeText: { color: colors.textSecondary, lineHeight: 20, fontSize: 13 },
  });
