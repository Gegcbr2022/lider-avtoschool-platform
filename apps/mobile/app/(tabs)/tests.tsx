import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Label, ProgressBar } from "../../components/mobile-ui";
import { askLidyk } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { recordTestCompletion } from "../../lib/firestore";
import {
  getCategoryQuestions,
  getRandomQuestions,
  PDR_QUESTIONS,
  type PDRQuestion,
} from "../../lib/pdr-questions";
import { radii, shadows, spacing, useTheme } from "../../lib/theme";

const MASCOT = require("../../assets/mascot.png") as number;

type QuizState = "idle" | "running" | "done";

// ─── PDR categories for the menu ─────────────────────────────────────────────
const PDR_CATEGORIES = [
  { icon: "🎯", name: "Знаки", label: "Дорожні знаки", desc: "Попереджувальні, заборонні, інформаційні", color: "#e63946" },
  { icon: "↔️", name: "Пріоритет", label: "Пріоритет", desc: "Хто має перевагу у типових ситуаціях", color: "#ffb703" },
  { icon: "🛣️", name: "Швидкість", label: "Швидкість", desc: "Обмеження та контроль швидкості", color: "#2a9d8f" },
  { icon: "🚦", name: "Перехрестя", label: "Перехрестя", desc: "Регульовані та нерегульовані", color: "#f4a261" },
  { icon: "🛑", name: "Зупинка", label: "Стоянка і зупинка", desc: "Де можна і де заборонено", color: "#e76f51" },
  { icon: "📏", name: "Розмітка", label: "Розмітка", desc: "Горизонтальна та вертикальна", color: "#457b9d" },
  { icon: "🛡️", name: "Безпека", label: "Безпека руху", desc: "Дистанція, обгін, маневри", color: "#6a4c93" },
  { icon: "🅿️", name: "Стоянка", label: "Паркування", desc: "Стоянка, зупинка, місця заборони", color: "#118ab2" },
  { icon: "🚶", name: "Пішоходи", label: "Пішоходи", desc: "Переходи, пріоритет і безпечний проїзд", color: "#06d6a0" },
  { icon: "🏙️", name: "Місто", label: "Міський рух", desc: "Особливості руху у місті", color: "#1d3557" },
];

// ─── Mini-games definition ────────────────────────────────────────────────────
const MINI_GAMES = [
  { icon: "⚠️", category: "Знаки", label: "Знаки на швидкість", desc: "Швидко впізнавай знаки та їх вимоги", difficulty: "Легкий", duration: "2–4 хв", benefit: "Тренує реакцію та пам'ять" },
  { icon: "↔️", category: "Перехрестя", label: "Хто має перевагу?", desc: "Відпрацюй пріоритет у конфліктних точках", difficulty: "Середній", duration: "3–5 хв", benefit: "Найчастіша помилка на іспиті" },
  { icon: "🅿️", category: "Стоянка", label: "Паркування", desc: "Де можна стояти, зупинятися і чекати", difficulty: "Середній", duration: "3–5 хв", benefit: "Уникни штрафів у місті" },
  { icon: "⚡", category: "Безпека", label: "Реакція водія", desc: "Ризики, дистанція, обгін і аварійні ситуації", difficulty: "Легкий", duration: "2–4 хв", benefit: "Допомагає не панікувати" },
  { icon: "🏙️", category: "Безпека", label: "Дорожня ситуація", desc: "Типові сценарії міського руху", difficulty: "Середній", duration: "3–5 хв", benefit: "Переносить правила на дорогу" },
  { icon: "🚦", category: "Перехрестя", label: "Перехрестя", desc: "Регульовані, нерегульовані, круговий рух", difficulty: "Важкий", duration: "4–6 хв", benefit: "Топ-3 питань іспиту" },
  { icon: "🔎", category: "Безпека", label: "Знайди помилку", desc: "Визнач порушення у короткій ситуації", difficulty: "Середній", duration: "3–5 хв", benefit: "Прокачує уважність" },
  { icon: "🚥", category: "Перехрестя", label: "Світлофор", desc: "Сигнали, додаткові секції, регулювальник", difficulty: "Легкий", duration: "2–4 хв", benefit: "Швидкі бали на іспиті" },
  { icon: "🔄", category: "Безпека", label: "Маневр", desc: "Перестроювання, поворот, розворот, обгін", difficulty: "Середній", duration: "3–5 хв", benefit: "Менше помилок на практиці" },
  { icon: "🏁", category: "exam", label: "Екзамен-бліц", desc: "5 випадкових питань без довгого режиму", difficulty: "Легкий", duration: "1–2 хв", benefit: "Швидка перевірка перед уроком" },
];

