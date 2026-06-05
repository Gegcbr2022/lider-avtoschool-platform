// ─── Auth Screen — production-ready ──────────────────────────────────────────
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth";
import { useTheme, radii, spacing } from "../lib/theme";

type Screen = "choose" | "email-login" | "email-register" | "forgot";

// ─── Shared components ────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, secure, keyboard, error, autoFocus, autoCapitalize,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; secure?: boolean;
  keyboard?: "default" | "email-address" | "phone-pad";
  error?: string; autoFocus?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "700" }}>{label}</Text>
      <TextInput
        style={{
          backgroundColor: colors.bgCard, borderRadius: radii.sm, borderWidth: 1.5,
          borderColor: error ? colors.red : colors.border, paddingHorizontal: 16,
          paddingVertical: 14, color: colors.textPrimary, fontSize: 16, fontWeight: "600",
        }}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={colors.textTertiary} secureTextEntry={secure}
        keyboardType={keyboard ?? "default"} autoCapitalize={autoCapitalize ?? "none"}
        autoCorrect={false} autoFocus={autoFocus}
      />
      {error ? <Text style={{ color: colors.red, fontSize: 12, fontWeight: "600" }}>{error}</Text> : null}
    </View>
  );
}

function Btn({ label, onPress, loading, variant = "primary", disabled }: {
  label: string; onPress: () => void; loading?: boolean;
  variant?: "primary" | "outline" | "ghost"; disabled?: boolean;
}) {
  const { colors } = useTheme();
  if (variant === "primary") {
    return (
      <Pressable onPress={onPress} disabled={loading || disabled}
        style={{ backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 18, alignItems: "center", shadowColor: colors.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8, opacity: (loading || disabled) ? 0.6 : 1 }}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>{label}</Text>}
      </Pressable>
    );
  }
  if (variant === "outline") {
    return (
      <Pressable onPress={onPress} disabled={disabled}
        style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingVertical: 14, alignItems: "center", opacity: disabled ? 0.5 : 1 }}
      >
        <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 15 }}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ alignItems: "center", paddingVertical: 10 }}>
      <Text style={{ color: colors.textTertiary, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

// ─── Choose Method ────────────────────────────────────────────────────────────

function ChooseScreen({ onSelect }: { onSelect: (s: Screen) => void }) {
  const { colors } = useTheme();
  const { signInAsGuest, signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  async function handleGoogle() {
    setGoogleError(null);
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    setGoogleLoading(false);
    if (!result.success && !result.cancelled) {
      setGoogleError(result.error ?? "Помилка входу через Google");
    }
    // success → onAuthStateChanged in _layout.tsx handles navigation
  }

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ alignItems: "center", gap: 12, marginBottom: spacing.sm }}>
        <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 42 }}>🚗</Text>
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "900", letterSpacing: -0.5, textAlign: "center" }}>Автошкола Лідер</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: "center", lineHeight: 22 }}>
          Твій шлях до водійських прав починається тут.
        </Text>
      </View>

      {/* Email register */}
      <Pressable
        onPress={() => onSelect("email-register")}
        style={{ backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 18, alignItems: "center", shadowColor: colors.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }}
      >
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Зареєструватись безкоштовно</Text>
      </Pressable>

      {/* Email login */}
      <Btn label="Увійти в існуючий акаунт" onPress={() => onSelect("email-login")} variant="outline" />

      {/* Google Sign-In */}
      <Pressable
        onPress={handleGoogle}
        disabled={googleLoading}
        style={{
          flexDirection: "row", alignItems: "center", gap: 14, padding: 16,
          backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1.5,
          borderColor: colors.border, opacity: googleLoading ? 0.7 : 1,
        }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
          {googleLoading ? (
            <ActivityIndicator size="small" color={colors.red} />
          ) : (
            <Text style={{ fontSize: 22, fontWeight: "900", color: "#4285F4" }}>G</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 15 }}>
            {googleLoading ? "Вхід через Google..." : "Продовжити через Google"}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Швидко і безпечно</Text>
        </View>
      </Pressable>

      {googleError ? (
        <View style={{ backgroundColor: colors.redSoft, borderRadius: radii.sm, padding: 12, borderWidth: 1, borderColor: colors.red + "40" }}>
          <Text style={{ color: colors.red, fontWeight: "700", fontSize: 13 }}>⚠️ {googleError}</Text>
        </View>
      ) : null}

      <View style={{ height: 1, backgroundColor: colors.divider }} />

      <Btn label="Продовжити як гість" onPress={() => signInAsGuest()} variant="ghost" />
      <Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: "center", marginTop: -4 }}>
        Доступні курси та демо-тест без реєстрації
      </Text>
    </View>
  );
}

