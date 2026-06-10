import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DrivingLicenseCategory, PDRQuestion } from "./pdr-questions";

const PROGRESS_PREFIX = "lider:pdr-progress:v1";
const MARATHON_PREFIX = "lider:pdr-marathon:v1";
const PENDING_SYNC_KEY = "lider:pdr-pending-sync:v1";

export type PdrQuizMode = "exam" | "topic" | "mini" | "mistakes" | "marathon" | "duel";

export type PdrMistakeRecord = {
  questionId: string;
  category: string;
  licenseCategory: DrivingLicenseCategory;
  wrongCount: number;
  correctStreak: number;
  lastAnswerIndex: number | null;
  lastSeenAt: string;
};

export type PdrTopicProgress = {
  category: string;
  seen: number;
  correct: number;
  lastSeenAt: string;
};

export type PdrProtocol = {
  mode: PdrQuizMode;
  licenseCategory: DrivingLicenseCategory;
  correct: number;
  total: number;
  wrong: number;
  answered: number;
  percent: number;
  passedByMvs: boolean;
  timedOut: boolean;
  elapsedSeconds: number;
  finishedAt: string;
};

export type PdrProgressState = {
  mistakes: Record<string, PdrMistakeRecord>;
  topicProgress: Record<string, PdrTopicProgress>;
  lastProtocol?: PdrProtocol;
  updatedAt?: string;
};

export type PdrAttemptItem = {
  question: PDRQuestion;
  answerIndex: number | null;
};

export type PdrMarathonState = {
  licenseCategory: DrivingLicenseCategory;
  questionIds: string[];
  answers: Array<number | null>;
  currentIndex: number;
  updatedAt: string;
};

export type PdrCoachTopic = {
  category: string;
  percent: number;
  seen: number;
  correct: number;
  mistakeCount: number;
  priority: number;
  reason: string;
};

export type PdrCoachPlan = {
  overallPercent: number;
  seen: number;
  correct: number;
  mistakeCount: number;
  weakTopics: PdrCoachTopic[];
  recommendedCategory: string | null;
  summary: string;
  nextSteps: string[];
};

async function markPendingSync(scopeId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_SYNC_KEY);
    const pending: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (!pending.includes(scopeId)) {
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify([...pending, scopeId]));
    }
  } catch {}
}

export async function clearPendingSync(scopeId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_SYNC_KEY);
    const pending: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending.filter((s) => s !== scopeId)));
  } catch {}
}

export async function hasPendingSync(scopeId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_SYNC_KEY);
    if (!raw) return false;
    return (JSON.parse(raw) as string[]).includes(scopeId);
  } catch {
    return false;
  }
}

function progressKey(scopeId: string): string {
  return `${PROGRESS_PREFIX}:${scopeId || "guest"}`;
}

export async function overwritePdrProgress(scopeId: string, state: PdrProgressState): Promise<void> {
  await AsyncStorage.setItem(progressKey(scopeId), JSON.stringify({ ...state, updatedAt: state.updatedAt ?? new Date().toISOString() }));
}

function marathonKey(scopeId: string): string {
  return `${MARATHON_PREFIX}:${scopeId || "guest"}`;
}

function emptyProgress(): PdrProgressState {
  return { mistakes: {}, topicProgress: {} };
}

