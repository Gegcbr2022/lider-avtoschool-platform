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
  Card, Label, MascotMessage, Pill, PrimaryButton, ProgressBar, EmptyState,
} from "../../components/mobile-ui";
import { askLidyk } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import {
  type ClubPostDoc, type ClubCommentDoc, type StoryDoc, type Award, type UserStats,
  type LeaderboardEntry,
  createFirestoreId,
  subscribeToClubPosts, createClubPost, togglePostLike, deletePost,
  subscribeToComments, createComment, toggleCommentLike,
  subscribeToStories, createStory, viewStory, reactToStory, deleteStory,
  getUserStats, computeAwards, EMPTY_STATS, getLeaderboard,
} from "../../lib/firestore";
import { uploadClubImage, uploadStoryMedia } from "../../lib/storage";
import {
  getMascotState,
  mascotQuickPrompts, mascotStates,
  storyToneBg, todayChallenge,
} from "../../lib/mobile-data";
import { radii, shadows, spacing, useTheme } from "../../lib/theme";

const MASCOT = require("../../assets/mascot.png") as number;

type ClubView = "main" | "lidyk" | "feed" | "awards" | "leaderboard";

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

function formatStoryDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function StoryResultCard({ story, hasMedia }: { story: StoryDoc; hasMedia: boolean }) {
  const result = story.result;
  if (!result) return null;
  const percent = Math.max(0, Math.min(100, result.percent));
  const wrong = Math.max(0, result.total - result.correct);
  const passed = Boolean(result.passed);
  const accent = passed ? "#22c55e" : "#f59e0b";
  const modeLabel = result.mode === "exam" ? "Іспит МВС" : result.mode === "marathon" ? "Марафон" : "Тренування";
  const time = formatStoryDuration(result.elapsedSeconds);

  return (
    <View
      style={{
        marginHorizontal: 20,
        borderRadius: 28,
        padding: 20,
        backgroundColor: hasMedia ? "rgba(12,12,12,0.56)" : "rgba(255,255,255,0.16)",
        borderWidth: 1,
        borderColor: hasMedia ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.22)",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "rgba(255,255,255,0.72)", fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>ПДР · {modeLabel}</Text>
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 4 }}>
            {passed ? "Лідик зарахував" : "Лідик дав план"}
          </Text>
        </View>
        <Image source={MASCOT} style={{ width: 58, height: 58, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.88)" }} resizeMode="contain" />
      </View>

      <Text style={{ color: "#fff", fontSize: 74, fontWeight: "900", lineHeight: 84, marginTop: 18 }}>{percent}%</Text>
      <View style={{ height: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.22)", overflow: "hidden" }}>
        <View style={{ width: `${percent}%`, height: 8, borderRadius: 999, backgroundColor: accent }} />
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
        {[
          { label: "Вірно", value: `${result.correct}/${result.total}` },
          { label: "Помилки", value: `${wrong}` },
          { label: "Категорія", value: result.licenseCategory ?? "B" },
        ].map((item) => (
          <View key={item.label} style={{ flex: 1, borderRadius: 16, padding: 10, backgroundColor: "rgba(255,255,255,0.14)" }}>
            <Text style={{ color: "rgba(255,255,255,0.62)", fontSize: 10, fontWeight: "900" }}>{item.label}</Text>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900", marginTop: 2 }}>{item.value}</Text>
          </View>
        ))}
      </View>

      <View style={{ alignSelf: "flex-start", marginTop: 14, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: accent }}>
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "900" }}>
          {passed ? "готовий до складнішого" : "повторю слабкі теми"}{time ? ` · ${time}` : ""}
        </Text>
      </View>
    </View>
  );
}

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
  const hasMedia = Boolean(story.mediaUrl && story.mediaType === "image");
  const hasResult = story.kind === "pdrResult" && Boolean(story.result);

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
      <View style={{ flex: 1, backgroundColor: hasMedia ? "#000" : bg }}>
        {hasMedia ? (
          <Image
            source={{ uri: story.mediaUrl }}
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : null}
        {hasMedia ? (
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
          <View style={{ flex: 1, justifyContent: "center" }}>
            {hasResult ? <StoryResultCard story={story} hasMedia={hasMedia} /> : null}
            <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, flexDirection: "row" }}>
              <Pressable style={{ flex: 1 }} onPress={() => { progressAnimRef.current?.stop(); progressAnim.setValue(0); goPrev(); }} />
              <Pressable style={{ flex: 1 }} onPress={() => { progressAnimRef.current?.stop(); progressAnim.setValue(0); goNext(); }} />
            </View>
          </View>
          {/* Content */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 36, paddingTop: 18, backgroundColor: hasMedia ? "rgba(0,0,0,0.24)" : "transparent" }}>
            <Text style={{ fontSize: hasResult ? 18 : 24, fontWeight: "900", lineHeight: hasResult ? 25 : 34, letterSpacing: 0, color: "#fff" }}>
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
          <EmptyState
            emoji="📸"
            title="Стрічка клубу чекає"
            detail="Стань першим, хто поділиться досвідом водіння чи цікавим питанням з іншими учнями."
            action="Написати допис"
            onAction={() => setShowCompose(true)}
          />
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