const RIGHTS_CATEGORIES = [
  { code: "A / A1", label: "Мото", active: false },
  { code: "B", label: "Легкове авто", active: true },
  { code: "C", label: "Вантажне", active: false },
  { code: "D", label: "Автобус", active: false },
  { code: "BE / CE", label: "Причепи", active: false },
];

function PdrVisual({ category }: { category: string }) {
  const { colors } = useTheme();
  const isIntersection = category === "Перехрестя" || category === "Пріоритет";
  const isSigns = category === "Знаки";
  const isParking = category === "Стоянка" || category === "Зупинка";
  const accent = isSigns ? "#e63946" : isIntersection ? "#f4a261" : isParking ? "#118ab2" : colors.red;

  return (
    <View style={{ borderRadius: radii.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 }}>
      <View style={{ height: 112, borderRadius: radii.sm, backgroundColor: colors.bgElevated, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
        {isSigns ? (
          <View style={{ width: 90, height: 78, borderRadius: 12, borderWidth: 7, borderColor: accent, transform: [{ rotate: "45deg" }], alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
            <Text style={{ transform: [{ rotate: "-45deg" }], color: "#111", fontSize: 24, fontWeight: "900" }}>!</Text>
          </View>
        ) : isIntersection ? (
          <>
            <View style={{ position: "absolute", width: "100%", height: 28, backgroundColor: "#495057" }} />
            <View style={{ position: "absolute", height: "100%", width: 28, backgroundColor: "#495057" }} />
            <View style={{ position: "absolute", width: 8, height: 92, backgroundColor: "#f8f9fa", opacity: 0.8 }} />
            <View style={{ position: "absolute", height: 8, width: 92, backgroundColor: "#f8f9fa", opacity: 0.8 }} />
            <Text style={{ position: "absolute", right: 22, top: 16, fontSize: 24 }}>🚗</Text>
            <Text style={{ position: "absolute", left: 24, bottom: 16, fontSize: 24 }}>🚙</Text>
          </>
        ) : isParking ? (
          <>
            <View style={{ position: "absolute", left: 18, right: 18, top: 52, height: 34, backgroundColor: "#495057", borderRadius: 4 }} />
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={{ position: "absolute", left: 26 + i * 48, top: 56, width: 2, height: 26, backgroundColor: "#f8f9fa" }} />
            ))}
            <View style={{ width: 54, height: 54, borderRadius: 12, backgroundColor: accent, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#fff", fontSize: 30, fontWeight: "900" }}>P</Text>
            </View>
          </>
        ) : (
          <>
            <View style={{ position: "absolute", width: "100%", height: 44, backgroundColor: "#495057" }} />
            <View style={{ position: "absolute", width: "78%", height: 4, backgroundColor: "#f8f9fa", opacity: 0.85 }} />
            <Text style={{ fontSize: 38 }}>🚗</Text>
          </>
        )}
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "700", lineHeight: 18 }}>
        Візуальна підказка до теми: {category}. Розбери схему перед відповіддю.
      </Text>
    </View>
  );
}

// ─── Lidyk Explanation Modal ──────────────────────────────────────────────────

function LidykExplainModal({
  question, options, correctIndex, onClose,
}: {
  question: string; options: string[]; correctIndex: number; onClose: () => void;
}) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function askForExplanation() {
    setLoading(true);
    setError(false);
    const prompt = `Поясни питання ПДР:\n"${question}"\nВаріанти: ${options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(", ")}. Правильна відповідь: ${String.fromCharCode(65 + correctIndex)}) ${options[correctIndex]}.\nПоясни коротко чому саме ця відповідь правильна. Відповідай українською.`;
    const result = await askLidyk(prompt, user?.id ?? null);
    if (result.errorType) {
      setError(true);
    } else {
      setResponse(result.answer);
    }
    setLoading(false);
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }} onPress={onClose}>
        <View style={{ backgroundColor: colors.bgSheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, borderTopWidth: 1, borderTopColor: colors.border, maxHeight: "85%" }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 20 }} />

          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Image source={MASCOT} style={{ width: 48, height: 48 }} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: "900", color: colors.textPrimary }}>Лідик пояснює</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>AI-роз'яснення правила ПДР</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 22, color: colors.textTertiary }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Question context */}
          <View style={{ backgroundColor: colors.bgElevated, borderRadius: radii.sm, padding: 12, marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, lineHeight: 18 }} numberOfLines={3}>{question}</Text>
            <Text style={{ marginTop: 6, fontSize: 13, fontWeight: "800", color: colors.success }}>
              ✓ {options[correctIndex]}
            </Text>
          </View>

          {/* Ask button or response */}
          {!response && !loading ? (
            <TouchableOpacity
              onPress={askForExplanation}
              style={{ backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 16, alignItems: "center", ...shadows.red }}
            >
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>🚗 Поясни, Лідику!</Text>
            </TouchableOpacity>
          ) : null}

          {loading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border }}>
              <Image source={MASCOT} style={{ width: 40, height: 40 }} resizeMode="contain" />
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: colors.textPrimary }}>Лідик думає...</Text>
                <ActivityIndicator color={colors.red} size="small" style={{ alignSelf: "flex-start" }} />
              </View>
            </View>
          ) : null}

          {response ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                  <Image source={MASCOT} style={{ width: 40, height: 40, marginTop: 2 }} resizeMode="contain" />
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.textPrimary, lineHeight: 22 }}>
                    {response}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => { setResponse(null); askForExplanation(); }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: colors.bgElevated, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textTertiary }}>🔄 Запитати ще раз</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : null}

          {error ? (
            <View style={{ backgroundColor: colors.warningSoft, borderRadius: radii.md, padding: 14, borderWidth: 1, borderColor: colors.warning + "44" }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.warning }}>
                Не вдалось отримати відповідь. Перевір з'єднання і спробуй знову.
              </Text>
              <TouchableOpacity onPress={askForExplanation} style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.warning }}>🔄 Спробувати знову</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Quiz Screen ─────────────────────────────────────────────────────────────

