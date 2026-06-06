// ─── Чат — Менеджер + Інструктор ─────────────────────────────────────────────
// Architecture: 2 chats (manager + instructor). Each maps to a real Firestore
// conversation. Backend mirrors each thread to a separate Telegram supergroup
// topic named after the client. First message in topic = client card.
// Manager/instructor reply in TG → FCM push → message appears here live.
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "../../lib/auth";
import { notifyChat } from "../../lib/api";
import {
  ensureConversation,
  ensureInstructorConversation,
  getMyBookings,
  sendMessage,
  subscribeToMessages,
  type MessageDoc,
  type ConversationType,
} from "../../lib/firestore";
import { useTheme, radii, spacing } from "../../lib/theme";
import { useNetworkStatus } from "../../lib/useNetwork";

function formatTime(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
}

// ─── Chat list definition ─────────────────────────────────────────────────────

type ChatDef = {
  id: string;
  type: ConversationType;
  title: string;
  emoji: string;
  subtitle: string;
  systemMessage: string;
};

const CHATS: ChatDef[] = [
  {
    id: "manager",
    type: "manager",
    title: "Менеджер",
    emoji: "👩‍💼",
    subtitle: "Оплата, документи, запис на навчання",
    systemMessage: "Напиши своє питання — менеджер відповість якнайшвидше (зазвичай протягом робочого дня).",
  },
  {
    id: "instructor",
    type: "instructor",
    title: "Інструктор",
    emoji: "🚗",
    subtitle: "Практичні заняття, розклад, питання по водінню",
    systemMessage: "Напиши питання своєму інструктору. Відповідь прийде сюди та в Telegram.",
  },
];

// ─── Chat List ────────────────────────────────────────────────────────────────