// ─── LEADERBOARD VIEW ────────────────────────────────────────────────────────

const LEADERBOARD_MIN_ACCURACY_ANSWERS = 20;

type LeaderboardSortKey = "accuracy" | "answered" | "streak";
type LeaderboardWindowKey = "week" | "month" | "all";
type RankedLeaderboardEntry = {
  entry: LeaderboardEntry;
  rank: number;
  isNovice: boolean;
};

const LEADERBOARD_SORT_OPTIONS: { key: LeaderboardSortKey; label: string }[] = [
  { key: "accuracy", label: "Точність" },
  { key: "answered", label: "Відповіді" },
  { key: "streak", label: "Серія" },
];

const LEADERBOARD_WINDOW_OPTIONS: { key: LeaderboardWindowKey; label: string }[] = [
  { key: "week", label: "Тиждень" },
  { key: "month", label: "Місяць" },
  { key: "all", label: "Всі" },
];

function estimateCorrectAnswers(entry: LeaderboardEntry): number {
  return Math.round((entry.totalAnswered * entry.accuracyPct) / 100);
}

function getLeaderboardMetric(entry: LeaderboardEntry, sortBy: LeaderboardSortKey): string {
  if (sortBy === "accuracy") return `${entry.accuracyPct}%`;
  if (sortBy === "answered") return String(entry.totalAnswered);
  return `${entry.streakDays}д`;
}

function getLeaderboardMetricLabel(sortBy: LeaderboardSortKey): string {
  if (sortBy === "accuracy") return "точність";
  if (sortBy === "answered") return "відповідей";
  return "серія";
}

function sortByAnsweredThenAccuracy(a: LeaderboardEntry, b: LeaderboardEntry): number {
  return b.totalAnswered - a.totalAnswered || b.accuracyPct - a.accuracyPct || b.streakDays - a.streakDays;
}

function compareLeaderboardEntries(sortBy: LeaderboardSortKey) {
  return (a: LeaderboardEntry, b: LeaderboardEntry): number => {
    if (sortBy === "accuracy") {
      return b.accuracyPct - a.accuracyPct || sortByAnsweredThenAccuracy(a, b);
    }
    if (sortBy === "answered") {
      return sortByAnsweredThenAccuracy(a, b);
    }
    return b.streakDays - a.streakDays || sortByAnsweredThenAccuracy(a, b);
  };
}

function rankLeaderboardEntries(entries: LeaderboardEntry[], sortBy: LeaderboardSortKey): RankedLeaderboardEntry[] {
  if (sortBy !== "accuracy") {
    return [...entries].sort(compareLeaderboardEntries(sortBy)).map((entry, index) => ({
      entry,
      rank: index + 1,
      isNovice: false,
    }));
  }

  const eligible = entries
    .filter((entry) => entry.totalAnswered >= LEADERBOARD_MIN_ACCURACY_ANSWERS)
    .sort(compareLeaderboardEntries("accuracy"));
  const novices = entries
    .filter((entry) => entry.totalAnswered < LEADERBOARD_MIN_ACCURACY_ANSWERS)
    .sort(sortByAnsweredThenAccuracy);

  return [...eligible, ...novices].map((entry, index) => ({
    entry,
    rank: index + 1,
    isNovice: entry.totalAnswered < LEADERBOARD_MIN_ACCURACY_ANSWERS,
  }));
}

