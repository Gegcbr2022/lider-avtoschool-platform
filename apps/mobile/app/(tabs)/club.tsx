import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Animated, Easing, FlatList, Image,
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import {
  Card, Label, MascotMessage, Pill, PrimaryButton, ProgressBar,
} from "../../components/mobile-ui";
import { askLidyk } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import {
  type ClubPostDoc, type ClubCommentDoc, type StoryDoc, type Award, type UserStats,
  createFirestoreId,
  subscribeToClubPosts, createClubPost, togglePostLike, deletePost,
  subscribeToComments, createComment, toggleCommentLike,
  subscribeToStories, createStory, viewStory, reactToStory, deleteStory,
  getUserStats, computeAwards, EMPTY_STATS,
} from "../../lib/firestore";
import { uploadClubImage, uploadStoryMedia } from "../../lib/storage";
import {
  getMascotState,
  mascotQuickPrompts, mascotStates,
  storyToneBg, todayChallenge,
} from "../../lib/mobile-data";
import { radii, shadows, spacing, useTheme } from "../../lib/theme";

const MASCOT = require("../../assets/mascot.png") as number;

type ClubView = "main" | "lidyk" | "feed" | "awards";

const AWARD_FILTER_LABELS: Record<string, string> = {
  all: "Всі", streak: "Серія", tests: "Тести", learning: "Навчання",
  practice: "Практика", community: "Спільнота", games: "Ігри", graduation: "Випуск",
};

