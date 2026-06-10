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
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Label, ProgressBar } from "../../components/mobile-ui";
import { askLidyk, recognizeSign } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { addUserBonus, createFirestoreId, createStory, getUserStats, loadPdrProgressFromFirestore, recordTestCompletion, savePdrProgressToFirestore, type UserStats, EMPTY_STATS } from "../../lib/firestore";
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
  buildPdrCoachPlan,
  clearMarathonState,
  clearPendingSync,
  getTopicPercent,
  hasPendingSync,
  loadMarathonState,
  loadPdrProgress,
  overwritePdrProgress,
  recordPdrSession,
  saveMarathonState,
  type PdrMistakeRecord,
  type PdrMarathonState,
  type PdrProgressState,
  type PdrQuizMode,
  type PdrTopicProgress,
} from "../../lib/pdr-progress";
import { useNetworkStatus } from "../../lib/useNetwork";
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
  { icon: "🎯", name: "Знаки", label: "Дорожні знаки", desc: "Попереджувальні, заборонні, інформаційні", color: "red" },
  { icon: "↔️", name: "Пріоритет", label: "Пріоритет", desc: "Хто має перевагу у типових ситуаціях", color: "warning" },
  { icon: "🛣️", name: "Швидкість", label: "Швидкість", desc: "Обмеження та контроль швидкості", color: "info" },
  { icon: "🚦", name: "Перехрестя", label: "Перехрестя", desc: "Регульовані та нерегульовані", color: "yellow" },
  { icon: "🛑", name: "Зупинка", label: "Стоянка і зупинка", desc: "Де можна і де заборонено", color: "red" },
  { icon: "📏", name: "Розмітка", label: "Розмітка", desc: "Горизонтальна та вертикальна", color: "info" },
  { icon: "🛡️", name: "Безпека", label: "Безпека руху", desc: "Дистанція, обгін, маневри", color: "success" },
  { icon: "↩️", name: "Маневр", label: "Маневри", desc: "Повороти, перестроювання, причепи і габарити", color: "warning" },
  { icon: "🅿️", name: "Стоянка", label: "Паркування", desc: "Стоянка, зупинка, місця заборони", color: "info" },
  { icon: "🚶", name: "Пішоходи", label: "Пішоходи", desc: "Переходи, пріоритет і безпечний проїзд", color: "success" },
  { icon: "🏙️", name: "Місто", label: "Міський рух", desc: "Особливості руху у місті", color: "textPrimary" },
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
  { code: "A", label: "Мото", value: "A", accent: "warning" },
  { code: "A1", label: "Легкі мото", value: "A1", accent: "warning" },
  { code: "B", label: "Легкове авто", value: "B", accent: "red" },
  { code: "C", label: "Вантажне", value: "C", accent: "info" },
  { code: "D", label: "Автобус", value: "D", accent: "info" },
  { code: "BE", label: "Причеп B", value: "BE", accent: "success" },
  { code: "CE", label: "Причеп C", value: "CE", accent: "success" },
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
  const hasTrafficLight = kind === "trafficLight";
  const hasRailway = kind === "railwayCrossing";
  const hasRoadWorks = kind === "roadWorks";
  const hasWetRoad = kind === "slipperyRoad" || kind === "motorcycleCurve";
  const hasLaneMerge = kind === "laneMerge";
  const hasBusStop = kind === "busStop";
  const hasSchoolZone = kind === "schoolZone";
  const vehicleType = kind === "truckSteepDescent" || kind === "cargoShift"
    ? "truck"
    : kind === "busStop"
      ? "bus"
      : kind === "trailerSway"
        ? "trailer"
        : kind === "motorcycleCurve"
          ? "motorcycle"
          : question.licenseCategories?.some((cat) => cat === "C" || cat === "CE")
            ? "truck"
            : question.licenseCategories?.some((cat) => cat === "D")
              ? "bus"
              : question.licenseCategories?.some((cat) => cat === "A" || cat === "A1")
                ? "motorcycle"
                : "car";

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
      case "trafficLight":
        return (
          <View style={{ width: 52, height: 92, borderRadius: 18, backgroundColor: "#111827", borderWidth: 4, borderColor: "#334155", alignItems: "center", justifyContent: "space-around", paddingVertical: 8 }}>
            <View style={{ width: 19, height: 19, borderRadius: 10, backgroundColor: "#ef4444" }} />
            <View style={{ width: 19, height: 19, borderRadius: 10, backgroundColor: "#f59e0b", opacity: 0.55 }} />
            <View style={{ width: 19, height: 19, borderRadius: 10, backgroundColor: "#22c55e", opacity: 0.45 }} />
          </View>
        );
      case "railwayCrossing":
        return (
          <View style={{ width: 88, height: 88, alignItems: "center", justifyContent: "center" }}>
            <View style={{ position: "absolute", width: 94, height: 10, borderRadius: 5, backgroundColor: "#fff", borderWidth: 2, borderColor: "#e63946", transform: [{ rotate: "45deg" }] }} />
            <View style={{ position: "absolute", width: 94, height: 10, borderRadius: 5, backgroundColor: "#fff", borderWidth: 2, borderColor: "#e63946", transform: [{ rotate: "-45deg" }] }} />
            <Text style={{ color: "#111827", fontSize: 14, fontWeight: "900", marginTop: 54 }}>RAIL</Text>
          </View>
        );
      case "roadWorks":
        return (
          <View style={{ width: 86, height: 74, borderRadius: 12, borderWidth: 7, borderColor: "#e63946", transform: [{ rotate: "45deg" }], alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
            <Text style={{ transform: [{ rotate: "-45deg" }], color: "#111827", fontSize: 16, fontWeight: "900" }}>WORK</Text>
          </View>
        );
      case "slipperyRoad":
        return (
          <View style={{ width: 86, height: 74, borderRadius: 12, borderWidth: 7, borderColor: "#e63946", transform: [{ rotate: "45deg" }], alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
            <Text style={{ transform: [{ rotate: "-45deg" }], color: "#111827", fontSize: 28, fontWeight: "900" }}>≈</Text>
          </View>
        );
      case "laneMerge":
        return blueSign("⇢");
      case "busStop":
        return blueSign("BUS");
      case "schoolZone":
        return (
          <View style={{ width: 82, height: 82, borderRadius: 18, backgroundColor: "#facc15", borderWidth: 7, borderColor: "#111827", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#111827", fontSize: 16, fontWeight: "900" }}>KIDS</Text>
          </View>
        );
      case "motorway":
        return blueSign("M");
      case "truckSteepDescent":
        return (
          <View style={{ width: 86, height: 74, borderRadius: 12, borderWidth: 7, borderColor: "#e63946", transform: [{ rotate: "45deg" }], alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
            <Text style={{ transform: [{ rotate: "-45deg" }], color: "#111827", fontSize: 18, fontWeight: "900" }}>10%</Text>
          </View>
        );
      case "cargoShift":
        return (
          <View style={{ width: 86, height: 74, borderRadius: 12, borderWidth: 7, borderColor: "#e63946", transform: [{ rotate: "45deg" }], alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
            <Text style={{ transform: [{ rotate: "-45deg" }], color: "#111827", fontSize: 15, fontWeight: "900" }}>LOAD</Text>
          </View>
        );
      case "trailerSway":
        return (
          <View style={{ width: 86, height: 74, borderRadius: 12, borderWidth: 7, borderColor: "#e63946", transform: [{ rotate: "45deg" }], alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
            <Text style={{ transform: [{ rotate: "-45deg" }], color: "#111827", fontSize: 15, fontWeight: "900" }}>TRLR</Text>
          </View>
        );
      case "motorcycleCurve":
        return (
          <View style={{ width: 86, height: 74, borderRadius: 12, borderWidth: 7, borderColor: "#e63946", transform: [{ rotate: "45deg" }], alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
            <Text style={{ transform: [{ rotate: "-45deg" }], color: "#111827", fontSize: 15, fontWeight: "900" }}>MOTO</Text>
          </View>
        );
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

  const renderVehicle = () => {
    if (vehicleType === "motorcycle") {
      return (
        <View style={{ position: "absolute", right: 34, bottom: 31, width: 78, height: 38 }}>
          <View style={{ position: "absolute", left: 9, bottom: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: "#111827", borderWidth: 4, borderColor: "#475569" }} />
          <View style={{ position: "absolute", right: 4, bottom: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: "#111827", borderWidth: 4, borderColor: "#475569" }} />
          <View style={{ position: "absolute", left: 24, bottom: 15, width: 36, height: 11, borderRadius: 6, backgroundColor: "#e63946", transform: [{ rotate: "-8deg" }] }} />
          <View style={{ position: "absolute", left: 38, bottom: 24, width: 14, height: 14, borderRadius: 7, backgroundColor: "#fde68a" }} />
        </View>
      );
    }

    const width = vehicleType === "bus" ? 118 : vehicleType === "truck" ? 116 : vehicleType === "trailer" ? 136 : 86;
    const cabWidth = vehicleType === "truck" || vehicleType === "trailer" ? 42 : width;
    const bodyColor = vehicleType === "bus" ? "#f59e0b" : vehicleType === "truck" ? "#2563eb" : "#e63946";
    return (
      <View style={{ position: "absolute", right: 24, bottom: 29, width, height: 42 }}>
        {vehicleType === "trailer" ? (
          <View style={{ position: "absolute", left: 0, top: 6, width: 72, height: 32, borderRadius: 8, backgroundColor: "#94a3b8", borderWidth: 3, borderColor: "#e2e8f0" }}>
            <View style={{ position: "absolute", left: 18, top: 7, width: 24, height: 10, borderRadius: 4, backgroundColor: "#cbd5e1" }} />
          </View>
        ) : null}
        <View style={{ position: "absolute", right: 0, top: vehicleType === "trailer" ? 6 : 0, width: cabWidth, height: vehicleType === "truck" || vehicleType === "trailer" ? 34 : 34, borderRadius: 10, backgroundColor: bodyColor, borderWidth: 3, borderColor: vehicleType === "bus" ? "#fde68a" : "#dbeafe" }}>
          <View style={{ position: "absolute", left: 9, top: 7, width: 18, height: 10, borderRadius: 4, backgroundColor: "#bfdbfe" }} />
          {cabWidth > 55 ? <View style={{ position: "absolute", right: 10, top: 7, width: 20, height: 10, borderRadius: 4, backgroundColor: "#bfdbfe" }} /> : null}
        </View>
        {vehicleType === "truck" ? (
          <View style={{ position: "absolute", left: 0, top: 3, width: 70, height: 34, borderRadius: 8, backgroundColor: "#94a3b8", borderWidth: 3, borderColor: "#e2e8f0" }}>
            {kind === "cargoShift" ? <View style={{ position: "absolute", left: 16, top: 8, width: 35, height: 14, borderRadius: 4, backgroundColor: "#facc15", transform: [{ rotate: "-10deg" }] }} /> : null}
          </View>
        ) : null}
        <View style={{ position: "absolute", left: 10, bottom: -8, width: 18, height: 18, borderRadius: 9, backgroundColor: "#111827" }} />
        <View style={{ position: "absolute", right: 10, bottom: -8, width: 18, height: 18, borderRadius: 9, backgroundColor: "#111827" }} />
      </View>
    );
  };

  return (
    <View style={{ borderRadius: radii.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 }}>
      <View style={{ height: 174, borderRadius: radii.sm, backgroundColor: "#cfe8f7", overflow: "hidden" }}>
        <View style={{ position: "absolute", left: 0, right: 0, top: 0, height: 78, backgroundColor: "#dbeafe" }} />
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 96, backgroundColor: "#364152" }} />
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 46, height: 4, backgroundColor: "#f8fafc", opacity: 0.9 }} />
        {hasIntersection || hasTrafficLight ? (
          <>
            <View style={{ position: "absolute", left: "44%", top: 0, bottom: 0, width: 58, backgroundColor: "#364152" }} />
            <View style={{ position: "absolute", left: "50%", top: 10, bottom: 10, width: 4, backgroundColor: "#f8fafc", opacity: 0.75 }} />
          </>
        ) : null}
        {hasCrosswalk || hasSchoolZone ? (
          <View style={{ position: "absolute", left: 130, right: 20, bottom: 28, flexDirection: "row", justifyContent: "space-between" }}>
            {[0, 1, 2, 3, 4].map((stripe) => (
              <View key={stripe} style={{ width: 14, height: 58, borderRadius: 3, backgroundColor: "#f8fafc" }} />
            ))}
          </View>
        ) : null}
        {hasTrafficLight ? (
          <View style={{ position: "absolute", left: 138, right: 28, bottom: 84, height: 5, backgroundColor: "#f8fafc", opacity: 0.95 }} />
        ) : null}
        {hasRailway ? (
          <>
            <View style={{ position: "absolute", left: 120, right: 26, bottom: 30, height: 6, borderRadius: 3, backgroundColor: "#94a3b8", transform: [{ rotate: "-8deg" }] }} />
            <View style={{ position: "absolute", left: 120, right: 26, bottom: 62, height: 6, borderRadius: 3, backgroundColor: "#94a3b8", transform: [{ rotate: "-8deg" }] }} />
            {[0, 1, 2, 3, 4].map((rail) => (
              <View key={rail} style={{ position: "absolute", left: 136 + rail * 42, bottom: 30 + rail * -6, width: 6, height: 44, borderRadius: 3, backgroundColor: "#cbd5e1", transform: [{ rotate: "-8deg" }] }} />
            ))}
          </>
        ) : null}
        {hasRoadWorks ? (
          <>
            {[0, 1, 2].map((cone) => (
              <View key={cone} style={{ position: "absolute", left: 132 + cone * 42, bottom: 24, width: 24, height: 34, borderRadius: 5, backgroundColor: "#f97316", borderWidth: 3, borderColor: "#fed7aa" }} />
            ))}
            <View style={{ position: "absolute", left: 252, bottom: 65, width: 78, height: 8, borderRadius: 4, backgroundColor: "#facc15", transform: [{ rotate: "-8deg" }] }} />
          </>
        ) : null}
        {hasWetRoad ? (
          <>
            {[0, 1, 2].map((line) => (
              <View key={line} style={{ position: "absolute", left: 145 + line * 48, bottom: 32 + line * 15, width: 54, height: 4, borderRadius: 2, backgroundColor: "#93c5fd", opacity: 0.65, transform: [{ rotate: "-12deg" }] }} />
            ))}
          </>
        ) : null}
        {hasLaneMerge ? (
          <>
            <View style={{ position: "absolute", left: 164, bottom: 72, width: 98, height: 5, borderRadius: 3, backgroundColor: "#f8fafc", transform: [{ rotate: "18deg" }] }} />
            <Text style={{ position: "absolute", left: 214, bottom: 58, color: "#f8fafc", fontSize: 28, fontWeight: "900" }}>↗</Text>
          </>
        ) : null}
        {hasBusStop ? (
          <View style={{ position: "absolute", right: 18, top: 70, width: 118, height: 34, borderRadius: 8, backgroundColor: "#e2e8f0", borderWidth: 2, borderColor: "#94a3b8", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#1f2937", fontSize: 12, fontWeight: "900" }}>ЗУПИНКА</Text>
          </View>
        ) : null}
        {(kind === "noParking" || kind === "noStopping") ? (
          <View style={{ position: "absolute", left: 118, right: 22, bottom: 24, height: 44, borderRadius: 8, borderWidth: 2, borderColor: "#f8fafc", borderStyle: "dashed" }} />
        ) : null}
        <View style={{ position: "absolute", left: 42, top: 54, width: 5, height: 86, borderRadius: 3, backgroundColor: "#6b7280" }} />
        <View style={{ position: "absolute", left: 14, top: 20, width: 92, height: 92, alignItems: "center", justifyContent: "center" }}>
          {renderSign()}
        </View>
        {renderVehicle()}
      </View>
      <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "900", lineHeight: 18 }}>
        {question.visual?.label ?? question.category}
      </Text>
    </View>
  );
}

function getVisualScan(question: PDRQuestion): { title: string; items: string[] } {
  const kind = question.visual?.kind;
  switch (kind) {
    case "trafficLight":
      return { title: "Скан сцени", items: ["Сигнал світлофора", "Стоп-лінія перед перехрестям", "Чи не перекриваєш перехрестя"] };
    case "railwayCrossing":
      return { title: "Скан переїзду", items: ["Сигнали і шлагбаум", "Чи вільні колії", "Запас місця після переїзду"] };
    case "roadWorks":
      return { title: "Скан ремонту", items: ["Тимчасові знаки", "Конуси і звуження смуги", "Дистанція до працівників"] };
    case "slipperyRoad":
    case "motorcycleCurve":
      return { title: "Скан зчеплення", items: ["Покриття дороги", "Швидкість до маневру", "Плавність керма і гальм"] };
    case "laneMerge":
      return { title: "Скан маневру", items: ["Дзеркала", "Сліпа зона", "Швидкість сусідньої смуги"] };
    case "busStop":
      return { title: "Скан зупинки", items: ["Пасажири біля дверей", "Дзеркала автобуса", "Безпечний старт у потік"] };
    case "schoolZone":
    case "pedestrianCrossing":
    case "pedestrianCrossingInfo":
    case "pedestrianCycleCrossing":
      return { title: "Скан переходу", items: ["Пішоходи з обох боків", "Авто, що закриває огляд", "Готовність зупинитися"] };
    case "truckSteepDescent":
    case "cargoShift":
      return { title: "Скан вантажівки", items: ["Маса і гальмівний шлях", "Кріплення вантажу", "Запас дистанції"] };
    case "trailerSway":
      return { title: "Скан причепа", items: ["Кут причепа", "Радіус повороту", "Плавність швидкості"] };
    case "noParking":
    case "noStopping":
      return { title: "Скан зони дії", items: ["Де починається знак", "Чи це зупинка або стоянка", "Чи не блокуєш огляд"] };
    case "giveWay":
    case "stop":
    case "priorityRoad":
    case "endPriorityRoad":
    case "roundabout":
      return { title: "Скан пріоритету", items: ["Хто на головній", "Чи потрібна повна зупинка", "Конфліктні точки"] };
    default:
      return { title: "Скан правила", items: ["Знак або розмітка", "Зона дії", "Найбезпечніша дія водія"] };
  }
}

// ─── Lidyk Explanation Modal ──────────────────────────────────────────────────

type LidykExplanationStyle = "short" | "friend" | "road";

const LIDYK_EXPLANATION_STYLES: Array<{
  id: LidykExplanationStyle;
  label: string;
  prompt: string;
}> = [
  {
    id: "short",
    label: "Коротко",
    prompt: "Поясни дуже коротко: 2-3 речення, тільки суть правила і чому відповідь правильна.",
  },
  {
    id: "friend",
    label: "Як другу",
    prompt: "Поясни простими словами, як другу перед іспитом. Без канцеляриту, з людською логікою.",
  },
  {
    id: "road",
    label: "Приклад",
    prompt: "Поясни через приклад на дорозі: що бачить водій, який ризик і яку дію треба зробити.",
  },
];

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
  const [style, setStyle] = useState<LidykExplanationStyle>("friend");

  async function askForExplanation(nextStyle = style) {
    setLoading(true);
    setError(false);
    const selectedStyle = LIDYK_EXPLANATION_STYLES.find((item) => item.id === nextStyle) ?? LIDYK_EXPLANATION_STYLES[1];
    const prompt = `Поясни питання ПДР:\n"${question}"\nВаріанти: ${options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(", ")}. Правильна відповідь: ${String.fromCharCode(65 + correctIndex)}) ${options[correctIndex]}.\n${selectedStyle.prompt}\nВідповідай українською.`;
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

          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {LIDYK_EXPLANATION_STYLES.map((item) => {
              const selected = item.id === style;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setStyle(item.id);
                    if (response && !loading) {
                      setResponse(null);
                      void askForExplanation(item.id);
                    }
                  }}
                  disabled={loading}
                  style={{
                    flex: 1,
                    borderRadius: 999,
                    paddingVertical: 10,
                    alignItems: "center",
                    backgroundColor: selected ? colors.redSoft : colors.bgElevated,
                    borderWidth: 1,
                    borderColor: selected ? colors.red + "66" : colors.border,
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  <Text style={{ color: selected ? colors.red : colors.textSecondary, fontSize: 12, fontWeight: "900" }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Ask button or response */}
          {!response && !loading ? (
            <TouchableOpacity
              onPress={() => void askForExplanation()}
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
                  onPress={() => { setResponse(null); void askForExplanation(); }}
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
              <TouchableOpacity onPress={() => void askForExplanation()} style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6 }}>
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
  const [showVisualScan, setShowVisualScan] = useState(false);
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
  const visualScan = getVisualScan(q);

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
      setShowVisualScan(false);
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
        {visualHints ? (
          <Pressable
            onPress={() => setShowVisualScan((value) => !value)}
            style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: showVisualScan ? colors.red + "66" : colors.border, borderRadius: radii.md, padding: 14, gap: 10 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: colors.red, fontSize: 16, fontWeight: "900" }}>🔎</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "900" }}>Візуальний розбір</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 2 }} numberOfLines={2}>
                  {showVisualScan ? "Перевір ці точки перед відповіддю." : "Підказка по картинці без правильної відповіді"}
                </Text>
              </View>
              <Text style={{ color: colors.textTertiary, fontSize: 18, fontWeight: "900" }}>{showVisualScan ? "−" : "+"}</Text>
            </View>
            {showVisualScan ? (
              <View style={{ backgroundColor: colors.bgElevated, borderRadius: radii.sm, padding: 12, gap: 8 }}>
                <Text style={{ color: colors.red, fontSize: 12, fontWeight: "900" }}>{visualScan.title}</Text>
                {visualScan.items.map((item, index) => (
                  <View key={item} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                    <Text style={{ color: colors.textTertiary, fontSize: 12, fontWeight: "900", width: 16 }}>{index + 1}</Text>
                    <Text style={{ flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 17 }}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </Pressable>
        ) : null}

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
  mode,
  licenseCategory,
  elapsedSeconds,
  onClose,
}: {
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
  mode: PdrQuizMode;
  licenseCategory: DrivingLicenseCategory;
  elapsedSeconds: number;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const wrong = Math.max(0, total - correct);
  const previewAccent = passed ? colors.success : "#f59e0b";
  const previewBackground = "#111827";
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
        kind: "pdrResult",
        result: {
          correct,
          total,
          percent,
          passed,
          mode,
          licenseCategory,
          elapsedSeconds,
        },
        tone: "dark",
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
      Alert.alert("Готово", "Результат опубліковано в сторис Лідер Клубу.", [
        { text: "Залишитись", style: "cancel" },
        {
          text: "Відкрити клуб",
          onPress: () => router.push("/(tabs)/club" as import("expo-router").Href),
        },
      ]);
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

          <View style={{ marginTop: 16, borderRadius: radii.lg, overflow: "hidden", backgroundColor: previewBackground, borderWidth: 1.5, borderColor: previewAccent + "66" }}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage.uri }} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%" }} resizeMode="cover" />
            ) : null}
            {selectedImage ? <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.42)" }} /> : null}
            <View style={{ padding: 16, minHeight: 178, justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <View>
                  <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>сторис · ПДР</Text>
                  <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900", marginTop: 3 }}>
                    {passed ? "Лідик зарахував" : "Лідик дав план"}
                  </Text>
                </View>
                <Image source={MASCOT} style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.84)" }} resizeMode="contain" />
              </View>
              <View>
                <Text style={{ color: previewAccent, fontSize: 48, fontWeight: "900", lineHeight: 54 }}>{percent}%</Text>
                <Text style={{ color: "rgba(255,255,255,0.86)", fontSize: 14, fontWeight: "800" }}>
                  {correct}/{total} правильних · {wrong} помилок · {licenseCategory}
                </Text>
                <View style={{ height: 7, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.24)", overflow: "hidden", marginTop: 10 }}>
                  <View style={{ width: `${Math.min(100, Math.max(0, percent))}%`, height: 7, borderRadius: 999, backgroundColor: previewAccent }} />
                </View>
              </View>
            </View>
          </View>

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
          mode={result.mode}
          licenseCategory={result.licenseCategory}
          elapsedSeconds={result.elapsedSeconds}
          onClose={() => setShowStorySheet(false)}
        />
      ) : null}
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, alignItems: "center", paddingTop: 60 }}>
        <Text style={{ fontSize: 64 }}>{passed ? "🏆" : "📚"}</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 32, fontWeight: "900", textAlign: "center" }}>
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
            <Text style={{ color: colors.success, fontWeight: "800", fontSize: 15 }}>Створити сторис з результатом</Text>
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

// ─── Sign Scanner ─────────────────────────────────────────────────────────────

function SignScannerSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyzeImage(base64: string, mimeType: string) {
    if (!base64) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await recognizeSign(base64, mimeType);
      setAnswer(res.answer);
    } catch {
      setAnswer("Не вдалося розпізнати знак. Перевір з'єднання і спробуй ще раз.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert("Доступ потрібен", "Дозволь доступ до камери."); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, base64: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedUri(asset.uri);
      void analyzeImage(asset.base64 ?? "", asset.mimeType ?? "image/jpeg");
    }
  }

  async function handleGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Доступ потрібен", "Дозволь доступ до фото."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, base64: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedUri(asset.uri);
      void analyzeImage(asset.base64 ?? "", asset.mimeType ?? "image/jpeg");
    }
  }

  function handleClose() {
    setSelectedUri(null);
    setAnswer(null);
    setLoading(false);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }} onPress={handleClose}>
        <View
          onStartShouldSetResponder={() => true}
          style={{ backgroundColor: colors.bgSheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 42, borderTopWidth: 1, borderTopColor: colors.border, maxHeight: "88%" }}
        >
          <View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 18 }} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#1d4ed818", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 26 }}>📷</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900" }}>Сканер знаків</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Лідик пояснить знак за фото</Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Text style={{ color: colors.textTertiary, fontSize: 22, fontWeight: "800" }}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable onPress={handleCamera} style={{ flex: 1, borderRadius: radii.md, padding: 14, backgroundColor: colors.red, alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 24 }}>📸</Text>
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "900" }}>Зробити фото</Text>
              </Pressable>
              <Pressable onPress={handleGallery} style={{ flex: 1, borderRadius: radii.md, padding: 14, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 24 }}>🖼️</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "900" }}>З галереї</Text>
              </Pressable>
            </View>

            {selectedUri ? (
              <Image source={{ uri: selectedUri }} style={{ width: "100%", height: 200, borderRadius: radii.md, backgroundColor: colors.bgElevated }} resizeMode="cover" />
            ) : (
              <View style={{ width: "100%", height: 160, borderRadius: radii.md, backgroundColor: colors.bgElevated, alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Text style={{ fontSize: 40 }}>🔍</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 14, fontWeight: "700", textAlign: "center", paddingHorizontal: 24 }}>Сфотографуй знак або дорожню ситуацію</Text>
              </View>
            )}

            {loading ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border }}>
                <ActivityIndicator color={colors.red} />
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Лідик аналізує знак…</Text>
              </View>
            ) : answer ? (
              <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Image source={MASCOT} style={{ width: 38, height: 38 }} resizeMode="contain" />
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "900" }}>Лідик пояснює</Text>
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 15, lineHeight: 22 }}>{answer}</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Lidyk Coach Plan ─────────────────────────────────────────────────────────