function getLeaderboardDelta(row: RankedLeaderboardEntry | undefined, rows: RankedLeaderboardEntry[], sortBy: LeaderboardSortKey): string {
  if (!row) return "Пройди тест, щоб потрапити до рейтингу.";
  if (row.isNovice) {
    const left = Math.max(0, LEADERBOARD_MIN_ACCURACY_ANSWERS - row.entry.totalAnswered);
    return left > 0 ? `+${left} відповідей до чесного заліку точності` : "Точність вже рахується у загальному заліку";
  }

  const prev = rows.find((candidate) => candidate.rank === row.rank - 1 && !candidate.isNovice);
  if (!prev) return "Ти у верхівці. Тримай темп!";

  const name = prev.entry.displayName || "учня";
  if (sortBy === "accuracy") {
    const delta = Math.max(1, prev.entry.accuracyPct - row.entry.accuracyPct + 1);
    return `+${delta}% щоб обігнати ${name}`;
  }
  if (sortBy === "answered") {
    const delta = Math.max(1, prev.entry.totalAnswered - row.entry.totalAnswered + 1);
    return `+${delta} відповідей щоб обігнати ${name}`;
  }
  const delta = Math.max(1, prev.entry.streakDays - row.entry.streakDays + 1);
  return `+${delta} дн. серії щоб обігнати ${name}`;
}

function getLidykLeaderboardMessage(row: RankedLeaderboardEntry | undefined, rows: RankedLeaderboardEntry[]): string {
  if (!row) return "Пройди перший ПДР-тест, і я покажу твоє місце серед учнів.";
  if (row.isNovice) {
    const left = Math.max(0, LEADERBOARD_MIN_ACCURACY_ANSWERS - row.entry.totalAnswered);
    return `Ще ${left} відповідей, і твоя точність піде у чесний залік. Без випадкових чемпіонів.`;
  }
  if (row.rank <= 10) return "Ти вже в топ-10. Один короткий тест сьогодні допоможе втримати позицію.";

  const topTen = rows.find((candidate) => candidate.rank === 10 && !candidate.isNovice);
  if (!topTen) return "Роби рівний темп: серія маленьких тестів сильніша за один марафон.";

  const delta = Math.max(1, estimateCorrectAnswers(topTen.entry) - estimateCorrectAnswers(row.entry) + 1);
  return `До топ-10 лишилось ${delta} правильних відповідей. Поїхали!`;
}