function ChatList({ onOpen }: { onOpen: (id: string) => void }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Чати</Text>
        <Text style={s.headerSub}>Зв'язок з автошколою</Text>
      </View>
      <ScrollView style={{ flex: 1 }}>
        {CHATS.map((chat) => (
          <Pressable key={chat.id} style={s.chatRow} onPress={() => onOpen(chat.id)}>
            <View style={s.chatAvatar}>
              <Text style={{ fontSize: 22 }}>{chat.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.chatName}>{chat.title}</Text>
              <Text style={s.chatSub} numberOfLines={1}>{chat.subtitle}</Text>
            </View>
            <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Conversation ─────────────────────────────────────────────────────────────

function Conversation({ chat, onBack }: { chat: ChatDef; onBack: () => void }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const isOffline = useNetworkStatus() === "offline";
  const scrollRef = useRef<ScrollView>(null);
  const s = makeStyles(colors);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    let unsub: (() => void) | undefined;
    let active = true;

    (async () => {
      try {
        let convId: string;
        if (chat.type === "instructor") {
          // Resolve the student's assigned instructor from their bookings.
          const bookings = await getMyBookings(user.id);
          const withInstructor = bookings.find((b) => b.instructorId);
          if (!withInstructor) {
            if (active) {
              setError("Запишись на практику, щоб написати інструктору.");
              setLoading(false);
            }
            return;
          }
          convId = await ensureInstructorConversation({
            callerId: user.id,
            studentId: user.id,
            studentName: user.name,
            instructorId: withInstructor.instructorId,
            instructorName: withInstructor.instructorName,
          });
        } else {
          convId = await ensureConversation(user.id, user.name, chat.type, chat.title);
        }
        if (!active) return;
        setConversationId(convId);
        unsub = subscribeToMessages(convId, (msgs) => {
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
  }, [user, chat.type]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !conversationId || !user || sending) return;
    setInput("");
    setSending(true);
    try {
      await sendMessage(conversationId, { senderId: user.id, senderName: user.name, text });
      // Notify backend — sends to TG topic + triggers FCM on reply
      void notifyChat({
        conversationId,
        userId: user.id,
        userName: user.name,
        text,
        conversationType: chat.type,
        userPhone: user.phone,
        userEmail: user.email,
        userCity: user.city,
        userCategory: user.category,
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
          <Pressable hitSlop={12} onPress={onBack} style={{ marginRight: 8 }}>
            <Text style={{ color: colors.red, fontSize: 22, fontWeight: "600" }}>‹</Text>
          </Pressable>
          <View style={s.chatAvatar}>
            <Text style={{ fontSize: 20 }}>{chat.emoji}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.headerTitle}>{chat.title}</Text>
            <Text style={s.headerSub}>Відповідь приходить сюди та push-сповіщенням</Text>
          </View>
        </View>

        {isOffline ? (
          <View style={s.offlineBar}>
            <Text style={{ color: colors.warning, fontWeight: "700", fontSize: 13 }}>
              📡 Немає інтернету — повідомлення надішлеться після відновлення
            </Text>
          </View>
        ) : null}

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={s.messagesContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          <View style={s.systemRow}>
            <Text style={s.systemText}>{chat.systemMessage}</Text>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator color={colors.red} />
            </View>
          ) : null}

          {error ? (
            <View style={[s.systemRow, { backgroundColor: colors.redSoft }]}>
              <Text style={[s.systemText, { color: colors.red }]}>{error}</Text>
            </View>
          ) : null}

          {messages.map((m) => {
            const mine = m.senderId === user?.id;
            return (
              <View key={m.id} style={[s.bubbleWrap, mine ? s.bubbleWrapMine : s.bubbleWrapTheirs]}>
                <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleTheirs]}>
                  {!mine ? <Text style={s.senderName}>{m.senderName || chat.title}</Text> : null}
                  <Text style={[s.bubbleText, mine && s.bubbleTextMine]}>{m.text}</Text>
                  <Text style={[s.time, mine && s.timeMine]}>{formatTime(m.createdAt)}</Text>
                </View>
              </View>
            );
          })}

          {!loading && messages.length === 0 && !error ? (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>{chat.emoji}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center" }}>
                Постав перше питання нижче.{"\n"}Відповідь прийде сюди та push-сповіщенням.
              </Text>
            </View>
          ) : null}
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

// ─── Root tab component ───────────────────────────────────────────────────────

export default function ChatTab() {
  const { colors } = useTheme();
  const { mode, user } = useAuth();
  const s = makeStyles(colors);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const isGuest = mode !== "authenticated" || !user || user.isGuest;

  if (isGuest) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Чати</Text>
        </View>
        <View style={s.center}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>💬</Text>
          <Text style={s.gateTitle}>Зв'язок з автошколою</Text>
          <Text style={s.gateSub}>
            Увійди в акаунт, щоб написати менеджеру або інструктору.{"\n"}Відповідь прийде сюди та push-сповіщенням.
          </Text>
          <Pressable style={s.gateBtn} onPress={() => router.push("/auth?mode=login")}>
            <Text style={s.gateBtnText}>Увійти</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (activeChat) {
    const chat = CHATS.find((c) => c.id === activeChat) ?? CHATS[0];
    return <Conversation chat={chat} onBack={() => setActiveChat(null)} />;
  }

  return <ChatList onOpen={(id) => setActiveChat(id)} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
    header: {
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bgCard,
      flexDirection: "row",
      alignItems: "center",
    },
    headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "900" },
    headerSub: { color: colors.textSecondary, fontSize: 11, marginTop: 1, flex: 1 },

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
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.redSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    chatName: { color: colors.textPrimary, fontSize: 16, fontWeight: "800" },
    chatSub: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 2 },

    offlineBar: {
      backgroundColor: colors.warningSoft,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.warning + "44",
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
    bubbleWrapMine: { alignSelf: "flex-end" },
    bubbleWrapTheirs: { alignSelf: "flex-start" },
    bubble: { borderRadius: radii.md, padding: 12, gap: 3 },
    bubbleMine: { backgroundColor: colors.red, borderBottomRightRadius: 4 },
    bubbleTheirs: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
    senderName: { color: colors.red, fontSize: 11, fontWeight: "800", marginBottom: 1 },
    bubbleText: { color: colors.textPrimary, fontSize: 15, lineHeight: 21, fontWeight: "500" },
    bubbleTextMine: { color: "#fff" },
    time: { color: colors.textTertiary, fontSize: 10, alignSelf: "flex-end", marginTop: 2 },
    timeMine: { color: "rgba(255,255,255,0.7)" },

    gateTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "900", textAlign: "center" },
    gateSub: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 10 },
    gateBtn: { marginTop: 24, backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 14, paddingHorizontal: 40 },
    gateBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },

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
