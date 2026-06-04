import { useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Card, Label, MascotMessage, Pill, PrimaryButton, ProgressBar, Row,
} from "../../components/mobile-ui";
import { askLidyk } from "../../lib/api";
import {
  type ClubStory,
  clubAwards, clubFeedPosts, driverChecklist, driverClubStreak,
  getMascotState, mascotQuickPrompts, mascotStates, mockStories,
  roadTips, storyToneBg, todayChallenge,
} from "../../lib/mobile-data";
import { useTheme, radii, spacing, shadows } from "../../lib/theme";

const MASCOT = require("../../assets/mascot.png") as number;

const AWARD_FILTER_LABELS: Record<string, string> = {
  all: "Всі", streak: "Серія", tests: "Тести", learning: "Навчання",
  practice: "Практика", community: "Спільнота", graduation: "Після прав",
};

// ─── Story Ring ───────────────────────────────────────────────────────────────

function StoryRing({ story, onPress }: { story: ClubStory; onPress: () => void }) {
  const { colors } = useTheme();
  const bg = storyToneBg[story.tone];
  return (
    <TouchableOpacity onPress={onPress} style={{ alignItems: "center", width: 64 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2.5, borderColor: bg, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "900", color: "#fff" }}>{story.initials}</Text>
        </View>
      </View>
      <Text style={{ marginTop: 6, fontSize: 11, fontWeight: "700", color: colors.textSecondary, textAlign: "center" }} numberOfLines={1}>
        {story.authorName}
      </Text>
    </TouchableOpacity>
  );
}

function AddStoryRing({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={{ alignItems: "center", width: 64 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2.5, borderColor: colors.red, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 26, fontWeight: "900", color: colors.red }}>+</Text>
        </View>
      </View>
      <Text style={{ marginTop: 6, fontSize: 11, fontWeight: "700", color: colors.textSecondary, textAlign: "center" }}>Твоя</Text>
    </TouchableOpacity>
  );
}

// ─── Story Viewer ─────────────────────────────────────────────────────────────

