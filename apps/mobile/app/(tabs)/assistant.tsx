// Лідик AI — full-screen chat with theme support and mascot states
import { useMemo, useRef, useState } from "react";
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
import { askLidyk } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useTheme, radii, spacing } from "../../lib/theme";
import { useNetworkStatus } from "../../lib/useNetwork";
import { crashError, crashLog } from "../../lib/crashlytics";

type Message = { role: "user" | "assistant"; text: string; fallback?: boolean; ts: number };
type MascotState = "idle" | "thinking" | "happy" | "sad" | "offline";

const MASCOT_EMOJI: Record<MascotState, string> = {
  idle: "🚗",
  thinking: "🤔",
  happy: "😄",
  sad: "😔",
  offline: "📡",
};

const MASCOT_LABEL: Record<MascotState, string> = {
  idle: "Лідик",
  thinking: "Думає...",
  happy: "Відповів!",
  sad: "Помилка",
  offline: "Офлайн режим",
};

const QUICK_PROMPTS = [
  "Поясни помилку в ПДР",
  "Дай план на 10 хвилин",
  "Що повторити перед іспитом?",
  "Які документи потрібні?",
  "Скільки коштує навчання?",
  "Як записатись на практику?",
];

const SMART_ACTIONS = [
  { label: "ПДР", prompt: "Поясни правило перешкоди праворуч простими словами" },
  { label: "Іспит", prompt: "Склади короткий план підготовки до іспиту МВС на сьогодні" },
  { label: "Практика", prompt: "Як підготуватися до першого практичного заняття з інструктором?" },
] as const;

