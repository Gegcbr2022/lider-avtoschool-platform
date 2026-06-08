import Constants from "expo-constants";
import { Platform } from "react-native";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { firebaseApp } from "./firebase";

const FIREBASE_API = "https://api-jd6b6vy57a-ew.a.run.app";

export const API_BASE =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? FIREBASE_API;

const APP_VERSION = (Constants.expoConfig?.version as string | undefined) ?? "1.0.0";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LidykErrorType =
  | "offline"       // мережа недоступна
  | "timeout"       // запит завис
  | "server_error"  // 5xx
  | "auth_error"    // 401/403
  | "rate_limit"    // 429
  | "empty"         // порожнє питання
  | "unknown";      // інше

export type LidykResponse = {
  answer: string;
  mode?: "openai" | "openai-fallback" | "local-fallback" | "guard" | "fallback";
  model?: string;
  errorType?: LidykErrorType;
};

type AiLogUserContext =
  | string
  | null
  | undefined
  | {
      id?: string | null;
      name?: string | null;
      phone?: string | null;
      email?: string | null;
    };

function normalizeAiLogUser(user?: AiLogUserContext) {
  if (!user || typeof user === "string") {
    return { userId: user ?? null, userName: null, userPhone: null, userEmail: null };
  }
  return {
    userId: user.id ?? null,
    userName: user.name ?? null,
    userPhone: user.phone ?? null,
    userEmail: user.email ?? null,
  };
}

// ─── Error classification ─────────────────────────────────────────────────────

function classifyError(err: unknown): LidykErrorType {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (err.name === "AbortError" || msg.includes("aborted") || msg.includes("timeout")) {
      return "timeout";
    }
    if (
      msg.includes("network request failed") ||
      msg.includes("failed to fetch") ||
      msg.includes("network error") ||
      msg.includes("connection refused") ||
      msg.includes("enetunreach") ||
      msg.includes("econnrefused")
    ) {
      return "offline";
    }
  }
  return "unknown";
}

const ERROR_MESSAGES: Record<LidykErrorType, string> = {
  offline:      "Немає з'єднання з інтернетом 📡 Перевір підключення і спробуй ще раз.",
  timeout:      "Лідик думає занадто довго ⏱️ Спробуй запитати ще раз — зазвичай відповідь приходить швидше.",
  server_error: "Сервер тимчасово недоступний 🔧 Спробуй за кілька хвилин.",
  auth_error:   "Проблема з авторизацією. Спробуй перезайти в акаунт і запитати знову.",
  rate_limit:   "Лідик перегружений 😅 Зачекай хвилинку і спробуй ще раз.",
  empty:        "Лідик не почув запитання. Напиши, що тебе цікавить 💬",
  unknown:      "Щось пішло не так 🤔 Спробуй ще раз.",
};

// ─── Main API call ────────────────────────────────────────────────────────────

export async function askLidyk(
  question: string,
  userContext?: AiLogUserContext
): Promise<LidykResponse> {
  if (!question.trim()) {
    return { answer: ERROR_MESSAGES.empty, mode: "fallback", errorType: "empty" };
  }

  const startedAt = Date.now();
  let errorType: LidykErrorType | undefined;
  let result: LidykResponse;

  // AbortSignal.timeout() is not supported in Hermes/React Native — use manual controller.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(`${API_BASE}/ai/lidyk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
      signal: controller.signal,
    });

    if (response.status === 429) {
      errorType = "rate_limit";
      throw new Error("rate_limit");
    }
    if (response.status === 401 || response.status === 403) {
      errorType = "auth_error";
      throw new Error("auth_error");
    }
    if (response.status >= 500) {
      errorType = "server_error";
      throw new Error(`HTTP ${response.status}`);
    }
    if (!response.ok) {
      errorType = "unknown";
      throw new Error(`HTTP ${response.status}`);
    }

    result = (await response.json()) as LidykResponse;
  } catch (err) {
    if (!errorType) errorType = classifyError(err);
    result = {
      answer: ERROR_MESSAGES[errorType],
      mode: "fallback",
      errorType,
    };
  } finally {
    clearTimeout(timeoutId);
  }

  // Fire-and-forget AI log (non-blocking, never throws)
  const logUser = normalizeAiLogUser(userContext);
  void logAiQuery({
    question,
    answer: result.answer,
    mode: result.mode,
    model: result.model,
    latencyMs: Date.now() - startedAt,
    error: errorType,
    ...logUser,
  });

  return result;
}

// ─── Sign recognition ─────────────────────────────────────────────────────────

export async function recognizeSign(imageBase64: string, mimeType = "image/jpeg"): Promise<LidykResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  let errorType: LidykErrorType | undefined;
  let result: LidykResponse;

  try {
    const response = await fetch(`${API_BASE}/ai/recognize-sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType }),
      signal: controller.signal,
    });

    if (response.status === 422) {
      errorType = "empty";
      throw new Error("invalid_image");
    }
    if (response.status >= 500) {
      errorType = "server_error";
      throw new Error(`HTTP ${response.status}`);
    }
    if (!response.ok) {
      errorType = "unknown";
      throw new Error(`HTTP ${response.status}`);
    }

    result = (await response.json()) as LidykResponse;
  } catch (err) {
    if (!errorType) errorType = classifyError(err);
    result = { answer: ERROR_MESSAGES[errorType], mode: "fallback", errorType };
  } finally {
    clearTimeout(timeoutId);
  }

  return result;
}

// ─── Chat → Telegram bridge notify ────────────────────────────────────────────
// Fire-and-forget: tells the backend to mirror this message into the manager's
// Telegram topic. Never throws — chat works even if the bridge is down.
export async function notifyChat(params: {
  conversationId: string;
  messageId?: string;
  userId: string;
  userName: string;
  text: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "document";
  fileName?: string;
  conversationType?: string;
  userPhone?: string;
  userEmail?: string;
  userCity?: string;
  userCategory?: string;
}): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    await fetch(`${API_BASE}/chat/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
  } catch {
    // Bridge is best-effort; the message is already saved in Firestore.
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── AI Logging to Firestore ──────────────────────────────────────────────────

interface AiLogEntry {
  question: string;
  answer: string;
  mode?: string;
  model?: string;
  latencyMs: number;
  error?: string;
  userId: string | null;
  userName?: string | null;
  userPhone?: string | null;
  userEmail?: string | null;
}

async function logAiQuery(entry: AiLogEntry): Promise<void> {
  try {
    const db = getFirestore(firebaseApp);
    await addDoc(collection(db, "aiLogs"), {
      question: entry.question,
      answer: entry.answer,
      mode: entry.mode ?? null,
      model: entry.model ?? null,
      latencyMs: entry.latencyMs,
      error: entry.error ?? null,
      userId: entry.userId,
      userName: entry.userName ?? null,
      userPhone: entry.userPhone ?? null,
      userEmail: entry.userEmail ?? null,
      appVersion: APP_VERSION,
      platform: Platform.OS,
      source: "mobile",
      timestamp: serverTimestamp(),
    });
  } catch {
    // Logging is non-critical — silent fail
  }
}