function QuizScreen({
  questions, onFinish, onExit,
}: {
  questions: PDRQuestion[];
  onFinish: (correct: number, total: number) => void;
  onExit: () => void;
}) {
  const { colors } = useTheme();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [showExplanation, setShowExplanation] = useState(false);
  const [showLidyk, setShowLidyk] = useState(false);

  if (!questions.length) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
        <Text style={{ fontSize: 56, marginBottom: 16 }}>🚗</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900", textAlign: "center" }}>Питань за цим фільтром немає</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: "center" }}>Спробуй інший розділ або режим «Екзамен».</Text>
        <Pressable onPress={onExit} style={{ marginTop: 24, backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 14, paddingHorizontal: 32 }}>
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>← До тренажеру</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const q = questions[current];
  if (!q) {
    const correct = answers.filter((a, i) => a !== null && a === questions[i]?.correctIndex).length;
    onFinish(correct, questions.length);
    return null;
  }

  const isAnswered = selected !== null;
  const isCorrect = selected === q.correctIndex;
  const isLast = current === questions.length - 1;
  const progress = (current / questions.length) * 100;

  function handleSelect(idx: number) {
    if (isAnswered) return;
    setSelected(idx);
    const next = [...answers];
    next[current] = idx;
    setAnswers(next);
    setShowExplanation(true);
  }

  function handleNext() {
    if (isLast) {
      const correct = answers.filter((a, i) => a !== null && a === questions[i]?.correctIndex).length;
      onFinish(correct, questions.length);
    } else {
      setCurrent(current + 1);
      setSelected(null);
      setShowExplanation(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {showLidyk ? (
        <LidykExplainModal
          question={q.question}
          options={q.options}
          correctIndex={q.correctIndex}
          onClose={() => setShowLidyk(false)}
        />
      ) : null}

      {/* Header */}
      <View style={{ padding: spacing.md, gap: 8, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Pressable onPress={onExit} hitSlop={12}>
            <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "700" }}>✕ Вийти</Text>
          </Pressable>
          <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 13 }}>{current + 1} / {questions.length}</Text>
          <View style={{ backgroundColor: colors.bgElevated, borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "700" }}>{q.category}</Text>
          </View>
        </View>
        <ProgressBar value={progress} color={colors.red} height={6} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 140 }}>
        <PdrVisual category={q.category} />

        {/* Question */}
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "800", lineHeight: 26 }}>{q.question}</Text>

        {/* Options */}
        <View style={{ gap: 10 }}>
          {q.options.map((option, idx) => {
            const isRight = idx === q.correctIndex;
            const isWrong = isAnswered && idx === selected && !isRight;
            let bg: string = colors.bgCard, border: string = colors.border, textColor: string = colors.textPrimary;
            if (isAnswered) {
              if (isRight) { bg = colors.successSoft; border = colors.success; textColor = colors.success; }
              else if (isWrong) { bg = colors.redSoft; border = colors.red; textColor = colors.red; }
            }
            return (
              <Pressable
                key={idx} onPress={() => handleSelect(idx)} disabled={isAnswered}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radii.md, backgroundColor: bg, borderWidth: 1.5, borderColor: border }}
              >
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isAnswered && isRight ? colors.success : isAnswered && isWrong ? colors.red : colors.bgElevated, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: isAnswered && (isRight || isWrong) ? "#fff" : colors.textSecondary, fontWeight: "900", fontSize: 14 }}>
                    {isAnswered && isRight ? "✓" : isAnswered && isWrong ? "✕" : String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <Text style={{ flex: 1, color: textColor, fontWeight: "600", fontSize: 15, lineHeight: 22 }}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Explanation */}
        {showExplanation ? (
          <View style={{ backgroundColor: isCorrect ? colors.successSoft : colors.warningSoft, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: isCorrect ? colors.success + "44" : colors.warning + "44", gap: 10 }}>
            <Text style={{ color: isCorrect ? colors.success : colors.warning, fontWeight: "900", fontSize: 14 }}>
              {isCorrect ? "✅ Правильно!" : "⚠️ Неправильно"}
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 14, lineHeight: 20 }}>{q.explanation}</Text>

            {/* Ask Lidyk button */}
            <TouchableOpacity
              onPress={() => setShowLidyk(true)}
              style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.bgCard, borderRadius: radii.sm, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, alignSelf: "flex-start" }}
            >
              <Image source={MASCOT} style={{ width: 24, height: 24 }} resizeMode="contain" />
              <Text style={{ fontSize: 13, fontWeight: "800", color: colors.textPrimary }}>Запитати Лідика</Text>
            </TouchableOpacity>
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
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
              {isLast ? "Завершити тест →" : "Наступне питання →"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// ─── Results Screen ───────────────────────────────────────────────────────────

function ResultScreen({ correct, total, onRestart, onBack }: {
  correct: number; total: number; onRestart: () => void; onBack: () => void;
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
        <View style={{ backgroundColor: passed ? colors.successSoft : colors.warningSoft, borderRadius: radii.lg, padding: spacing.xl, alignItems: "center", gap: spacing.sm, width: "100%", borderWidth: 1, borderColor: passed ? colors.success + "44" : colors.warning + "44" }}>
          <Text style={{ color: passed ? colors.success : colors.warning, fontSize: 56, fontWeight: "900" }}>{percent}%</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "700" }}>{correct} / {total} правильних</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center" }}>
            {passed ? "Відмінний результат! Ти готовий до іспиту ПДР." : "Для складання іспиту потрібно 75%+. Продовжуй тренуватись!"}
          </Text>
        </View>
        <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, flexDirection: "row", gap: 12, alignItems: "flex-start", borderWidth: 1, borderColor: colors.border, width: "100%" }}>
          <Text style={{ fontSize: 32 }}>{passed ? "🚗💨" : "🚗📚"}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.red, fontWeight: "900", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 }}>ЛІДИК</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 14, lineHeight: 20, marginTop: 4 }}>
              {passed ? "Чудово! Запиши результат. Покажи мені після реального іспиту 🎉" : "Не здавайся! Повтори слабкі теми — я підкажу де тренуватись 💪"}
            </Text>
          </View>
        </View>
        <View style={{ gap: 10, width: "100%" }}>
          <Pressable onPress={onRestart} style={{ backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 16, alignItems: "center", shadowColor: colors.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }}>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Спробувати ще раз 🔄</Text>
          </Pressable>
          <Pressable onPress={onBack} style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" }}>
            <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 15 }}>← До тренажеру</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

