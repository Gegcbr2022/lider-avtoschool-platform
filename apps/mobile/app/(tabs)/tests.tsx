import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Label, ProgressBar } from "../../components/mobile-ui";
import { askLidyk } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { createFirestoreId, createStory, recordTestCompletion } from "../../lib/firestore";
import { loadAppSettings } from "../../lib/app-settings";
import {
  getCategoryQuestions,
  getLicenseQuestionCount,
  getQuestionsByIds,
  getQuestionsForLicense,
  getTopicQuestionCount,
  getRandomQuestions,
  getStratifiedExamQuestions,
  PDR_QUESTIONS,
  type DrivingLicenseCategory,
  type PDRQuestion,
  type PdrVisualKind,
} from "../../lib/pdr-questions";
import {
  clearMarathonState,
  getTopicPercent,
  loadMarathonState,
  loadPdrProgress,
  recordPdrSession,
  saveMarathonState,
  type PdrMarathonState,
  type PdrProgressState,
  type PdrQuizMode,
} from "../../lib/pdr-progress";
import { uploadStoryMedia } from "../../lib/storage";
import { radii, shadows, spacing, useTheme } from "../../lib/theme";

const MASCOT = require("../../assets/mascot.png") as number;

type QuizState = "idle" | "running" | "done";
const EXAM_DURATION_SECONDS = 20 * 60;

type QuizFinishPayload = {
  correct: number;
  total: number;
  answers: Array<number | null>;
  questions: PDRQuestion[];
  mode: PdrQuizMode;
  licenseCategory: DrivingLicenseCategory;
  timedOut: boolean;
  elapsedSeconds: number;
};

type QuizMeta = {
  mode: PdrQuizMode;
  title: string;
  licenseCategory: DrivingLicenseCategory;
  category?: string | null;
  initialCurrent?: number;
  initialAnswers?: Array<number | null>;
};

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function buildProtocol(payload: QuizFinishPayload) {
  const wrong = payload.total - payload.correct;
  const answered = payload.answers.filter((answer) => answer !== null).length;
  const percent = payload.total ? Math.round((payload.correct / payload.total) * 100) : 0;
  return {
    mode: payload.mode,
    licenseCategory: payload.licenseCategory,
    correct: payload.correct,
    total: payload.total,
    wrong,
    answered,
    percent,
    passedByMvs: wrong <= 2 && !payload.timedOut && payload.total === 20,
    timedOut: payload.timedOut,
    elapsedSeconds: payload.elapsedSeconds,
    finishedAt: new Date().toISOString(),
  };
}

