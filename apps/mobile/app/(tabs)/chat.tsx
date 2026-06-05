// ─── Чат — Telegram-like chat list → conversation ──────────────────────────────
// Architecture: list of chats (currently just "Автошкола Лідер"), tap → conversation.
// Conversation is a real Firestore real-time messenger. Backend mirrors each
// thread to a Telegram supergroup topic; manager replies come back here.
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
  ensureSupportConversation,
  sendMessage,
  subscribeToMessages,
  type MessageDoc,
} from "../../lib/firestore";
import { useTheme, radii, spacing } from "../../lib/theme";
import { useNetworkStatus } from "../../lib/useNetwork";

function formatTime(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
}

// ─── Chat List ────────────────────────────────────────────────────────────────

type ChatItem = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  lastMessage?: string;
  lastTime?: string;
  unread?: number;
};

function ChatList({ onOpen }: { onOpen: (id: string) => void }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const chats: ChatItem[] = [
    {
      id: "support",
      title: "Автошкола Лідер",
      subtitle: "Менеджер · Підтримка · Інструктор",
      emoji: "🚗",
      lastMessage: "Напишіть своє питання...",
    },
  ];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Чати</Text>
      </View>
      <ScrollView style={{ flex: 1 }}>
        {chats.map((chat) => (
          <Pressable key={chat.id} style={s.chatRow} onPress={() => onOpen(chat.id)}>
            <View style={s.chatAvatar}>
              <Text style={{ fontSize: 22 }}>{chat.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={s.chatName}>{chat.title}</Text>
                {chat.lastTime ? (
                  <Text style={s.chatTime}>{chat.lastTime}</Text>
                ) : null}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3 }}>
                <Text style={s.chatSub} numberOfLines={1}>{chat.subtitle}</Text>
                {chat.unread ? (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{chat.unread}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Conversation ─────────────────────────────────────────────────────────────

function Conversation({ onBack }: { onBack: () => void }) {
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
        const convId = await ensureSupportConversation(user.id, user.name);
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
  }, [user]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !conversationId || !user || sending) return;
    setInput("");
    setSending(true);
    try {
      await sendMessage(conversationId, { senderId: user.id, senderName: user.name, text });
      void notifyChat({ conversationId, userId: user.id, userName: user.name, text });
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
        {/* Header with back button */}
        <View style={s.header}>
          <Pressable hitSlop={12} onPress={onBack} style={{ marginRight: 8 }}>
            <Text style={{ color: colors.red, fontSize: 22, fontWeight: "600" }}>‹</Text>
          </Pressable>
          <View style={s.chatAvatar}>
            <Text style={{ fontSize: 20 }}>🚗</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.headerTitle}>Автошкола «Лідер»</Text>
            <Text style={s.headerSub}>Менеджер · Підтримка · Інструктор</Text>
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
            <Text style={s.systemText}>
              Напиши своє питання — менеджер автошколи відповість якнайшвидше (зазвичай протягом робочого дня).
            </Text>
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
                  {!mine ? <Text style={s.senderName}>{m.senderName || "Автошкола"}</Text> : null}
                  <Text style={[s.bubbleText, mine && s.bubbleTextMine]}>{m.text}</Text>
                  <Text style={[s.time, mine && s.timeMine]}>{formatTime(m.createdAt)}</Text>
                </View>
              </View>
            );
          })}

          {!loading && messages.length === 0 && !error ? (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>👋</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center" }}>
                Привіт! Це твій чат з автошколою.{"\n"}Постав перше питання нижче.
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
          <Text style={s.gateTitle}>Чат з автошколою</Text>
          <Text style={s.gateSub}>
            Увійди в акаунт, щоб написати менеджеру, підтримці чи інструктору. Відповідь приходить прямо сюди.
          </Text>
          <Pressable style={s.gateBtn} onPress={() => router.push("/auth?mode=login")}>
            <Text style={s.gateBtnText}>Увійти</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (activeChat) {
    return <Conversation onBack={() => setActiveChat(null)} />;
  }

  return <ChatList onOpen={(id) => setActiveChat(id)} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
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
    headerSub: { color: colors.textSecondary, fontSize: 11, marginTop: 1 },

    chatRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
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
    chatSub: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
    chatTime: { color: colors.textTertiary, fontSize: 12 },
    badge: {
      backgroundColor: colors.red,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
      marginLeft: 8,
    },
    badgeText: { color: "#fff", fontSize: 11, fontWeight: "900" },

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
