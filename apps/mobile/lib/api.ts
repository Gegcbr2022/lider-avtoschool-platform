import Constants from "expo-constants";

// Production: Firebase Functions directly (bypasses Vercel for mobile)
const FIREBASE_API = "https://api-jd6b6vy57a-ew.a.run.app";

export const API_BASE =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? FIREBASE_API;

export type LidykResponse = {
  answer: string;
  mode?: "openai" | "openai-fallback" | "local-fallback" | "guard" | "fallback";
  model?: string;
};

export async function askLidyk(question: string): Promise<LidykResponse> {
  try {
    const response = await fetch(`${API_BASE}/ai/lidyk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(15_000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as LidykResponse;
  } catch {
    return {
      answer: "Немає зв'язку. Лідик чекає сигналу 📡  Перевір інтернет і спробуй знову.",
      mode: "fallback"
    };
  }
}
