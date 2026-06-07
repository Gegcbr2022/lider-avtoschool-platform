// ─── Чат — Менеджер + Інструктор ─────────────────────────────────────────────
// Architecture: 2 chats (manager + instructor). Each maps to a real Firestore
// conversation. Backend mirrors each thread to a separate Telegram supergroup
// topic named after the client. First message in topic = client card.
// Manager/instructor reply in TG → FCM push → message appears here live.
import { useEffect, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "../../lib/auth";
import { notifyChat } from "../../lib/api";
import {
  ensureConversation,
  ensureInstructorConversation,
  getMyBookings,
  markConversationRead,
  sendMessage,
  subscribeToMessages,
  subscribeToConversations,
  type MessageDoc,
  type ConversationType,
  type ConversationDoc,
} from "../../lib/firestore";
import { uploadChatImage } from "../../lib/storage";
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
  const { user } = useAuth();
  const s = makeStyles(colors);
  const [convMap, setConvMap] = useState<Record<string, ConversationDoc>>({});

  useEffect(() => {
    if (!user?.id) return;
    const unsub = subscribeToConversations(user.id, (convs) => {
      const m: Record<string, ConversationDoc> = {};
      for (const c of convs) {
        if (c.type === "manager" || c.type === "instructor") m[c.type] = c;
      }
      setConvMap(m);
    });
    return unsub;
  }, [user?.id]);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Чати</Text>
        <Text style={s.headerSub}>Зв'язок з автошколою</Text>
      </View>
      <ScrollView style={{ flex: 1 }}>
        {CHATS.map((chat) => {
          const conv = convMap[chat.type];
          const lastMsg = conv?.lastMessage;
          const lastAt = conv?.lastMessageAt;
          const timeStr = lastAt
            ? lastAt.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })
            : null;
          return (
            <Pressable key={chat.id} style={s.chatRow} onPress={() => onOpen(chat.id)}>
              <View style={s.chatAvatar}>
                <Text style={{ fontSize: 22 }}>{chat.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.chatName}>{chat.title}</Text>
                <Text style={s.chatSub} numberOfLines={1}>
                  {lastMsg ?? chat.subtitle}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                {timeStr ? (
                  <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "600" }}>
                    {timeStr}
                  </Text>
                ) : null}
                <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>
              </View>
            </Pressable>
          );
        })}
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const [fullscreenPhotoState, setFullscreenPhotoState] = useState<"loading" | "ready" | "error">("loading");
  const [photoErrors, setPhotoErrors] = useState<Record<string, boolean>>({});

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
        void markConversationRead(convId, user.id);
        unsub = subscribeToMessages(convId, (msgs) => {
          setMessages(msgs);
          void markConversationRead(convId, user.id);
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
      await sendMessage(conversationId, { senderId: user.id, senderName: user.name, senderRole: user.role, text });
      void notifyChat({
        conversationId, userId: user.id, userName: user.name, text,
        conversationType: chat.type, userPhone: user.phone, userEmail: user.email,
        userCity: user.city, userCategory: user.category,
      });
    } catch {
      setError("Повідомлення не надіслано. Спробуй ще раз.");
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  async function handlePickImage() {
    if (!conversationId || !user || uploadingImage) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Доступ потрібен", "Дозвольте доступ до фото в налаштуваннях.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const uri = asset.uri;
    setUploadingImage(true);
    try {
      const { downloadURL, storagePath, fileSize } = await uploadChatImage(conversationId, uri);
      await sendMessage(conversationId, {
        senderId: user.id, senderName: user.name,
        senderRole: user.role,
        text: "", mediaUrl: downloadURL, mediaPath: storagePath, mediaType: "image",
        fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
        fileSize: asset.fileSize ?? fileSize,
        width: asset.width,
        height: asset.height,
      });
      void notifyChat({
        conversationId, userId: user.id, userName: user.name, text: "",
        mediaUrl: downloadURL, mediaType: "image",
        conversationType: chat.type, userPhone: user.phone, userEmail: user.email,
        userCity: user.city, userCategory: user.category,
      });
    } catch (err) {
      console.error("[Chat] photo upload failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert("Помилка", `Не вдалось надіслати фото.\n${__DEV__ ? msg : "Перевір з'єднання і спробуй ще раз."}`);
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Fullscreen photo modal */}
      <Modal
        visible={fullscreenPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenPhoto(null)}
        statusBarTranslucent
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)", alignItems: "center", justifyContent: "center" }}
          onPress={() => setFullscreenPhoto(null)}
        >
          {fullscreenPhoto ? (
              <>
                {fullscreenPhotoState === "loading" ? (
                  <ActivityIndicator color="#fff" size="large" style={{ position: "absolute" }} />
                ) : null}
                {fullscreenPhotoState === "error" ? (
                  <View style={{ padding: 18, borderRadius: radii.md, backgroundColor: "rgba(255,255,255,0.12)", marginHorizontal: 24 }}>
                    <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800", textAlign: "center" }}>Фото не завантажилось</Text>
                    <Text style={{ color: "rgba(255,255,255,0.72)", fontSize: 12, textAlign: "center", marginTop: 6 }}>
                      Перевір інтернет або спробуй відкрити ще раз.
                    </Text>
                  </View>
                ) : (
                  <Image
                    source={{ uri: fullscreenPhoto }}
                    style={{ width: "100%", height: "80%", borderRadius: 0 }}
                    resizeMode="contain"
                    onLoadStart={() => setFullscreenPhotoState("loading")}
                    onLoad={() => setFullscreenPhotoState("ready")}
                    onError={() => setFullscreenPhotoState("error")}
                  />
                )}
              </>
          ) : null}
          <TouchableOpacity
            onPress={() => setFullscreenPhoto(null)}
            style={{ position: "absolute", top: 48, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}>✕</Text>
          </TouchableOpacity>
        </Pressable>
      </Modal>

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
                  {!mine ? <Text style={s.senderName}>{chat.title}</Text> : null}
                  {m.mediaUrl && m.mediaType === "image" ? (
                    <Pressable
                      onPress={() => {
                        setFullscreenPhotoState("loading");
                        setFullscreenPhoto(m.mediaUrl ?? null);
                      }}
                      style={{ marginBottom: m.text ? 6 : 0 }}
                    >
                      {photoErrors[m.id] ? (
                        <View style={{ width: 200, minHeight: 92, borderRadius: radii.sm, backgroundColor: mine ? "rgba(255,255,255,0.18)" : colors.bgElevated, alignItems: "center", justifyContent: "center", padding: 12 }}>
                          <Text style={{ color: mine ? "#fff" : colors.textPrimary, fontSize: 13, fontWeight: "800", textAlign: "center" }}>Фото недоступне</Text>
                          <Text style={{ color: mine ? "rgba(255,255,255,0.72)" : colors.textTertiary, fontSize: 11, textAlign: "center", marginTop: 4 }}>
                            Натисни, щоб спробувати відкрити.
                          </Text>
                        </View>
                      ) : (
                        <>
                          <Image
                            source={{ uri: m.mediaUrl }}
                            style={{ width: 200, height: 150, borderRadius: radii.sm }}
                            resizeMode="cover"
                            onError={() => {
                              console.warn("[Chat] Image failed to load:", m.mediaUrl);
                              setPhotoErrors(prev => ({ ...prev, [m.id]: true }));
                            }}
                          />
                          <View style={{ position: "absolute", bottom: 6, right: 6, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>⛶ Відкрити</Text>
                          </View>
                        </>
                      )}
                    </Pressable>
                  ) : null}
                  {m.text ? <Text style={[s.bubbleText, mine && s.bubbleTextMine]}>{m.text}</Text> : null}
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
          <Pressable
            style={[s.attachBtn, (uploadingImage) && { opacity: 0.4 }]}
            onPress={handlePickImage}
            disabled={uploadingImage || sending}
          >
            {uploadingImage ? <ActivityIndicator color={colors.textTertiary} size="small" /> : <Text style={{ fontSize: 20 }}>📷</Text>}
          </Pressable>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Написати повідомлення..."
            placeholderTextColor={colors.textTertiary}
            multiline
            editable={!sending && !uploadingImage}
          />
          <Pressable
            style={[s.sendBtn, (!input.trim() || sending || uploadingImage) && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!input.trim() || sending || uploadingImage}
          >
            {sending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.sendText}>↑</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Instructor Chat View ────────────────────────────────────────────────────
// Instructors see their student conversations directly (not the student chat list)

function InstructorChatTab() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const s = makeStyles(colors);
  const [convs, setConvs] = useState<ConversationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToConversations(user.id, (list) => {
      setConvs(list);
      setLoading(false);
    });
    return unsub;
  }, [user?.id]);

  if (activeChatId) {
    // Reuse the student Conversation component with a synthesized ChatDef
    const conv = convs.find((c) => c.id === activeChatId);
    const chatDef: ChatDef = {
      id: activeChatId,
      type: "instructor",
      title: conv?.title ?? "Учень",
      emoji: "👤",
      subtitle: "Чат з учнем",
      systemMessage: "Відповідайте учню. Повідомлення відображаються у його додатку та Telegram.",
    };
    return <Conversation chat={chatDef} onBack={() => setActiveChatId(null)} />;
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Чати з учнями</Text>
        <Text style={s.headerSub}>Відповідайте учням та менеджерам</Text>
      </View>
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.red} />
        </View>
      ) : convs.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>💬</Text>
          <Text style={s.gateTitle}>Немає чатів</Text>
          <Text style={s.gateSub}>
            Учні, які записались до вас на практику,{"\n"}з'являться тут автоматично.
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {convs.map((c) => (
            <Pressable
              key={c.id}
              style={s.chatRow}
              onPress={() => setActiveChatId(c.id)}
            >
              <View style={s.chatAvatar}>
                <Text style={{ fontSize: 22 }}>👤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.chatName}>{c.title}</Text>
                {c.lastMessage ? (
                  <Text style={s.chatSub} numberOfLines={1}>
                    {c.lastMessage}
                  </Text>
                ) : (
                  <Text style={[s.chatSub, { fontStyle: "italic" }]}>
                    Немає повідомлень
                  </Text>
                )}
              </View>
              <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
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

  // Instructor gets a dedicated view showing student conversations
  if (user?.role === "instructor") {
    return <InstructorChatTab />;
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
    attachBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.bgElevated,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
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