function LeaderboardView({
  currentUid,
  onBack,
  onShareReferral,
}: {
  currentUid?: string;
  onBack: () => void;
  onShareReferral: () => void;
}) {
  const { colors } = useTheme();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<LeaderboardSortKey>("accuracy");
  const [timeWindow, setTimeWindow] = useState<LeaderboardWindowKey>("all");
  const rowAnims = useRef<Animated.Value[]>([]);

  useEffect(() => {
    setLoading(true);
    void getLeaderboard(30).then((data) => {
      setEntries(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Stagger rows in after data loads
  useEffect(() => {
    if (loading) return;
    const total = Math.min(30, 2 + entries.length);
    rowAnims.current = Array.from({ length: total }, () => new Animated.Value(0));
    Animated.stagger(
      40,
      rowAnims.current.map((a) =>
        Animated.spring(a, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 3 })
      )
    ).start();
  }, [loading]);

  // TODO: When Firestore stores weekly/monthly PDR aggregates, pass timeWindow
  // into getLeaderboard. Until then all chips show the same real all-time data.
  const ranked = useMemo(() => rankLeaderboardEntries(entries, sortBy), [entries, sortBy]);
  const currentRow = ranked.find((row) => row.entry.uid === currentUid);
  const podiumRows = ranked.filter((row) => !row.isNovice).slice(0, 3);
  const podiumLayout = [podiumRows[1], podiumRows[0], podiumRows[2]].filter(Boolean) as RankedLeaderboardEntry[];
  const podiumIds = new Set(podiumRows.map((row) => row.entry.uid));
  const regularRows = ranked.filter((row) => !podiumIds.has(row.entry.uid) && !row.isNovice);
  const noviceRows = ranked.filter((row) => row.isNovice);
  const showSoloState = !loading && entries.length === 1;
  const showEmptyState = !loading && entries.length === 0;
  const soloIsMe = showSoloState && entries[0]?.uid === currentUid;
  const stickyPlace = currentRow ? `#${currentRow.rank}` : "ще немає";
  const stickyDelta = getLeaderboardDelta(currentRow, ranked, sortBy);
  const lidykMessage = getLidykLeaderboardMessage(currentRow, ranked);
  const metricLabel = getLeaderboardMetricLabel(sortBy);
  const gold = "#F2C94C";
  const goldSoft = "rgba(242, 201, 76, 0.14)";

  const ra = (idx: number): object => {
    const a = rowAnims.current[idx];
    if (!a) return {};
    return {
      opacity: a,
      transform: [{ translateY: (a as Animated.Value).interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
    };
  };

  return (
    <View style={{ flex: 1 }}>
      <SubHeader title="Рейтинг ПДР" subtitle="Чесний залік учнів школи" onBack={onBack} />

      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgCard, paddingHorizontal: spacing.md, paddingTop: 10, paddingBottom: 10, gap: 10 }}>
        {/* Тимчасово приховано до бекенд-реалізації
        <View style={{ flexDirection: "row", borderRadius: 999, padding: 3, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border }}>
          {LEADERBOARD_WINDOW_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setTimeWindow(opt.key)}
              style={{ flex: 1, borderRadius: 999, paddingVertical: 8, alignItems: "center", backgroundColor: timeWindow === opt.key ? colors.red : "transparent" }}
            >
              <Text style={{ fontSize: 12, fontWeight: "900", color: timeWindow === opt.key ? "#fff" : colors.textSecondary }}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row", gap: 8 }}>
          {LEADERBOARD_SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setSortBy(opt.key)}
              style={{ borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 8, borderColor: sortBy === opt.key ? colors.red : colors.border, backgroundColor: sortBy === opt.key ? colors.redSoft : colors.bg }}
            >
              <Text style={{ fontSize: 13, fontWeight: "800", color: sortBy === opt.key ? colors.red : colors.textSecondary }}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: ranked.length > 1 ? 150 : 120, gap: spacing.md }}>
        {loading ? (
          <ActivityIndicator color={colors.red} style={{ marginTop: 40 }} />
        ) : showEmptyState || showSoloState ? (
          <View style={{ alignItems: "center", marginTop: 44, gap: 14 }}>
            <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.red + "33" }}>
              <Text style={{ fontSize: 34 }}>🏁</Text>
            </View>
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900", textAlign: "center" }}>
              {showSoloState ? (soloIsMe ? "Ти поки єдиний у рейтингу" : "У рейтингу поки один учасник") : "Рейтинг поки порожній"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: "center", maxWidth: 290 }}>
              Запроси друзів, проходьте ПДР-тести разом і змагайтесь без випадкових чемпіонів.
            </Text>
            {showSoloState ? (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                <View style={{ borderRadius: 14, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, alignItems: "center" }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900" }}>{entries[0].totalAnswered}</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800" }}>відповідей</Text>
                </View>
                <View style={{ borderRadius: 14, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, alignItems: "center" }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900" }}>{entries[0].accuracyPct}%</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800" }}>точність</Text>
                </View>
              </View>
            ) : null}
            <PrimaryButton onPress={onShareReferral} style={{ marginTop: 4 }}>
              Запросити друзів
            </PrimaryButton>
            <MascotMessage
              emoji="🚗"
              title="Лідик"
              message="Перший справжній суперник з'явиться швидше, якщо кинути запрошення просто зараз."
              tone="error"
            />
          </View>
        ) : (
          <>
            <Animated.View style={ra(0)}>
              <MascotMessage emoji="🏎️" title="Лідик тримає темп" message={lidykMessage} tone="error" />
            </Animated.View>

            <Animated.View style={ra(1)}>
                    {podiumLayout.length > 0 ? (
                      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, minHeight: 188 }}>
                        {podiumLayout.map((row) => {
                          const isFirst = row.rank === 1;
                          const isMe = row.entry.uid === currentUid;
                          const medal = row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : "🥉";
                          return (
                            <View
                              key={row.entry.uid}
                              style={{
                                flex: 1,
                                minHeight: isFirst ? 176 : 146,
                                borderRadius: 22,
                                padding: 12,
                                alignItems: "center",
                                justifyContent: "space-between",
                                backgroundColor: isFirst ? goldSoft : colors.bgCard,
                                borderWidth: isMe || isFirst ? 2 : 1,
                                borderColor: isMe ? colors.red : isFirst ? gold : colors.border,
                                marginBottom: isFirst ? 0 : 12,
                              }}
                            >
                              <Text style={{ fontSize: isFirst ? 28 : 23 }}>{medal}</Text>
                              <View style={{ width: isFirst ? 58 : 48, height: isFirst ? 58 : 48, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: isMe ? colors.redSoft : colors.bgElevated, borderWidth: 1, borderColor: isFirst ? gold : colors.border }}>
                                <Text style={{ fontSize: isFirst ? 29 : 23 }}>{row.entry.avatarEmoji ?? "🚗"}</Text>
                              </View>
                              <View style={{ alignItems: "center", width: "100%", marginTop: 4 }}>
                                <Text style={{ color: colors.textPrimary, fontSize: isFirst ? 14 : 12, fontWeight: "900", textAlign: "center", letterSpacing: -0.2 }} numberOfLines={1}>
                                  {row.entry.displayName}
                                </Text>
                                {isMe ? <Text style={{ color: colors.red, fontSize: 10, fontWeight: "900", marginTop: 2, letterSpacing: 0.5 }}>ВИ</Text> : null}
                              </View>
                              <View style={{ alignItems: "center", marginTop: 6 }}>
                                <Text style={{ color: isFirst ? gold : colors.red, fontSize: isFirst ? 28 : 22, fontWeight: "900", letterSpacing: -1 }}>
                                  {getLeaderboardMetric(row.entry, sortBy)}
                                </Text>
                                <Text style={{ color: isFirst ? "rgba(242, 201, 76, 0.8)" : colors.textTertiary, fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, marginTop: -2 }}>{metricLabel}</Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <View style={{ borderRadius: radii.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 6 }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "900" }}>Залік точності ще формується</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
                          Для подіуму потрібно щонайменше {LEADERBOARD_MIN_ACCURACY_ANSWERS} відповідей. Нижче — ліга «Новачки».
                        </Text>
                      </View>
                    )}
                  </Animated.View>

                  {regularRows.length > 0 ? (
                    <View style={{ gap: 8 }}>
                      <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>Місця 4+</Text>
                      {regularRows.map((row, idx) => {
                        const isMe = row.entry.uid === currentUid;
                        return (
                          <Animated.View key={row.entry.uid} style={ra(2 + idx)}>
                            <View
                              style={{ backgroundColor: isMe ? colors.redSoft : colors.bgCard, borderRadius: radii.sm, borderWidth: isMe ? 2 : 1, borderColor: isMe ? colors.red : colors.border, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }}
                            >
                              <Text style={{ fontSize: 15, fontWeight: "900", width: 32, textAlign: "center", color: isMe ? colors.red : colors.textTertiary }}>#{row.rank}</Text>
                              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.bgElevated, alignItems: "center", justifyContent: "center" }}>
                                <Text style={{ fontSize: 20 }}>{row.entry.avatarEmoji ?? "🚗"}</Text>
                              </View>
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "900", flexShrink: 1 }} numberOfLines={1}>{row.entry.displayName}</Text>
                                  {isMe ? <Text style={{ color: colors.red, fontSize: 10, fontWeight: "900" }}>ВИ</Text> : null}
                                </View>
                                <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                                  {[row.entry.city, row.entry.licenseCategory ? `кат. ${row.entry.licenseCategory}` : null].filter(Boolean).join(" · ") || `${row.entry.totalAnswered} відповідей`}
                                </Text>
                              </View>
                              <View style={{ alignItems: "flex-end" }}>
                                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "900" }}>{getLeaderboardMetric(row.entry, sortBy)}</Text>
                                <Text style={{ color: colors.textTertiary, fontSize: 10, fontWeight: "800" }}>{metricLabel}</Text>
                              </View>
                            </View>
                          </Animated.View>
                        );
                      })}
                    </View>
                  ) : null}

                  {noviceRows.length > 0 ? (
                    <View style={{ gap: 8 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>Ліга Новачки</Text>
                        <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800" }}>до {LEADERBOARD_MIN_ACCURACY_ANSWERS} відповідей</Text>
                      </View>
                      {noviceRows.map((row, idx) => {
                        const isMe = row.entry.uid === currentUid;
                        const left = Math.max(0, LEADERBOARD_MIN_ACCURACY_ANSWERS - row.entry.totalAnswered);
                        return (
                          <Animated.View key={row.entry.uid} style={ra(2 + regularRows.length + idx)}>
                            <View
                              style={{ backgroundColor: isMe ? colors.redSoft : colors.bgCard, borderRadius: radii.sm, borderWidth: isMe ? 2 : 1, borderColor: isMe ? colors.red : colors.border, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }}
                            >
                              <Text style={{ fontSize: 15, fontWeight: "900", width: 32, textAlign: "center", color: colors.textTertiary }}>#{row.rank}</Text>
                              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.bgElevated, alignItems: "center", justifyContent: "center" }}>
                                <Text style={{ fontSize: 20 }}>{row.entry.avatarEmoji ?? "🚗"}</Text>
                              </View>
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "900", flexShrink: 1 }} numberOfLines={1}>{row.entry.displayName}</Text>
                                  {isMe ? <Text style={{ color: colors.red, fontSize: 10, fontWeight: "900" }}>ВИ</Text> : null}
                                </View>
                                <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 2 }}>
                                  +{left} відповідей до заліку точності
                                </Text>
                              </View>
                              <View style={{ alignItems: "flex-end" }}>
                                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "900" }}>{row.entry.totalAnswered}</Text>
                                <Text style={{ color: colors.textTertiary, fontSize: 10, fontWeight: "800" }}>відповідей</Text>
                              </View>
                            </View>
                          </Animated.View>
                        );
                      })}
                    </View>
                  ) : null}
          </>
        )}
      </ScrollView>

      {!loading && !showEmptyState && !showSoloState ? (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.md, paddingTop: 10, paddingBottom: 14, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ borderRadius: radii.md, backgroundColor: colors.bgCard, borderWidth: 1.5, borderColor: colors.red, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 20 }}>🎯</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "900" }}>Ваше місце: {stickyPlace}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "700", marginTop: 2 }} numberOfLines={1}>
                {stickyDelta}
              </Text>
            </View>
            <TouchableOpacity onPress={onShareReferral} style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: colors.red }}>
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "900" }}>Друзі</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
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
          <EmptyState
            emoji="🏅"
            title="Нагороди ще попереду"
            detail="Пройди більше тестів і навчальних модулів — перші нагороди не за горами."
          />
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
  if (view === "leaderboard") return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <LeaderboardView currentUid={user?.id} onBack={() => setView("main")} onShareReferral={handleReferral} />
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
                      {latest.kind === "pdrResult" ? (
                        <View style={{ position: "absolute", left: -7, top: -5, borderRadius: 8, backgroundColor: colors.red, borderWidth: 2, borderColor: colors.bg, paddingHorizontal: 5, paddingVertical: 2 }}>
                          <Text style={{ color: "#fff", fontSize: 8, fontWeight: "900" }}>ПДР</Text>
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

          {/* Leaderboard — visible to all */}
          <Pressable onPress={() => setView("leaderboard")}>
            <View style={{ backgroundColor: "#f59e0b18", borderRadius: radii.md, borderWidth: 1, borderColor: "#f59e0b44", padding: 16, ...shadows.card, flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#f59e0b22", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 26 }}>🏆</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "900", color: colors.textPrimary }}>Рейтинг ПДР</Text>
                <Text style={{ marginTop: 3, fontSize: 13, color: colors.textSecondary }}>Топ учнів за точністю відповідей</Text>
              </View>
              <Text style={{ fontSize: 20, color: "#f59e0b", fontWeight: "900" }}>›</Text>
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
