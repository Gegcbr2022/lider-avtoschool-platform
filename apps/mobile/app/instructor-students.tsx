// ─── Instructor Students Screen ───────────────────────────────────────────────
// Lists all students who have booked this instructor.
// Tapping a student opens an inline conversation with them.
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "../lib/auth";
import { notifyChat } from "../lib/api";
import { useTheme, radii, spacing } from "../lib/theme";
import {
  getInstructorBookings,
  ensureInstructorConversation,
  subscribeToMessages,
  sendMessage,
  type BookingDoc,
  type MessageDoc,
} from "../lib/firestore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatTime(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
}

function statusLabel(status: string): { label: string; color: string } {
  switch (status) {
    case "confirmed": return { label: "Підтверджено", color: "#22c55e" };
    case "cancelled": return { label: "Скасовано", color: "#ef4444" };
    case "completed": return { label: "Завершено", color: "#6b7280" };
    default:          return { label: "Очікується", color: "#f59e0b" };
  }
}

// Deduplicate bookings by studentId — keep the latest one.
function deduplicateByStudent(bookings: BookingDoc[]): BookingDoc[] {
  const map = new Map<string, BookingDoc>();
  for (const b of bookings) {
    const prev = map.get(b.studentId);
    if (!prev || b.startsAt > prev.startsAt) {
      map.set(b.studentId, b);
    }
  }
  return Array.from(map.values()).sort((a, b) => (a.studentName < b.studentName ? -1 : 1));
}

// ─── Inline Conversation ──────────────────────────────────────────────────────

type ConvViewProps = {
  studentId: string;
  studentName: string;
  onClose: () => void;
};