// Story tone colors (fallback if not in storyToneBg)
const TONE_COLORS: Record<string, string> = {
  red: "#ff1e1e", green: "#22c55e", yellow: "#f59e0b", dark: "#374151",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date | null): string {
  if (!date) return "";
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "щойно";
  if (diff < 3600) return `${Math.floor(diff / 60)} хв тому`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} год тому`;
  return `${Math.floor(diff / 86400)} дн. тому`;
}

// ─── Story Viewer ─────────────────────────────────────────────────────────────

const STORY_DURATION_MS = 5000;

function StoryViewer({
  stories, startIndex, userId, onClose,
}: {
  stories: StoryDoc[]; startIndex: number; userId?: string; onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const [deleting, setDeleting] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const story = stories[idx];
  const bg = (storyToneBg as Record<string, string>)[story?.tone] ?? TONE_COLORS[story?.tone ?? "dark"] ?? "#374151";

  useEffect(() => {
    if (story && userId) {
      void viewStory(story.id, userId);
    }
  }, [story?.id]);

  // Auto-advance + animated progress bar
  useEffect(() => {
    progressAnim.setValue(0);
    progressAnimRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    progressAnimRef.current.start(({ finished }) => {
      if (finished) goNext();
    });
    return () => { progressAnimRef.current?.stop(); };
  }, [idx]);

  if (!story) { onClose(); return null; }
  const reacted = Boolean(userId && story.reactedBy?.includes(userId));

  function goNext() { idx < stories.length - 1 ? setIdx(i => i + 1) : onClose(); }
  function goPrev() {
    if (idx > 0) {
      progressAnimRef.current?.stop();
      progressAnim.setValue(0);
      setIdx(i => i - 1);
    }
  }

  async function handleDelete() {
    Alert.alert("Видалити історію?", "Ця дія незворотня.", [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити", style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try { await deleteStory(story.id); } catch { /* noop */ }
          onClose();
        }
      }
    ]);
  }

  const remaining = Math.max(0, story.expiresAt ? (story.expiresAt.getTime() - Date.now()) / 3600000 : 24);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: story.mediaUrl && story.mediaType === "image" ? "#000" : bg }}>
        {story.mediaUrl && story.mediaType === "image" ? (
          <Image
            source={{ uri: story.mediaUrl }}
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : null}
        {story.mediaUrl && story.mediaType === "image" ? (
          <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.22)" }} />
        ) : null}
        <SafeAreaView style={{ flex: 1 }}>
          {/* Progress bars */}
          <View style={{ flexDirection: "row", gap: 4, paddingHorizontal: 14, paddingTop: 8 }}>
            {stories.map((_, i) => (
              <View key={i} style={{ flex: 1, height: 3, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.3)" }}>
                {i < idx ? (
                  <View style={{ height: 3, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.9)", width: "100%" }} />
                ) : i === idx ? (
                  <Animated.View style={{ height: 3, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.9)", width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }} />
                ) : null}
              </View>
            ))}
          </View>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 18 }}>{story.authorEmoji ?? "🚗"}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: "900", color: "#fff" }}>{story.authorName}</Text>
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: "600" }}>
                  {Math.round(remaining)}г · {story.views} переглядів
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {story.authorId === userId && !deleting ? (
                <TouchableOpacity onPress={handleDelete} style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 18, color: "rgba(255,255,255,0.75)" }}>🗑</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 22, fontWeight: "900", color: "#fff" }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Tap zones */}
          <View style={{ flex: 1, flexDirection: "row" }}>
            <Pressable style={{ flex: 1 }} onPress={() => { progressAnimRef.current?.stop(); progressAnim.setValue(0); goPrev(); }} />
            <Pressable style={{ flex: 1 }} onPress={() => { progressAnimRef.current?.stop(); progressAnim.setValue(0); goNext(); }} />
          </View>
          {/* Content */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 36, paddingTop: 18, backgroundColor: story.mediaUrl ? "rgba(0,0,0,0.24)" : "transparent" }}>
            <Text style={{ fontSize: 24, fontWeight: "900", lineHeight: 34, letterSpacing: -0.5, color: "#fff" }}>
              {story.text}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <TouchableOpacity
                onPress={() => userId && reactToStory(story.id, userId, reacted)}
                disabled={!userId}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}
              >
                <Text style={{ fontSize: 18 }}>{reacted ? "♥" : "♡"}</Text>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>{story.reactions}</Text>
              </TouchableOpacity>
              {story.tags.map(tag => (
                <View key={tag} style={{ backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#fff" }}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ─── Create Story Sheet ───────────────────────────────────────────────────────

function CreateStorySheet({
  authorId, authorName, authorEmoji, onClose,
}: {
  authorId: string; authorName: string; authorEmoji?: string; onClose: () => void;
}) {
  const { colors } = useTheme();
  const [text, setText] = useState("");
  const [tone, setTone] = useState<"red" | "green" | "yellow" | "dark">("red");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [pickingImage, setPickingImage] = useState(false);

  const tones: { value: "red" | "green" | "yellow" | "dark"; label: string; color: string }[] = [
    { value: "red", label: "Новини", color: "#ff1e1e" },
    { value: "green", label: "Поради", color: "#22c55e" },
    { value: "yellow", label: "Успіхи", color: "#f59e0b" },
    { value: "dark", label: "Цікаве", color: "#374151" },
  ];

  async function handlePickImage() {
    if (pickingImage || loading) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Доступ потрібен", "Дозвольте доступ до фото в налаштуваннях.");
      return;
    }
    setPickingImage(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.82,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets?.[0]) setSelectedImage(result.assets[0]);
    } finally {
      setPickingImage(false);
    }
  }

  async function handlePublish() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const storyId = createFirestoreId("stories");
      let uploaded: Awaited<ReturnType<typeof uploadStoryMedia>> | null = null;
      if (selectedImage) {
        uploaded = await uploadStoryMedia(storyId, selectedImage.uri);
      }
      await createStory({
        id: storyId,
        authorId, authorName, authorEmoji,
        text: text.trim(), tone,
        tags: [tones.find(t => t.value === tone)?.label ?? ""],
        mediaUrl: uploaded?.downloadURL,
        mediaPath: uploaded?.storagePath,
        mediaType: uploaded ? "image" : undefined,
        fileName: selectedImage?.fileName ?? (uploaded ? `story-${Date.now()}.jpg` : undefined),
        fileSize: selectedImage?.fileSize ?? uploaded?.fileSize,
        width: selectedImage?.width,
        height: selectedImage?.height,
        status: "published",
        visibility: "school",
      });
      onClose();
    } catch (err) {
      console.error("[CreateStory] failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert("Помилка", `Не вдалось опублікувати сторі.\n${__DEV__ ? msg : "Перевір з'єднання і спробуй ще раз."}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} onPress={onClose} />
        <View style={{ backgroundColor: colors.bgSheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 20 }} />
          <Text style={{ fontSize: 20, fontWeight: "900", color: colors.textPrimary, marginBottom: 16 }}>Нова Історія</Text>

          {/* Tone selector */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {tones.map(t => (
              <TouchableOpacity
                key={t.value} onPress={() => setTone(t.value)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: radii.sm, alignItems: "center", backgroundColor: tone === t.value ? t.color : colors.bgElevated, borderWidth: 1.5, borderColor: tone === t.value ? t.color : colors.border }}
              >
                <Text style={{ fontSize: 11, fontWeight: "800", color: tone === t.value ? "#fff" : colors.textSecondary }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Text input */}
          <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.sm, borderWidth: 1.5, borderColor: colors.border, padding: 14, marginBottom: 16 }}>
            <TextInput
              style={{ color: colors.textPrimary, fontSize: 16, minHeight: 80, textAlignVertical: "top" }}
              value={text} onChangeText={setText}
              placeholder="Розкажи про своє навчання або поділись порадою..."
              placeholderTextColor={colors.textTertiary}
              multiline maxLength={300} autoFocus
            />
            <Text style={{ fontSize: 11, color: colors.textTertiary, textAlign: "right", marginTop: 4 }}>{text.length}/300</Text>
          </View>

          {selectedImage ? (
            <View style={{ marginBottom: 14, borderRadius: radii.sm, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
              <Image source={{ uri: selectedImage.uri }} style={{ width: "100%", height: 150 }} resizeMode="cover" />
              <TouchableOpacity
                onPress={() => setSelectedImage(null)}
                style={{ position: "absolute", top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={pickingImage || loading}
              style={{ marginBottom: 14, borderRadius: radii.sm, borderWidth: 1.5, borderColor: colors.border, paddingVertical: 12, alignItems: "center", backgroundColor: colors.bgCard }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "800" }}>
                {pickingImage ? "Відкриваємо галерею..." : "📷 Додати фото"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handlePublish} disabled={!text.trim() || loading}
            style={{ backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 16, alignItems: "center", opacity: !text.trim() || loading ? 0.5 : 1 }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Опублікувати Історію</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Subview back-header ──────────────────────────────────────────────────────

function SubHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 4 }}>
      <TouchableOpacity
        onPress={onBack}
        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }}
      >
        <Text style={{ fontSize: 20, color: colors.textPrimary, fontWeight: "900" }}>‹</Text>
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 22, fontWeight: "900", color: colors.textPrimary, letterSpacing: -0.4 }}>{title}</Text>
        {subtitle ? <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

// ─── LIDYK VIEW ───────────────────────────────────────────────────────────────

function LidykView({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [customQ, setCustomQ] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [responseModel, setResponseModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorType, setErrorType] = useState<string | null>(null);

  async function handleAsk(q: string) {
    if (!q.trim() || loading) return;
    setLoading(true);
    setResponse(null);
    setErrorType(null);
    setCustomQ("");
    const result = await askLidyk(q, user);
    setResponse(result.answer);
    setResponseModel(result.model ?? null);
    setErrorType(result.errorType ?? null);
    setLoading(false);
  }

  return (
    <View style={{ flex: 1 }}>
      <SubHeader title="Лідик AI" subtitle="Помічник з ПДР і підготовки" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 100, gap: spacing.md }}>
        {!response && !loading ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 16, ...shadows.card }}>
            <Image source={MASCOT} style={{ width: 64, height: 64 }} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: "900", color: colors.textPrimary }}>Привіт! Я Лідик 👋</Text>
              <Text style={{ marginTop: 4, fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>
                Запитай про ПДР, знаки, правила руху чи підготовку до іспиту
              </Text>
            </View>
          </View>
        ) : null}

        <View>
          <Text style={{ fontSize: 11, fontWeight: "800", color: colors.textTertiary, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>
            Швидкі запитання
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {mascotQuickPrompts.map(p => (
              <TouchableOpacity
                key={p} onPress={() => handleAsk(p)} disabled={loading}
                style={{ borderRadius: 999, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.bgCard, opacity: loading ? 0.45 : 1 }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
          <TextInput
            style={{ flex: 1, borderRadius: radii.sm, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, fontWeight: "600", color: colors.textPrimary, backgroundColor: colors.bgCard, minHeight: 48 }}
            value={customQ} onChangeText={setCustomQ}
            placeholder="Запитай про ПДР..." placeholderTextColor={colors.textTertiary}
            multiline returnKeyType="send" onSubmitEditing={() => handleAsk(customQ)} editable={!loading}
          />
          <TouchableOpacity
            onPress={() => handleAsk(customQ)} disabled={loading || !customQ.trim()}
            style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.red, alignItems: "center", justifyContent: "center", opacity: loading || !customQ.trim() ? 0.35 : 1, ...shadows.red }}
          >
            <Text style={{ fontSize: 22, color: "#fff" }}>↑</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border }}>
            <Image source={MASCOT} style={{ width: 44, height: 44 }} resizeMode="contain" />
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "800", color: colors.textPrimary }}>Лідик думає...</Text>
              <ActivityIndicator color={colors.red} size="small" style={{ alignSelf: "flex-start" }} />
            </View>
          </View>
        ) : null}

        {response && !loading ? (
          <View style={{ backgroundColor: errorType ? colors.warningSoft : colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: errorType ? colors.warning + "55" : colors.border, gap: 12, ...shadows.card }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
              <Image source={MASCOT} style={{ width: 42, height: 42, marginTop: 2 }} resizeMode="contain" />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.textPrimary, lineHeight: 22 }}>{response}</Text>
            </View>
            {errorType ? (
              <TouchableOpacity
                onPress={() => { setResponse(null); setErrorType(null); }}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: colors.warning + "22", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.warning }}>🔄 Спробувати знову</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textTertiary }}>
                  {responseModel ? `${responseModel}` : "Лідик AI"}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textTertiary, fontWeight: "600" }}>Не замінює інструктора</Text>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

