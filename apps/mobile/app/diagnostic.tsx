// ─── Diagnostic screen ────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { firebaseAuth, firebaseApp } from "../lib/firebase";
import { API_BASE } from "../lib/api";
import { useTheme, radii, spacing } from "../lib/theme";

type Status = "checking" | "ok" | "degraded" | "error";
type Check = { label: string; status: Status; detail: string; latencyMs?: number };

async function pingGet(url: string, ms = 8000): Promise<{ ok: boolean; latencyMs: number; status?: number; body?: object }> {
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    const latencyMs = Date.now() - start;
    let body: object | undefined;
    try { body = await res.json(); } catch { /* */ }
    return { ok: res.ok, latencyMs, status: res.status, body };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

async function pingPost(url: string, payload: object, ms = 10000): Promise<{ ok: boolean; latencyMs: number; status?: number; body?: object }> {
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    const latencyMs = Date.now() - start;
    let body: object | undefined;
    try { body = await res.json(); } catch { /* */ }
    return { ok: res.ok, latencyMs, status: res.status, body };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

function StatusBadge({ status, colors }: { status: Status; colors: ReturnType<typeof useTheme>["colors"] }) {
  const map: Record<Status, { label: string; bg: string; color: string }> = {
    checking: { label: "⏳ Перевірка...", bg: colors.bgElevated,   color: colors.textSecondary },
    ok:       { label: "✅ OK",           bg: colors.successSoft,   color: colors.success },
    degraded: { label: "⚠️ Частково",    bg: colors.warningSoft,   color: colors.warning },
    error:    { label: "❌ Помилка",      bg: colors.redSoft,       color: colors.red },
  };
  const s = map[status];
  return (
    <View style={{ borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: s.bg }}>
      <Text style={{ fontSize: 12, fontWeight: "800", color: s.color }}>{s.label}</Text>
    </View>
  );
}

export default function DiagnosticScreen() {
  const { colors } = useTheme();
  const [checks, setChecks] = useState<Check[]>([
    { label: "API /health",        status: "checking", detail: "Перевіряємо..." },
    { label: "API /health/email",  status: "checking", detail: "Перевіряємо..." },
    { label: "AI /ai/lidyk (POST)",status: "checking", detail: "Перевіряємо..." },
    { label: "Firebase Auth",      status: "checking", detail: "Перевіряємо..." },
    { label: "AsyncStorage",       status: "checking", detail: "Перевіряємо..." },
    { label: "Firestore /leads",   status: "checking", detail: "Перевіряємо..." },
  ]);
  const [runAt, setRunAt] = useState("");

  function setCheck(i: number, u: Partial<Check>) {
    setChecks((p) => p.map((c, idx) => (idx === i ? { ...c, ...u } : c)));
  }

  async function run() {
    setRunAt(new Date().toLocaleTimeString("uk-UA"));
    setChecks((p) => p.map((c) => ({ ...c, status: "checking" as Status, detail: "Перевіряємо...", latencyMs: undefined })));

    // 1. /health
    const h = await pingGet(`${API_BASE}/health`);
    setCheck(0, {
      status: h.ok ? "ok" : "error",
      detail: h.ok ? `${h.latencyMs}ms — сервіс активний` : `Помилка ${h.status ?? "timeout"} (${h.latencyMs}ms) — URL: ${API_BASE}`,
      latencyMs: h.latencyMs,
    });

    // 2. /health/email
    const e = await pingGet(`${API_BASE}/health/email`);
    const eb = e.body as { ready?: boolean; issues?: string[] } | undefined;
    setCheck(1, {
      status: e.ok && eb?.ready ? "ok" : e.ok ? "degraded" : "error",
      detail: e.ok
        ? eb?.ready ? "Email готовий" : `Не готовий: ${eb?.issues?.join(", ") ?? "—"}`
        : `Помилка ${e.status ?? "timeout"} (${e.latencyMs}ms)`,
      latencyMs: e.latencyMs,
    });

    // 3. AI — POST request (GET returns 404/405, so we POST)
    const ai = await pingPost(`${API_BASE}/ai/lidyk`, { question: "ping" }, 12000);
    const aiOk = ai.status !== undefined && ai.status < 500;
    setCheck(2, {
      status: aiOk ? "ok" : "error",
      detail: aiOk
        ? `Відповідає (HTTP ${ai.status}, ${ai.latencyMs}ms)`
        : `Помилка ${ai.status ?? "timeout"} (${ai.latencyMs}ms)`,
      latencyMs: ai.latencyMs,
    });

    // 4. Firebase Auth
    const fbUser = firebaseAuth.currentUser;
    setCheck(3, {
      status: "ok",
      detail: fbUser
        ? `${fbUser.email ?? (fbUser.isAnonymous ? "Гість (анон)" : fbUser.uid.slice(0, 8))}`
        : "Не авторизовано",
    });

    // 5. AsyncStorage
    try {
      const AS = require("@react-native-async-storage/async-storage");
      await AS.default.getItem("@lider:diag-ping");
      setCheck(4, { status: "ok", detail: "AsyncStorage доступний" });
    } catch {
      setCheck(4, { status: "degraded", detail: "AsyncStorage недоступний" });
    }

    // 6. Firestore via POST /leads (use valid "mobile" source)
    const lr = await pingPost(`${API_BASE}/leads`, {
      name: "Diagnostic Ping",
      phone: "+380000000001",
      city: "Київ",
      category: "B",
      contactMethod: "phone",
      source: "mobile",
      branchId: "kyiv",
      consentAccepted: true,
    }, 12000);
    setCheck(5, {
      status: lr.ok ? "ok" : lr.status === 429 ? "degraded" : "error",
      detail: lr.ok
        ? `Firestore OK (${lr.latencyMs}ms)`
        : lr.status === 429 ? "Rate limited (Firestore OK)"
        : `Помилка ${lr.status ?? "timeout"}: ${JSON.stringify(lr.body ?? {}).slice(0, 100)}`,
      latencyMs: lr.latencyMs,
    });
  }

  useEffect(() => { run(); }, []);

  const overall = checks.every((c) => c.status === "ok") ? "ok"
    : checks.some((c) => c.status === "error") ? "error" : "degraded";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 48, gap: spacing.md }}>

        {/* Header */}
        <View style={{ gap: 4 }}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "700" }}>← Назад</Text>
          </Pressable>
          <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: "900", letterSpacing: -0.5 }}>
            Діагностика
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Стан API, Firebase та авторизації</Text>
          {runAt ? <Text style={{ color: colors.textTertiary, fontSize: 12 }}>Перевірено: {runAt}</Text> : null}
        </View>

        {/* Overall */}
        <View style={{
          borderRadius: radii.md, padding: 16, alignItems: "center",
          backgroundColor: overall === "ok" ? colors.successSoft : overall === "error" ? colors.redSoft : colors.warningSoft,
          borderWidth: 1,
          borderColor: overall === "ok" ? colors.success + "44" : overall === "error" ? colors.red + "44" : colors.warning + "44",
        }}>
          <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 15 }}>
            {overall === "ok" ? "✅ Всі системи працюють" : overall === "error" ? "❌ Є критичні помилки" : "⚠️ Деякі системи деградовані"}
          </Text>
        </View>

        {/* Checks */}
        {checks.map((check, i) => (
          <View key={i} style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 15 }}>{check.label}</Text>
              <StatusBadge status={check.status} colors={colors} />
            </View>
            {check.status === "checking"
              ? <ActivityIndicator color={colors.red} size="small" style={{ alignSelf: "flex-start", marginTop: 8 }} />
              : <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>{check.detail}</Text>
            }
            {check.latencyMs !== undefined && check.status !== "checking"
              ? <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "700" }}>{check.latencyMs}ms</Text>
              : null
            }
          </View>
        ))}

        {/* Config */}
        <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 4 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 15, marginBottom: 6 }}>Конфіг</Text>
          {[
            ["API Base", API_BASE],
            ["Firebase Project", (firebaseApp as any).options?.projectId ?? "—"],
            ["Auth Domain", (firebaseApp as any).options?.authDomain ?? "—"],
            ["Auth UID", firebaseAuth.currentUser?.uid?.slice(0, 12) ?? "—"],
            ["Anon", firebaseAuth.currentUser?.isAnonymous ? "так" : "ні"],
            ["Email", firebaseAuth.currentUser?.email ?? "—"],
            ["Email Verified", firebaseAuth.currentUser?.emailVerified ? "✅ так" : "❌ ні"],
          ].map(([k, v]) => (
            <Text key={k} style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
              <Text style={{ color: colors.textTertiary }}>{k}: </Text>{v}
            </Text>
          ))}
        </View>

        {/* Refresh */}
        <Pressable
          onPress={run}
          style={{ backgroundColor: colors.bgElevated, borderRadius: radii.md, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border }}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 15 }}>🔄 Перевірити ще раз</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