function ConversationView({ studentId, studentName, onClose }: ConvViewProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const s = makeStyles(colors);
  const scrollRef = useRef<ScrollView>(null);

  const [convId, setConvId]       = useState<string | null>(null);
  const [messages, setMessages]   = useState<MessageDoc[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let unsub: (() => void) | undefined;
    let active = true;

    (async () => {
      try {
        // Conversation keyed by both real uids (student + this instructor)
        const id = await ensureInstructorConversation({
          callerId: user.id,
          studentId,
          studentName,
          instructorId: user.id,
          instructorName: user.name,
        });
        if (!active) return;
        setConvId(id);
        unsub = subscribeToMessages(id, (msgs) => {
          setMessages(msgs);
          setLoading(false);
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
        });
      } catch {
        if (active) {
          setError("Не вдалось підключити чат. Перевір з'єднання.");
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      unsub?.();
    };
  }, [studentId, studentName, user]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !convId || !user || sending) return;
    setInput("");
    setSending(true);
    try {
      await sendMessage(convId, { senderId: user.id, senderName: user.name, text });
      // Mirror to Telegram (best-effort); admin syncs via Firestore automatically.
      void notifyChat({
        conversationId: convId,
        userId: user.id,
        userName: user.name,
        text,
        conversationType: "instructor",
      });
    } catch {
      setError("Повідомлення не надіслано. Спробуй ще раз.");
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        {/* Header */}
        <View style={s.header}>
          <Pressable hitSlop={12} onPress={onClose} style={{ marginRight: 8 }}>
            <Text style={{ color: colors.red, fontSize: 22, fontWeight: "600" }}>‹</Text>
          </Pressable>
          <View style={s.chatAvatar}>
            <Text style={{ fontSize: 20 }}>👤</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.headerTitle}>{studentName}</Text>
            <Text style={s.headerSub}>Чат з учнем</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={s.messagesContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {loading ? (
            <ActivityIndicator color={colors.red} style={{ marginVertical: 40 }} />
          ) : null}

          {error ? (
            <View style={[s.systemRow, { backgroundColor: colors.redSoft }]}>
              <Text style={[s.systemText, { color: colors.red }]}>{error}</Text>
            </View>
          ) : null}

          {!loading && messages.length === 0 && !error ? (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>💬</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center" }}>
                Напиши першим! Повідомлення приходять у застосунок учня.
              </Text>
            </View>
          ) : null}

          {messages.map((m) => {
            const mine = m.senderId === user?.id;
            return (
              <View key={m.id} style={[s.bubbleWrap, mine ? s.bubbleWrapMine : s.bubbleWrapTheirs]}>
                <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleTheirs]}>
                  {!mine ? <Text style={s.senderName}>{m.senderName || studentName}</Text> : null}
                  <Text style={[s.bubbleText, mine && s.bubbleTextMine]}>{m.text}</Text>
                  <Text style={[s.timeText, mine && s.timeMine]}>{formatTime(m.createdAt)}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Написати повідомлення..."
            placeholderTextColor={colors.textTertiary}
            multiline
            editable={!sending}
          />
          <Pressable
            style={[s.sendBtn, (!input.trim() || sending) && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.sendText}>↑</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Student List ─────────────────────────────────────────────────────────────

export default function InstructorStudentsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const s = makeStyles(colors);

  const [bookings, setBookings]     = useState<BookingDoc[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStudent, setActiveStudent] = useState<{ id: string; name: string } | null>(null);

  async function loadBookings() {
    if (!user) return;
    const data = await getInstructorBookings(user.id);
    setBookings(data);
    setLoading(false);
  }

  useEffect(() => {
    void loadBookings();
  }, [user?.id]);

  async function onRefresh() {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  }

  // If a student conversation is open, show it
  if (activeStudent) {
    return (
      <ConversationView
        studentId={activeStudent.id}
        studentName={activeStudent.name}
        onClose={() => setActiveStudent(null)}
      />
    );
  }

  const students = deduplicateByStudent(bookings);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={{ marginRight: 8 }}>
          <Text style={{ color: colors.red, fontSize: 22, fontWeight: "600" }}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Мої учні</Text>
          <Text style={s.headerSub}>Записані на заняття</Text>
        </View>
      </View>

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
        {loading ? (
          <ActivityIndicator color={colors.red} style={{ marginVertical: 48 }} />
        ) : students.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyText}>У вас поки немає записаних учнів</Text>
          </View>
        ) : (
          students.map((b) => {
            const st = statusLabel(b.status);
            return (
              <Pressable
                key={b.studentId}
                style={s.studentCard}
                onPress={() => setActiveStudent({ id: b.studentId, name: b.studentName })}
              >
                <View style={s.studentAvatar}>
                  <Text style={{ fontSize: 22 }}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.studentName}>{b.studentName || "Учень"}</Text>
                  <Text style={s.lessonTime}>🕐 {formatDateTime(b.startsAt)}</Text>
                  <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
                </View>
                <View style={s.chatIconWrap}>
                  <Text style={s.chatIconText}>💬</Text>
                </View>
              </Pressable>
            );
          })
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
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bgCard,
    },
    headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "900" },
    headerSub:   { color: colors.textSecondary, fontSize: 11, marginTop: 1 },

    studentCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.bg,
    },
    studentAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.redSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    studentName: { color: colors.textPrimary, fontSize: 15, fontWeight: "800" },
    lessonTime:  { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
    statusText:  { fontSize: 12, fontWeight: "700", marginTop: 2 },

    chatIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.bgCard,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    chatIconText: { fontSize: 18 },

    emptyCard: {
      alignItems: "center",
      paddingVertical: 48,
      margin: spacing.md,
      backgroundColor: colors.bgCard,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyEmoji: { fontSize: 36, marginBottom: 10 },
    emptyText:  { color: colors.textSecondary, fontSize: 14 },

    // ── Conversation styles ────────────────────────────────────────────────
    chatAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.redSoft,
      alignItems: "center",
      justifyContent: "center",
    },

    messagesContent: { padding: spacing.md, gap: 10, paddingBottom: 16 },

    systemRow: {
      backgroundColor: colors.bgElevated,
      borderRadius: radii.sm,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    systemText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: "center" },

    bubbleWrap: { maxWidth: "85%" },
    bubbleWrapMine:   { alignSelf: "flex-end" },
    bubbleWrapTheirs: { alignSelf: "flex-start" },
    bubble: { borderRadius: radii.md, padding: 12, gap: 3 },
    bubbleMine:   { backgroundColor: colors.red, borderBottomRightRadius: 4 },
    bubbleTheirs: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
    senderName: { color: colors.red, fontSize: 11, fontWeight: "800", marginBottom: 1 },
    bubbleText: { color: colors.textPrimary, fontSize: 15, lineHeight: 21, fontWeight: "500" },
    bubbleTextMine: { color: "#fff" },
    timeText: { color: colors.textTertiary, fontSize: 10, alignSelf: "flex-end", marginTop: 2 },
    timeMine: { color: "rgba(255,255,255,0.7)" },

    inputRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "flex-end",
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.bgCard,
    },
    input: {
      flex: 1,
      maxHeight: 120,
      backgroundColor: colors.bgElevated,
      borderRadius: radii.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: colors.textPrimary,
      fontSize: 15,
    },
    sendBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.red,
      alignItems: "center",
      justifyContent: "center",
    },
    sendText: { color: "#fff", fontSize: 20, fontWeight: "900" },
  });
}
