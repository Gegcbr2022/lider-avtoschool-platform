import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DrivingLicenseCategory, PDRQuestion } from "./pdr-questions";

const PROGRESS_PREFIX = "lider:pdr-progress:v1";
const MARATHON_PREFIX = "lider:pdr-marathon:v1";

export type PdrQuizMode = "exam" | "topic" | "mini" | "mistakes" | "marathon";

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

function progressKey(scopeId: string): string {
  return `${PROGRESS_PREFIX}:${scopeId || "guest"}`;
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
  return state;
}

export function getTopicPercent(progress?: PdrTopicProgress): number {
  if (!progress || progress.seen <= 0) return 0;
  return Math.round((progress.correct / progress.seen) * 100);
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
