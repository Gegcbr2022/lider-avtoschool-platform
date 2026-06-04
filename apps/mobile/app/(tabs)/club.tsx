import { useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Card,
  Label,
  MascotMessage,
  Pill,
  PrimaryButton,
  ProgressBar,
  Row,
} from "../../components/mobile-ui";
import { askLidyk } from "../../lib/api";
import {
  type ClubStory,
  clubAwards,
  clubFeedPosts,
  driverChecklist,
  driverClubStreak,
  getMascotState,
  mascotQuickPrompts,
  mascotStates,
  mockStories,
  roadTips,
  storyToneBg,
  todayChallenge,
} from "../../lib/mobile-data";
import { darkColors as colors, radii, shadows, spacing } from "../../lib/theme";

const MASCOT = require("../../assets/mascot.png") as number;

const AWARD_FILTER_LABELS: Record<string, string> = {
  all: "Всі",
  streak: "Серія",
  tests: "Тести",
  learning: "Навчання",
  practice: "Практика",
  community: "Спільнота",
  graduation: "Після прав",
};

// ─── Stories row ──────────────────────────────────────────────────────────────

function StoryRing({ story, onPress }: { story: ClubStory; onPress: () => void }) {
  const bg = storyToneBg[story.tone];
  return (
    <TouchableOpacity style={styles.storyRing} onPress={onPress}>
      <View style={[styles.storyAvatar, { borderColor: bg }]}>
        <View style={[styles.storyInitialBox, { backgroundColor: bg }]}>
          <Text style={styles.storyInitial}>{story.initials}</Text>
        </View>
      </View>
      <Text style={styles.storyName} numberOfLines={1}>{story.authorName}</Text>
    </TouchableOpacity>
  );
}

function AddStoryRing({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.storyRing} onPress={onPress}>
      <View style={[styles.storyAvatar, { borderColor: colors.red }]}>
        <View style={[styles.storyInitialBox, { backgroundColor: colors.redSoft }]}>
          <Text style={styles.addStoryPlus}>+</Text>
        </View>
      </View>
      <Text style={styles.storyName}>Твоя</Text>
    </TouchableOpacity>
  );
}

// ─── Story viewer ─────────────────────────────────────────────────────────────