// ─── Email Register ───────────────────────────────────────────────────────────

function EmailRegisterScreen({ onBack, onSuccess }: { onBack: () => void; onSuccess: (email: string) => void }) {
  const { colors } = useTheme();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError(null);
    const trimEmail = email.trim().toLowerCase();
    if (!name.trim()) { setError("Введіть ваше ім'я"); return; }
    if (!trimEmail || !trimEmail.includes("@")) { setError("Введіть коректний email"); return; }
    if (password.length < 6) { setError("Пароль — мінімум 6 символів"); return; }
    setLoading(true);
    const ok = await signUp({ name: name.trim(), email: trimEmail, password });
    setLoading(false);
    if (ok) {
      onSuccess(trimEmail);
    } else {
      setError("Цей email вже зареєстрований або сталася помилка.");
    }
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Pressable onPress={onBack} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 14 }}>← Назад</Text>
      </Pressable>
      <View>
        <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: "900", letterSpacing: -0.5 }}>Реєстрація</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>Займе менше хвилини</Text>
      </View>
      <Field label="Ваше ім'я" value={name} onChange={setName} placeholder="Іван Коваль" autoCapitalize="words" autoFocus />
      <Field label="Email" value={email} onChange={setEmail} placeholder="your@email.com" keyboard="email-address" />
      <Field label="Пароль" value={password} onChange={setPassword} placeholder="мінімум 6 символів" secure error={error ?? undefined} />
      {error ? (
        <View style={{ backgroundColor: colors.redSoft, borderRadius: radii.sm, padding: 12, borderWidth: 1, borderColor: colors.red + "40" }}>
          <Text style={{ color: colors.red, fontWeight: "700", fontSize: 13 }}>⚠️ {error}</Text>
        </View>
      ) : null}
      <Btn label="Зареєструватись" onPress={handleRegister} loading={loading} />
      <Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: "center", lineHeight: 18 }}>
        Реєструючись, ви погоджуєтесь з умовами використання та політикою конфіденційності
      </Text>
    </View>
  );
}

// ─── Email Verification Pending ───────────────────────────────────────────────

function VerificationPendingScreen({ email, onDone }: { email: string; onDone: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.lg, alignItems: "center", paddingTop: 24 }}>
      <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 44 }}>📧</Text>
      </View>
      <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: "900", textAlign: "center", letterSpacing: -0.5 }}>
        Перевір пошту!
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: "center", lineHeight: 24 }}>
        Ми надіслали лист підтвердження на{"\n"}
        <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>{email}</Text>
      </Text>
      <View style={{ backgroundColor: colors.infoSoft, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.info + "33", width: "100%", gap: 4 }}>
        <Text style={{ color: colors.info, fontWeight: "800", fontSize: 13 }}>📬 Що далі:</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
          1. Відкрий лист від Автошколи Лідер{"\n"}
          2. Натисни кнопку «Підтвердити email»{"\n"}
          3. Повернись і натисни «Увійти»
        </Text>
      </View>
      <Btn label="Увійти в акаунт →" onPress={onDone} />
      <Btn label="Я ще не отримав листа" onPress={() => {}} variant="ghost" />
    </View>
  );
}

// ─── Email Login ──────────────────────────────────────────────────────────────