export default function AssistantTab() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const networkStatus = useNetworkStatus();
  const isOffline = networkStatus === "offline";

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Привіт! Я Лідик — AI-помічник автошколи «Лідер». 🚗\n\nЗапитай про ПДР, категорії прав, ціни, філії або запис на навчання.",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mascotState, setMascotState] = useState<MascotState>("idle");
  const hasConversation = messages.length > 1;
  const composerHint = useMemo(() => {
    if (isOffline) return "Офлайн: перевір інтернет";
    if (loading) return "Лідик готує відповідь";
    return hasConversation ? "Можеш уточнити питання" : "Обери швидку тему або напиши своє";
  }, [hasConversation, isOffline, loading]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;

    if (isOffline) {
      setMessages((prev) => [...prev,
        { role: "user", text: q, ts: Date.now() },
        { role: "assistant", text: "Лідик offline 📡 Немає з'єднання з інтернетом. Перевір мережу і спробуй ще раз.", fallback: true, ts: Date.now() },
      ]);
      setMascotState("offline");
      setTimeout(() => setMascotState("idle"), 3000);
      return;
    }

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q, ts: Date.now() }]);
    setLoading(true);
    setMascotState("thinking");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await askLidyk(q, user);

      if (res.mode === "openai") {
        crashLog("ai:lidyk_success");
        setMessages((prev) => [...prev, { role: "assistant", text: res.answer, ts: Date.now() }]);
        setMascotState("happy");
      } else if (res.mode === "local-fallback") {
        crashLog("ai:lidyk_local_fallback");
        setMessages((prev) => [...prev, { role: "assistant", text: res.answer, fallback: true, ts: Date.now() }]);
        setMascotState("offline");
      } else if (res.mode === "guard") {
        setMessages((prev) => [...prev, { role: "assistant", text: res.answer, ts: Date.now() }]);
        setMascotState("idle");
      } else {
        crashLog(`ai:lidyk_fallback mode=${res.mode}`);
        setMessages((prev) => [...prev, { role: "assistant", text: res.answer, fallback: true, ts: Date.now() }]);
        setMascotState("sad");
      }
    } catch (err: unknown) {
      const isTimeout = err instanceof Error && err.name === "AbortError";
      crashError(err instanceof Error ? err : new Error(String(err)), isTimeout ? "ai:lidyk_timeout" : "ai:lidyk_error");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: isTimeout
            ? "Лідик думав надто довго... Спробуй ще раз або задай простіше питання. ⏱️"
            : "Щось пішло не так. Спробуй ще раз — Лідик вже готується! 🔧",
          fallback: true,
          ts: Date.now(),
        },
      ]);
      setMascotState(isTimeout ? "thinking" : "sad");
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
        setTimeout(() => setMascotState("idle"), 2000);
      }, 100);
    }
  }

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header with back arrow + mascot state */}
        <View style={s.header}>
          <Pressable
            hitSlop={14}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/(tabs)" as import("expo-router").Href);
            }}
            style={s.backBtn}
          >
            <Text style={s.backBtnText}>‹</Text>
          </Pressable>
          <View style={s.mascotBadge}>
            <Text style={s.mascotEmoji}>{MASCOT_EMOJI[mascotState]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>{MASCOT_LABEL[mascotState]}</Text>
            <Text style={s.headerSub}>AI-консультант автошколи «Лідер»</Text>
          </View>
          {loading ? (
            <ActivityIndicator color={colors.red} size="small" style={{ marginRight: 4 }} />
          ) : null}
          {hasConversation && !loading ? (
            <Pressable hitSlop={10} onPress={() => setMessages((prev) => prev.slice(0, 1))} style={s.clearBtn}>
              <Text style={s.clearBtnText}>Очистити</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Offline banner */}
        {isOffline ? (
          <View style={{ backgroundColor: colors.warningSoft, borderBottomWidth: 1, borderBottomColor: colors.warning + "44", paddingHorizontal: spacing.md, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 18 }}>📡</Text>
            <Text style={{ color: colors.warning, fontWeight: "700", fontSize: 13, flex: 1 }}>
              Немає інтернету — Лідик не може відповідати
            </Text>
          </View>
        ) : null}

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={s.messages}
          contentContainerStyle={s.messagesContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {!hasConversation ? (
            <View style={s.actionGrid}>
              {SMART_ACTIONS.map((action) => (
                <Pressable key={action.label} style={s.actionCard} onPress={() => send(action.prompt)} disabled={loading || isOffline}>
                  <Text style={s.actionTitle}>{action.label}</Text>
                  <Text style={s.actionSub} numberOfLines={2}>{action.prompt}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {messages.map((msg, i) => (
            <View
              key={i}
              style={[
                s.bubbleWrap,
                msg.role === "user" ? s.bubbleWrapUser : s.bubbleWrapBot,
              ]}
            >
              {msg.role === "assistant" ? (
                <View style={s.botAvatar}>
                  <Text style={{ fontSize: 14 }}>🚗</Text>
                </View>
              ) : null}
              <View
                style={[
                  s.bubble,
                  msg.role === "user" ? s.bubbleUser : s.bubbleBot,
                  msg.fallback ? s.bubbleFallback : null,
                ]}
              >
                <Text style={[s.bubbleText, msg.role === "user" && s.bubbleTextUser]}>
                  {msg.text}
                </Text>
                {msg.fallback ? (
                  <View style={s.fallbackRow}>
                    <Text style={s.fallbackNote}>📡 Резервний режим</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}

          {loading ? (
            <View style={[s.bubbleWrap, s.bubbleWrapBot]}>
              <View style={s.botAvatar}>
                <Text style={{ fontSize: 14 }}>🚗</Text>
              </View>
              <View style={[s.bubble, s.bubbleBot, s.typingBubble]}>
                <ActivityIndicator color={colors.red} size="small" />
                <Text style={s.typingText}>Лідик думає...</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={s.composer}>
          <Text style={s.composerHint}>{composerHint}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.prompts}
            style={s.promptsStrip}
          >
            {QUICK_PROMPTS.map((p) => (
              <Pressable key={p} style={s.prompt} onPress={() => send(p)} disabled={loading || isOffline}>
                <Text style={s.promptText}>{p}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Input */}
          <View style={s.inputRow}>
          <TextInput
            style={[s.input, isOffline && { opacity: 0.5 }]}
            value={input}
            onChangeText={setInput}
            placeholder={isOffline ? "Немає інтернету..." : "Запитай Лідика..."}
            placeholderTextColor={colors.textTertiary}
            returnKeyType="send"
            onSubmitEditing={() => send(input)}
            editable={!loading && !isOffline}
            multiline={false}
            autoCorrect={false}
          />
          <Pressable
            style={[s.sendBtn, (loading || !input.trim()) && s.sendBtnDisabled]}
            onPress={() => send(input)}
            disabled={loading || !input.trim()}
          >
            <Text style={s.sendText}>↑</Text>
          </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },

    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bgCard,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    backBtnText: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.textPrimary,
      lineHeight: 26,
    },
    mascotBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.redSoft,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.red + "40",
    },
    mascotEmoji: { fontSize: 20 },
    headerTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "800" },
    headerSub: { color: colors.textSecondary, fontSize: 11, marginTop: 1 },
    clearBtn: {
      borderRadius: radii.full,
      paddingHorizontal: 10,
      paddingVertical: 7,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    clearBtnText: { color: colors.textSecondary, fontSize: 11, fontWeight: "800" },

    messages: { flex: 1 },
    messagesContent: { padding: spacing.md, gap: 12, paddingBottom: 12, flexGrow: 1 },

    actionGrid: { flexDirection: "row", gap: 8, marginBottom: 2 },
    actionCard: {
      flex: 1,
      minHeight: 82,
      borderRadius: radii.md,
      padding: 10,
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionTitle: { color: colors.red, fontSize: 12, fontWeight: "900", marginBottom: 5 },
    actionSub: { color: colors.textSecondary, fontSize: 11, lineHeight: 15, fontWeight: "700" },

    bubbleWrap: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
    bubbleWrapBot: { alignSelf: "flex-start", maxWidth: "90%" },
    bubbleWrapUser: { alignSelf: "flex-end", maxWidth: "80%", flexDirection: "row-reverse" },

    botAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.redSoft,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },

    bubble: {
      borderRadius: radii.md,
      padding: 12,
      gap: 4,
      flex: 1,
    },
    bubbleBot: {
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bubbleUser: {
      backgroundColor: colors.red,
      borderBottomRightRadius: 4,
    },
    bubbleFallback: {
      backgroundColor: colors.warningSoft,
      borderColor: colors.warning + "55",
    },
    typingBubble: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 14,
    },
    bubbleText: { color: colors.textPrimary, fontSize: 14, lineHeight: 22, fontWeight: "500" },
    bubbleTextUser: { color: "#fff" },
    fallbackRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
    fallbackNote: { color: colors.warning, fontSize: 11, fontWeight: "700" },
    typingText: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },

    composer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.bgCard,
      paddingTop: 8,
    },
    composerHint: { color: colors.textTertiary, fontSize: 11, fontWeight: "800", paddingHorizontal: spacing.md, marginBottom: 6 },
    promptsStrip: { maxHeight: 42, flexGrow: 0 },
    prompts: {
      paddingHorizontal: spacing.md,
      paddingBottom: 6,
      gap: 8,
      alignItems: "center",
    },
    prompt: {
      borderRadius: radii.full,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: colors.bgElevated,
      borderWidth: 1.5,
      borderColor: colors.border,
      flexShrink: 0,
    },
    promptText: {
      color: colors.textSecondary,
      fontWeight: "700",
      fontSize: 12,
      flexShrink: 0,
    },

    inputRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: spacing.md,
      paddingTop: 4,
      paddingBottom: Platform.OS === "ios" ? spacing.md : 10,
    },
    input: {
      flex: 1,
      backgroundColor: colors.bgElevated,
      borderRadius: radii.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    sendBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.red,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.red,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    },
    sendBtnDisabled: { opacity: 0.35 },
    sendText: { color: "#fff", fontSize: 20, fontWeight: "900" },
  });
}
