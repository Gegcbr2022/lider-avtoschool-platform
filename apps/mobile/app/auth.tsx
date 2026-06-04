// ─── Auth Screen ─────────────────────────────────────────────────────────────
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

type Screen = "choose" | "email" | "phone";
type EmailMode = "login" | "register";

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, secure, keyboard, error, autoFocus,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; secure?: boolean;
  keyboard?: "default" | "email-address" | "phone-pad";
  error?: string; autoFocus?: boolean;
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
        keyboardType={keyboard ?? "default"} autoCapitalize="none"
        autoCorrect={false} autoFocus={autoFocus}
      />
      {error ? <Text style={{ color: colors.red, fontSize: 12, fontWeight: "600" }}>{error}</Text> : null}
    </View>
  );
}

function PrimaryBtn({ label, onPress, loading }: { label: string; onPress: () => void; loading?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress} disabled={loading}
      style={{ backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 18, alignItems: "center", shadowColor: colors.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8, opacity: loading ? 0.6 : 1 }}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>{label}</Text>
      }
    </Pressable>
  );
}

function ModeToggle({ mode, onChange }: { mode: EmailMode; onChange: (m: EmailMode) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", backgroundColor: colors.bgCard, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, padding: 4, gap: 4 }}>
      {(["login", "register"] as EmailMode[]).map((m) => (
        <Pressable
          key={m} onPress={() => onChange(m)}
          style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: radii.xs, backgroundColor: mode === m ? colors.red : "transparent" }}
        >
          <Text style={{ color: mode === m ? "#fff" : colors.textSecondary, fontWeight: "700", fontSize: 14 }}>
            {m === "login" ? "Вхід" : "Реєстрація"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Choose Screen ────────────────────────────────────────────────────────────

function ChooseScreen({ onSelect }: { onSelect: (s: Screen) => void }) {
  const { colors } = useTheme();
  const { signInAsGuest } = useAuth();

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ alignItems: "center", marginBottom: spacing.sm }}>
        <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Text style={{ fontSize: 40 }}>🚗</Text>
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "900", letterSpacing: -0.5, textAlign: "center" }}>
          Автошкола Лідер
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 8, textAlign: "center", lineHeight: 22 }}>
          Твій шлях до прав починається тут.
        </Text>
      </View>

      <Pressable
        onPress={() => onSelect("email")}
        style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 18, backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 20 }}>📧</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 16 }}>Увійти через Email</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Пошта та пароль</Text>
        </View>
        <Text style={{ color: colors.textTertiary, fontSize: 20 }}>›</Text>
      </Pressable>

      <Pressable
        onPress={() => onSelect("phone")}
        style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 18, backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 20 }}>📱</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 16 }}>Увійти через Телефон</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Номер телефону та пароль</Text>
        </View>
        <Text style={{ color: colors.textTertiary, fontSize: 20 }}>›</Text>
      </Pressable>

      {/* Google — coming soon, shown as disabled */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 18, backgroundColor: colors.bgElevated, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border, opacity: 0.5 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "900", color: colors.textTertiary }}>G</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textTertiary, fontWeight: "700", fontSize: 16 }}>Google</Text>
          <Text style={{ color: colors.textTertiary, fontSize: 13, marginTop: 2 }}>Скоро буде доступно</Text>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />

      <Pressable
        onPress={() => signInAsGuest()}
        style={{ alignItems: "center", paddingVertical: 14, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border }}
      >
        <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 15 }}>
          Продовжити як гість
        </Text>
        <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 4 }}>
          Доступні курси та демо-тест без реєстрації
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Email Screen ─────────────────────────────────────────────────────────────