// ─── Comments Section ─────────────────────────────────────────────────────────

function CommentsSection({ postId, authorId, authorName, authorEmoji, onClose }: {
  postId: string; authorId: string; authorName: string; authorEmoji?: string; onClose: () => void;
}) {
  const { colors } = useTheme();
  const [comments, setComments] = useState<ClubCommentDoc[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  // Maps commentId → optimistic override (true = liked, false = unliked).
  // Base truth is c.likedBy?.includes(authorId) from Firestore.
  const [optimistic, setOptimistic] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    const unsub = subscribeToComments(postId, setComments);
    return unsub;
  }, [postId]);

  function isLiked(c: ClubCommentDoc): boolean {
    const override = optimistic.get(c.id);
    return override !== undefined ? override : (c.likedBy?.includes(authorId) ?? false);
  }

  // Display count uses Firestore's count as source of truth; the icon reflects optimistic state.
  function likeDisplay(c: ClubCommentDoc): number {
    return c.likesCount;
  }

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await createComment({ postId, authorId, authorName, authorEmoji, text: text.trim() });
      setText("");
    } catch {
      Alert.alert("Помилка", "Не вдалось відправити коментар.");
    } finally {
      setSending(false);
    }
  }

  async function handleLikeComment(c: ClubCommentDoc) {
    const currentlyLiked = isLiked(c);
    setOptimistic(prev => new Map(prev).set(c.id, !currentlyLiked));
    try {
      await toggleCommentLike(c.id, authorId, currentlyLiked);
    } catch {
      setOptimistic(prev => new Map(prev).set(c.id, currentlyLiked));
    }
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: colors.textPrimary }}>Коментарі</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 22, color: colors.textTertiary }}>✕</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={comments}
          keyExtractor={c => c.id}
          contentContainerStyle={{ padding: spacing.md, gap: 12, paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <Text style={{ fontSize: 24, marginBottom: 8 }}>💬</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Коментарів ще немає. Будь першим!</Text>
            </View>
          }
          renderItem={({ item: c }) => {
            const liked = isLiked(c);
            return (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 18 }}>{c.authorEmoji ?? "🚗"}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.sm, padding: 12, borderWidth: 1, borderColor: colors.border }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: colors.textPrimary }}>{c.authorName}</Text>
                    <Text style={{ fontSize: 11, color: colors.textTertiary }}>{formatRelativeTime(c.createdAt)}</Text>
                  </View>
                  <Text style={{ fontSize: 14, color: colors.textPrimary, lineHeight: 20 }}>{c.text}</Text>
                  <TouchableOpacity
                    onPress={() => handleLikeComment(c)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, alignSelf: "flex-start" }}
                  >
                    <Text style={{ fontSize: 14, color: liked ? colors.red : colors.textTertiary }}>♥</Text>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: liked ? colors.red : colors.textTertiary }}>{likeDisplay(c)}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={{ flexDirection: "row", gap: 10, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg }}>
            <TextInput
              style={{ flex: 1, borderRadius: radii.sm, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.textPrimary, backgroundColor: colors.bgCard, maxHeight: 100 }}
              value={text} onChangeText={setText}
              placeholder="Написати коментар..." placeholderTextColor={colors.textTertiary}
              multiline editable={!sending}
            />
            <TouchableOpacity
              onPress={handleSend} disabled={!text.trim() || sending}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: text.trim() ? colors.red : colors.bgElevated, alignItems: "center", justifyContent: "center" }}
            >
              {sending ? <ActivityIndicator color="#fff" size="small" /> : (
                <Text style={{ fontSize: 20, color: text.trim() ? "#fff" : colors.textTertiary }}>↑</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── FEED VIEW ────────────────────────────────────────────────────────────────

function FeedView({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const { user, mode } = useAuth();
  const [posts, setPosts] = useState<ClubPostDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [selectedPostImage, setSelectedPostImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [pickingPostImage, setPickingPostImage] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const likedRef = useRef<Set<string>>(new Set());
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const unsub = subscribeToClubPosts((p) => { setPosts(p); setLoading(false); }, () => setLoading(false));
    return unsub;
  }, []);

  // Only fully authenticated (non-anonymous) users can post/like
  const isAuth = mode === "authenticated";
  const authorEmoji = user?.avatarEmoji ?? "🚗";
  const authorName = user?.name ?? "Учень";
  const authorId = user?.id ?? "guest";

  async function handlePickPostImage() {
    if (pickingPostImage || publishing) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Доступ потрібен", "Дозвольте доступ до фото в налаштуваннях.");
      return;
    }
    setPickingPostImage(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.82,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets?.[0]) setSelectedPostImage(result.assets[0]);
    } finally {
      setPickingPostImage(false);
    }
  }

  async function handlePublish() {
    if (!newPostText.trim() || publishing || !isAuth) return;
    setPublishing(true);
    try {
      const postId = createFirestoreId("clubPosts");
      let uploaded: Awaited<ReturnType<typeof uploadClubImage>> | null = null;
      if (selectedPostImage) {
        uploaded = await uploadClubImage(postId, selectedPostImage.uri);
      }
      await createClubPost({
        id: postId,
        authorId, authorName, authorEmoji: user?.avatarEmoji,
        authorRole: user?.role ?? "student",
        text: newPostText.trim(),
        mediaUrl: uploaded?.downloadURL,
        mediaPath: uploaded?.storagePath,
        mediaType: uploaded ? "image" : undefined,
        fileName: selectedPostImage?.fileName ?? (uploaded ? `club-${Date.now()}.jpg` : undefined),
        fileSize: selectedPostImage?.fileSize ?? uploaded?.fileSize,
        width: selectedPostImage?.width,
        height: selectedPostImage?.height,
        status: "published",
        visibility: "school",
      });
      setNewPostText("");
      setSelectedPostImage(null);
      setShowCompose(false);
    } catch (err) {
      console.error("[ClubPost] publish failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert("Помилка", `Не вдалось опублікувати пост.\n${__DEV__ ? msg : "Перевір з'єднання і спробуй ще раз."}`);
    } finally {
      setPublishing(false);
    }
  }

  async function handleLike(postId: string) {
    if (!isAuth) return;
    const liked = likedRef.current.has(postId);
    liked ? likedRef.current.delete(postId) : likedRef.current.add(postId);
    forceUpdate(n => n + 1);
    try {
      await togglePostLike(postId, authorId, liked);
    } catch {
      liked ? likedRef.current.add(postId) : likedRef.current.delete(postId);
      forceUpdate(n => n + 1);
    }
  }

  function handleDeletePost(postId: string) {
    Alert.alert("Видалити пост?", "Ця дія незворотня.", [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити", style: "destructive",
        onPress: () => deletePost(postId).catch(() => Alert.alert("Помилка", "Не вдалось видалити пост.")),
      }
    ]);
  }

  const commentsPost = commentsPostId ? posts.find(p => p.id === commentsPostId) : null;

  return (
    <View style={{ flex: 1 }}>
      {commentsPost ? (
        <CommentsSection
          postId={commentsPost.id} authorId={authorId}
          authorName={authorName} authorEmoji={authorEmoji}
          onClose={() => setCommentsPostId(null)}
        />
      ) : null}

      <SubHeader title="Клубна стрічка" subtitle="Поради, успіхи та спілкування" onBack={onBack} />

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 110, gap: 12 }}>
        {/* Compose */}
        {isAuth ? (
          <Pressable
            onPress={() => setShowCompose(!showCompose)}
            style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 14, borderWidth: 1, borderColor: showCompose ? colors.red : colors.border, flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 18 }}>{authorEmoji}</Text>
            </View>
            <Text style={{ color: colors.textTertiary, fontSize: 14, fontWeight: "600", flex: 1 }}>
              Поділитися думкою або порадою...
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push("/auth?mode=register" as import("expo-router").Href)}
            style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 14, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 18 }}>🔐</Text>
            </View>
            <Text style={{ color: colors.textTertiary, fontSize: 14, fontWeight: "600", flex: 1 }}>
              Зареєструйся, щоб писати у стрічку
            </Text>
            <Text style={{ color: colors.red, fontSize: 13, fontWeight: "800" }}>Увійти →</Text>
          </Pressable>
        )}

        {showCompose ? (
          <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 14, borderWidth: 1, borderColor: colors.red + "55", gap: 10 }}>
            <TextInput
              autoFocus multiline maxLength={500}
              style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "600", minHeight: 80, textAlignVertical: "top" }}
              value={newPostText} onChangeText={setNewPostText}
              placeholder="Поділись досвідом або порадою..." placeholderTextColor={colors.textTertiary}
            />
            {selectedPostImage ? (
              <View style={{ borderRadius: radii.sm, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
                <Image source={{ uri: selectedPostImage.uri }} style={{ width: "100%", height: 150 }} resizeMode="cover" />
                <TouchableOpacity
                  onPress={() => setSelectedPostImage(null)}
                  style={{ position: "absolute", top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 11, color: colors.textTertiary }}>{newPostText.length}/500</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={handlePickPostImage}
                  disabled={pickingPostImage || publishing}
                  style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: radii.sm, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border }}
                >
                  <Text style={{ color: colors.textSecondary, fontWeight: "800" }}>
                    {pickingPostImage ? "..." : "📷"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setShowCompose(false); setNewPostText(""); setSelectedPostImage(null); }} style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                  <Text style={{ color: colors.textTertiary, fontWeight: "700" }}>Скасувати</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePublish} disabled={!newPostText.trim() || publishing}
                  style={{ backgroundColor: newPostText.trim() ? colors.red : colors.bgElevated, borderRadius: radii.sm, paddingHorizontal: 16, paddingVertical: 10 }}
                >
                  {publishing ? <ActivityIndicator color="#fff" size="small" /> : (
                    <Text style={{ color: newPostText.trim() ? "#fff" : colors.textTertiary, fontWeight: "800" }}>
                      Опублікувати
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* Loading */}
        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator color={colors.red} />
            <Text style={{ color: colors.textTertiary, marginTop: 12, fontSize: 14 }}>Завантаження стрічки...</Text>
          </View>
        ) : null}

        {/* Posts */}
        {!loading && posts.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 12 }}>
            <Text style={{ fontSize: 48 }}>📝</Text>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textSecondary }}>Стрічка поки порожня</Text>
            <Text style={{ fontSize: 13, color: colors.textTertiary, textAlign: "center" }}>
              Будь першим, хто поділиться досвідом з іншими учнями!
            </Text>
          </View>
        ) : null}

        {posts.map(post => {
          const liked = likedRef.current.has(post.id);
          const likeCount = post.likesCount + (liked ? 1 : 0);
          return (
            <View key={post.id} style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 20 }}>{post.authorEmoji ?? "🚗"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "900", color: colors.textPrimary }}>{post.authorName}</Text>
                  <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 1 }}>{formatRelativeTime(post.createdAt)}</Text>
                </View>
                {post.tag ? (
                  <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: (post.tagColor ?? colors.red) + "22" }}>
                    <Text style={{ fontSize: 11, fontWeight: "800", color: post.tagColor ?? colors.red }}>{post.tag}</Text>
                  </View>
                ) : null}
                {post.authorId === authorId ? (
                  <TouchableOpacity onPress={() => handleDeletePost(post.id)} hitSlop={8}>
                    <Text style={{ fontSize: 16, color: colors.textTertiary }}>⋯</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textPrimary, lineHeight: 22 }}>{post.text}</Text>

              {post.mediaUrl && post.mediaType === "image" ? (
                <Image
                  source={{ uri: post.mediaUrl }}
                  style={{ width: "100%", height: 190, borderRadius: radii.sm, marginTop: 12, backgroundColor: colors.bgElevated }}
                  resizeMode="cover"
                />
              ) : null}

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: liked ? colors.redSoft : colors.bgElevated }}
                  onPress={() => handleLike(post.id)}
                >
                  <Text style={{ fontSize: 16, color: liked ? colors.red : colors.textTertiary }}>♥</Text>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: liked ? colors.red : colors.textSecondary }}>{likeCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7 }}
                  onPress={() => setCommentsPostId(post.id)}
                >
                  <Text style={{ fontSize: 15, color: colors.textTertiary }}>💬</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textTertiary }}>{post.commentsCount}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── AWARDS VIEW ──────────────────────────────────────────────────────────────