function StoryViewer({ story, onClose }: { story: ClubStory; onClose: () => void }) {
  const bg = storyToneBg[story.tone];
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: bg }}>
        <SafeAreaView style={{ flex: 1, padding: 20, justifyContent: "space-between" }}>
          <View style={{ height: 3, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 999, marginBottom: 16 }}>
            <View style={{ height: 3, width: "40%", backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 999 }} />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "900", color: "#fff" }}>{story.initials}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: "900", color: "#fff" }}>{story.authorName}</Text>
                {story.city ? <Text style={{ fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.65)" }}>{story.city}</Text> : null}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: "900", color: "#fff" }}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, justifyContent: "center" }}>
            <Text style={{ fontSize: 28, fontWeight: "900", lineHeight: 38, letterSpacing: -0.5, color: "#fff" }}>{story.caption}</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Text style={{ fontSize: 20, fontWeight: "900", color: "#fff" }}>♥ {story.reactions}</Text>
            {story.tags.map((tag) => (
              <View key={tag} style={{ backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: "800", color: "#fff" }}>{tag}</Text>
              </View>
            ))}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ─── Create Story Sheet ───────────────────────────────────────────────────────

function CreateStorySheet({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme();
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}
        onPress={onClose} activeOpacity={1}
      >
        <View style={{ backgroundColor: colors.bgSheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <Image source={MASCOT} style={{ width: 52, height: 52 }} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: "900", color: colors.textPrimary }}>Поділитися успіхом</Text>
              <Text style={{ marginTop: 4, fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>Обери шаблон і надихни інших!</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            {["📚 Я склав теорію", "🚗 Перший урок", "🎓 Я отримав права", "🚙 Моя машина", "🅿️ Паркування", "💡 Порада"].map((tpl) => (
              <TouchableOpacity key={tpl} style={{ borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.bgElevated }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: colors.textPrimary }}>{tpl}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: 18, backgroundColor: colors.bgElevated, borderRadius: 14, padding: 12 }}>
            <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: "600" }}>📎 Медіа upload — після підключення backend</Text>
          </View>

          <TouchableOpacity style={{ marginTop: 16, alignItems: "center" }} onPress={onClose}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: colors.textTertiary }}>Закрити</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Lidyk AI ─────────────────────────────────────────────────────────────────

function LidykAssistant() {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [customQ, setCustomQ] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  async function handleAsk(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setResponse(null);
    setCustomQ("");
    const result = await askLidyk(q);
    setResponse(result.answer);
    setIsFallback(result.mode !== "openai");
    setLoading(false);
  }

  return (
    <Card>
      <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 12 }} onPress={() => setExpanded(v => !v)}>
        <Image source={MASCOT} style={{ width: 48, height: 48 }} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: colors.textPrimary }}>Запитай Лідика</Text>
          <Text style={{ marginTop: 2, fontSize: 12, color: colors.textSecondary, fontWeight: "600" }}>AI-помічник для навчання та підготовки</Text>
        </View>
        <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: "900" }}>{expanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {expanded ? (
        <View style={{ marginTop: 16, gap: 10 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {mascotQuickPrompts.map((p) => (
              <TouchableOpacity key={p} onPress={() => handleAsk(p)} disabled={loading}
                style={{ borderRadius: 999, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.bgElevated }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <TextInput
              style={{ flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontWeight: "600", color: colors.textPrimary, backgroundColor: colors.bgElevated }}
              value={customQ} onChangeText={setCustomQ}
              placeholder="Запитай щось..." placeholderTextColor={colors.textTertiary}
              returnKeyType="send" onSubmitEditing={() => handleAsk(customQ)} editable={!loading}
            />
            <TouchableOpacity
              style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.red, alignItems: "center", justifyContent: "center", opacity: (loading || !customQ.trim()) ? 0.4 : 1 }}
              onPress={() => handleAsk(customQ)} disabled={loading || !customQ.trim()}
            >
              <Text style={{ fontSize: 20, color: "#fff", fontWeight: "900" }}>→</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Image source={MASCOT} style={{ width: 32, height: 32 }} resizeMode="contain" />
              <ActivityIndicator color={colors.red} size="small" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textSecondary }}>Лідик думає...</Text>
            </View>
          ) : null}

          {response && !loading ? (
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: isFallback ? colors.warningSoft : colors.bgElevated, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: isFallback ? colors.warning + "44" : colors.border }}>
              <Image source={MASCOT} style={{ width: 32, height: 32, marginTop: 2 }} resizeMode="contain" />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.textPrimary, lineHeight: 22 }}>{response}</Text>
            </View>
          ) : null}

          <Text style={{ fontSize: 11, color: colors.textTertiary, fontWeight: "600", textAlign: "center" }}>
            {isFallback ? "Підключи інтернет для відповідей від реального Лідика" : "Лідик допомагає з ПДР · Не замінює інструктора"}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function ClubTab() {
  const { colors } = useTheme();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set(clubFeedPosts.filter(p => p.hasLiked).map(p => p.id)));
  const [activeStory, setActiveStory] = useState<ClubStory | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [awardFilter, setAwardFilter] = useState("all");
  const [tipIndex] = useState(Math.floor(Date.now() / 86_400_000) % roadTips.length);

  const mascot = getMascotState(driverClubStreak);
  const isAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === todayChallenge.correctIndex;

  const filteredAwards = awardFilter === "all" ? clubAwards : clubAwards.filter(a => a.group === awardFilter);
  const earnedAwards = filteredAwards.filter(a => a.earned);
  const lockedAwards = filteredAwards.filter(a => !a.earned);

  function toggleLike(postId: string) {
    setLikedPosts(prev => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {activeStory ? <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} /> : null}
      {showCreateStory ? <CreateStorySheet onClose={() => setShowCreateStory(false)} /> : null}

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 110, gap: spacing.md }}>

        {/* Header */}
        <View>
          <Text style={{ color: colors.textPrimary, fontSize: 30, fontWeight: "900", letterSpacing: -0.5 }}>Лідер Клуб</Text>
          <Text style={{ marginTop: 6, color: colors.textSecondary, fontSize: 15, lineHeight: 22 }}>AI-чат, нагороди, тест дня та спільнота</Text>
        </View>

        {/* Stories */}
        <View>
          <Text style={{ fontSize: 20, fontWeight: "900", color: colors.textPrimary, letterSpacing: -0.3, marginBottom: 10 }}>Stories</Text>
          <FlatList
            data={mockStories} horizontal showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            ListHeaderComponent={<AddStoryRing onPress={() => setShowCreateStory(true)} />}
            renderItem={({ item }) => <StoryRing story={item} onPress={() => setActiveStory(item)} />}
            contentContainerStyle={{ paddingRight: 8, gap: 12 }}
          />
        </View>

        {/* Mascot card */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 16, ...shadows.card }}>
          <Image source={MASCOT} style={{ width: 56, height: 56 }} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: "900", color: colors.red, letterSpacing: 0.8, textTransform: "uppercase" }}>ЛІДИК</Text>
            <Text style={{ marginTop: 4, fontSize: 14, fontWeight: "600", color: colors.textPrimary, lineHeight: 20 }}>{mascot.message}</Text>
          </View>
        </View>

        {/* Streak */}
        <Card tone="red">
          <Label variant="inverse">Ваша серія</Label>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, marginBottom: 14 }}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 40, fontWeight: "900", color: "#fff" }}>{driverClubStreak.current}</Text>
              <Text style={{ marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.72)", fontWeight: "700" }}>днів поспіль</Text>
            </View>
            <View style={{ width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.2)" }} />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 40, fontWeight: "900", color: "#fff" }}>{driverClubStreak.best}</Text>
              <Text style={{ marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.72)", fontWeight: "700" }}>найкращий результат</Text>
            </View>
          </View>
          <ProgressBar value={(driverClubStreak.current / driverClubStreak.best) * 100} color="rgba(255,255,255,0.6)" />
          <Text style={{ marginTop: 12, fontSize: 13, color: "rgba(255,255,255,0.72)", fontWeight: "600", textAlign: "center" }}>
            Проходьте щоденний тест — підтримуйте серію
          </Text>
        </Card>

        {/* Daily challenge */}
        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Label>Тест дня</Label>
            <Pill tone={isAnswered ? (isCorrect ? "success" : "warning") : "default"}>
              {isAnswered ? (isCorrect ? "Правильно!" : "Не вірно") : todayChallenge.category}
            </Pill>
          </View>
          <Text style={{ marginTop: 12, fontSize: 16, fontWeight: "800", color: colors.textPrimary, lineHeight: 24 }}>
            {todayChallenge.question}
          </Text>
          <View style={{ marginTop: 14, gap: 8 }}>
            {todayChallenge.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isRight = index === todayChallenge.correctIndex;
              let bg = colors.bgElevated, border = colors.border;
              if (isAnswered && isRight) { bg = colors.successSoft; border = colors.success + "60"; }
              else if (isAnswered && isSelected && !isRight) { bg = colors.redSoft; border = colors.red + "60"; }
              return (
                <TouchableOpacity
                  key={option} disabled={isAnswered}
                  onPress={() => !isAnswered && setSelectedAnswer(index)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: border, backgroundColor: bg }}
                >
                  <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: isAnswered && isRight ? colors.success : isAnswered && isSelected ? colors.red : colors.border, backgroundColor: isAnswered && isRight ? colors.success : isAnswered && isSelected && !isRight ? colors.red : colors.bgCard }}>
                    <Text style={{ color: isAnswered && (isRight || isSelected) ? "#fff" : colors.textPrimary, fontWeight: "900", fontSize: 13, textAlignVertical: "center" }}>
                      {isAnswered && isRight ? "✓" : isAnswered && isSelected && !isRight ? "✕" : String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: "700", color: colors.textPrimary, lineHeight: 20 }}>{option}</Text>
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
          <Text style={{ fontSize: 20, fontWeight: "900", color: colors.textPrimary, letterSpacing: -0.3, marginBottom: 10 }}>Клубна стрічка</Text>
          {clubFeedPosts.map(post => {
            const liked = likedPosts.has(post.id);
            const likeCount = post.likes + (liked && !post.hasLiked ? 1 : !liked && post.hasLiked ? -1 : 0);
            return (
              <View key={post.id} style={{ backgroundColor: colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.red, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: "#fff" }}>{post.author.slice(0, 1)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "900", color: colors.textPrimary }}>{post.author}</Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: "600" }}>{post.role}</Text>
                  </View>
                  <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: post.tagColor + "33" }}>
                    <Text style={{ fontSize: 11, fontWeight: "800", color: post.tagColor }}>{post.tag}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textPrimary, lineHeight: 22 }}>{post.content}</Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  <Text style={{ fontSize: 12, color: colors.textTertiary, fontWeight: "600" }}>{post.timeAgo}</Text>
                  <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 5 }} onPress={() => toggleLike(post.id)}>
                    <Text style={{ fontSize: 16, color: liked ? colors.red : colors.textTertiary }}>♥</Text>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: liked ? colors.red : colors.textSecondary }}>{likeCount}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Awards */}
        <View>
          <Text style={{ fontSize: 20, fontWeight: "900", color: colors.textPrimary, letterSpacing: -0.3, marginBottom: 10 }}>Нагороди</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {Object.keys(AWARD_FILTER_LABELS).map(key => (
              <TouchableOpacity
                key={key} onPress={() => setAwardFilter(key)}
                style={{ borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderColor: awardFilter === key ? colors.red : colors.border, backgroundColor: awardFilter === key ? colors.redSoft : colors.bgElevated }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: awardFilter === key ? colors.red : colors.textSecondary }}>
                  {AWARD_FILTER_LABELS[key]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {earnedAwards.length > 0 ? (
            <>
              <Text style={{ fontSize: 12, fontWeight: "800", color: colors.textTertiary, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 }}>
                Отримано ({earnedAwards.length})
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {earnedAwards.map(award => (
                  <View key={award.id} style={{ width: "47%", borderRadius: 18, padding: 14, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ fontSize: 26 }}>{award.icon}</Text>
                    <Text style={{ marginTop: 6, fontSize: 13, fontWeight: "900", color: colors.textPrimary }}>{award.title}</Text>
                    <Text style={{ marginTop: 3, fontSize: 11, fontWeight: "600", color: colors.textSecondary, lineHeight: 16 }}>{award.description}</Text>
                    {award.earnedAt ? <Text style={{ marginTop: 4, fontSize: 10, fontWeight: "700", color: colors.success }}>{award.earnedAt}</Text> : null}
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {lockedAwards.length > 0 ? (
            <>
              <Text style={{ fontSize: 12, fontWeight: "800", color: colors.textTertiary, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8, marginTop: earnedAwards.length > 0 ? 16 : 0 }}>
                В процесі ({lockedAwards.length})
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {lockedAwards.map(award => (
                  <View key={award.id} style={{ width: "47%", borderRadius: 18, padding: 14, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, opacity: 0.55 }}>
                    <Text style={{ fontSize: 26, opacity: 0.6 }}>{award.icon}</Text>
                    <Text style={{ marginTop: 6, fontSize: 13, fontWeight: "900", color: colors.textSecondary }}>{award.title}</Text>
                    <Text style={{ marginTop: 3, fontSize: 11, fontWeight: "600", color: colors.textSecondary, lineHeight: 16 }}>{award.description}</Text>
                    {award.progress !== undefined && award.maxProgress !== undefined ? (
                      <View style={{ marginTop: 8, gap: 4 }}>
                        <ProgressBar value={(award.progress / award.maxProgress) * 100} color={colors.red} />
                        <Text style={{ fontSize: 10, fontWeight: "700", color: colors.textTertiary }}>{award.progress} / {award.maxProgress}</Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {filteredAwards.length === 0 ? (
            <MascotMessage emoji="🅿️" title="Тут ще пусто" message="Пройди перший тест — і нагороди почнуть з'являтися." />
          ) : null}
        </View>

        {/* Tip of the day */}
        <Card tone="dark">
          <Label>Підказка дня</Label>
          <Text style={{ marginTop: 8, fontSize: 14, fontWeight: "700", color: colors.textPrimary, lineHeight: 22 }}>{roadTips[tipIndex]}</Text>
        </Card>

        {/* Driver checklist */}
        <Card>
          <Label>Чек-лист водія</Label>
          {driverChecklist.map(item => (
            <Row key={item.id} title={item.title} detail={item.detail}
              right={<Pill tone={item.done ? "success" : "default"}>{item.done ? "✓" : "—"}</Pill>}
            />
          ))}
        </Card>

        {/* Referral & discounts */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1, borderRadius: 18, padding: 16, backgroundColor: colors.red }}>
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "900" }}>Реферал</Text>
            <Text style={{ marginTop: 6, color: "rgba(255,255,255,0.74)", fontSize: 13, lineHeight: 18 }}>Запросіть друга — бонус за кожного</Text>
          </View>
          <View style={{ flex: 1, borderRadius: 18, padding: 16, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "900" }}>Знижки</Text>
            <Text style={{ marginTop: 6, color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>Додаткові заняття для випускників</Text>
          </View>
        </View>

        <PrimaryButton onPress={() => setShowCreateStory(true)}>Поділитися успіхом →</PrimaryButton>

      </ScrollView>
    </SafeAreaView>
  );
}
