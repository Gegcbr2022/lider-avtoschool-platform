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
  Linking,
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
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "../../lib/auth";
import { notifyChat } from "../../lib/api";
import {
  ensureConversation,
  ensureInstructorConversation,
  getMyBookings,
  markConversationRead,
  markMessagesRead,
  setMessageReaction,
  sendMessage,
  subscribeToMessages,
  subscribeToConversations,
  type MessageDoc,
  type ConversationType,
  type ConversationDoc,
} from "../../lib/firestore";
import { uploadChatFile, uploadChatImage } from "../../lib/storage";
import { useTheme, radii, spacing } from "../../lib/theme";
import { useNetworkStatus } from "../../lib/useNetwork";
import { crashError, crashLog } from "../../lib/crashlytics";
import { EmptyState } from "../../components/mobile-ui";

function formatTime(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function safeDownloadName(name?: string): string {
  const cleaned = (name ?? `file-${Date.now()}`)
    .trim()
    .replace(/[^\w.\-() ]+/g, "_")
    .replace(/\s+/g, "-");
  return cleaned || `file-${Date.now()}`;
}

type MessageReceiptState = "sent" | "delivered" | "read";

function messageReceipt(message: MessageDoc, currentUserId?: string): MessageReceiptState | null {
  if (!currentUserId || message.senderId !== currentUserId) return null;
  const readByOther = message.readBy?.some((id) => id && id !== currentUserId);
  if (readByOther) return "read";
  const delivered = message.deliveryStatus === "delivered" || message.deliveredTo?.some((id) => id && id !== currentUserId);
  return delivered ? "delivered" : "sent";
}

function receiptMarks(state: MessageReceiptState): string {
  return state === "sent" ? "✓" : "✓✓";
}

function attachmentIcon(message: MessageDoc): string {
  const name = message.fileName?.toLowerCase() ?? "";
  if (message.mediaType === "video") return "🎬";
  if (name.endsWith(".pdf")) return "📕";
  if (name.endsWith(".doc") || name.endsWith(".docx")) return "📘";
  if (name.endsWith(".xls") || name.endsWith(".xlsx")) return "📗";
  if (name.endsWith(".ppt") || name.endsWith(".pptx")) return "📙";
  if (name.endsWith(".zip") || name.endsWith(".rar") || name.endsWith(".7z")) return "🗜️";
  return "📎";
}

function attachmentTitle(message: MessageDoc): string {
  if (message.fileName) return message.fileName;
  if (message.mediaType === "video") return "Відео з чату";
  return "Файл з чату";
}

function attachmentMeta(message: MessageDoc): string {
  const size = formatFileSize(message.fileSize);
  const type = message.mediaType === "video" ? "Відео" : "Документ";
  return [type, size || null, "відкрити"].filter(Boolean).join(" · ");
}

const QUICK_REACTIONS = ["👍", "❤️", "🔥", "😂", "👀"] as const;

function reactionSummary(reactions?: Record<string, string>): Array<{ emoji: string; count: number }> {
  const counts = new Map<string, number>();
  Object.values(reactions ?? {}).forEach((emoji) => {
    if (!emoji) return;
    counts.set(emoji, (counts.get(emoji) ?? 0) + 1);
  });
  return Array.from(counts.entries()).map(([emoji, count]) => ({ emoji, count }));
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
      <View style={s.listHeader}>
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

function Conversation({
  chat,
  onBack,
  conversationIdOverride,
}: {
  chat: ChatDef;
  onBack: () => void;
  conversationIdOverride?: string;
}) {
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
  const [uploadingFile, setUploadingFile] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
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
        if (conversationIdOverride) {
          convId = conversationIdOverride;
        } else if (chat.type === "instructor") {
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
            studentPhone: user.phone,
            instructorId: withInstructor.instructorUserId || withInstructor.instructorId,
            instructorName: withInstructor.instructorName,
          });
        } else {
          convId = await ensureConversation(user.id, user.name, chat.type, chat.title, user.phone);
        }
        if (!active) return;
        setConversationId(convId);
        void markConversationRead(convId, user.id);
        unsub = subscribeToMessages(convId, (msgs) => {
          setMessages(msgs);
          void markConversationRead(convId, user.id);
          void markMessagesRead(convId, user.id, msgs);
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
  }, [user, chat.type, conversationIdOverride]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !conversationId || !user || sending) return;
    setInput("");
    setSending(true);
    try {
      const messageId = await sendMessage(conversationId, { senderId: user.id, senderName: user.name, senderRole: user.role, senderPhone: user.phone, text });
      crashLog(`chat:message_sent type=${chat.type}`);
      void notifyChat({
        conversationId, messageId, userId: user.id, userName: user.name, text,
        conversationType: chat.type, userPhone: user.phone, userEmail: user.email,
        userCity: user.city, userCategory: user.category,
      });
    } catch (e) {
      crashError(e, "chat:send_message");
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
      const messageId = await sendMessage(conversationId, {
        senderId: user.id, senderName: user.name,
        senderRole: user.role,
        senderPhone: user.phone,
        text: "", mediaUrl: downloadURL, mediaPath: storagePath, mediaType: "image",
        fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
        fileSize: asset.fileSize ?? fileSize,
        width: asset.width,
        height: asset.height,
      });
      void notifyChat({
        conversationId, messageId, userId: user.id, userName: user.name, text: "",
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

  async function handlePickFile() {
    if (!conversationId || !user || uploadingFile) return;
    setUploadingFile(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: [
          "application/pdf",
          "text/*",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "application/zip",
        ],
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const asset = result.assets[0];
      const { downloadURL, storagePath, fileSize } = await uploadChatFile(
        conversationId,
        asset.uri,
        asset.name,
        asset.mimeType
      );
      const messageId = await sendMessage(conversationId, {
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        senderPhone: user.phone,
        text: "",
        mediaUrl: downloadURL,
        mediaPath: storagePath,
        mediaType: "document",
        fileName: asset.name ?? `file-${Date.now()}`,
        fileSize: asset.size ?? fileSize,
      });
      void notifyChat({
        conversationId,
        messageId,
        userId: user.id,
        userName: user.name,
        text: "",
        mediaUrl: downloadURL,
        mediaType: "document",
        fileName: asset.name ?? `file-${Date.now()}`,
        conversationType: chat.type,
        userPhone: user.phone,
        userEmail: user.email,
        userCity: user.city,
        userCategory: user.category,
      });
    } catch (err) {
      console.error("[Chat] file upload failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert("Помилка", `Не вдалося надіслати файл.\n${__DEV__ ? msg : "Перевір з'єднання і спробуй ще раз."}`);
    } finally {
      setUploadingFile(false);
    }
  }

  function handleAttach() {
    Alert.alert("Додати вкладення", "Що надіслати в чат?", [
      { text: "Фото", onPress: handlePickImage },
      { text: "Файл", onPress: handlePickFile },
      { text: "Скасувати", style: "cancel" },
    ]);
  }

  async function handleOpenFile(message: MessageDoc) {
    if (!message.mediaUrl || downloadingFileId) return;
    setDownloadingFileId(message.id);
    try {
      const dir = `${FileSystem.cacheDirectory ?? ""}chat-downloads/`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
      const fileUri = `${dir}${safeDownloadName(message.fileName)}`;
      const downloaded = await FileSystem.downloadAsync(message.mediaUrl, fileUri);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloaded.uri, {
          dialogTitle: message.fileName ?? "Файл з чату",
        });
      } else {
        await Linking.openURL(message.mediaUrl);
      }
    } catch (err) {
      console.warn("[Chat] file open failed:", err);
      Linking.openURL(message.mediaUrl).catch(() => {
        Alert.alert("Помилка", "Не вдалося відкрити файл. Спробуй ще раз або перевір з'єднання.");
      });
    } finally {
      setDownloadingFileId(null);
    }
  }

  async function handleReact(message: MessageDoc, emoji: string) {
    if (!conversationId || !user) return;
    const current = message.reactions?.[user.id];
    try {
      await setMessageReaction(conversationId, message.id, user.id, current === emoji ? null : emoji);
      setReactionPickerFor(null);
    } catch {
      Alert.alert("Не вдалося поставити реакцію", "Перевір інтернет і спробуй ще раз.");
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
        <View style={s.conversationHeader}>
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
            const receipt = messageReceipt(m, user?.id);
            const reactions = reactionSummary(m.reactions);
            const myReaction = user?.id ? m.reactions?.[user.id] : undefined;
            const showAsImage = Boolean(m.mediaUrl && (m.mediaType === "image" || (!m.mediaType && !m.fileName)));
            const showAsFile = Boolean(m.mediaUrl && !showAsImage);
            return (
              <View key={m.id} style={[s.bubbleWrap, mine ? s.bubbleWrapMine : s.bubbleWrapTheirs]}>
                <Pressable
                  style={[s.bubble, mine ? s.bubbleMine : s.bubbleTheirs]}
                  onLongPress={() => setReactionPickerFor(reactionPickerFor === m.id ? null : m.id)}
                  onPress={() => reactionPickerFor === m.id ? setReactionPickerFor(null) : undefined}
                >
                  {!mine ? <Text style={s.senderName}>{chat.title}</Text> : null}
                  {showAsImage ? (
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
                  {showAsFile ? (
                    <Pressable
                      onPress={() => handleOpenFile(m)}
                      disabled={downloadingFileId === m.id}
                      style={{
                        width: 230,
                        maxWidth: "100%",
                        borderRadius: radii.sm,
                        padding: 12,
                        marginBottom: m.text ? 6 : 0,
                        backgroundColor: mine ? "rgba(255,255,255,0.16)" : colors.bgElevated,
                        borderWidth: 1,
                        borderColor: mine ? "rgba(255,255,255,0.22)" : colors.border,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        opacity: downloadingFileId === m.id ? 0.72 : 1,
                      }}
                    >
                      {downloadingFileId === m.id ? (
                        <ActivityIndicator color={mine ? "#fff" : colors.red} size="small" />
                      ) : (
                        <Text style={{ fontSize: 24 }}>{attachmentIcon(m)}</Text>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={2} style={{ color: mine ? "#fff" : colors.textPrimary, fontSize: 13, fontWeight: "800" }}>
                          {attachmentTitle(m)}
                        </Text>
                        <Text style={{ color: mine ? "rgba(255,255,255,0.72)" : colors.textTertiary, fontSize: 11, marginTop: 2 }}>
                          {downloadingFileId === m.id ? "Завантаження..." : attachmentMeta(m)}
                        </Text>
                      </View>
                    </Pressable>
                  ) : null}
                  {m.text ? <Text style={[s.bubbleText, mine && s.bubbleTextMine]}>{m.text}</Text> : null}
                  <View style={s.metaRow}>
                    <Text style={[s.time, mine && s.timeMine]}>{formatTime(m.createdAt)}</Text>
                    {receipt ? (
                      <Text style={[s.receipt, receipt === "read" && s.receiptRead]}>
                        {receiptMarks(receipt)}
                      </Text>
                    ) : null}
                  </View>
                  {reactions.length ? (
                    <View style={s.reactionSummary}>
                      {reactions.map((reaction) => (
                        <Text key={reaction.emoji} style={[s.reactionPill, !mine && s.reactionPillTheirs]}>
                          {reaction.emoji} {reaction.count}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </Pressable>
                {reactionPickerFor === m.id ? (
                  <View style={[s.reactionPicker, mine ? s.reactionPickerMine : s.reactionPickerTheirs]}>
                    {QUICK_REACTIONS.map((emoji) => (
                      <Pressable
                        key={emoji}
                        onPress={() => handleReact(m, emoji)}
                        style={[s.reactionBtn, myReaction === emoji && s.reactionBtnActive]}
                      >
                        <Text style={{ fontSize: 18 }}>{emoji}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}

          {!loading && messages.length === 0 && !error ? (
            <View style={{ paddingTop: 30 }}>
              <EmptyState
                emoji={chat.emoji}
                title="Немає повідомлень"
                detail="Постав перше питання нижче. Відповідь прийде сюди та push-сповіщенням."
              />
            </View>
          ) : null}
        </ScrollView>

        <View style={s.inputRow}>
          <Pressable
            style={[s.attachBtn, (uploadingImage || uploadingFile) && { opacity: 0.4 }]}
            onPress={handleAttach}
            disabled={uploadingImage || uploadingFile || sending}
          >
            {uploadingImage || uploadingFile ? <ActivityIndicator color={colors.textTertiary} size="small" /> : <Text style={{ fontSize: 20 }}>📎</Text>}
          </Pressable>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Написати повідомлення..."
            placeholderTextColor={colors.textTertiary}
            multiline
            editable={!sending && !uploadingImage && !uploadingFile}
          />
          <Pressable
            style={[s.sendBtn, (!input.trim() || sending || uploadingImage || uploadingFile) && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!input.trim() || sending || uploadingImage || uploadingFile}
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
    return <Conversation chat={chatDef} conversationIdOverride={activeChatId} onBack={() => setActiveChatId(null)} />;
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.listHeader}>
        <Text style={s.headerTitle}>Чати з учнями</Text>
        <Text style={s.headerSub}>Відповідайте учням та менеджерам</Text>
      </View>
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.red} />
        </View>
      ) : convs.length === 0 ? (
        <View style={{ paddingTop: 60, paddingHorizontal: spacing.md }}>
          <EmptyState
            emoji="💬"
            title="Немає активних чатів"
            detail="Учні, які записалися до вас на практику, з'являться тут автоматично."
          />
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
        <View style={s.listHeader}>
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
    listHeader: {
      paddingHorizontal: spacing.md,
      paddingTop: 18,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bgCard,
      gap: 5,
    },
    conversationHeader: {
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bgCard,
      flexDirection: "row",
      alignItems: "center",
    },
    headerTitle: { color: colors.textPrimary, fontSize: 19, lineHeight: 25, fontWeight: "900", flexShrink: 1 },
    headerSub: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 1, flexShrink: 1 },

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
    metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 5, marginTop: 2 },
    time: { color: colors.textTertiary, fontSize: 10 },
    timeMine: { color: "rgba(255,255,255,0.7)" },
    receipt: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "900" },
    receiptRead: { color: "#9ee7ff" },
    reactionSummary: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", gap: 4, marginTop: 5 },
    reactionPill: {
      overflow: "hidden",
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.16)",
      color: "#fff",
      fontSize: 11,
      fontWeight: "900",
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    reactionPillTheirs: {
      backgroundColor: colors.bgElevated,
      color: colors.textPrimary,
    },
    reactionPicker: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
      padding: 6,
      borderRadius: 999,
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reactionPickerMine: { alignSelf: "flex-end" },
    reactionPickerTheirs: { alignSelf: "flex-start" },
    reactionBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reactionBtnActive: {
      backgroundColor: colors.redSoft,
      borderColor: colors.red + "77",
    },

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