type SubView = "menu" | "categories" | "minigames";

export default function TestsTab() {
  const { colors } = useTheme();
  const { user, mode } = useAuth();
  const [quizState, setQuizState] = useState<QuizState>("idle");
  const [questions, setQuestions] = useState<PDRQuestion[]>([]);
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [subView, setSubView] = useState<SubView>("menu");

  const startExam = useCallback(() => {
    const qs = getRandomQuestions(20);
    if (!qs.length) return;
    setQuestions(qs); setResult(null); setActiveCategory(null); setQuizState("running");
  }, []);

  const startCategoryTest = useCallback((category: string) => {
    let qs = getCategoryQuestions(category, 10);
    if (!qs.length) qs = getRandomQuestions(10);
    setQuestions(qs); setResult(null); setActiveCategory(category); setQuizState("running");
  }, []);

  const handleFinish = useCallback((correct: number, total: number) => {
    setResult({ correct, total }); setQuizState("done");
    if (mode === "authenticated" && user && !user.isGuest) {
      void recordTestCompletion(user.id, { correct, total }).catch(() => {});
    }
  }, [user, mode]);

  const handleRestart = useCallback(() => {
    activeCategory ? startCategoryTest(activeCategory) : startExam();
  }, [activeCategory, startExam, startCategoryTest]);

  if (quizState === "running") {
    return <QuizScreen questions={questions} onFinish={handleFinish} onExit={() => setQuizState("idle")} />;
  }
  if (quizState === "done" && result) {
    return <ResultScreen correct={result.correct} total={result.total} onRestart={handleRestart} onBack={() => { setQuizState("idle"); setSubView("menu"); }} />;
  }

  // ─── Category browser ───────────────────────────────────────────────────────
  if (subView === "categories") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgCard }}>
          <Pressable onPress={() => setSubView("menu")} hitSlop={12} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 20, color: colors.textPrimary, fontWeight: "700" }}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "900", color: colors.textPrimary }}>Тренування по темах</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>10 питань на тему</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: 10, paddingBottom: 100 }}>
          {PDR_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.name} onPress={() => startCategoryTest(cat.name)}
              style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: cat.color + "18", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 24 }}>{cat.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textPrimary }}>{cat.label}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{cat.desc}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: "800", color: cat.color, textTransform: "uppercase", letterSpacing: 0.5 }}>10 питань</Text>
                <Text style={{ fontSize: 18, color: colors.textTertiary }}>›</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Mini-games browser ─────────────────────────────────────────────────────
  if (subView === "minigames") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgCard }}>
          <Pressable onPress={() => setSubView("menu")} hitSlop={12} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 20, color: colors.textPrimary, fontWeight: "700" }}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "900", color: colors.textPrimary }}>Міні-ігри</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>Цільові тренування по слабких темах</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: 12, paddingBottom: 100 }}>
          <View style={{ backgroundColor: colors.bgElevated, borderRadius: radii.md, padding: 14, borderWidth: 1, borderColor: colors.border, flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Text style={{ fontSize: 22 }}>💡</Text>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: "600", color: colors.textSecondary, lineHeight: 19 }}>
              Міні-ігри — короткі тренування на конкретну тему. Ідеально щоб підтягнути слабкі місця.
            </Text>
          </View>
          {MINI_GAMES.map((g) => {
            const diffColor = g.difficulty === "Легкий" ? colors.success : g.difficulty === "Важкий" ? colors.red : colors.warning;
            return (
              <Pressable
                key={g.label} onPress={() => g.category === "exam" ? (setQuestions(getRandomQuestions(5)), setResult(null), setActiveCategory(null), setQuizState("running")) : startCategoryTest(g.category)}
                style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}
              >
                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                    <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: colors.bgElevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }}>
                      <Text style={{ fontSize: 26 }}>{g.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "900", color: colors.textPrimary }}>{g.label}</Text>
                      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 3, lineHeight: 18 }}>{g.desc}</Text>
                      <View style={{ flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        <View style={{ borderRadius: 999, backgroundColor: diffColor + "18", paddingHorizontal: 10, paddingVertical: 4 }}>
                          <Text style={{ fontSize: 11, fontWeight: "800", color: diffColor }}>{g.difficulty}</Text>
                        </View>
                        <View style={{ borderRadius: 999, backgroundColor: colors.bgElevated, paddingHorizontal: 10, paddingVertical: 4 }}>
                          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary }}>⏱ {g.duration}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgElevated }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.red }}>✨ {g.benefit}</Text>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: colors.red }}>Почати →</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Main menu ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 100 }}>
        <View style={{ paddingTop: 4 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 }}>ПДР Тренажер</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4, lineHeight: 20 }}>
            Готуйся до іспиту з поясненнями від Лідика
          </Text>
        </View>

        {/* Exam mode — hero button */}
        <Pressable
          onPress={startExam}
          style={{ backgroundColor: colors.red, borderRadius: radii.lg, padding: spacing.lg, shadowColor: colors.red, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 }}
        >
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.2 }}>🏁 ІСПИТ ЯК У МВС</Text>
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 6, letterSpacing: -0.5 }}>Екзаменаційний тест</Text>
          <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4, lineHeight: 19 }}>
            20 питань · 75%+ для складання · пояснення Лідика
          </Text>
          <View style={{ marginTop: 16, backgroundColor: "rgba(255,255,255,0.22)", borderRadius: radii.md, paddingVertical: 13, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>🚀 Почати іспит</Text>
          </View>
        </Pressable>

        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "900" }}>Категорії прав</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {RIGHTS_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.code}
                onPress={cat.active ? () => setSubView("categories") : undefined}
                disabled={!cat.active}
                style={{
                  minWidth: "30%",
                  flexGrow: 1,
                  borderRadius: radii.md,
                  padding: 12,
                  backgroundColor: cat.active ? colors.bgCard : colors.bgElevated,
                  borderWidth: 1,
                  borderColor: cat.active ? colors.red + "55" : colors.border,
                  opacity: cat.active ? 1 : 0.65,
                }}
              >
                <Text style={{ color: cat.active ? colors.red : colors.textSecondary, fontWeight: "900", fontSize: 15 }}>{cat.code}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "700", marginTop: 2 }}>
                  {cat.active ? cat.label : `${cat.label} · скоро`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Швидкий старт */}
        <Pressable
          onPress={() => startCategoryTest("Знаки")}
          style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadows.card }}
        >
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 24 }}>⚡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: colors.textPrimary }}>Швидкий старт</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>10 питань · знаки пріоритету</Text>
          </View>
          <Text style={{ fontSize: 18, color: colors.textTertiary }}>›</Text>
        </Pressable>

        {/* Category browser */}
        <Pressable
          onPress={() => setSubView("categories")}
          style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadows.card }}
        >
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#457b9d" + "18", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 24 }}>📚</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: colors.textPrimary }}>Тренування по темах</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              {PDR_CATEGORIES.length} тем · знаки, перехрестя, швидкість...
            </Text>
          </View>
          <Text style={{ fontSize: 18, color: colors.textTertiary }}>›</Text>
        </Pressable>

        {/* Mini-games */}
        <Pressable
          onPress={() => setSubView("minigames")}
          style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadows.card }}
        >
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#f4a261" + "18", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 24 }}>🎮</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: colors.textPrimary }}>Міні-ігри</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              {MINI_GAMES.length} ігор · 2–6 хв кожна · цільові теми
            </Text>
          </View>
          <Text style={{ fontSize: 18, color: colors.textTertiary }}>›</Text>
        </Pressable>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: 4 }}>
            <Text style={{ color: colors.red, fontSize: 26, fontWeight: "900" }}>{PDR_QUESTIONS.length}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "700", textAlign: "center" }}>Питань у банку</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: 4 }}>
            <Text style={{ color: result ? (result.correct / result.total >= 0.75 ? colors.success : colors.warning) : colors.textTertiary, fontSize: 26, fontWeight: "900" }}>
              {result ? `${Math.round((result.correct / result.total) * 100)}%` : "—"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "700", textAlign: "center" }}>Останній тест</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: 4 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: "900" }}>75%</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "700", textAlign: "center" }}>Мінімум МВС</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