function EmailScreen({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<EmailMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !email.includes("@")) { setError("Введіть коректний email"); return; }
    if (password.length < 6) { setError("Пароль — мінімум 6 символів"); return; }
    setLoading(true);
    if (mode === "login") {
      const ok = await signIn(email.trim().toLowerCase(), password);
      setLoading(false);
      if (!ok) setError("Невірний email або пароль");
    } else {
      const ok = await signUp({
        name: name.trim() || email.split("@")[0],
        email: email.trim().toLowerCase(),
        password,
        phone: "", city: "Київ", category: "B", contactMethod: "phone",
      });
      setLoading(false);
      if (ok) {
        setRegistered(true);
      } else {
        setError("Помилка. Можливо, цей email вже зареєстрований.");
      }
    }
  }

  // Email verification sent screen
  if (registered) {
    return (
      <View style={{ gap: spacing.lg, alignItems: "center", paddingTop: 24 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 40 }}>📧</Text>
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "900", textAlign: "center" }}>
          Перевір пошту!
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: "center", lineHeight: 24 }}>
          Ми надіслали лист підтвердження на{"\n"}
          <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>{email.trim().toLowerCase()}</Text>
        </Text>
        <View style={{ backgroundColor: colors.infoSoft, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.info + "33", width: "100%" }}>
          <Text style={{ color: colors.info, fontWeight: "700", fontSize: 13 }}>
            📬 Що далі:{"\n"}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
            1. Відкрий лист від Автошколи Лідер{"\n"}
            2. Натисни кнопку підтвердження{"\n"}
            3. Повернись в додаток і увійди
          </Text>
        </View>
        <Pressable
          onPress={() => { setRegistered(false); setMode("login"); }}
          style={{ width: "100%", backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 18, alignItems: "center", shadowColor: colors.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }}
        >
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Увійти в акаунт →</Text>
        </Pressable>
        <Pressable onPress={() => setRegistered(false)} style={{ paddingVertical: 10 }}>
          <Text style={{ color: colors.textTertiary, fontSize: 14 }}>Змінити email</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Pressable onPress={onBack} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 14 }}>← Назад</Text>
      </Pressable>

      <ModeToggle mode={mode} onChange={(m) => { setMode(m); setError(null); }} />

      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "900", letterSpacing: -0.5 }}>
        {mode === "login" ? "Вхід в кабінет" : "Створити акаунт"}
      </Text>

      {mode === "register" ? (
        <Field label="Ваше ім'я" value={name} onChange={setName} placeholder="Іван Коваль" autoFocus />
      ) : null}

      <Field label="Email" value={email} onChange={setEmail} placeholder="your@email.com" keyboard="email-address" autoFocus={mode === "login"} />
      <Field label="Пароль" value={password} onChange={setPassword} placeholder="мінімум 6 символів" secure error={error ?? undefined} />

      {error ? (
        <View style={{ backgroundColor: colors.redSoft, borderRadius: radii.sm, padding: 12, borderWidth: 1, borderColor: colors.red + "40" }}>
          <Text style={{ color: colors.red, fontWeight: "700", fontSize: 14 }}>⚠️ {error}</Text>
        </View>
      ) : null}

      <PrimaryBtn label={mode === "login" ? "Увійти" : "Зареєструватись"} onPress={handleSubmit} loading={loading} />

      {mode === "login" ? (
        <Pressable style={{ alignItems: "center", paddingVertical: 8 }} onPress={() => {}}>
          <Text style={{ color: colors.textTertiary, fontSize: 13 }}>Забули пароль? Надіслати лист для відновлення</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── Phone Screen ─────────────────────────────────────────────────────────────

function PhoneScreen({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<EmailMode>("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function normalize(p: string) { return p.replace(/\D/g, "").replace(/^38/, "").slice(0, 10); }
  function phoneToEmail(p: string) { return `${normalize(p)}@phone.lider.ua`; }

  async function handleSubmit() {
    setError(null);
    const digits = normalize(phone);
    if (digits.length < 9) { setError("Введіть коректний номер телефону"); return; }
    if (password.length < 6) { setError("Пароль — мінімум 6 символів"); return; }
    setLoading(true);
    const proxyEmail = phoneToEmail(phone);
    if (mode === "login") {
      const ok = await signIn(proxyEmail, password);
      setLoading(false);
      if (!ok) setError("Невірний номер або пароль");
    } else {
      const ok = await signUp({
        name: `Учень`,
        email: proxyEmail,
        password,
        phone: `+38${digits}`,
        city: "Київ", category: "B", contactMethod: "phone",
      });
      setLoading(false);
      if (!ok) setError("Цей номер вже зареєстрований або сталась помилка.");
    }
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Pressable onPress={onBack} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 14 }}>← Назад</Text>
      </Pressable>

      <ModeToggle mode={mode} onChange={(m) => { setMode(m); setError(null); }} />

      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "900" }}>
        {mode === "login" ? "Вхід за телефоном" : "Реєстрація за телефоном"}
      </Text>

      <Field label="Номер телефону" value={phone} onChange={setPhone} placeholder="+380 50 123 45 67" keyboard="phone-pad" autoFocus />
      <Field label="Пароль" value={password} onChange={setPassword} placeholder="мінімум 6 символів" secure error={error ?? undefined} />

      {error ? (
        <View style={{ backgroundColor: colors.redSoft, borderRadius: radii.sm, padding: 12, borderWidth: 1, borderColor: colors.red + "40" }}>
          <Text style={{ color: colors.red, fontWeight: "700", fontSize: 14 }}>⚠️ {error}</Text>
        </View>
      ) : null}

      <PrimaryBtn label={mode === "login" ? "Увійти" : "Зареєструватись"} onPress={handleSubmit} loading={loading} />
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AuthScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const { colors } = useTheme();
  const [screen, setScreen] = useState<Screen>(
    params.mode === "register" || params.mode === "login" ? "email" : "choose"
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {screen === "choose" && <ChooseScreen onSelect={setScreen} />}
          {screen === "email" && <EmailScreen onBack={() => setScreen("choose")} />}
          {screen === "phone" && <PhoneScreen onBack={() => setScreen("choose")} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