export async function loadPdrProgress(scopeId: string): Promise<PdrProgressState> {
  const raw = await AsyncStorage.getItem(progressKey(scopeId));
  if (!raw) return emptyProgress();

  try {
    const parsed = JSON.parse(raw) as PdrProgressState;
    return {
      mistakes: parsed.mistakes ?? {},
      topicProgress: parsed.topicProgress ?? {},
      lastProtocol: parsed.lastProtocol,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return emptyProgress();
  }
}

async function savePdrProgress(scopeId: string, state: PdrProgressState): Promise<void> {
  await AsyncStorage.setItem(progressKey(scopeId), JSON.stringify({ ...state, updatedAt: new Date().toISOString() }));
}

export async function recordPdrSession(
  scopeId: string,
  licenseCategory: DrivingLicenseCategory,
  attempts: PdrAttemptItem[],
  protocol: PdrProtocol
): Promise<PdrProgressState> {
  const state = await loadPdrProgress(scopeId);
  const now = new Date().toISOString();

  for (const attempt of attempts) {
    if (attempt.answerIndex === null) continue;

    const { question, answerIndex } = attempt;
    const isCorrect = answerIndex === question.correctIndex;
    const topic = state.topicProgress[question.category] ?? {
      category: question.category,
      seen: 0,
      correct: 0,
      lastSeenAt: now,
    };

    topic.seen += 1;
    topic.correct += isCorrect ? 1 : 0;
    topic.lastSeenAt = now;
    state.topicProgress[question.category] = topic;

    const existingMistake = state.mistakes[question.id];
    if (!isCorrect) {
      state.mistakes[question.id] = {
        questionId: question.id,
        category: question.category,
        licenseCategory,
        wrongCount: (existingMistake?.wrongCount ?? 0) + 1,
        correctStreak: 0,
        lastAnswerIndex: answerIndex,
        lastSeenAt: now,
      };
      continue;
    }

    if (existingMistake) {
      const correctStreak = existingMistake.correctStreak + 1;
      if (correctStreak >= 2) {
        delete state.mistakes[question.id];
      } else {
        state.mistakes[question.id] = {
          ...existingMistake,
          correctStreak,
          lastAnswerIndex: answerIndex,
          lastSeenAt: now,
        };
      }
    }
  }

  state.lastProtocol = protocol;
  await savePdrProgress(scopeId, state);
  void markPendingSync(scopeId);
  return state;
}

export function getTopicPercent(progress?: PdrTopicProgress): number {
  if (!progress || progress.seen <= 0) return 0;
  return Math.round((progress.correct / progress.seen) * 100);
}

export function buildPdrCoachPlan(
  progress: PdrProgressState,
  licenseCategory: DrivingLicenseCategory
): PdrCoachPlan {
  const topics = Object.values(progress.topicProgress);
  const mistakes = Object.values(progress.mistakes).filter((mistake) => mistake.licenseCategory === licenseCategory);
  const mistakesByCategory = mistakes.reduce<Record<string, number>>((acc, mistake) => {
    acc[mistake.category] = (acc[mistake.category] ?? 0) + 1;
    return acc;
  }, {});

  const categories = new Set<string>([
    ...topics.map((topic) => topic.category),
    ...Object.keys(mistakesByCategory),
  ]);

  const seen = topics.reduce((sum, topic) => sum + topic.seen, 0);
  const correct = topics.reduce((sum, topic) => sum + topic.correct, 0);
  const overallPercent = seen > 0 ? Math.round((correct / seen) * 100) : 0;

  if (!categories.size) {
    return {
      overallPercent,
      seen,
      correct,
      mistakeCount: mistakes.length,
      weakTopics: [],
      recommendedCategory: null,
      summary: "Лідик ще не має історії відповідей. Почни з короткого тесту або екзамену МВС, і план з'явиться автоматично.",
      nextSteps: [
        "Пройди 10 питань у швидкому старті.",
        "Після першої помилки відкрий пояснення Лідика.",
        "Повернися до плану - він покаже слабкі теми.",
      ],
    };
  }

  const weakTopics = Array.from(categories)
    .map<PdrCoachTopic>((category) => {
      const topic = progress.topicProgress[category];
      const percent = getTopicPercent(topic);
      const topicSeen = topic?.seen ?? 0;
      const topicCorrect = topic?.correct ?? 0;
      const mistakeCount = mistakesByCategory[category] ?? 0;
      const lowCoverageBoost = topicSeen < 8 ? 10 : 0;
      const priority = (100 - percent) + mistakeCount * 14 + lowCoverageBoost;
      const reason = mistakeCount > 0
        ? `${mistakeCount} пит. у черзі помилок`
        : topicSeen < 8
          ? "мало практики"
          : `${percent}% точність`;

      return {
        category,
        percent,
        seen: topicSeen,
        correct: topicCorrect,
        mistakeCount,
        priority,
        reason,
      };
    })
    .filter((topic) => topic.mistakeCount > 0 || topic.seen < 8 || topic.percent < 82)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);

  const recommendedCategory = weakTopics[0]?.category ?? null;
  const summary = recommendedCategory
    ? `Фокус на ${recommendedCategory}: там зараз найбільший приріст до екзамену.`
    : overallPercent >= 85
      ? "Ти вже близько до стабільного рівня. Час тренувати екзамен МВС і швидкість відповіді."
      : "Прогрес є. Лідик радить закріпити теми з точністю нижче 82%.";

  const nextSteps = recommendedCategory
    ? [
        `Пройди 10 питань з теми "${recommendedCategory}".`,
        "Після кожної помилки відкрий пояснення простішими словами.",
        "Повернися до екзамену МВС, коли у слабкій темі буде 80%+.",
      ]
    : [
        "Пройди екзамен МВС на 20 питань.",
        "Збери нові помилки у чергу повторення.",
        "Повтори питання, доки помилка не закриється двома правильними відповідями.",
      ];

  return {
    overallPercent,
    seen,
    correct,
    mistakeCount: mistakes.length,
    weakTopics,
    recommendedCategory,
    summary,
    nextSteps,
  };
}

export async function loadMarathonState(scopeId: string): Promise<PdrMarathonState | null> {
  const raw = await AsyncStorage.getItem(marathonKey(scopeId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PdrMarathonState;
    if (!Array.isArray(parsed.questionIds) || !Array.isArray(parsed.answers)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveMarathonState(scopeId: string, state: Omit<PdrMarathonState, "updatedAt">): Promise<void> {
  await AsyncStorage.setItem(marathonKey(scopeId), JSON.stringify({ ...state, updatedAt: new Date().toISOString() }));
}

export async function clearMarathonState(scopeId: string): Promise<void> {
  await AsyncStorage.removeItem(marathonKey(scopeId));
}