function StoryViewer({ story, onClose }: { story: ClubStory; onClose: () => void }) {
  const bg = storyToneBg[story.tone];
  const textColor = "#ffffff";
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={[styles.storyFull, { backgroundColor: bg }]}>
        <SafeAreaView style={styles.storyFullInner}>
          <View style={styles.storyProgress}>
            <View style={styles.storyProgressBar} />
          </View>
          <View style={styles.storyHeader}>
            <View style={styles.storyHeaderLeft}>
              <View style={[styles.storyMiniAvatar, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                <Text style={styles.storyMiniInitial}>{story.initials}</Text>
              </View>
              <View>
                <Text style={[styles.storyAuthor, { color: textColor }]}>{story.authorName}</Text>
                {story.city ? (
                  <Text style={[styles.storyCity, { color: "rgba(255,255,255,0.65)" }]}>
                    {story.city}
                  </Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.storyClose}>
              <Text style={[styles.storyCloseText, { color: textColor }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.storyCaption}>
            <Text style={[styles.storyCaptionText, { color: textColor }]}>{story.caption}</Text>
          </View>
          <View style={styles.storyReactions}>
            <Text style={[styles.storyReactionCount, { color: textColor }]}>♥ {story.reactions}</Text>
            {story.tags.map((tag) => (
              <View key={tag} style={styles.storyTag}>
                <Text style={styles.storyTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ─── Create story sheet ───────────────────────────────────────────────────────

function CreateStorySheet({ onClose }: { onClose: () => void }) {
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetOverlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.sheetBody}>
          <View style={styles.sheetMascotRow}>
            <Image source={MASCOT} style={styles.sheetMascot} resizeMode="contain" />
            <View style={styles.sheetMascotText}>
              <Text style={styles.sheetTitle}>Поділитися успіхом</Text>
              <Text style={styles.sheetSubtitle}>Обери шаблон — і натхни інших учнів!</Text>
            </View>
          </View>
          <View style={styles.templateGrid}>
            {(
              [
                "📚 Я склав теорію",
                "🚗 Перший урок",
                "🎓 Я отримав права",
                "🚙 Моя машина",
                "🅿️ Паркування переможено",
                "💡 Порада новачкам",
              ] as const
            ).map((tpl) => (
              <TouchableOpacity key={tpl} style={styles.templateCard}>
                <Text style={styles.templateText}>{tpl}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.sheetNote}>
            <Text style={styles.sheetNoteText}>
              📎 Фото/відео та публікація — після підключення backend
            </Text>
          </View>
          <TouchableOpacity style={styles.sheetCancel} onPress={onClose}>
            <Text style={styles.sheetCancelText}>Закрити</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Lidyk AI assistant ───────────────────────────────────────────────────────

function LidykAssistant() {
  const [expanded, setExpanded] = useState(false);
  const [customQ, setCustomQ] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  async function handleAsk(question: string) {
    if (!question.trim()) return;
    setLoading(true);
    setResponse(null);
    setCustomQ("");
    const result = await askLidyk(question);
    setResponse(result.answer);
    setIsFallback(result.mode === "fallback");
    setLoading(false);
  }

  return (
    <Card>
      <TouchableOpacity style={styles.aiHeader} onPress={() => setExpanded((v) => !v)}>
        <Image source={MASCOT} style={styles.aiMascotImg} resizeMode="contain" />
        <View style={styles.aiHeaderText}>
          <Text style={styles.aiTitle}>Запитай Лідика</Text>
          <Text style={styles.aiSub}>AI-помічник для навчання та підготовки</Text>
        </View>
        <Text style={styles.aiChevron}>{expanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.aiBody}>
          <View style={styles.aiPrompts}>
            {mascotQuickPrompts.map((prompt) => (
              <TouchableOpacity
                key={prompt}
                style={styles.aiPromptBtn}
                onPress={() => handleAsk(prompt)}
                disabled={loading}
              >
                <Text style={styles.aiPromptText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.aiInputRow}>
            <TextInput
              style={styles.aiInput}
              value={customQ}
              onChangeText={setCustomQ}
              placeholder="Запитай щось..."
              placeholderTextColor={colors.textTertiary}
              returnKeyType="send"
              onSubmitEditing={() => handleAsk(customQ)}
              editable={!loading}
              multiline={false}
            />
            <TouchableOpacity
              style={[styles.aiSendBtn, loading && { opacity: 0.5 }]}
              onPress={() => handleAsk(customQ)}
              disabled={loading || !customQ.trim()}
            >
              <Text style={styles.aiSendText}>→</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.aiLoadingRow}>
              <Image source={MASCOT} style={styles.aiLoadingMascot} resizeMode="contain" />
              <Text style={styles.aiLoadingText}>Лідик думає...</Text>
            </View>
          ) : null}

          {response && !loading ? (
            <View style={[styles.aiResponse, isFallback && styles.aiResponseFallback]}>
              <Image source={MASCOT} style={styles.aiResponseMascot} resizeMode="contain" />
              <Text style={styles.aiResponseText}>{response}</Text>
            </View>
          ) : null}

          <Text style={styles.aiDisclaimer}>
            {isFallback
              ? "Підключи інтернет для відповідей від реального Лідика"
              : "Лідик допомагає з ПДР та навчанням · Не замінює інструктора"}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function ClubTab() {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(
    new Set(clubFeedPosts.filter((p) => p.hasLiked).map((p) => p.id))
  );
  const [activeStory, setActiveStory] = useState<ClubStory | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [awardFilter, setAwardFilter] = useState<string>("all");
  const [tipIndex] = useState(Math.floor(Date.now() / 86_400_000) % roadTips.length);

  const mascot = getMascotState(driverClubStreak);
  const isAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === todayChallenge.correctIndex;

  const filteredAwards =
    awardFilter === "all" ? clubAwards : clubAwards.filter((a) => a.group === awardFilter);
  const earnedAwards = filteredAwards.filter((a) => a.earned);
  const lockedAwards = filteredAwards.filter((a) => !a.earned);

  function toggleLike(postId: string) {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {activeStory ? <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} /> : null}
      {showCreateStory ? <CreateStorySheet onClose={() => setShowCreateStory(false)} /> : null}

      <ScrollView contentContainerStyle={styles.container}>

        {/* Header */}
        <View>
          <Text style={styles.title}>Лідер Клуб</Text>
          <Text style={styles.subtitle}>AI-чат, нагороди, тест дня та спільнота</Text>
        </View>

        {/* Stories */}
        <View>
          <Text style={styles.sectionHeading}>Stories</Text>
          <FlatList
            data={mockStories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={<AddStoryRing onPress={() => setShowCreateStory(true)} />}
            renderItem={({ item }) => (
              <StoryRing story={item} onPress={() => setActiveStory(item)} />
            )}
            contentContainerStyle={styles.storiesRow}
          />
        </View>

        {/* Mascot card */}
        <View style={styles.mascotCard}>
          <Image source={MASCOT} style={styles.mascotImg} resizeMode="contain" />
          <View style={styles.mascotBubble}>
            <Text style={styles.mascotName}>ЛІДИК</Text>
            <Text style={styles.mascotMessage}>{mascot.message}</Text>
          </View>
        </View>

        {/* Streak */}
        <Card tone="red">
          <Label variant="inverse">Ваша серія</Label>
          <View style={styles.streakRow}>
            <View style={styles.streakBlock}>
              <Text style={styles.streakNumber}>{driverClubStreak.current}</Text>
              <Text style={styles.streakLabel}>днів поспіль</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakBlock}>
              <Text style={styles.streakNumber}>{driverClubStreak.best}</Text>
              <Text style={styles.streakLabel}>найкращий результат</Text>
            </View>
          </View>
          <ProgressBar
            value={(driverClubStreak.current / driverClubStreak.best) * 100}
            color="rgba(255,255,255,0.6)"
          />
          <Text style={styles.streakHint}>Проходьте щоденний тест — підтримуйте серію</Text>
        </Card>

        {/* Daily challenge */}
        <Card>
          <View style={styles.challengeHeader}>
            <Label>Тест дня</Label>
            <Pill tone={isAnswered ? (isCorrect ? "success" : "warning") : "default"}>
              {isAnswered ? (isCorrect ? "Правильно!" : "Не вірно") : todayChallenge.category}
            </Pill>
          </View>
          <Text style={styles.question}>{todayChallenge.question}</Text>
          <View style={styles.options}>
            {todayChallenge.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isRight = index === todayChallenge.correctIndex;
              let optionStyle = styles.option;
              let bgStyle = {};
              if (isAnswered && isRight) bgStyle = { backgroundColor: colors.successSoft, borderColor: colors.success + "60" };
              else if (isAnswered && isSelected && !isRight) bgStyle = { backgroundColor: colors.redSoft, borderColor: colors.red + "60" };
              return (
                <TouchableOpacity
                  key={option}
                  style={[optionStyle, bgStyle]}
                  onPress={() => !isAnswered && setSelectedAnswer(index)}
                  disabled={isAnswered}
                >
                  <Text
                    style={[
                      styles.optionLetter,
                      isAnswered && isRight && styles.correctLetter,
                      isAnswered && isSelected && !isRight && styles.wrongLetter,
                    ]}
                  >
                    {String.fromCharCode(65 + index)}
                  </Text>
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {isAnswered ? (
            <MascotMessage
              emoji={mascotStates[isCorrect ? "test-passed" : "test-failed"].emoji}
              title={mascotStates[isCorrect ? "test-passed" : "test-failed"].title}
              message={mascotStates[isCorrect ? "test-passed" : "test-failed"].message}
              tone={isCorrect ? "success" : "warning"}
            />
          ) : null}
        </Card>

        {/* Lidyk AI */}
        <LidykAssistant />

        {/* Feed */}
        <View>
          <Text style={styles.sectionHeading}>Клубна стрічка</Text>
          {clubFeedPosts.map((post) => {
            const liked = likedPosts.has(post.id);
            const likeCount =
              post.likes + (liked && !post.hasLiked ? 1 : !liked && post.hasLiked ? -1 : 0);
            return (
              <View key={post.id} style={styles.feedCard}>
                <View style={styles.feedHeader}>
                  <View style={styles.feedAvatar}>
                    <Text style={styles.feedAvatarText}>{post.author.slice(0, 1)}</Text>
                  </View>
                  <View style={styles.feedAuthorBlock}>
                    <Text style={styles.feedAuthor}>{post.author}</Text>
                    <Text style={styles.feedRole}>{post.role}</Text>
                  </View>
                  <View style={[styles.feedTag, { backgroundColor: post.tagColor + "33" }]}>
                    <Text style={[styles.feedTagText, { color: post.tagColor }]}>{post.tag}</Text>
                  </View>
                </View>
                <Text style={styles.feedContent}>{post.content}</Text>
                <View style={styles.feedFooter}>
                  <Text style={styles.feedTime}>{post.timeAgo}</Text>
                  <TouchableOpacity style={styles.likeButton} onPress={() => toggleLike(post.id)}>
                    <Text style={[styles.likeIcon, liked && styles.likeIconActive]}>♥</Text>
                    <Text style={[styles.likeCount, liked && styles.likeCountActive]}>{likeCount}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Awards */}
        <View>
          <Text style={styles.sectionHeading}>Нагороди</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {Object.keys(AWARD_FILTER_LABELS).map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.filterTab, awardFilter === key && styles.filterTabActive]}
                onPress={() => setAwardFilter(key)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    awardFilter === key && styles.filterTabTextActive,
                  ]}
                >
                  {AWARD_FILTER_LABELS[key]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {earnedAwards.length > 0 && (
            <>
              <Text style={styles.awardGroupLabel}>Отримано ({earnedAwards.length})</Text>
              <View style={styles.awardsGrid}>
                {earnedAwards.map((award) => (
                  <View key={award.id} style={styles.awardCard}>
                    <Text style={styles.awardIcon}>{award.icon}</Text>
                    <Text style={styles.awardTitle}>{award.title}</Text>
                    <Text style={styles.awardDesc}>{award.description}</Text>
                    {award.earnedAt ? (
                      <Text style={styles.awardDate}>{award.earnedAt}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </>
          )}

          {lockedAwards.length > 0 && (
            <>
              <Text style={[styles.awardGroupLabel, earnedAwards.length > 0 && { marginTop: 16 }]}>
                В процесі ({lockedAwards.length})
              </Text>
              <View style={styles.awardsGrid}>
                {lockedAwards.map((award) => (
                  <View key={award.id} style={[styles.awardCard, styles.awardLocked]}>
                    <Text style={[styles.awardIcon, styles.awardIconLocked]}>{award.icon}</Text>
                    <Text style={[styles.awardTitle, styles.awardTitleLocked]}>{award.title}</Text>
                    <Text style={styles.awardDesc}>{award.description}</Text>
                    {award.progress !== undefined && award.maxProgress !== undefined ? (
                      <View style={styles.awardProgressWrap}>
                        <ProgressBar
                          value={(award.progress / award.maxProgress) * 100}
                          color={colors.red}
                        />
                        <Text style={styles.awardProgressText}>
                          {award.progress} / {award.maxProgress}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </>
          )}

          {filteredAwards.length === 0 ? (
            <MascotMessage
              emoji="🅿️"
              title="Тут ще пусто"
              message="Пройди перший тест — і нагороди почнуть з'являтися."
            />
          ) : null}
        </View>

        {/* Tip of the day */}
        <Card tone="dark">
          <Label>Підказка дня</Label>
          <Text style={styles.tipText}>{roadTips[tipIndex]}</Text>
        </Card>

        {/* Driver checklist */}
        <Card>
          <Label>Чек-лист водія</Label>
          {driverChecklist.map((item) => (
            <Row
              key={item.id}
              title={item.title}
              detail={item.detail}
              right={<Pill tone={item.done ? "success" : "default"}>{item.done ? "✓" : "—"}</Pill>}
            />
          ))}
        </Card>

        {/* Referral & discounts */}
        <View style={styles.insightRow}>
          <View style={styles.insightCardRed}>
            <Text style={styles.insightTitle}>Реферал</Text>
            <Text style={styles.insightDetail}>Запросіть друга — бонус за кожного</Text>
          </View>
          <View style={styles.insightCardDark}>
            <Text style={styles.insightTitle}>Знижки</Text>
            <Text style={styles.insightDetail}>Додаткові заняття для випускників</Text>
          </View>
        </View>

        <PrimaryButton onPress={() => setShowCreateStory(true)}>
          Поділитися успіхом →
        </PrimaryButton>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md, paddingBottom: 110, gap: spacing.md },
  title: { color: colors.textPrimary, fontSize: 30, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { marginTop: 6, color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  sectionHeading: { fontSize: 20, fontWeight: "900", color: colors.textPrimary, letterSpacing: -0.3, marginBottom: 10 },

  // Mascot card
  mascotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadows.card,
  },
  mascotImg: { width: 56, height: 56 },
  mascotBubble: { flex: 1 },
  mascotName: {
    fontSize: 11,
    fontWeight: "900",
    color: colors.red,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  mascotMessage: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    lineHeight: 20,
  },

  // Stories
  storiesRow: { paddingRight: 8, gap: 12 },
  storyRing: { alignItems: "center", width: 64 },
  storyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  storyInitialBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  storyInitial: { fontSize: 20, fontWeight: "900", color: colors.white },
  addStoryPlus: { fontSize: 26, fontWeight: "900", color: colors.red },
  storyName: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textAlign: "center",
  },

  // Story viewer
  storyFull: { flex: 1 },
  storyFullInner: { flex: 1, padding: 20, justifyContent: "space-between" },
  storyProgress: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 999,
    marginBottom: 16,
  },
  storyProgressBar: { height: 3, width: "40%", backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 999 },
  storyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  storyHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  storyMiniAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  storyMiniInitial: { fontSize: 16, fontWeight: "900", color: colors.white },
  storyAuthor: { fontSize: 15, fontWeight: "900" },
  storyCity: { fontSize: 12, fontWeight: "600" },
  storyClose: { padding: 8 },
  storyCloseText: { fontSize: 20, fontWeight: "900" },
  storyCaption: { flex: 1, justifyContent: "center" },
  storyCaptionText: { fontSize: 28, fontWeight: "900", lineHeight: 38, letterSpacing: -0.5 },
  storyReactions: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  storyReactionCount: { fontSize: 20, fontWeight: "900" },
  storyTag: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  storyTagText: { fontSize: 12, fontWeight: "800", color: colors.white },

  // Create story sheet
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheetBody: {
    backgroundColor: colors.bgSheet,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 48,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sheetMascotRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  sheetMascot: { width: 52, height: 52 },
  sheetMascotText: { flex: 1 },
  sheetTitle: { fontSize: 22, fontWeight: "900", color: colors.textPrimary },
  sheetSubtitle: { marginTop: 4, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  templateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 },
  templateCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.bgElevated,
  },
  templateText: { fontSize: 13, fontWeight: "800", color: colors.textPrimary },
  sheetNote: { marginTop: 18, backgroundColor: colors.bgElevated, borderRadius: 14, padding: 12 },
  sheetNoteText: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  sheetCancel: { marginTop: 16, alignItems: "center" },
  sheetCancelText: { fontSize: 15, fontWeight: "800", color: colors.textTertiary },

  // AI assistant
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiMascotImg: { width: 48, height: 48 },
  aiHeaderText: { flex: 1 },
  aiTitle: { fontSize: 16, fontWeight: "900", color: colors.textPrimary },
  aiSub: { marginTop: 2, fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  aiChevron: { fontSize: 14, color: colors.textSecondary, fontWeight: "900" },
  aiBody: { marginTop: 16, gap: 10 },
  aiPrompts: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  aiPromptBtn: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.bgElevated,
  },
  aiPromptText: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
  aiInputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  aiInput: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    backgroundColor: colors.bgElevated,
  },
  aiSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
  },
  aiSendText: { fontSize: 20, color: colors.white, fontWeight: "900" },
  aiLoadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  aiLoadingMascot: { width: 32, height: 32 },
  aiLoadingText: { fontSize: 14, fontWeight: "700", color: colors.textSecondary },
  aiResponse: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiResponseFallback: { backgroundColor: colors.warningSoft, borderColor: colors.warning + "44" },
  aiResponseMascot: { width: 32, height: 32, marginTop: 2 },
  aiResponseText: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.textPrimary, lineHeight: 22 },
  aiDisclaimer: { fontSize: 11, color: colors.textTertiary, fontWeight: "600", textAlign: "center" },

  // Streak card
  streakRow: { flexDirection: "row", alignItems: "center", marginTop: 12, marginBottom: 14 },
  streakBlock: { flex: 1, alignItems: "center" },
  streakNumber: { fontSize: 40, fontWeight: "900", color: colors.white },
  streakLabel: { marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.72)", fontWeight: "700" },
  streakDivider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.2)" },
  streakHint: {
    marginTop: 12,
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    fontWeight: "600",
    textAlign: "center",
  },

  // Challenge
  challengeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  question: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
    lineHeight: 24,
  },
  options: { marginTop: 14, gap: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgCard,
    textAlign: "center",
    textAlignVertical: "center",
    fontWeight: "900",
    fontSize: 13,
    color: colors.textPrimary,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  correctLetter: { backgroundColor: colors.success, color: colors.white, borderColor: colors.success },
  wrongLetter: { backgroundColor: colors.red, color: colors.white, borderColor: colors.red },
  optionText: { flex: 1, fontSize: 14, fontWeight: "700", color: colors.textPrimary, lineHeight: 20 },

  // Feed
  feedCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 10,
  },
  feedHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  feedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
  },
  feedAvatarText: { fontSize: 16, fontWeight: "900", color: colors.white },
  feedAuthorBlock: { flex: 1 },
  feedAuthor: { fontSize: 13, fontWeight: "900", color: colors.textPrimary },
  feedRole: { fontSize: 11, color: colors.textSecondary, fontWeight: "600" },
  feedTag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  feedTagText: { fontSize: 11, fontWeight: "800" },
  feedContent: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, lineHeight: 22 },
  feedFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  feedTime: { fontSize: 12, color: colors.textTertiary, fontWeight: "600" },
  likeButton: { flexDirection: "row", alignItems: "center", gap: 5 },
  likeIcon: { fontSize: 16, color: colors.textTertiary },
  likeIconActive: { color: colors.red },
  likeCount: { fontSize: 13, fontWeight: "800", color: colors.textSecondary },
  likeCountActive: { color: colors.red },

  // Awards
  filterRow: { marginBottom: 12 },
  filterTab: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: colors.bgElevated,
  },
  filterTabActive: { borderColor: colors.red, backgroundColor: colors.redSoft },
  filterTabText: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
  filterTabTextActive: { color: colors.red },
  awardGroupLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textTertiary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  awardsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  awardCard: {
    width: "47%",
    borderRadius: 18,
    padding: 14,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  awardLocked: { opacity: 0.55 },
  awardIcon: { fontSize: 26 },
  awardIconLocked: { opacity: 0.6 },
  awardTitle: { marginTop: 6, fontSize: 13, fontWeight: "900", color: colors.textPrimary },
  awardTitleLocked: { color: colors.textSecondary },
  awardDesc: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    lineHeight: 16,
  },
  awardDate: { marginTop: 4, fontSize: 10, fontWeight: "700", color: colors.success },
  awardProgressWrap: { marginTop: 8, gap: 4 },
  awardProgressText: { fontSize: 10, fontWeight: "700", color: colors.textTertiary },

  // Tip
  tipText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    lineHeight: 22,
  },

  // Insight row
  insightRow: { flexDirection: "row", gap: 12 },
  insightCardRed: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: colors.red,
  },
  insightCardDark: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  insightTitle: { color: colors.white, fontSize: 17, fontWeight: "900" },
  insightDetail: { marginTop: 6, color: "rgba(255,255,255,0.74)", fontSize: 13, lineHeight: 18 },
});
