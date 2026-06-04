// ─── Auth screen: 2-step registration + login + guest ─────────────────────────
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth";
import { useTheme, radii, spacing } from "../lib/theme";

type Mode = "login" | "register";
type Step = 1 | 2;
type AuthMethod = "email" | "phone";

// ─── Simple field ─────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, secure, keyboard, autoCapitalize, error,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; secure?: boolean;
  keyboard?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "words";
  error?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "700" }}>{label}</Text>
      <TextInput
        style={[
          {
            backgroundColor: colors.bgCard,
            borderRadius: radii.sm,
            borderWidth: 1.5,
            borderColor: error ? colors.red : colors.border,
            paddingHorizontal: 16,
            paddingVertical: 14,
            color: colors.textPrimary,
            fontSize: 16,
            fontWeight: "600",
          },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        secureTextEntry={secure}
        keyboardType={keyboard ?? "default"}
        autoCapitalize={autoCapitalize ?? "sentences"}
        autoCorrect={false}
      />
      {error ? (
        <Text style={{ color: colors.red, fontSize: 12, fontWeight: "600" }}>{error}</Text>
      ) : null}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AuthScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const initialMode: Mode = params.mode === "register" ? "register" : "login";
  const [mode, setMode] = useState<Mode>(initialMode);

  const { signIn, signUp, signInAsGuest } = useAuth();
  const { colors } = useTheme();

  // Step management (register only)
  const [step, setStep] = useState<Step>(1);
  const [method, setMethod] = useState<AuthMethod>("email");

  // Step 1 fields
  const [identifier, setIdentifier] = useState(""); // email or phone

  // Step 2 fields
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Login fields
  const [loginId, setLoginId] = useState("");
  const [loginPass, setLoginPass] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ─── Validate ─────────────────────────────────────────────────────────────

  function validateStep1(): boolean {
    if (!identifier.trim()) { setError("Введіть email або номер телефону"); return false; }
    if (method === "email" && !identifier.includes("@")) { setError("Невірний формат email"); return false; }
    if (method === "phone" && identifier.replace(/\D/g, "").length < 10) { setError("Невірний номер телефону"); return false; }
    return true;
  }

  function validateStep2(): boolean {
    if (password.length < 6) { setError("Пароль — мінімум 6 символів"); return false; }
    return true;
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  function handleStep1Next() {
    setError(null);
    if (!validateStep1()) return;
    setStep(2);
  }

  async function handleRegister() {
    setError(null);
    if (!validateStep2()) return;
    setSubmitting(true);

    const email = method === "email"
      ? identifier.trim().toLowerCase()
      : `${identifier.replace(/\D/g, "")}@phone.lider.ua`;

    const ok = await signUp({
      name: name.trim() || (method === "email" ? identifier.split("@")[0] : `Учень`),
      email,
      password,
      phone: method === "phone" ? identifier.trim() : "",
      city: "Київ",
      category: "B",
      contactMethod: "phone",
    });
    setSubmitting(false);
    if (!ok) setError("Помилка реєстрації. Спробуй інший email або повернись і перевір дані.");
  }

  async function handleLogin() {
    setError(null);
    if (!loginId.trim()) { setError("Введіть email або телефон"); return; }
    if (!loginPass) { setError("Введіть пароль"); return; }
    setSubmitting(true);

    const email = loginId.includes("@")
      ? loginId.trim().toLowerCase()
      : `${loginId.replace(/\D/g, "")}@phone.lider.ua`;

    const ok = await signIn(email, loginPass);
    setSubmitting(false);
    if (!ok) setError("Невірні дані. Перевір email/телефон та пароль.");
  }

  // ─── UI ───────────────────────────────────────────────────────────────────

  const inputBg = colors.bgCard;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 60, gap: spacing.lg }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ gap: 8 }}>
            <Pressable onPress={() => step === 2 ? setStep(1) : router.back()} style={{ paddingVertical: 4, alignSelf: "flex-start" }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "700" }}>
                {step === 2 && mode === "register" ? "← Назад" : "← Назад"}
              </Text>
            </Pressable>
            <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 }}>
              {mode === "register"
                ? step === 1 ? "Реєстрація" : "Придумай пароль"
                : "Вхід в кабінет"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22 }}>
              {mode === "register"
                ? step === 1
                  ? "Введи email або номер телефону — більше нічого не потрібно."
                  : `Пароль для акаунту ${identifier}.`
                : "Введи дані від свого акаунту Лідер."}
            </Text>
          </View>

          {/* Mode switcher */}
          <View style={{ flexDirection: "row", backgroundColor: colors.bgCard, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, padding: 4, gap: 4 }}>
            {(["register", "login"] as Mode[]).map((m) => (
              <Pressable
                key={m}
                style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: radii.xs, backgroundColor: mode === m ? colors.red : "transparent" }}
                onPress={() => { setMode(m); setStep(1); setError(null); }}
              >
                <Text style={{ color: mode === m ? colors.white : colors.textSecondary, fontWeight: "700", fontSize: 14 }}>
                  {m === "register" ? "Реєстрація" : "Вхід"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Form */}
          <View style={{ gap: spacing.md }}>
            {mode === "register" ? (
              step === 1 ? (
                <>
                  {/* Method selector */}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {(["email", "phone"] as AuthMethod[]).map((m) => (
                      <Pressable
                        key={m}
                        style={{ flex: 1, paddingVertical: 10, borderRadius: radii.sm, borderWidth: 1.5, borderColor: method === m ? colors.red : colors.border, backgroundColor: method === m ? colors.redSoft : colors.bgElevated, alignItems: "center" }}
                        onPress={() => { setMethod(m); setIdentifier(""); setError(null); }}
                      >
                        <Text style={{ color: method === m ? colors.red : colors.textSecondary, fontWeight: "700", fontSize: 14 }}>
                          {m === "email" ? "📧 Email" : "📱 Телефон"}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Field
                    label={method === "email" ? "Email" : "Номер телефону"}
                    value={identifier}
                    onChange={setIdentifier}
                    placeholder={method === "email" ? "your@email.com" : "+380 50 123 45 67"}
                    keyboard={method === "email" ? "email-address" : "phone-pad"}
                    autoCapitalize="none"
                    error={error ?? undefined}
                  />

                  <Pressable
                    style={{ backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 18, alignItems: "center", shadowColor: colors.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }}
                    onPress={handleStep1Next}
                  >
                    <Text style={{ color: colors.white, fontSize: 16, fontWeight: "800" }}>Продовжити →</Text>
                  </Pressable>
                </>
              ) : (
                // Step 2
                <>
                  <Field
                    label="Ім'я (необов'язково)"
                    value={name}
                    onChange={setName}
                    placeholder="Іван Коваль"
                    autoCapitalize="words"
                  />

                  <Field
                    label="Пароль"
                    value={password}
                    onChange={setPassword}
                    placeholder="мінімум 6 символів"
                    secure
                    autoCapitalize="none"
                    error={error ?? undefined}
                  />

                  <Pressable
                    style={{ backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 18, alignItems: "center", shadowColor: colors.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8, opacity: submitting ? 0.6 : 1 }}
                    onPress={handleRegister}
                    disabled={submitting}
                  >
                    {submitting ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={{ color: colors.white, fontSize: 16, fontWeight: "800" }}>Зареєструватись ✓</Text>}
                  </Pressable>
                </>
              )
            ) : (
              // Login
              <>
                <Field
                  label="Email або телефон"
                  value={loginId}
                  onChange={setLoginId}
                  placeholder="your@email.com або +380..."
                  keyboard="email-address"
                  autoCapitalize="none"
                />
                <Field
                  label="Пароль"
                  value={loginPass}
                  onChange={setLoginPass}
                  placeholder="••••••"
                  secure
                  autoCapitalize="none"
                  error={error ?? undefined}
                />
                <Pressable
                  style={{ backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 18, alignItems: "center", shadowColor: colors.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8, opacity: submitting ? 0.6 : 1 }}
                  onPress={handleLogin}
                  disabled={submitting}
                >
                  {submitting ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={{ color: colors.white, fontSize: 16, fontWeight: "800" }}>Увійти</Text>}
                </Pressable>
              </>
            )}

            {/* Error */}
            {error && mode !== "register" ? (
              <View style={{ backgroundColor: colors.redSoft, borderRadius: radii.sm, padding: 14, borderWidth: 1, borderColor: colors.red + "40" }}>
                <Text style={{ color: colors.red, fontWeight: "700", fontSize: 14 }}>⚠️ {error}</Text>
              </View>
            ) : null}
          </View>

          {/* Google auth (coming soon) */}
          <View style={{ alignItems: "center", gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, width: "100%" }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text style={{ color: colors.textTertiary, fontSize: 13 }}>або</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>

            {/* TODO: Google Sign-In — see lib/googleAuth.ts for setup instructions */}
            <View style={{ width: "100%", borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingVertical: 14, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: colors.bgElevated }}>
              <Text style={{ fontSize: 18 }}>G</Text>
              <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 15 }}>Увійти через Google</Text>
              <View style={{ backgroundColor: colors.warningSoft, borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: colors.warning, fontSize: 10, fontWeight: "800" }}>SOON</Text>
              </View>
            </View>

            <Pressable
              style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingVertical: 13, paddingHorizontal: 32 }}
              onPress={signInAsGuest}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 15 }}>Продовжити як гість</Text>
            </Pressable>

            <Text style={{ color: colors.textTertiary, fontSize: 12, lineHeight: 18, textAlign: "center" }}>
              Гість може переглядати курси та пройти демо-тест без реєстрації.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
