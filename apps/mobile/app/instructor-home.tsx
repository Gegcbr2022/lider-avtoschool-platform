// ─── Instructor Home Screen ───────────────────────────────────────────────────
// Shows the instructor's upcoming schedule and student conversations.
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "../lib/auth";
import { useTheme, radii, spacing } from "../lib/theme";
import {
  getInstructorBookings,
  subscribeToConversations,
  type BookingDoc,
  type ConversationDoc,
} from "../lib/firestore";

function formatDateTime(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("uk-UA", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusLabel(status: string): { label: string; color: string } {
  switch (status) {
    case "confirmed": return { label: "Підтверджено", color: "#22c55e" };
    case "cancelled": return { label: "Скасовано", color: "#ef4444" };
    case "completed": return { label: "Завершено", color: "#6b7280" };
    default:          return { label: "Очікується", color: "#f59e0b" };
  }
}

export default function InstructorHomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const s = makeStyles(colors);

  const [bookings, setBookings]     = useState<BookingDoc[]>([]);
  const [convs, setConvs]           = useState<ConversationDoc[]>([]);
  const [loadingB, setLoadingB]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ─── Load instructor bookings ──────────────────────────────────────────────
  async function loadBookings() {
    if (!user) return;
    const data = await getInstructorBookings(user.id);
    setBookings(data);
    setLoadingB(false);
  }

  useEffect(() => {
    void loadBookings();
  }, [user?.id]);

  // ─── Subscribe to conversations where instructor is a participant ──────────
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToConversations(user.id, (list) => {
      setConvs(list);
    });
    return unsub;
  }, [user?.id]);

  async function onRefresh() {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  }

  // Upcoming = not cancelled/completed, sorted soonest first
  const upcoming = bookings
    .filter((b) => b.status !== "cancelled" && b.status !== "completed")
    .sort((a, b) => (a.startsAt > b.startsAt ? 1 : -1));

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.red}
          />
        }
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Інструктор 🚗</Text>
            <Text style={s.headerSub}>{user?.name ?? ""}</Text>
          </View>
          <Pressable style={s.studentsBtn} onPress={() => router.push("/instructor-students")}>
            <Text style={s.studentsBtnText}>Мої учні</Text>
          </Pressable>
        </View>

        {/* ── Upcoming schedule ──────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>📅 Розклад занять</Text>

        {loadingB ? (
          <ActivityIndicator color={colors.red} style={{ marginVertical: 24 }} />
        ) : upcoming.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyText}>Немає запланованих занять</Text>
          </View>
        ) : (
          upcoming.map((b) => {
            const st = statusLabel(b.status);
            return (
              <View key={b.id} style={s.bookingCard}>
                <View style={s.bookingRow}>
                  <Text style={s.studentName}>{b.studentName || "Учень"}</Text>
                  <Text style={[s.statusBadge, { color: st.color }]}>{st.label}</Text>
                </View>
                <Text style={s.bookingTime}>🕐 {formatDateTime(b.startsAt)}</Text>
              </View>
            );
          })
        )}

        {/* ── Student chats ─────────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>💬 Чати з учнями</Text>

        {convs.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyEmoji}>💬</Text>
            <Text style={s.emptyText}>Поки що немає чатів</Text>
          </View>
        ) : (
          convs.map((c) => (
            <Pressable
              key={c.id}
              style={s.chatRow}
              onPress={() => router.push({ pathname: "/instructor-students", params: { convId: c.id } })}
            >
              <View style={s.chatAvatar}>
                <Text style={{ fontSize: 20 }}>👤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.chatName}>{c.title}</Text>
                {c.lastMessage ? (
                  <Text style={s.chatLast} numberOfLines={1}>{c.lastMessage}</Text>
                ) : null}
              </View>
              <Text style={s.chevron}>›</Text>
            </Pressable>
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bgCard,
    },
    headerTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: "900" },
    headerSub:   { color: colors.textSecondary, fontSize: 13, marginTop: 2 },

    studentsBtn: {
      backgroundColor: colors.red,
      borderRadius: radii.md,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    studentsBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },

    sectionTitle: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginTop: spacing.lg,
      marginBottom: spacing.xs,
      marginHorizontal: spacing.md,
    },

    bookingCard: {
      backgroundColor: colors.bgCard,
      borderRadius: radii.md,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bookingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    studentName: { color: colors.textPrimary, fontSize: 15, fontWeight: "800" },
    statusBadge: { fontSize: 12, fontWeight: "700" },
    bookingTime: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },

    emptyCard: {
      alignItems: "center",
      paddingVertical: 28,
      marginHorizontal: spacing.md,
      backgroundColor: colors.bgCard,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    emptyEmoji: { fontSize: 32, marginBottom: 8 },
    emptyText:  { color: colors.textSecondary, fontSize: 14 },

    chatRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: spacing.md,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.bg,
    },
    chatAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.redSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    chatName: { color: colors.textPrimary, fontSize: 15, fontWeight: "800" },
    chatLast: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
    chevron:  { color: colors.textTertiary, fontSize: 18 },
  });
}
