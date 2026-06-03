import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Card,
  Label,
  Pill,
  PrimaryButton,
  ProgressBar,
  Row
} from "../../components/mobile-ui";
import {
  clubAwards,
  clubFeedPosts,
  driverChecklist,
  driverClubStreak,
  getMascotState,
  roadTips,
  todayChallenge
} from "../../lib/mobile-data";
import { colors } from "../../lib/theme";

export default function ClubTab() {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(
    new Set(clubFeedPosts.filter((p) => p.hasLiked).map((p) => p.id))
  );
  const [tipIndex] = useState(Math.floor(Date.now() / 86_400_000) % roadTips.length);

  const mascot = getMascotState(driverClubStreak);
  const isAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === todayChallenge.correctIndex;

  const earned = clubAwards.filter((a) => a.earned);
  const locked  = clubAwards.filter((a) => !a.earned);

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
      <ScrollView contentContainerStyle={styles.container}>

        {/* Header */}
        <View>
          <Text style={styles.title}>Клуб водія</Text>
          <Text style={styles.subtitle}>Щоденні тести, нагороди та клубна стрічка</Text>
        </View>

        {/* Mascot card */}
        <View style={styles.mascotCard}>
          <Text style={styles.mascotEmoji}>{mascot.emoji}</Text>
          <View style={styles.mascotBubble}>
            <Text style={styles.mascotName}>Лідик</Text>
            <Text style={styles.mascotMessage}>{mascot.message}</Text>
          </View>
        </View>

        {/* Streak */}
        <Card tone="green">
          <Label inverse>Ваша серія</Label>
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
          <ProgressBar value={(driverClubStreak.current / driverClubStreak.best) * 100} color="rgba(255,255,255,0.5)" />
          <Text style={styles.streakHint}>
            Проходьте щоденний тест — підтримуйте серію
          </Text>
        </Card>

        {/* Daily challenge */}
        <Card>
          <View style={styles.challengeHeader}>
            <Label>Тест дня</Label>
            <Pill tone={isAnswered ? (isCorrect ? "success" : "warning") : "neutral"}>
              {isAnswered ? (isCorrect ? "Правильно!" : "Не вірно") : todayChallenge.category}
            </Pill>
          </View>
          <Text style={styles.question}>{todayChallenge.question}</Text>
          <View style={styles.options}>
            {todayChallenge.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isRight = index === todayChallenge.correctIndex;
              let bg: string = colors.background;
              if (isAnswered && isRight) bg = "#e8f5ee";
              if (isAnswered && isSelected && !isRight) bg = "#fef3f2";
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.option, { backgroundColor: bg }]}
                  onPress={() => !isAnswered && setSelectedAnswer(index)}
                  disabled={isAnswered}
                >
                  <Text style={[styles.optionLetter, isAnswered && isRight && styles.correctLetter]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {isAnswered && (
            <View style={[styles.explanation, { backgroundColor: isCorrect ? "#e8f5ee" : "#fff8ec" }]}>
              <Text style={styles.explanationText}>{todayChallenge.explanation}</Text>
            </View>
          )}
        </Card>

        {/* Club feed */}
        <View>
          <Text style={styles.sectionHeading}>Клубна стрічка</Text>
          {clubFeedPosts.map((post) => {
            const liked = likedPosts.has(post.id);
            const likeCount = post.likes + (liked && !post.hasLiked ? 1 : !liked && post.hasLiked ? -1 : 0);
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
                  <View style={[styles.feedTag, { backgroundColor: post.tagColor }]}>
                    <Text style={styles.feedTagText}>{post.tag}</Text>
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
          <Text style={styles.sectionHeading}>Нагороди Лідер Клубу</Text>
          {earned.length > 0 && (
            <>
              <Text style={styles.awardGroupLabel}>Отримано ({earned.length})</Text>
              <View style={styles.awardsGrid}>
                {earned.map((award) => (
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
          <Text style={[styles.awardGroupLabel, { marginTop: 16 }]}>В процесі ({locked.length})</Text>
          <View style={styles.awardsGrid}>
            {locked.map((award) => (
              <View key={award.id} style={[styles.awardCard, styles.awardLocked]}>
                <Text style={[styles.awardIcon, styles.awardIconLocked]}>{award.icon}</Text>
                <Text style={[styles.awardTitle, styles.awardTitleLocked]}>{award.title}</Text>
                <Text style={styles.awardDesc}>{award.description}</Text>
                {award.progress !== undefined && award.maxProgress !== undefined ? (
                  <View style={styles.awardProgressWrap}>
                    <ProgressBar value={(award.progress / award.maxProgress) * 100} color={colors.green} />
                    <Text style={styles.awardProgressText}>{award.progress} / {award.maxProgress}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        {/* Tip of the day */}
        <Card tone="yellow">
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
              right={<Pill tone={item.done ? "success" : "neutral"}>{item.done ? "✓" : "—"}</Pill>}
            />
          ))}
        </Card>

        {/* Referral */}
        <View style={styles.insightRow}>
          <View style={[styles.insightCard, { backgroundColor: colors.green }]}>
            <Text style={styles.insightTitle}>Реферал</Text>
            <Text style={styles.insightDetail}>Запросіть друга — бонус за кожного</Text>
          </View>
          <View style={[styles.insightCard, { backgroundColor: colors.yellow }]}>
            <Text style={[styles.insightTitle, { color: colors.graphite }]}>Знижки</Text>
            <Text style={[styles.insightDetail, { color: colors.graphite }]}>Додаткові заняття для випускників</Text>
          </View>
        </View>

        <PrimaryButton>Поділитися кодом {"→"}</PrimaryButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingBottom: 110, gap: 16 },
  title: { color: colors.graphite, fontSize: 30, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { marginTop: 6, color: colors.muted, fontSize: 15, lineHeight: 22 },

  // Mascot
  mascotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16
  },
  mascotEmoji: { fontSize: 40 },
  mascotBubble: { flex: 1 },
  mascotName: { fontSize: 11, fontWeight: "900", color: colors.green, letterSpacing: 0.8, textTransform: "uppercase" },
  mascotMessage: { marginTop: 4, fontSize: 14, fontWeight: "600", color: colors.graphite, lineHeight: 20 },

  // Streak
  streakRow: { flexDirection: "row", alignItems: "center", marginTop: 12, marginBottom: 14 },
  streakBlock: { flex: 1, alignItems: "center" },
  streakNumber: { fontSize: 40, fontWeight: "900", color: colors.white },
  streakLabel: { marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.72)", fontWeight: "700" },
  streakDivider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.2)" },
  streakHint: { marginTop: 12, fontSize: 13, color: "rgba(255,255,255,0.72)", fontWeight: "600", textAlign: "center" },

  // Challenge
  challengeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  question: { marginTop: 12, fontSize: 16, fontWeight: "800", color: colors.graphite, lineHeight: 24 },
  options: { marginTop: 14, gap: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.line,
    textAlign: "center",
    textAlignVertical: "center",
    fontWeight: "900",
    fontSize: 13,
    color: colors.graphite,
    overflow: "hidden"
  },
  correctLetter: { backgroundColor: "#14733d", color: colors.white },
  optionText: { flex: 1, fontSize: 14, fontWeight: "700", color: colors.graphite, lineHeight: 20 },
  explanation: { marginTop: 12, borderRadius: 14, padding: 12 },
  explanationText: { fontSize: 13, fontWeight: "600", color: colors.graphite, lineHeight: 20 },

  // Section heading
  sectionHeading: { fontSize: 20, fontWeight: "900", color: colors.graphite, letterSpacing: -0.3, marginBottom: 10 },

  // Feed
  feedCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 10
  },
  feedHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  feedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center"
  },
  feedAvatarText: { fontSize: 16, fontWeight: "900", color: colors.white },
  feedAuthorBlock: { flex: 1 },
  feedAuthor: { fontSize: 13, fontWeight: "900", color: colors.graphite },
  feedRole: { fontSize: 11, color: colors.muted, fontWeight: "600" },
  feedTag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  feedTagText: { fontSize: 11, fontWeight: "800", color: colors.graphite },
  feedContent: { fontSize: 14, fontWeight: "600", color: colors.graphite, lineHeight: 22 },
  feedFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  feedTime: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  likeButton: { flexDirection: "row", alignItems: "center", gap: 5 },
  likeIcon: { fontSize: 16, color: colors.muted },
  likeIconActive: { color: "#e53e3e" },
  likeCount: { fontSize: 13, fontWeight: "800", color: colors.muted },
  likeCountActive: { color: "#e53e3e" },

  // Awards
  awardGroupLabel: { fontSize: 12, fontWeight: "800", color: colors.muted, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 },
  awardsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  awardCard: {
    width: "47%",
    borderRadius: 18,
    padding: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line
  },
  awardLocked: { opacity: 0.55 },
  awardIcon: { fontSize: 26 },
  awardIconLocked: { opacity: 0.6 },
  awardTitle: { marginTop: 6, fontSize: 13, fontWeight: "900", color: colors.graphite },
  awardTitleLocked: { color: colors.muted },
  awardDesc: { marginTop: 3, fontSize: 11, fontWeight: "600", color: colors.muted, lineHeight: 16 },
  awardDate: { marginTop: 4, fontSize: 10, fontWeight: "700", color: colors.green },
  awardProgressWrap: { marginTop: 8, gap: 4 },
  awardProgressText: { fontSize: 10, fontWeight: "700", color: colors.muted },

  // Tip
  tipText: { marginTop: 8, fontSize: 14, fontWeight: "700", color: colors.graphite, lineHeight: 22 },

  // Insight row
  insightRow: { flexDirection: "row", gap: 12 },
  insightCard: { flex: 1, borderRadius: 18, padding: 16 },
  insightTitle: { color: colors.white, fontSize: 17, fontWeight: "900" },
  insightDetail: { marginTop: 6, color: "rgba(255,255,255,0.74)", fontSize: 13, lineHeight: 18 }
});