function LidykPlanSheet({
  visible,
  progressState,
  licenseCategory,
  onClose,
  onStartCategory,
  onStartExam,
}: {
  visible: boolean;
  progressState: PdrProgressState;
  licenseCategory: DrivingLicenseCategory;
  onClose: () => void;
  onStartCategory: (cat: string) => void;
  onStartExam: () => void;
}) {
  const { colors } = useTheme();
  const plan = buildPdrCoachPlan(progressState, licenseCategory);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }} onPress={onClose}>
        <View
          onStartShouldSetResponder={() => true}
          style={{ backgroundColor: colors.bgSheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 42, borderTopWidth: 1, borderTopColor: colors.border, maxHeight: "88%" }}
        >
          <View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 18 }} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Image source={MASCOT} style={{ width: 48, height: 48 }} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "900" }}>Мій план від Лідика</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Категорія {licenseCategory} · персональний маршрут</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={{ color: colors.textTertiary, fontSize: 22, fontWeight: "800" }}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
            <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "800", lineHeight: 20 }}>
                {plan.summary}
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1, backgroundColor: colors.bgElevated, borderRadius: radii.sm, padding: 12 }}>
                  <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800" }}>Точність</Text>
                  <Text style={{ color: plan.overallPercent >= 75 ? colors.success : colors.warning, fontSize: 24, fontWeight: "900", marginTop: 2 }}>
                    {plan.seen ? `${plan.overallPercent}%` : "—"}
                  </Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.bgElevated, borderRadius: radii.sm, padding: 12 }}>
                  <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800" }}>Відповіді</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "900", marginTop: 2 }}>{plan.seen}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.bgElevated, borderRadius: radii.sm, padding: 12 }}>
                  <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800" }}>Помилки</Text>
                  <Text style={{ color: plan.mistakeCount ? colors.red : colors.success, fontSize: 24, fontWeight: "900", marginTop: 2 }}>{plan.mistakeCount}</Text>
                </View>
              </View>
            </View>

            {plan.weakTopics.length ? (
              <View style={{ gap: 8 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "900" }}>Слабкі теми</Text>
                {plan.weakTopics.map((topic) => {
                  const catDef = PDR_CATEGORIES.find((cat) => cat.name === topic.category);
                  return (
                    <Pressable
                      key={topic.category}
                      onPress={() => {
                        onClose();
                        onStartCategory(topic.category);
                      }}
                      style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 9 }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Text style={{ fontSize: 22 }}>{catDef?.icon ?? "📘"}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "900" }}>{topic.category}</Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{topic.reason}</Text>
                        </View>
                        <Text style={{ color: topic.percent < 60 ? colors.red : colors.warning, fontSize: 15, fontWeight: "900" }}>{topic.percent}%</Text>
                      </View>
                      <ProgressBar value={topic.percent} color={topic.percent < 60 ? colors.red : colors.warning} height={5} />
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <View style={{ backgroundColor: colors.bgElevated, borderRadius: radii.md, padding: 14, gap: 10 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "900" }}>Наступні кроки</Text>
              {plan.nextSteps.map((step, index) => (
                <View key={step} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: colors.red, fontSize: 12, fontWeight: "900" }}>{index + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>{step}</Text>
                </View>
              ))}
            </View>

            <View style={{ gap: 10 }}>
              {plan.recommendedCategory ? (
                <Pressable
                  onPress={() => {
                    onClose();
                    onStartCategory(plan.recommendedCategory!);
                  }}
                  style={{ backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 15, alignItems: "center", ...shadows.red }}
                >
                  <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>Тренувати {plan.recommendedCategory}</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => {
                  onClose();
                  onStartExam();
                }}
                style={{ borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bgCard, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "900" }}>Почати екзамен МВС</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
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
  const [showCoachPlan, setShowCoachPlan] = useState(false);
  const [showSignScanner, setShowSignScanner] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>(EMPTY_STATS);
  const selectedLicense = RIGHTS_CATEGORIES.find((cat) => cat.value === licenseCategory) ?? RIGHTS_CATEGORIES[1];
  const scopeId = user?.id ?? "guest";
  const mistakeCount = Object.values(progressState.mistakes).filter((mistake) => mistake.licenseCategory === licenseCategory).length;
  const coachPlan = useMemo(() => buildPdrCoachPlan(progressState, licenseCategory), [progressState, licenseCategory]);
  const networkStatus = useNetworkStatus();
  const prevNetworkRef = useRef<"online" | "offline" | "unknown">("online");

  useEffect(() => {
    let alive = true;
    void loadPdrProgress(scopeId).then((state) => {
      if (alive) setProgressState(state);
    }).catch(() => {});
    void loadMarathonState(scopeId).then((state) => {
      if (alive) setMarathonState(state);
    }).catch(() => {});
    if (user?.id) {
      void getUserStats(user.id).then((s) => { if (alive) setUserStats(s); }).catch(() => {});
    }
    return () => { alive = false; };
  }, [scopeId, user?.id]);

  // Merge remote Firestore progress if it is more recent (cross-device sync on login)
  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    const uid = user.id;
    void loadPdrProgressFromFirestore(uid).then(async (remote) => {
      if (!alive || !remote) return;
      const local = await loadPdrProgress(scopeId);
      const localAt = local.updatedAt ?? "";
      const remoteAt = remote.updatedAt ?? "";
      if (remoteAt > localAt) {
        const merged: PdrProgressState = {
          mistakes: remote.mistakes as Record<string, PdrMistakeRecord>,
          topicProgress: remote.topicProgress as Record<string, PdrTopicProgress>,
          updatedAt: remoteAt,
        };
        await overwritePdrProgress(scopeId, merged);
        if (alive) setProgressState(merged);
      }
    }).catch(() => {});
    return () => { alive = false; };
  }, [user?.id, scopeId]);

  // Flush pending sync when network comes back online
  useEffect(() => {
    if (networkStatus === "online" && prevNetworkRef.current !== "online" && user?.id) {
      const uid = user.id;
      void hasPendingSync(scopeId).then(async (pending) => {
        if (!pending) return;
        const state = await loadPdrProgress(scopeId);
        await savePdrProgressToFirestore(uid, state.mistakes, state.topicProgress, state.updatedAt);
        await clearPendingSync(scopeId);
      }).catch(() => {});
    }
    prevNetworkRef.current = networkStatus;
  }, [networkStatus, user?.id, scopeId]);

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
      .then((state) => {
        setProgressState(state);
        if (user?.id && !user.isGuest) {
          void savePdrProgressToFirestore(user.id, state.mistakes, state.topicProgress, state.updatedAt)
            .then(() => clearPendingSync(scopeId))
            .catch(() => {});
        }
      })
      .catch(() => {});
    if (payload.mode === "marathon") {
      setMarathonState(null);
      void clearMarathonState(scopeId).catch(() => {});
    }
    if (mode === "authenticated" && user && !user.isGuest) {
      void recordTestCompletion(user.id, { correct: payload.correct, total: payload.total })
        .then((s) => setUserStats(s))
        .catch(() => {});
      // Award Лідер-бали: +1 for ≥75%, +2 for exam pass (≥90% МВС)
      const scorePct = payload.total > 0 ? Math.round((payload.correct / payload.total) * 100) : 0;
      if (scorePct >= 75) {
        const bonusAmount = (payload.mode === "exam" && scorePct >= 90) ? 2 : 1;
        const reason = payload.mode === "exam" ? `Іспит ${scorePct}%` : `Тест ${scorePct}%`;
        void addUserBonus(user.id, bonusAmount, reason).catch(() => {});
      }
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
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: (colors as any)[cat.color] + "18", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 24 }}>{cat.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textPrimary }}>{cat.label}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{cat.desc}</Text>
                  <View style={{ marginTop: 9, gap: 5 }}>
                    <ProgressBar value={topicPercent} color={(colors as any)[cat.color]} height={5} />
                    <Text style={{ fontSize: 11, color: colors.textTertiary, fontWeight: "700" }}>
                      {topicProgress ? `${topicPercent}% · ${topicProgress.correct}/${topicProgress.seen}` : "Ще не тренувалась"}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: (colors as any)[cat.color], textTransform: "uppercase", letterSpacing: 0.5 }}>
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
      <SignScannerSheet visible={showSignScanner} onClose={() => setShowSignScanner(false)} />
      <LidykPlanSheet
        visible={showCoachPlan}
        progressState={progressState}
        licenseCategory={licenseCategory}
        onClose={() => setShowCoachPlan(false)}
        onStartCategory={startCategoryTest}
        onStartExam={startExam}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 100 }}>
        {/* Header with stats bar */}
        <View style={{ paddingTop: 4, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "900" }}>ПДР Тренажер</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4, lineHeight: 20 }}>
              Готуйся до іспиту з поясненнями від Лідика
            </Text>
          </View>
          {userStats.streakDays > 0 ? (
            <View style={{ alignItems: "center", backgroundColor: colors.redSoft, borderRadius: radii.md, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: colors.red + "44" }}>
              <Text style={{ fontSize: 18 }}>🔥</Text>
              <Text style={{ color: colors.red, fontWeight: "900", fontSize: 15 }}>{userStats.streakDays}</Text>
              <Text style={{ color: colors.red, fontSize: 9, fontWeight: "700" }}>СЕРІЯ</Text>
            </View>
          ) : null}
        </View>

        {/* Stats mini-row */}
        {userStats.totalAnswered > 0 ? (
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              { label: "Відповідей", value: String(userStats.totalAnswered), icon: "📚" },
              { label: "Найкращий", value: `${userStats.bestScorePct}%`, icon: "🏆" },
              { label: "Тестів", value: String(userStats.testsCompleted), icon: "✅" },
            ].map((stat) => (
              <View key={stat.label} style={{ flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.sm, padding: 10, borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: 2 }}>
                <Text style={{ fontSize: 16 }}>{stat.icon}</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "900" }}>{stat.value}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 10, fontWeight: "700" }}>{stat.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Last protocol result card */}
        {progressState.lastProtocol ? (() => {
          const p = progressState.lastProtocol;
          const modeLabel = p.mode === "exam" ? "Іспит МВС" : p.mode === "marathon" ? "Марафон" : "Тренування";
          const accent = p.passedByMvs ? colors.success : p.percent >= 60 ? colors.warning : colors.red;
          return (
            <Pressable
              onPress={p.mode === "exam" ? startExam : () => startCategoryTest("Знаки")}
              style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 14, borderWidth: 1, borderColor: accent + "66", flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: accent + "18", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: accent, fontSize: 22, fontWeight: "900" }}>{p.percent}%</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 }}>Останній результат</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "800", marginTop: 2 }}>
                  {modeLabel} · {p.correct}/{p.total} · {p.licenseCategory}
                </Text>
                <Text style={{ color: accent, fontSize: 12, fontWeight: "700", marginTop: 1 }}>
                  {p.passedByMvs ? "✓ Складено" : p.percent >= 60 ? "Майже готовий" : "Треба повторити"}
                </Text>
              </View>
              <Text style={{ color: colors.textTertiary, fontSize: 18 }}>↺</Text>
            </Pressable>
          );
        })() : null}

        {/* Exam mode — hero button */}
        <Pressable
          onPress={startExam}
          style={{ backgroundColor: colors.red, borderRadius: radii.lg, padding: spacing.lg, shadowColor: colors.red, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 }}
        >
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.2 }}>🏁 ІСПИТ ЯК У МВС</Text>
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 6 }}>Екзаменаційний тест</Text>
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
                  backgroundColor: selected ? (colors as any)[cat.accent] + "18" : colors.bgCard,
                  borderWidth: 1,
                  borderColor: selected ? (colors as any)[cat.accent] : colors.border,
                }}
              >
                <Text style={{ color: selected ? (colors as any)[cat.accent] : colors.textPrimary, fontWeight: "900", fontSize: 15 }}>{cat.code}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "700", marginTop: 2 }}>
                  {cat.label} · {count} питань
                </Text>
              </Pressable>
            );})}
          </View>
        </View>

        {/* Category accuracy progress bars */}
        {Object.keys(progressState.topicProgress).length > 0 ? (() => {
          const topics = Object.values(progressState.topicProgress)
            .filter((t) => t.seen >= 3)
            .sort((a, b) => b.seen - a.seen)
            .slice(0, 6);
          if (!topics.length) return null;
          return (
            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "900" }}>Прогрес по темах</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {topics.map((t) => {
                  const pct = t.seen > 0 ? Math.round((t.correct / t.seen) * 100) : 0;
                  const accent = pct >= 75 ? colors.success : pct >= 50 ? colors.warning : colors.red;
                  const catDef = PDR_CATEGORIES.find((c) => c.name === t.category);
                  return (
                    <Pressable
                      key={t.category}
                      onPress={() => startCategoryTest(t.category)}
                      style={{ width: 112, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 12, borderWidth: 1, borderColor: colors.border, gap: 6 }}
                    >
                      <Text style={{ fontSize: 20 }}>{catDef?.icon ?? "📘"}</Text>
                      <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: "800" }} numberOfLines={2}>{t.category}</Text>
                      <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden" }}>
                        <View style={{ width: `${pct}%`, height: 4, backgroundColor: accent, borderRadius: 2 }} />
                      </View>
                      <Text style={{ color: accent, fontSize: 13, fontWeight: "900" }}>{pct}%</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          );
        })() : null}

        {/* Personal coach route */}
        <Pressable
          onPress={() => setShowCoachPlan(true)}
          style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 12, ...shadows.card }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center" }}>
              <Image source={MASCOT} style={{ width: 44, height: 44 }} resizeMode="contain" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "900" }} numberOfLines={1}>
                Мій план від Лідика
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 3 }} numberOfLines={2}>
                {coachPlan.recommendedCategory
                  ? `Фокус: ${coachPlan.recommendedCategory} · точність ${coachPlan.overallPercent || 0}%`
                  : coachPlan.seen
                    ? `Точність ${coachPlan.overallPercent}% · ${coachPlan.mistakeCount} помилок у черзі`
                    : "Почни з першого тесту - я складу маршрут автоматично"}
              </Text>
            </View>
            <Text style={{ color: colors.textTertiary, fontSize: 20, fontWeight: "900" }}>›</Text>
          </View>

          {coachPlan.weakTopics.length ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {coachPlan.weakTopics.map((topic) => (
                <View key={topic.category} style={{ backgroundColor: colors.bgElevated, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, maxWidth: "100%" }}>
                  <Text style={{ color: topic.percent < 60 ? colors.red : colors.warning, fontSize: 11, fontWeight: "900" }} numberOfLines={1}>
                    {topic.category} · {topic.percent}%
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ backgroundColor: colors.bgElevated, borderRadius: radii.sm, padding: 10 }}>
              <Text style={{ color: colors.textTertiary, fontSize: 12, fontWeight: "700" }}>
                Новий план з'явиться після перших відповідей.
              </Text>
            </View>
          )}
        </Pressable>

        {/* Sign scanner — killer feature E3 */}
        <Pressable
          onPress={() => setShowSignScanner(true)}
          style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#1d4ed808", borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: "#1d4ed830", ...shadows.card }}
        >
          <View style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: "#1d4ed818", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 26 }}>📷</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "900" }}>Сканер знаків</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 3 }} numberOfLines={2}>
              Сфотографуй знак — Лідик поясне за ПДР
            </Text>
          </View>
          <Text style={{ color: "#1d4ed8", fontSize: 20, fontWeight: "900" }}>›</Text>
        </Pressable>

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