// ─── PDR categories for the menu ─────────────────────────────────────────────
const PDR_CATEGORIES = [
  { icon: "🎯", name: "Знаки", label: "Дорожні знаки", desc: "Попереджувальні, заборонні, інформаційні", color: "#e63946" },
  { icon: "↔️", name: "Пріоритет", label: "Пріоритет", desc: "Хто має перевагу у типових ситуаціях", color: "#ffb703" },
  { icon: "🛣️", name: "Швидкість", label: "Швидкість", desc: "Обмеження та контроль швидкості", color: "#2a9d8f" },
  { icon: "🚦", name: "Перехрестя", label: "Перехрестя", desc: "Регульовані та нерегульовані", color: "#f4a261" },
  { icon: "🛑", name: "Зупинка", label: "Стоянка і зупинка", desc: "Де можна і де заборонено", color: "#e76f51" },
  { icon: "📏", name: "Розмітка", label: "Розмітка", desc: "Горизонтальна та вертикальна", color: "#457b9d" },
  { icon: "🛡️", name: "Безпека", label: "Безпека руху", desc: "Дистанція, обгін, маневри", color: "#6a4c93" },
  { icon: "↩️", name: "Маневр", label: "Маневри", desc: "Повороти, перестроювання, причепи і габарити", color: "#7c3aed" },
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

const RIGHTS_CATEGORIES: Array<{ code: string; label: string; value: DrivingLicenseCategory; accent: string }> = [
  { code: "A", label: "Мото", value: "A", accent: "#f59e0b" },
  { code: "A1", label: "Легкі мото", value: "A1", accent: "#fb923c" },
  { code: "B", label: "Легкове авто", value: "B", accent: "#e63946" },
  { code: "C", label: "Вантажне", value: "C", accent: "#2a9d8f" },
  { code: "D", label: "Автобус", value: "D", accent: "#457b9d" },
  { code: "BE", label: "Причеп B", value: "BE", accent: "#8b5cf6" },
  { code: "CE", label: "Причеп C", value: "CE", accent: "#6a4c93" },
];

function PdrVisual({ question }: { question: PDRQuestion }) {
  const { colors } = useTheme();
  const kind: PdrVisualKind = question.visual?.kind
    ?? (question.category === "Перехрестя" ? "stop"
      : question.category === "Пріоритет" ? "priorityRoad"
        : question.category === "Швидкість" ? "speedLimit"
          : question.category === "Стоянка" || question.category === "Зупинка" ? "noParking"
            : question.category === "Пішоходи" ? "pedestrianCrossing"
              : question.category === "Місто" ? "settlement"
                : "danger");
  const hasCrosswalk = kind === "pedestrianCrossing" || kind === "pedestrianCrossingInfo" || kind === "pedestrianCycleCrossing";
  const hasIntersection = kind === "roundabout" || kind === "stop" || kind === "giveWay" || kind === "priorityRoad" || kind === "endPriorityRoad";

  const roundSign = (content: string, options?: { bg?: string; color?: string; border?: string; slash?: boolean }) => (
    <View style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: options?.bg ?? "#fff", borderWidth: 8, borderColor: options?.border ?? "#e63946", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 8, elevation: 2 }}>
      <Text style={{ color: options?.color ?? "#111827", fontSize: content.length > 2 ? 22 : 30, fontWeight: "900" }}>{content}</Text>
      {options?.slash ? <View style={{ position: "absolute", width: 86, height: 6, borderRadius: 3, backgroundColor: "#e63946", transform: [{ rotate: "-45deg" }] }} /> : null}
    </View>
  );

  const blueSign = (content: string) => (
    <View style={{ width: 82, height: 82, borderRadius: 18, backgroundColor: "#1d4ed8", borderWidth: 5, borderColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 8, elevation: 2 }}>
      <Text style={{ color: "#fff", fontSize: content.length > 2 ? 21 : 30, fontWeight: "900" }}>{content}</Text>
    </View>
  );

  const renderSign = () => {
    switch (kind) {
      case "giveWay":
        return (
          <View style={{ width: 88, height: 76, borderRadius: 18, backgroundColor: "#fff", borderWidth: 8, borderColor: "#e63946", alignItems: "center", justifyContent: "center", transform: [{ rotate: "180deg" }] }}>
            <Text style={{ color: "#e63946", fontSize: 22, fontWeight: "900", transform: [{ rotate: "180deg" }] }}>YIELD</Text>
          </View>
        );
      case "stop":
        return (
          <View style={{ width: 86, height: 86, borderRadius: 24, backgroundColor: "#d90429", borderWidth: 6, borderColor: "#fff", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>STOP</Text>
          </View>
        );
      case "priorityRoad":
      case "endPriorityRoad":
        return (
          <View style={{ width: 74, height: 74, borderRadius: 10, backgroundColor: "#facc15", borderWidth: 7, borderColor: "#fff", transform: [{ rotate: "45deg" }], alignItems: "center", justifyContent: "center" }}>
            {kind === "endPriorityRoad" ? <View style={{ position: "absolute", width: 92, height: 6, borderRadius: 3, backgroundColor: "#111827", transform: [{ rotate: "0deg" }] }} /> : null}
          </View>
        );
      case "noEntry":
        return roundSign("", { bg: "#e63946", border: "#e63946", color: "#fff" });
      case "speedLimit":
        return roundSign("50");
      case "noStopping":
        return roundSign("X", { bg: "#1d4ed8", border: "#e63946", color: "#fff", slash: true });
      case "noParking":
        return roundSign("P", { bg: "#1d4ed8", border: "#e63946", color: "#fff", slash: true });
      case "straightOnly":
        return blueSign("↑");
      case "roundabout":
        return blueSign("↻");
      case "pedestrianCrossingInfo":
        return blueSign("PED");
      case "settlement":
        return (
          <View style={{ width: 112, height: 70, borderRadius: 8, backgroundColor: "#fff", borderWidth: 4, borderColor: "#111827", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#111827", fontSize: 18, fontWeight: "900" }}>МІСТО</Text>
            <Text style={{ color: "#111827", fontSize: 15, fontWeight: "900" }}>50</Text>
          </View>
        );
      case "hospital":
        return blueSign("H");
      case "gasStation":
        return blueSign("АЗС");
      case "pedestrianCrossing":
      case "pedestrianCycleCrossing":
        return (
          <View style={{ width: 82, height: 82, borderRadius: 18, backgroundColor: "#facc15", borderWidth: 7, borderColor: "#111827", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#111827", fontSize: 25, fontWeight: "900" }}>{kind === "pedestrianCycleCrossing" ? "BIKE" : "PED"}</Text>
          </View>
        );
      default:
        return (
          <View style={{ width: 86, height: 74, borderRadius: 12, borderWidth: 7, borderColor: "#e63946", transform: [{ rotate: "45deg" }], alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
            <Text style={{ transform: [{ rotate: "-45deg" }], color: "#111827", fontSize: 28, fontWeight: "900" }}>!</Text>
          </View>
        );
    }
  };

  return (
    <View style={{ borderRadius: radii.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 }}>
      <View style={{ height: 174, borderRadius: radii.sm, backgroundColor: "#cfe8f7", overflow: "hidden" }}>
        <View style={{ position: "absolute", left: 0, right: 0, top: 0, height: 78, backgroundColor: "#dbeafe" }} />
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 96, backgroundColor: "#364152" }} />
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 46, height: 4, backgroundColor: "#f8fafc", opacity: 0.9 }} />
        {hasIntersection ? (
          <>
            <View style={{ position: "absolute", left: "44%", top: 0, bottom: 0, width: 58, backgroundColor: "#364152" }} />
            <View style={{ position: "absolute", left: "50%", top: 10, bottom: 10, width: 4, backgroundColor: "#f8fafc", opacity: 0.75 }} />
          </>
        ) : null}
        {hasCrosswalk ? (
          <View style={{ position: "absolute", left: 130, right: 20, bottom: 28, flexDirection: "row", justifyContent: "space-between" }}>
            {[0, 1, 2, 3, 4].map((stripe) => (
              <View key={stripe} style={{ width: 14, height: 58, borderRadius: 3, backgroundColor: "#f8fafc" }} />
            ))}
          </View>
        ) : null}
        {(kind === "noParking" || kind === "noStopping") ? (
          <View style={{ position: "absolute", left: 118, right: 22, bottom: 24, height: 44, borderRadius: 8, borderWidth: 2, borderColor: "#f8fafc", borderStyle: "dashed" }} />
        ) : null}
        <View style={{ position: "absolute", left: 42, top: 54, width: 5, height: 86, borderRadius: 3, backgroundColor: "#6b7280" }} />
        <View style={{ position: "absolute", left: 14, top: 20, width: 92, height: 92, alignItems: "center", justifyContent: "center" }}>
          {renderSign()}
        </View>
        <View style={{ position: "absolute", right: 28, bottom: 29, width: 86, height: 34, borderRadius: 10, backgroundColor: "#e63946", borderWidth: 3, borderColor: "#fee2e2" }}>
          <View style={{ position: "absolute", left: 12, top: 7, width: 20, height: 10, borderRadius: 4, backgroundColor: "#bfdbfe" }} />
          <View style={{ position: "absolute", right: 12, top: 7, width: 20, height: 10, borderRadius: 4, backgroundColor: "#bfdbfe" }} />
          <View style={{ position: "absolute", left: 10, bottom: -9, width: 18, height: 18, borderRadius: 9, backgroundColor: "#111827" }} />
          <View style={{ position: "absolute", right: 10, bottom: -9, width: 18, height: 18, borderRadius: 9, backgroundColor: "#111827" }} />
        </View>
      </View>
      <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "900", lineHeight: 18 }}>
        {question.visual?.label ?? question.category}
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
    const result = await askLidyk(prompt, user);
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
  questions, meta, onFinish, onExit, onSnapshot,
}: {
  questions: PDRQuestion[];
  meta: QuizMeta;
  onFinish: (payload: QuizFinishPayload) => void;
  onExit: () => void;
  onSnapshot?: (state: { currentIndex: number; answers: Array<number | null> }) => void;
}) {
  const { colors } = useTheme();
  const initialAnswers = useMemo(() => {
    const seed = meta.initialAnswers?.slice(0, questions.length) ?? [];
    while (seed.length < questions.length) seed.push(null);
    return seed;
  }, [meta.initialAnswers, questions.length]);
  const [current, setCurrent] = useState(Math.min(meta.initialCurrent ?? 0, Math.max(questions.length - 1, 0)));
  const [selected, setSelected] = useState<number | null>(initialAnswers[Math.min(meta.initialCurrent ?? 0, Math.max(questions.length - 1, 0))] ?? null);
  const [answers, setAnswers] = useState<(number | null)[]>(initialAnswers);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showLidyk, setShowLidyk] = useState(false);
  const [visualHints, setVisualHints] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(meta.mode === "exam" ? EXAM_DURATION_SECONDS : null);
  const startedAt = useRef(Date.now());
  const finishedRef = useRef(false);

  useEffect(() => {
    loadAppSettings().then(settings => setVisualHints(settings.visualHints)).catch(() => {});
  }, []);

  function finishQuiz(timedOut = false, finalAnswers = answers) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const correct = finalAnswers.filter((a, i) => a !== null && a === questions[i]?.correctIndex).length;
    onFinish({
      correct,
      total: questions.length,
      answers: finalAnswers,
      questions,
      mode: meta.mode,
      licenseCategory: meta.licenseCategory,
      timedOut,
      elapsedSeconds: Math.round((Date.now() - startedAt.current) / 1000),
    });
  }

  useEffect(() => {
    if (remainingSeconds === null || finishedRef.current) return;
    if (remainingSeconds <= 0) {
      finishQuiz(true);
      return;
    }
    const timer = setTimeout(() => setRemainingSeconds((value) => value === null ? null : value - 1), 1000);
    return () => clearTimeout(timer);
  }, [remainingSeconds]);

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
    finishQuiz(false, answers);
    return null;
  }

  const isAnswered = selected !== null;
  const isCorrect = selected === q.correctIndex;
  const isLast = current === questions.length - 1;
  const progress = ((current + (isAnswered ? 1 : 0)) / questions.length) * 100;

  function handleSelect(idx: number) {
    if (isAnswered) return;
    setSelected(idx);
    const next = [...answers];
    next[current] = idx;
    setAnswers(next);
    onSnapshot?.({ currentIndex: current, answers: next });
    setShowExplanation(true);
  }

  function handleNext() {
    if (isLast) {
      finishQuiz(false, answers);
    } else {
      const nextIndex = current + 1;
      setCurrent(nextIndex);
      setSelected(answers[nextIndex] ?? null);
      onSnapshot?.({ currentIndex: nextIndex, answers });
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
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            {remainingSeconds !== null ? (
              <Text style={{ color: remainingSeconds <= 60 ? colors.red : colors.textPrimary, fontSize: 13, fontWeight: "900" }}>
                {formatDuration(remainingSeconds)}
              </Text>
            ) : null}
            <View style={{ backgroundColor: colors.bgElevated, borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "700" }}>{q.category}</Text>
            </View>
          </View>
        </View>
        <ProgressBar value={progress} color={colors.red} height={6} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 140 }}>
        {visualHints ? <PdrVisual question={q} /> : null}

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

