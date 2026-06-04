import { useState, useCallback } from "react";
import { Pressable, StyleSheet, Text, View, ScrollView, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Label, PrimaryButton, ProgressBar, SecondaryButton } from "../../components/mobile-ui";
import { getRandomQuestions, getCategoryQuestions, PDR_QUESTIONS, type PDRQuestion } from "../../lib/pdr-questions";
import { testCategories } from "../../lib/mobile-data";
import { useTheme, radii, spacing } from "../../lib/theme";

type QuizState = "idle" | "running" | "review" | "done";

// ─── Quiz session ─────────────────────────────────────────────────────────────

function QuizScreen({
  questions,
  onFinish,
}: {
  questions: PDRQuestion[];
  onFinish: (correct: number, total: number) => void;
}) {
  const { colors } = useTheme();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [showExplanation, setShowExplanation] = useState(false);

  const q = questions[current];
  const isAnswered = selected !== null;
  const isCorrect = selected === q.correctIndex;
  const isLast = current === questions.length - 1;

  function handleSelect(idx: number) {
    if (isAnswered) return;
    setSelected(idx);
    const newAnswers = [...answers];
    newAnswers[current] = idx;
    setAnswers(newAnswers);
    setShowExplanation(true);
  }

  function handleNext() {
    if (isLast) {
      const correct = answers.filter((a, i) => a === questions[i].correctIndex).length;
      onFinish(correct, questions.length);
    } else {
      setCurrent(current + 1);
      setSelected(null);
      setShowExplanation(false);
    }
  }

  const progress = ((current) / questions.length) * 100;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{ padding: spacing.md, gap: 8, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 13 }}>
            Питання {current + 1} / {questions.length}
          </Text>
          <View style={{ backgroundColor: colors.bgElevated, borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "700" }}>{q.category}</Text>
          </View>
        </View>
        <ProgressBar value={progress} color={colors.red} height={6} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 120 }}>
        {/* Question */}
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "800", lineHeight: 26 }}>
          {q.question}
        </Text>

        {/* Options */}
        <View style={{ gap: 10 }}>
          {q.options.map((option, idx) => {
            const isRight = idx === q.correctIndex;
            const isWrong = isAnswered && idx === selected && !isRight;

            let bg = colors.bgCard;
            let border = colors.border;
            let textColor = colors.textPrimary;

            if (isAnswered) {
              if (isRight) { bg = colors.successSoft; border = colors.success; textColor = colors.success; }
              else if (isWrong) { bg = colors.redSoft; border = colors.red; textColor = colors.red; }
            } else if (selected === idx) {
              bg = colors.redSoft; border = colors.red;
            }

            return (
              <Pressable
                key={idx}
                onPress={() => handleSelect(idx)}
                disabled={isAnswered}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  borderRadius: radii.md,
                  backgroundColor: bg,
                  borderWidth: 1.5,
                  borderColor: border,
                }}
              >
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isAnswered && isRight ? colors.success : isAnswered && isWrong ? colors.red : colors.bgElevated,
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Text style={{
                    color: isAnswered && (isRight || isWrong) ? colors.white : colors.textSecondary,
                    fontWeight: "900",
                    fontSize: 14,
                  }}>
                    {isAnswered && isRight ? "✓" : isAnswered && isWrong ? "✕" : String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <Text style={{ flex: 1, color: textColor, fontWeight: "600", fontSize: 15, lineHeight: 22 }}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Explanation */}
        {showExplanation ? (
          <View style={{
            backgroundColor: isCorrect ? colors.successSoft : colors.warningSoft,
            borderRadius: radii.md,
            padding: 16,
            borderWidth: 1,
            borderColor: isCorrect ? colors.success + "44" : colors.warning + "44",
            gap: 6,
          }}>
            <Text style={{ color: isCorrect ? colors.success : colors.warning, fontWeight: "900", fontSize: 14 }}>
              {isCorrect ? "✅ Правильно!" : "⚠️ Неправильно"}
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 14, lineHeight: 20 }}>
              {q.explanation}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Next button */}
      {isAnswered ? (
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: spacing.md, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Pressable
            onPress={handleNext}
            style={{ backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 16, alignItems: "center", shadowColor: colors.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }}
          >
            <Text style={{ color: colors.white, fontWeight: "800", fontSize: 16 }}>
              {isLast ? "Завершити тест →" : "Наступне питання →"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// ─── Results screen ───────────────────────────────────────────────────────────

function ResultScreen({
  correct,
  total,
  onRestart,
  onBack,
}: {
  correct: number;
  total: number;
  onRestart: () => void;
  onBack: () => void;
}) {
  const { colors } = useTheme();
  const percent = Math.round((correct / total) * 100);
  const passed = percent >= 75;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, alignItems: "center", paddingTop: 60 }}>
        <Text style={{ fontSize: 64 }}>{passed ? "🏆" : "📚"}</Text>

        <Text style={{ color: colors.textPrimary, fontSize: 32, fontWeight: "900", textAlign: "center", letterSpacing: -0.5 }}>
          {passed ? "Молодець!" : "Потренуйся ще!"}
        </Text>

        {/* Score */}
        <View style={{ backgroundColor: passed ? colors.successSoft : colors.warningSoft, borderRadius: radii.lg, padding: spacing.xl, alignItems: "center", gap: spacing.sm, width: "100%", borderWidth: 1, borderColor: passed ? colors.success + "44" : colors.warning + "44" }}>
          <Text style={{ color: passed ? colors.success : colors.warning, fontSize: 56, fontWeight: "900" }}>
            {percent}%
          </Text>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "700" }}>
            {correct} / {total} правильних
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center" }}>
            {passed
              ? "Відмінний результат! Ти готовий до іспиту ПДР."
              : "Для складання іспиту потрібно 75%+. Продовжуй тренуватись!"}
          </Text>
        </View>

        {/* Lidyk message */}
        <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, flexDirection: "row", gap: 12, alignItems: "flex-start", borderWidth: 1, borderColor: colors.border, width: "100%" }}>
          <Text style={{ fontSize: 32 }}>🚗</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.red, fontWeight: "900", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 }}>ЛІДИК</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 14, lineHeight: 20, marginTop: 4 }}>
              {passed
                ? "Чудово! Запиши результат і покажи мені знову після реального іспиту 🎉"
                : "Не здавайся! Повтори слабкі теми — я підкажу де тренуватись 💪"}
            </Text>
          </View>
        </View>

        <View style={{ gap: 10, width: "100%" }}>
          <Pressable
            onPress={onRestart}
            style={{ backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 16, alignItems: "center", shadowColor: colors.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }}
          >
            <Text style={{ color: colors.white, fontWeight: "800", fontSize: 16 }}>Спробувати ще раз 🔄</Text>
          </Pressable>

          <Pressable
            onPress={onBack}
            style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" }}
          >
            <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 15 }}>← До тренажеру</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function TestsTab() {
  const { colors } = useTheme();
  const [quizState, setQuizState] = useState<QuizState>("idle");
  const [questions, setQuestions] = useState<PDRQuestion[]>([]);
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  function startExam() {
    setQuestions(getRandomQuestions(20));
    setResult(null);
    setActiveCategory(null);
    setQuizState("running");
  }

  function startCategoryTest(category: string) {
    setQuestions(getCategoryQuestions(category, 10));
    setResult(null);
    setActiveCategory(category);
    setQuizState("running");
  }

  function handleFinish(correct: number, total: number) {
    setResult({ correct, total });
    setQuizState("done");
  }

  function handleRestart() {
    if (activeCategory) {
      startCategoryTest(activeCategory);
    } else {
      startExam();
    }
  }

  // ─── Quiz running ──────────────────────────────────────────────────────────
  if (quizState === "running") {
    return (
      <QuizScreen
        questions={questions}
        onFinish={handleFinish}
      />
    );
  }

  // ─── Quiz done ─────────────────────────────────────────────────────────────
  if (quizState === "done" && result) {
    return (
      <ResultScreen
        correct={result.correct}
        total={result.total}
        onRestart={handleRestart}
        onBack={() => setQuizState("idle")}
      />
    );
  }

  // ─── Idle (main screen) ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 100 }}>
        {/* Header */}
        <View>
          <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 }}>
            ПДР Тренажер
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4, lineHeight: 20 }}>
            Екзаменаційний режим: 20 питань, таймер, пояснення помилок.
          </Text>
        </View>

        {/* Exam card */}
        <Pressable
          onPress={startExam}
          style={{ backgroundColor: colors.red, borderRadius: radii.md, padding: spacing.lg, shadowColor: colors.red, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 }}
        >
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 }}>РЕЖИМ</Text>
          <Text style={{ color: colors.white, fontSize: 26, fontWeight: "900", marginTop: 6, letterSpacing: -0.5 }}>
            Екзамен: 20 питань
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 14, marginTop: 6, lineHeight: 20 }}>
            Останній результат: 85% · {PDR_QUESTIONS.length} питань у банку
          </Text>
          <View style={{ marginTop: 16, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: radii.md, paddingVertical: 12, alignItems: "center" }}>
            <Text style={{ color: colors.white, fontWeight: "800", fontSize: 16 }}>🚀 Почати іспит</Text>
          </View>
        </Pressable>

        {/* Categories */}
        <View>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>
            За категоріями
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {testCategories.map((category) => (
              <Pressable
                key={category}
                onPress={() => startCategoryTest(category)}
                style={{
                  borderRadius: radii.full,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  backgroundColor: colors.bgElevated,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 14 }}>{category}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Quick games */}
        <Card>
          <Label>Міні-ігри</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {[
              { icon: "🚦", name: "Світлофор", desc: "Сигнали" },
              { icon: "🅿️", name: "Паркування", desc: "Правила" },
              { icon: "⚠️", name: "Знаки", desc: "Впізнавання" },
              { icon: "📍", name: "Розмітка", desc: "Значення" },
            ].map((g) => (
              <Pressable
                key={g.name}
                onPress={() => startCategoryTest(g.name)}
                style={{ width: "47%", backgroundColor: colors.bgElevated, borderRadius: radii.md, padding: 14, borderWidth: 1, borderColor: colors.border }}
              >
                <Text style={{ fontSize: 24 }}>{g.icon}</Text>
                <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 14, marginTop: 6 }}>{g.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{g.desc}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Stats */}
        <Card tone="dark">
          <Label>Статистика</Label>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
            <View style={{ flex: 1, alignItems: "center", padding: 14, backgroundColor: colors.bgCard, borderRadius: radii.sm }}>
              <Text style={{ color: colors.red, fontSize: 24, fontWeight: "900" }}>0</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, textAlign: "center" }}>Тестів пройдено</Text>
            </View>
            <View style={{ flex: 1, alignItems: "center", padding: 14, backgroundColor: colors.bgCard, borderRadius: radii.sm }}>
              <Text style={{ color: colors.red, fontSize: 24, fontWeight: "900" }}>—</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, textAlign: "center" }}>Найкращий результат</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