function AwardsView({ awards, onBack }: { awards: Award[]; onBack: () => void }) {
  const { colors } = useTheme();
  const [awardFilter, setAwardFilter] = useState("all");

  const filtered = awardFilter === "all" ? awards : awards.filter(a => a.group === awardFilter);
  const earned = filtered.filter(a => a.earned);
  const locked = filtered.filter(a => !a.earned);
  const earnedAll = awards.filter(a => a.earned).length;

  return (
    <View style={{ flex: 1 }}>
      <SubHeader title="Нагороди" subtitle={`${earnedAll} з ${awards.length} отримано`} onBack={onBack} />

      {/* Filter chips — outside ScrollView to avoid nested scroll issues */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgCard }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexDirection: "row", gap: 8, paddingHorizontal: spacing.md, paddingVertical: 10 }}
        >
          {Object.keys(AWARD_FILTER_LABELS).map(key => (
            <TouchableOpacity
              key={key}
              onPress={() => setAwardFilter(key)}
              style={{
                borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 8,
                borderColor: awardFilter === key ? colors.red : colors.border,
                backgroundColor: awardFilter === key ? colors.redSoft : colors.bg,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: awardFilter === key ? colors.red : colors.textSecondary }}>
                {AWARD_FILTER_LABELS[key]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Scrollable awards list with proper bottom padding for tab bar */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 120, gap: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        {earned.length > 0 ? (
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: colors.success, letterSpacing: 0.8, textTransform: "uppercase" }}>
              ✓ Отримано ({earned.length})
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {earned.map(award => (
                <View key={award.id} style={{ width: "47%", borderRadius: radii.md, padding: 14, backgroundColor: colors.bgCard, borderWidth: 1.5, borderColor: colors.success + "55" }}>
                  <Text style={{ fontSize: 28 }}>{award.icon}</Text>
                  <Text style={{ marginTop: 8, fontSize: 13, fontWeight: "900", color: colors.textPrimary }}>{award.title}</Text>
                  <Text style={{ marginTop: 4, fontSize: 11, fontWeight: "600", color: colors.textSecondary, lineHeight: 16 }}>{award.description}</Text>
                  {award.earnedAt ? (
                    <Text style={{ marginTop: 6, fontSize: 10, fontWeight: "700", color: colors.success }}>✓ {award.earnedAt}</Text>
                  ) : (
                    <View style={{ marginTop: 8, borderRadius: 6, backgroundColor: colors.success + "18", paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" }}>
                      <Text style={{ fontSize: 10, fontWeight: "800", color: colors.success }}>Отримано</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {locked.length > 0 ? (
          <View style={{ gap: 10, marginTop: earned.length > 0 ? 6 : 0 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: colors.textTertiary, letterSpacing: 0.8, textTransform: "uppercase" }}>
              В процесі ({locked.length})
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {locked.map(award => (
                <View key={award.id} style={{ width: "47%", borderRadius: radii.md, padding: 14, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontSize: 28, opacity: 0.3 }}>{award.icon}</Text>
                  <Text style={{ marginTop: 8, fontSize: 13, fontWeight: "900", color: colors.textSecondary }}>{award.title}</Text>
                  <Text style={{ marginTop: 4, fontSize: 11, fontWeight: "600", color: colors.textTertiary, lineHeight: 16 }}>{award.description}</Text>
                  {award.progress !== undefined && award.maxProgress !== undefined ? (
                    <View style={{ marginTop: 10, gap: 4 }}>
                      <ProgressBar value={(award.progress / award.maxProgress) * 100} color={colors.red} />
                      <Text style={{ fontSize: 10, fontWeight: "700", color: colors.textTertiary }}>{award.progress} / {award.maxProgress}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 12 }}>
            <Image source={MASCOT} style={{ width: 80, height: 80, opacity: 0.4 }} resizeMode="contain" />
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textSecondary }}>Нічого в цій категорії</Text>
            <Text style={{ fontSize: 13, color: colors.textTertiary, textAlign: "center", lineHeight: 20 }}>
              Продовжуй навчання — нагороди з'являться
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

// ─── MAIN CLUB TAB ────────────────────────────────────────────────────────────

export default function ClubTab() {
  const { colors } = useTheme();
  const { user, mode } = useAuth();
  const [view, setView] = useState<ClubView>("main");
  const [stories, setStories] = useState<StoryDoc[]>([]);
  const [activeStoryGroupIdx, setActiveStoryGroupIdx] = useState<number | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);

  // Only fully authenticated (non-anonymous) users can post stories / see awards
  const isAuth = mode === "authenticated";
  const streak = { current: stats.streakDays, best: stats.bestStreak, lastActiveDate: stats.lastActiveDate ?? "" };
  const awards = computeAwards(stats);
  const mascot = getMascotState(isAuth ? streak : { current: 0, best: 0, lastActiveDate: "" });
  const isAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === todayChallenge.correctIndex;
  const earnedCount = awards.filter(a => a.earned).length;
  const storyGroups = useMemo(() => {
    const groups = new Map<string, StoryDoc[]>();
    for (const story of stories) {
      const key = story.authorId || story.id;
      groups.set(key, [...(groups.get(key) ?? []), story]);
    }
    return Array.from(groups.entries())
      .map(([authorId, groupStories]) => ({
        authorId,
        stories: groupStories.sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0)),
        latestAt: Math.max(...groupStories.map((s) => s.createdAt?.getTime() ?? 0)),
      }))
      .sort((a, b) => b.latestAt - a.latestAt);
  }, [stories]);

  // Subscribe to live stories
  useEffect(() => {
    const unsub = subscribeToStories(setStories, () => {});
    return unsub;
  }, []);

  // Load real gamification stats when the Club tab gains focus (reflects tests
  // just completed). Guests have no stats.
  useFocusEffect(
    useCallback(() => {
      if (!user?.id || !isAuth) { setStats(EMPTY_STATS); return; }
      getUserStats(user.id).then(setStats).catch(() => {});
    }, [user?.id, isAuth])
  );

  async function handleReferral() {
    const baseUrl = "https://lider-avtoschool.ua";
    const refSuffix = user?.id ? `?ref=${user.id.slice(0, 8)}` : "";
    try {
      await Share.share({
        message: `Я навчаюсь в автошколі Лідер 🚗 Приєднуйся: ${baseUrl}${refSuffix}`,
        title: "Автошкола Лідер",
      });
    } catch { /* share cancelled */ }
  }

  // Sub-screen renders
  if (view === "lidyk") return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <LidykView onBack={() => setView("main")} />
    </SafeAreaView>
  );
  if (view === "feed") return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <FeedView onBack={() => setView("main")} />
    </SafeAreaView>
  );
  if (view === "awards") return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <AwardsView awards={awards} onBack={() => setView("main")} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {activeStoryGroupIdx !== null && storyGroups[activeStoryGroupIdx]?.stories.length ? (
        <StoryViewer
          stories={storyGroups[activeStoryGroupIdx].stories} startIndex={0}
          userId={user?.id} onClose={() => setActiveStoryGroupIdx(null)}
        />
      ) : null}
      {showCreateStory && isAuth ? (
        <CreateStorySheet
          authorId={user!.id} authorName={user?.name ?? "Учень"}
          authorEmoji={user?.avatarEmoji} onClose={() => setShowCreateStory(false)}
        />
      ) : null}

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: colors.textPrimary, fontSize: 30, fontWeight: "900", letterSpacing: -0.5 }}>Лідер Клуб</Text>
            <Text style={{ marginTop: 4, color: colors.textSecondary, fontSize: 14 }}>Навчайся, спілкуйся, зростай</Text>
          </View>
          {isAuth ? (
            <TouchableOpacity
              hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
              onPress={() => setShowCreateStory(true)}
              style={{ backgroundColor: colors.redSoft, borderRadius: radii.sm, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.red + "44" }}
            >
              <Text style={{ fontSize: 13, fontWeight: "800", color: colors.red }}>+ Історія</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
              onPress={() => router.push("/auth?mode=register" as import("expo-router").Href)}
              style={{ backgroundColor: colors.redSoft, borderRadius: radii.sm, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.red + "44" }}
            >
              <Text style={{ fontSize: 13, fontWeight: "800", color: colors.red }}>Увійти</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stories */}
        {storyGroups.length > 0 ? (
          <View style={{ paddingTop: 4, paddingBottom: 18 }}>
            <FlatList
              data={storyGroups} horizontal showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.authorId}
              renderItem={({ item, index }) => {
                const first = item.stories[0];
                const latest = item.stories[item.stories.length - 1] ?? first;
                const bg = (storyToneBg as Record<string, string>)[latest.tone] ?? TONE_COLORS[latest.tone] ?? "#374151";
                const viewed = item.stories.every((story) => story.viewedBy?.includes(user?.id ?? ""));
                return (
                  <TouchableOpacity onPress={() => setActiveStoryGroupIdx(index)} style={{ alignItems: "center", width: 72 }}>
                    <View style={{ width: 58, height: 58, borderRadius: 29, borderWidth: 2.5, borderColor: viewed ? colors.border : bg, alignItems: "center", justifyContent: "center", opacity: viewed ? 0.6 : 1 }}>
                      <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 20 }}>{latest.authorEmoji ?? "🚗"}</Text>
                      </View>
                      {item.stories.length > 1 ? (
                        <View style={{ position: "absolute", right: -4, bottom: -3, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.red, borderWidth: 2, borderColor: colors.bg, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}>
                          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "900" }}>{item.stories.length}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={{ marginTop: 5, fontSize: 10, fontWeight: "700", color: colors.textSecondary, textAlign: "center" }} numberOfLines={2}>{latest.authorName}</Text>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 14 }}
            />
          </View>
        ) : null}

        <View style={{ paddingHorizontal: spacing.md, gap: spacing.md }}>
          {/* Streak — only for registered users */}
          {isAuth ? (
            <View style={{ borderRadius: radii.md, backgroundColor: colors.red, padding: 16, flexDirection: "row", alignItems: "center", gap: 16, ...shadows.red }}>
              <Text style={{ fontSize: 32 }}>🔥</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: "900", color: "rgba(255,255,255,0.6)", letterSpacing: 0.8, textTransform: "uppercase" }}>Ваша серія</Text>
                <Text style={{ fontSize: 22, fontWeight: "900", color: "#fff", marginTop: 2 }}>
                  {streak.current} {streak.current === 1 ? "день" : streak.current < 5 ? "дні" : "днів"} поспіль
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: "700" }}>Рекорд</Text>
                <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff" }}>{streak.best} д.</Text>
              </View>
            </View>
          ) : (
            <Pressable onPress={() => router.push("/auth?mode=register")} style={{ borderRadius: radii.md, backgroundColor: colors.red, padding: 16, flexDirection: "row", alignItems: "center", gap: 16, ...shadows.red }}>
              <Text style={{ fontSize: 32 }}>🏆</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: "900", color: "rgba(255,255,255,0.6)", letterSpacing: 0.8, textTransform: "uppercase" }}>Лідер Клуб</Text>
                <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff", marginTop: 2 }}>Зареєструйся, щоб зберегти серію</Text>
              </View>
              <Text style={{ fontSize: 22, color: "rgba(255,255,255,0.75)" }}>→</Text>
            </Pressable>
          )}

          {/* Daily quiz */}
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <Label>Тест дня</Label>
              <Pill tone={isAnswered ? (isCorrect ? "success" : "warning") : "default"}>
                {isAnswered ? (isCorrect ? "✓ Вірно" : "✗ Ні") : todayChallenge.category}
              </Pill>
            </View>
            <Text style={{ fontSize: 15, fontWeight: "800", color: colors.textPrimary, lineHeight: 22 }}>{todayChallenge.question}</Text>
            <View style={{ marginTop: 14, gap: 8 }}>
              {todayChallenge.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isRight = index === todayChallenge.correctIndex;
                let bg: string = colors.bgElevated, border: string = colors.border;
                if (isAnswered && isRight) { bg = colors.successSoft; border = colors.success + "55"; }
                else if (isAnswered && isSelected && !isRight) { bg = colors.redSoft; border = colors.red + "55"; }
                return (
                  <TouchableOpacity
                    key={option} disabled={isAnswered}
                    onPress={() => !isAnswered && setSelectedAnswer(index)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 12, borderRadius: radii.sm, padding: 12, borderWidth: 1, borderColor: border, backgroundColor: bg }}
                  >
                    <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: isAnswered && isRight ? colors.success : isAnswered && isSelected ? colors.red : colors.border, backgroundColor: isAnswered && isRight ? colors.success : isAnswered && isSelected && !isRight ? colors.red : colors.bgCard }}>
                      <Text style={{ color: isAnswered && (isRight || isSelected) ? "#fff" : colors.textPrimary, fontWeight: "900", fontSize: 13 }}>
                        {isAnswered && isRight ? "✓" : isAnswered && isSelected && !isRight ? "✕" : String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: "700", color: colors.textPrimary, lineHeight: 20 }}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {isAnswered ? (
              <View style={{ marginTop: 12, backgroundColor: isCorrect ? colors.successSoft : colors.warningSoft, borderRadius: radii.sm, padding: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: isCorrect ? colors.success : colors.warning, lineHeight: 20 }}>
                  {isCorrect ? "✓ " : "✗ "}{mascotStates[isCorrect ? "test-passed" : "test-failed"].message}
                </Text>
              </View>
            ) : null}
          </Card>

          {/* Lidyk card */}
          <Pressable onPress={() => setView("lidyk")}>
            <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, ...shadows.card }}>
              <Image source={MASCOT} style={{ width: 52, height: 52 }} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "900", color: colors.textPrimary }}>Запитай Лідика</Text>
                <Text style={{ marginTop: 3, fontSize: 12, color: colors.textSecondary, fontWeight: "600", lineHeight: 18 }}>{mascot.message}</Text>
              </View>
              <Text style={{ fontSize: 22, color: colors.textTertiary, fontWeight: "300" }}>›</Text>
            </View>
          </Pressable>

          {/* Feed card */}
          <Pressable onPress={() => setView("feed")}>
            <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 16, ...shadows.card }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: "900", color: colors.textPrimary }}>Клубна стрічка</Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.red }}>Відкрити →</Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>Спілкування, поради та успіхи учнів школи</Text>
            </View>
          </Pressable>

          {/* Awards card — registered users only */}
          {isAuth ? (
            <Pressable onPress={() => setView("awards")}>
              <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 16, ...shadows.card }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: colors.textPrimary }}>Нагороди</Text>
                    <Text style={{ marginTop: 3, fontSize: 13, color: colors.textSecondary }}>{earnedCount} з {awards.length} отримано</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 2 }}>
                    {awards.filter(a => a.earned).slice(0, 3).map(a => (
                      <Text key={a.id} style={{ fontSize: 22 }}>{a.icon}</Text>
                    ))}
                  </View>
                </View>
                <ProgressBar value={awards.length ? (earnedCount / awards.length) * 100 : 0} color={colors.red} height={6} />
                <Text style={{ marginTop: 8, fontSize: 12, fontWeight: "700", color: colors.red, textAlign: "right" }}>Переглянути всі →</Text>
              </View>
            </Pressable>
          ) : null}

          {/* Referral */}
          <Pressable onPress={handleReferral}>
            <View style={{ backgroundColor: colors.red, borderRadius: radii.md, padding: 18, flexDirection: "row", alignItems: "center", gap: 14, ...shadows.red }}>
              <Text style={{ fontSize: 30 }}>🤝</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: "900", color: "#fff" }}>Запросити друга</Text>
                <Text style={{ marginTop: 4, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 18 }}>Поділись посиланням — друг отримає знижку 🎁</Text>
              </View>
              <Text style={{ fontSize: 22, color: "rgba(255,255,255,0.75)" }}>↗</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