function EmailLoginScreen({ onBack, onForgot }: { onBack: () => void; onForgot: () => void }) {
  const { colors } = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail || !trimEmail.includes("@")) { setError("Введіть коректний email"); return; }
    if (!password) { setError("Введіть пароль"); return; }
    setLoading(true);
    const ok = await signIn(trimEmail, password);
    setLoading(false);
    if (!ok) setError("Невірний email або пароль. Перевірте дані або скористайтесь відновленням.");
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Pressable onPress={onBack} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 14 }}>← Назад</Text>
      </Pressable>
      <View>
        <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: "900", letterSpacing: -0.5 }}>Вхід</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>Введіть дані від вашого акаунту</Text>
      </View>
      <Field label="Email" value={email} onChange={setEmail} placeholder="your@email.com" keyboard="email-address" autoFocus />
      <Field label="Пароль" value={password} onChange={setPassword} placeholder="ваш пароль" secure error={error ?? undefined} />
      {error ? (
        <View style={{ backgroundColor: colors.redSoft, borderRadius: radii.sm, padding: 12, borderWidth: 1, borderColor: colors.red + "40" }}>
          <Text style={{ color: colors.red, fontWeight: "700", fontSize: 13 }}>⚠️ {error}</Text>
        </View>
      ) : null}
      <Btn label="Увійти" onPress={handleLogin} loading={loading} />
      <Btn label="Забули пароль? Відновити →" onPress={onForgot} variant="ghost" />
    </View>
  );
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setError(null);
    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail || !trimEmail.includes("@")) { setError("Введіть коректний email"); return; }
    setLoading(true);
    const result = await forgotPassword(trimEmail);
    setLoading(false);
    if (result.sent) {
      setSent(true);
    } else {
      setError(result.error ?? "Не вдалося надіслати лист. Перевірте email та спробуйте ще раз.");
    }
  }

  if (sent) {
    return (
      <View style={{ gap: spacing.lg, alignItems: "center", paddingTop: 24 }}>
        <Text style={{ fontSize: 56 }}>✉️</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "900", textAlign: "center" }}>Лист надіслано!</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: "center", lineHeight: 24 }}>
          Перевір <Text style={{ fontWeight: "700", color: colors.textPrimary }}>{email.trim()}</Text> та перейди за посиланням для скидання пароля.
        </Text>
        <View style={{ backgroundColor: colors.infoSoft, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.info + "33", width: "100%", gap: 4 }}>
          <Text style={{ color: colors.info, fontWeight: "800", fontSize: 13 }}>📬 Не бачиш листа?</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
            • Перевір папку «Спам» або «Промоакції»{"\n"}
            • Лист від noreply@lider-avtoschool.firebaseapp.com{"\n"}
            • Зазвичай приходить протягом 1-2 хвилин
          </Text>
        </View>
        <Btn label="← Повернутись до входу" onPress={onBack} variant="outline" />
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Pressable onPress={onBack} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 14 }}>← Назад</Text>
      </Pressable>
      <View>
        <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: "900", letterSpacing: -0.5 }}>Відновлення паролю</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4, lineHeight: 20 }}>
          Введіть email — ми надішлемо посилання для скидання пароля.
        </Text>
      </View>
      <Field label="Email" value={email} onChange={setEmail} placeholder="your@email.com" keyboard="email-address" autoFocus error={error ?? undefined} />
      {error ? (
        <View style={{ backgroundColor: colors.redSoft, borderRadius: radii.sm, padding: 12, borderWidth: 1, borderColor: colors.red + "40" }}>
          <Text style={{ color: colors.red, fontWeight: "700", fontSize: 13 }}>⚠️ {error}</Text>
        </View>
      ) : null}
      <Btn label="Надіслати посилання" onPress={handleSend} loading={loading} />
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AuthScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const { colors } = useTheme();

  const [screen, setScreen] = useState<Screen>(
    params.mode === "login" ? "email-login" : "choose"
  );
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);

  if (verifyEmail) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <VerificationPendingScreen
            email={verifyEmail}
            onDone={() => { setVerifyEmail(null); setScreen("email-login"); }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {screen === "choose" && (
            <ChooseScreen onSelect={setScreen} />
          )}
          {screen === "email-register" && (
            <EmailRegisterScreen
              onBack={() => setScreen("choose")}
              onSuccess={(e) => setVerifyEmail(e)}
            />
          )}
          {screen === "email-login" && (
            <EmailLoginScreen
              onBack={() => setScreen("choose")}
              onForgot={() => setScreen("forgot")}
            />
          )}
          {screen === "forgot" && (
            <ForgotPasswordScreen onBack={() => setScreen("email-login")} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