function ResultStorySheet({
  correct,
  total,
  percent,
  passed,
  onClose,
}: {
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [text, setText] = useState(
    `Мій результат у ПДР-тренажері Лідер: ${correct}/${total} (${percent}%). ${passed ? "Лідик каже: можна йти до складніших білетів." : "Лідик вже підготував мені план повторення."}`
  );
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [pickingImage, setPickingImage] = useState(false);
  const [publishing, setPublishing] = useState(false);

  async function handlePickImage() {
    if (pickingImage || publishing) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Доступ потрібен", "Дозволь доступ до фото, щоб додати картинку в сторис.");
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
    if (!user || !text.trim() || publishing) return;
    setPublishing(true);
    try {
      const storyId = createFirestoreId("stories");
      let uploaded: Awaited<ReturnType<typeof uploadStoryMedia>> | null = null;
      if (selectedImage) {
        uploaded = await uploadStoryMedia(storyId, selectedImage.uri);
      }
      await createStory({
        id: storyId,
        authorId: user.id,
        authorName: user.name ?? "Учень",
        authorEmoji: user.avatarEmoji,
        text: text.trim(),
        tone: passed ? "green" : "yellow",
        tags: ["ПДР", `${percent}%`],
        mediaUrl: uploaded?.downloadURL,
        mediaPath: uploaded?.storagePath,
        mediaType: uploaded ? "image" : undefined,
        fileName: selectedImage?.fileName ?? (uploaded ? `pdr-result-${Date.now()}.jpg` : undefined),
        fileSize: selectedImage?.fileSize ?? uploaded?.fileSize,
        width: selectedImage?.width,
        height: selectedImage?.height,
        status: "published",
        visibility: "school",
      });
      Alert.alert("Готово", "Результат опубліковано в сторис Лідер Клубу.");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert("Помилка", `Не вдалося викласти сторис.\n${__DEV__ ? msg : "Перевір інтернет і спробуй ще раз."}`);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} onPress={onClose} />
        <View style={{ backgroundColor: colors.bgSheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 46, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 18 }} />
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900" }}>Сторис з результатом</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
            Додай фото з уроку, дороги або себе після тренування. Лідик підпише результат акуратно.
          </Text>

          <View style={{ marginTop: 16, backgroundColor: colors.bgCard, borderRadius: radii.sm, borderWidth: 1.5, borderColor: colors.border, padding: 14 }}>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              maxLength={300}
              placeholder="Текст сторис"
              placeholderTextColor={colors.textTertiary}
              style={{ minHeight: 88, color: colors.textPrimary, fontSize: 15, lineHeight: 21, textAlignVertical: "top" }}
            />
            <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "700", textAlign: "right", marginTop: 6 }}>{text.length}/300</Text>
          </View>

          {selectedImage ? (
            <View style={{ marginTop: 14, borderRadius: radii.sm, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
              <Image source={{ uri: selectedImage.uri }} style={{ width: "100%", height: 150 }} resizeMode="cover" />
              <TouchableOpacity
                onPress={() => setSelectedImage(null)}
                style={{ position: "absolute", top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>×</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={pickingImage || publishing}
              style={{ marginTop: 14, borderRadius: radii.sm, borderWidth: 1.5, borderColor: colors.border, paddingVertical: 13, alignItems: "center", backgroundColor: colors.bgCard }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "900" }}>
                {pickingImage ? "Відкриваємо галерею..." : "Додати фото"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handlePublish}
            disabled={!text.trim() || publishing}
            style={{ marginTop: 14, backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 16, alignItems: "center", opacity: !text.trim() || publishing ? 0.5 : 1 }}
          >
            {publishing ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>Опублікувати в сторис</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ResultScreen({ result, onRestart, onBack, onMistakes }: {
  result: QuizFinishPayload;
  onRestart: () => void;
  onBack: () => void;
  onMistakes: () => void;
}) {
  const { colors } = useTheme();
  const { user, mode } = useAuth();
  const { correct, total } = result;
  const percent = Math.round((correct / total) * 100);
  const protocol = buildProtocol(result);
  const passed = result.mode === "exam" ? protocol.passedByMvs : percent >= 75;
  const [showShare, setShowShare] = useState(true);
  const [showMascotGuide, setShowMascotGuide] = useState(true);
  const [showStorySheet, setShowStorySheet] = useState(false);

  useEffect(() => {
    loadAppSettings()
      .then(settings => {
        setShowShare(settings.shareResults);
        setShowMascotGuide(settings.mascotGuide);
      })
      .catch(() => {});
  }, []);

  async function handleShare() {
    await Share.share({
      title: "Мій результат ПДР",
      message: `Я пройшов ПДР-тренажер у Лідер: ${correct}/${total} (${percent}%). ${passed ? "Готовий до іспиту!" : "Ще потренуюсь і доб'ю результат."}`,
    }).catch(() => {});
  }

  function handleOpenStorySheet() {
    if (mode !== "authenticated" || !user || user.isGuest) {
      Alert.alert("Потрібен акаунт", "Увійди в акаунт, щоб викладати сторис у Лідер Клубі.");
      return;
    }
    setShowStorySheet(true);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {showStorySheet ? (
        <ResultStorySheet
          correct={correct}
          total={total}
          percent={percent}
          passed={passed}
          onClose={() => setShowStorySheet(false)}
        />
      ) : null}
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, alignItems: "center", paddingTop: 60 }}>
        <Text style={{ fontSize: 64 }}>{passed ? "🏆" : "📚"}</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 32, fontWeight: "900", textAlign: "center", letterSpacing: -0.5 }}>
          {passed ? "Молодець!" : "Потренуйся ще!"}
        </Text>
        <View style={{ backgroundColor: passed ? colors.successSoft : colors.warningSoft, borderRadius: radii.lg, padding: spacing.xl, alignItems: "center", gap: spacing.sm, width: "100%", borderWidth: 1, borderColor: passed ? colors.success + "44" : colors.warning + "44" }}>
          <Text style={{ color: passed ? colors.success : colors.warning, fontSize: 56, fontWeight: "900" }}>{percent}%</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "700" }}>{correct} / {total} правильних</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center" }}>
            {result.mode === "exam"
              ? (passed ? "Екзамен складено за правилом МВС: максимум дві помилки." : "Для складання екзамену МВС потрібно не більше двох помилок.")
              : (passed ? "Відмінний результат! Ти готовий до іспиту ПДР." : "Для тренувального заліку потрібно 75%+. Продовжуй тренуватись!")}
          </Text>
        </View>
        {result.mode === "exam" ? (
          <View style={{ width: "100%", backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "900" }}>Протокол МВС</Text>
              <View style={{ backgroundColor: passed ? colors.successSoft : colors.redSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: passed ? colors.success : colors.red, fontSize: 11, fontWeight: "900" }}>
                  {passed ? "СКЛАДЕНО" : "НЕ СКЛАДЕНО"}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1, backgroundColor: colors.bgElevated, borderRadius: radii.sm, padding: 12 }}>
                <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800" }}>Помилки</Text>
                <Text style={{ color: protocol.wrong <= 2 ? colors.success : colors.red, fontSize: 22, fontWeight: "900", marginTop: 2 }}>
                  {protocol.wrong}/2
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.bgElevated, borderRadius: radii.sm, padding: 12 }}>
                <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800" }}>Час</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "900", marginTop: 2 }}>
                  {formatDuration(protocol.elapsedSeconds)}
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.bgElevated, borderRadius: radii.sm, padding: 12 }}>
                <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800" }}>Відповіді</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "900", marginTop: 2 }}>
                  {protocol.answered}/{protocol.total}
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
              Реальний режим: 20 питань, 20 хвилин, складання при максимум двох помилках.
              {protocol.timedOut ? " Час вийшов, протокол автоматично завершено." : ""}
            </Text>
          </View>
        ) : null}
        {showMascotGuide ? (
          <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, flexDirection: "row", gap: 12, alignItems: "flex-start", borderWidth: 1, borderColor: colors.border, width: "100%" }}>
            <Text style={{ fontSize: 32 }}>{passed ? "🚗💨" : "🚗📚"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.red, fontWeight: "900", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 }}>ЛІДИК</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 14, lineHeight: 20, marginTop: 4 }}>
                {passed ? "Чудово! Запиши результат. Покажи мені після реального іспиту 🎉" : "Не здавайся! Повтори слабкі теми — я підкажу де тренуватись 💪"}
              </Text>
            </View>
          </View>
        ) : null}
        <View style={{ gap: 10, width: "100%" }}>
          <Pressable onPress={onRestart} style={{ backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 16, alignItems: "center", shadowColor: colors.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }}>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Спробувати ще раз 🔄</Text>
          </Pressable>
          <Pressable onPress={onMistakes} style={{ borderWidth: 1.5, borderColor: colors.warning + "77", backgroundColor: colors.warningSoft, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" }}>
            <Text style={{ color: colors.warning, fontWeight: "800", fontSize: 15 }}>Робота над помилками</Text>
          </Pressable>
          <Pressable onPress={handleOpenStorySheet} style={{ borderWidth: 1.5, borderColor: colors.success + "77", backgroundColor: colors.successSoft, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" }}>
            <Text style={{ color: colors.success, fontWeight: "800", fontSize: 15 }}>Викласти в сторис з фото</Text>
          </Pressable>
          {showShare ? (
            <Pressable onPress={handleShare} style={{ borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bgCard, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" }}>
              <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 15 }}>Поділитися через месенджер</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onBack} style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" }}>
            <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 15 }}>← До тренажеру</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Progress Overview ────────────────────────────────────────────────────────

function ProgressOverview({
  progressState, licenseCategory, onStartCategory,
}: {
  progressState: PdrProgressState;
  licenseCategory: DrivingLicenseCategory;
  onStartCategory: (cat: string) => void;
}) {
  const { colors } = useTheme();

  const topics = Object.values(progressState.topicProgress);
  if (!topics.length) return null;

  // Sort: lowest accuracy first (weak topics up top)
  const sorted = [...topics].sort((a, b) => getTopicPercent(a) - getTopicPercent(b));
  const weakTopics = sorted.filter(t => getTopicPercent(t) < 80).slice(0, 3);
  const overallSeen = topics.reduce((sum, t) => sum + t.seen, 0);
  const overallCorrect = topics.reduce((sum, t) => sum + t.correct, 0);
  const overallPercent = overallSeen > 0 ? Math.round((overallCorrect / overallSeen) * 100) : 0;

  const msg = weakTopics.length
    ? `Підтягни ${weakTopics.map(t => t.category).join(", ")} — там найбільше помилок.`
    : overallPercent >= 85
      ? "Ти на відмінному рівні. Спробуй екзамен МВС!"
      : "Продовжуй тренуватись. Лідик стежить за прогресом.";

  return (
    <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "900" }}>Лідик рекомендує</Text>
        <View style={{ backgroundColor: overallPercent >= 75 ? colors.successSoft : colors.warningSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ color: overallPercent >= 75 ? colors.success : colors.warning, fontSize: 12, fontWeight: "900" }}>
            {overallPercent}% загальний
          </Text>
        </View>
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>{msg}</Text>

      {weakTopics.length > 0 ? (
        <View style={{ gap: 8 }}>
          {weakTopics.map(t => {
            const pct = getTopicPercent(t);
            const catDef = PDR_CATEGORIES.find(c => c.name === t.category);
            return (
              <Pressable
                key={t.category}
                onPress={() => onStartCategory(t.category)}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.bgElevated, borderRadius: radii.sm, padding: 10 }}
              >
                <Text style={{ fontSize: 20 }}>{catDef?.icon ?? "📋"}</Text>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: colors.textPrimary }}>{t.category}</Text>
                    <Text style={{ fontSize: 12, fontWeight: "900", color: pct < 60 ? colors.red : colors.warning }}>{pct}%</Text>
                  </View>
                  <ProgressBar value={pct} color={pct < 60 ? colors.red : colors.warning} height={4} />
                </View>
                <Text style={{ fontSize: 14, color: colors.textTertiary }}>›</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

type SubView = "menu" | "categories" | "minigames";

export default function TestsTab() {
  const { colors } = useTheme();
  const { user, mode } = useAuth();
  const [quizState, setQuizState] = useState<QuizState>("idle");
  const [questions, setQuestions] = useState<PDRQuestion[]>([]);
  const [result, setResult] = useState<QuizFinishPayload | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [subView, setSubView] = useState<SubView>("menu");
  const [licenseCategory, setLicenseCategory] = useState<DrivingLicenseCategory>("B");
  const [quizMeta, setQuizMeta] = useState<QuizMeta>({ mode: "exam", title: "Екзамен", licenseCategory: "B" });
  const [progressState, setProgressState] = useState<PdrProgressState>({ mistakes: {}, topicProgress: {} });
  const [marathonState, setMarathonState] = useState<PdrMarathonState | null>(null);
  const selectedLicense = RIGHTS_CATEGORIES.find((cat) => cat.value === licenseCategory) ?? RIGHTS_CATEGORIES[1];
  const scopeId = user?.id ?? "guest";
  const mistakeCount = Object.values(progressState.mistakes).filter((mistake) => mistake.licenseCategory === licenseCategory).length;

  useEffect(() => {
    let alive = true;
    void loadPdrProgress(scopeId).then((state) => {
      if (alive) setProgressState(state);
    }).catch(() => {});
    void loadMarathonState(scopeId).then((state) => {
      if (alive) setMarathonState(state);
    }).catch(() => {});
    return () => { alive = false; };
  }, [scopeId]);

  const launchQuiz = useCallback((qs: PDRQuestion[], meta: QuizMeta) => {
    if (!qs.length) return;
    setQuizMeta(meta);
    setQuestions(qs);
    setResult(null);
    setActiveCategory(meta.category ?? null);
    setQuizState("running");
  }, []);

  const startExam = useCallback(() => {
    const qs = getStratifiedExamQuestions(20, licenseCategory);
    launchQuiz(qs, { mode: "exam", title: "Екзамен МВС", licenseCategory });
  }, [licenseCategory, launchQuiz]);

  const startCategoryTest = useCallback((category: string) => {
    let qs = getCategoryQuestions(category, 10, licenseCategory);
    if (!qs.length) qs = getRandomQuestions(10, licenseCategory);
    launchQuiz(qs, { mode: "topic", title: category, licenseCategory, category });
  }, [licenseCategory, launchQuiz]);

  const startMiniQuiz = useCallback((category: string, count = 5) => {
    const qs = category === "exam" ? getRandomQuestions(count, licenseCategory) : getCategoryQuestions(category, count, licenseCategory);
    launchQuiz(qs.length ? qs : getRandomQuestions(count, licenseCategory), { mode: "mini", title: "Міні-тренування", licenseCategory, category: category === "exam" ? null : category });
  }, [licenseCategory, launchQuiz]);

  const startMistakes = useCallback(() => {
    const freshWrongIds = result?.questions
      .filter((question, index) => result.licenseCategory === licenseCategory && result.answers[index] !== null && result.answers[index] !== question.correctIndex)
      .map((question) => question.id) ?? [];
    const storedIds = Object.values(progressState.mistakes)
      .filter((mistake) => mistake.licenseCategory === licenseCategory)
      .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
      .map((mistake) => mistake.questionId);
    const ids = [...new Set([...freshWrongIds, ...storedIds])];
    const qs = getQuestionsByIds(ids).filter((question) =>
      !question.licenseCategories || question.licenseCategories.includes(licenseCategory)
    );
    if (!qs.length) {
      Alert.alert("Помилок ще немає", "Пройди екзамен або тренування, і Лідик збере питання, де варто повторити правило.");
      return;
    }
    launchQuiz(qs.slice(0, 30), { mode: "mistakes", title: "Робота над помилками", licenseCategory });
  }, [licenseCategory, progressState.mistakes, result, launchQuiz]);

  const startMarathon = useCallback((resume = false) => {
    if (resume && marathonState?.questionIds.length) {
      const resumed = getQuestionsByIds(marathonState.questionIds);
      if (resumed.length) {
        launchQuiz(resumed, {
          mode: "marathon",
          title: "Марафон ПДР",
          licenseCategory: marathonState.licenseCategory,
          initialCurrent: marathonState.currentIndex,
          initialAnswers: marathonState.answers,
        });
        return;
      }
    }

    const all = getQuestionsForLicense(licenseCategory).sort(() => Math.random() - 0.5);
    const answers = Array(all.length).fill(null);
    const snapshot = {
      licenseCategory,
      questionIds: all.map((question) => question.id),
      answers,
      currentIndex: 0,
    };
    setMarathonState({ ...snapshot, updatedAt: new Date().toISOString() });
    void saveMarathonState(scopeId, snapshot).catch(() => {});
    launchQuiz(all, { mode: "marathon", title: "Марафон ПДР", licenseCategory, initialAnswers: answers });
  }, [licenseCategory, launchQuiz, marathonState, scopeId]);

  const handleSnapshot = useCallback((snapshot: { currentIndex: number; answers: Array<number | null> }) => {
    if (quizMeta.mode !== "marathon") return;
    const next = {
      licenseCategory: quizMeta.licenseCategory,
      questionIds: questions.map((question) => question.id),
      answers: snapshot.answers,
      currentIndex: snapshot.currentIndex,
    };
    setMarathonState({ ...next, updatedAt: new Date().toISOString() });
    void saveMarathonState(scopeId, next).catch(() => {});
  }, [questions, quizMeta, scopeId]);

  const handleFinish = useCallback((payload: QuizFinishPayload) => {
    setResult(payload);
    setQuizState("done");
    const protocol = buildProtocol(payload);
    const attempts = payload.questions.map((question, index) => ({
      question,
      answerIndex: payload.answers[index] ?? null,
    }));
    void recordPdrSession(scopeId, payload.licenseCategory, attempts, protocol)
      .then(setProgressState)
      .catch(() => {});
    if (payload.mode === "marathon") {
      setMarathonState(null);
      void clearMarathonState(scopeId).catch(() => {});
    }
    if (mode === "authenticated" && user && !user.isGuest) {
      void recordTestCompletion(user.id, { correct: payload.correct, total: payload.total }).catch(() => {});
    }
  }, [user, mode, scopeId]);

  const handleRestart = useCallback(() => {
    if (!result) {
      activeCategory ? startCategoryTest(activeCategory) : startExam();
      return;
    }
    if (result.mode === "mistakes") {
      startMistakes();
    } else if (result.mode === "marathon") {
      startMarathon(false);
    } else if (activeCategory) {
      startCategoryTest(activeCategory);
    } else {
      startExam();
    }
  }, [activeCategory, result, startCategoryTest, startExam, startMarathon, startMistakes]);

  if (quizState === "running") {
    return <QuizScreen questions={questions} meta={quizMeta} onFinish={handleFinish} onExit={() => setQuizState("idle")} onSnapshot={handleSnapshot} />;
  }
  if (quizState === "done" && result) {
    return <ResultScreen result={result} onRestart={handleRestart} onMistakes={startMistakes} onBack={() => { setQuizState("idle"); setSubView("menu"); }} />;
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
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>10 питань на тему · {selectedLicense.code}</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: 10, paddingBottom: 100 }}>
          {PDR_CATEGORIES.map((cat) => {
            const topicCount = getTopicQuestionCount(cat.name, licenseCategory);
            const topicProgress = progressState.topicProgress[cat.name];
            const topicPercent = getTopicPercent(topicProgress);
            return (
              <Pressable
                key={cat.name} onPress={() => topicCount ? startCategoryTest(cat.name) : startExam()}
                style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border }}
              >
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: cat.color + "18", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 24 }}>{cat.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textPrimary }}>{cat.label}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{cat.desc}</Text>
                  <View style={{ marginTop: 9, gap: 5 }}>
                    <ProgressBar value={topicPercent} color={cat.color} height={5} />
                    <Text style={{ fontSize: 11, color: colors.textTertiary, fontWeight: "700" }}>
                      {topicProgress ? `${topicPercent}% · ${topicProgress.correct}/${topicProgress.seen}` : "Ще не тренувалась"}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: cat.color, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {topicCount ? `${Math.min(10, topicCount)} питань` : "мікс"}
                  </Text>
                  <Text style={{ fontSize: 18, color: colors.textTertiary }}>›</Text>
                </View>
              </Pressable>
            );
          })}
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
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>Цільові тренування · {selectedLicense.code}</Text>
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
                key={g.label} onPress={() => startMiniQuiz(g.category, 5)}
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
            {selectedLicense.code} · 20 питань · 20 хв · ≤2 помилки · протокол МВС
          </Text>
          <View style={{ marginTop: 16, backgroundColor: "rgba(255,255,255,0.22)", borderRadius: radii.md, paddingVertical: 13, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>🚀 Почати іспит</Text>
          </View>
        </Pressable>

        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "900" }}>Категорії прав</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {RIGHTS_CATEGORIES.map((cat) => {
              const selected = cat.value === licenseCategory;
              const count = getLicenseQuestionCount(cat.value);
              return (
              <Pressable
                key={cat.code}
                onPress={() => setLicenseCategory(cat.value)}
                style={{
                  minWidth: "30%",
                  flexGrow: 1,
                  borderRadius: radii.md,
                  padding: 12,
                  backgroundColor: selected ? cat.accent + "18" : colors.bgCard,
                  borderWidth: 1,
                  borderColor: selected ? cat.accent : colors.border,
                }}
              >
                <Text style={{ color: selected ? cat.accent : colors.textPrimary, fontWeight: "900", fontSize: 15 }}>{cat.code}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "700", marginTop: 2 }}>
                  {cat.label} · {count} питань
                </Text>
              </Pressable>
            );})}
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
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>10 питань · {selectedLicense.code} · знаки пріоритету</Text>
          </View>
          <Text style={{ fontSize: 18, color: colors.textTertiary }}>›</Text>
        </Pressable>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={startMistakes}
            style={{ flex: 1, backgroundColor: colors.warningSoft, borderRadius: radii.md, padding: 14, borderWidth: 1, borderColor: colors.warning + "55", gap: 8 }}
          >
            <Text style={{ fontSize: 24 }}>🛠️</Text>
            <Text style={{ color: colors.warning, fontSize: 14, fontWeight: "900" }}>Помилки</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17 }}>
              {mistakeCount ? `${mistakeCount} питань · 2 правильні поспіль прибирають з черги` : "Лідик збере після тесту"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => startMarathon(Boolean(marathonState?.questionIds.length))}
            style={{ flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 14, borderWidth: 1, borderColor: colors.border, gap: 8 }}
          >
            <Text style={{ fontSize: 24 }}>🏁</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "900" }}>Марафон</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17 }}>
              {marathonState?.questionIds.length
                ? `${marathonState.currentIndex + 1}/${marathonState.questionIds.length} · продовжити`
                : `${getLicenseQuestionCount(licenseCategory)} питань без втрати місця`}
            </Text>
          </Pressable>
        </View>

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
              {PDR_CATEGORIES.length} тем · зараз {selectedLicense.code}
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
              {MINI_GAMES.length} ігор · {selectedLicense.code} · 2–6 хв
            </Text>
          </View>
          <Text style={{ fontSize: 18, color: colors.textTertiary }}>›</Text>
        </Pressable>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: 4 }}>
            <Text style={{ color: colors.red, fontSize: 26, fontWeight: "900" }}>{getLicenseQuestionCount(licenseCategory)}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "700", textAlign: "center" }}>Питань · {selectedLicense.code}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: 4 }}>
            <Text style={{ color: result ? (result.correct / result.total >= 0.75 ? colors.success : colors.warning) : colors.textTertiary, fontSize: 26, fontWeight: "900" }}>
              {result ? `${Math.round((result.correct / result.total) * 100)}%` : "—"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "700", textAlign: "center" }}>Останній тест</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: 4 }}>
            <Text style={{ color: mistakeCount > 0 ? colors.warning : colors.success, fontSize: 26, fontWeight: "900" }}>{mistakeCount}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "700", textAlign: "center" }}>Помилок в черзі</Text>
          </View>
        </View>

        {/* Лідик рекомендує — персональна підказка на основі прогресу */}
        <ProgressOverview progressState={progressState} licenseCategory={licenseCategory} onStartCategory={startCategoryTest} />
      </ScrollView>
    </SafeAreaView>
  );
}
