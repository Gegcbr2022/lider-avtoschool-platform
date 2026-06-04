// ─── Auth Screen — упрощённый flow ───────────────────────────────────────────
// Flow: Choose method → Credentials → Done
// Methods: Email | Phone (proxy) | Google (SOON) | Guest
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
        keyboardType={keyboard ?? "default"} autoCapitalize="none" autoCorrect={false}
        autoFocus={autoFocus}
      />
      {error ? <Text style={{ color: colors.red, fontSize: 12, fontWeight: "600" }}>{error}</Text> : null}
    </View>
  );
}

function BigBtn({ label, onPress, loading, style }: { label: string; onPress: () => void; loading?: boolean; style?: object }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[{ backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 18, alignItems: "center", shadowColor: colors.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8, opacity: loading ? 0.6 : 1 }, style]}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>{label}</Text>
      }
    </Pressable>
  );
}

function OutlineBtn({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" }}
    >
      <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

// ─── Choose method screen ─────────────────────────────────────────────────────

function ChooseScreen({ onSelect }: { onSelect: (s: Screen) => void }) {
  const { colors } = useTheme();
  const { signInAsGuest } = useAuth();

  const options = [
    { icon: "📧", label: "Увійти через Email", screen: "email" as Screen, available: true },
    { icon: "📱", label: "Увійти через Телефон", screen: "phone" as Screen, available: true },
    { icon: "G", label: "Увійти через Google", screen: null, available: false },
  ];

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ alignItems: "center", marginBottom: spacing.sm }}>
        <Text style={{ fontSize: 48, marginBottom: 8 }}>🚗</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "900", letterSpacing: -0.5, textAlign: "center" }}>
          Лідер
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 6, textAlign: "center", lineHeight: 22 }}>
          Автошкола у твоєму телефоні.{"\n"}Обери спосіб входу:
        </Text>
      </View>

      {options.map((opt) => (
        <Pressable
          key={opt.label}
          onPress={opt.available && opt.screen ? () => onSelect(opt.screen!) : undefined}
          style={{
            flexDirection: "row", alignItems: "center", gap: 14, padding: 18,
            backgroundColor: opt.available ? colors.bgCard : colors.bgElevated,
            borderRadius: radii.md, borderWidth: 1.5,
            borderColor: opt.available ? colors.border : colors.border,
            opacity: opt.available ? 1 : 0.55,
          }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: opt.available ? colors.redSoft : colors.bgElevated, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: opt.available ? colors.red : colors.textTertiary, fontSize: opt.icon === "G" ? 20 : 18, fontWeight: "800" }}>{opt.icon}</Text>
          </View>
          <Text style={{ flex: 1, color: opt.available ? colors.textPrimary : colors.textTertiary, fontWeight: "700", fontSize: 16 }}>
            {opt.label}
          </Text>
          {!opt.available ? (
            <View style={{ backgroundColor: colors.warningSoft, borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: colors.warning, fontSize: 10, fontWeight: "800" }}>SOON</Text>
            </View>
          ) : (
            <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>
          )}
        </Pressable>
      ))}

      {/* Google TODO note */}
      <View style={{ backgroundColor: colors.infoSoft, borderRadius: radii.sm, padding: 12, borderWidth: 1, borderColor: colors.info + "33" }}>
        <Text style={{ color: colors.info, fontSize: 12, fontWeight: "700", marginBottom: 4 }}>
          ℹ️ Google Sign-In — що потрібно для активації:
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
          1. Firebase Console → Auth → Google → Enable{"\n"}
          2. Скопіювати Web Client ID у lib/googleAuth.ts{"\n"}
          3. Додати SHA-1/SHA-256 у Project Settings → Android{"\n"}
          4. Оновити google-services.json
        </Text>
      </View>

      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />

      <Pressable
        onPress={() => signInAsGuest()}
        style={{ alignItems: "center", paddingVertical: 12 }}
      >
        <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 15 }}>
          Продовжити як гість →
        </Text>
        <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 4 }}>
          Доступні курси та демо-тест
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Email screen ─────────────────────────────────────────────────────────────

function EmailScreen({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<EmailMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !email.includes("@")) { setError("Введіть коректний email"); return; }
    if (password.length < 6) { setError("Пароль — мінімум 6 символів"); return; }
    setLoading(true);
    if (mode === "login") {
      const ok = await signIn(email.trim().toLowerCase(), password);
      if (!ok) setError("Невірний email або пароль");
    } else {
      const ok = await signUp({
        name: name.trim() || email.split("@")[0],
        email: email.trim().toLowerCase(),
        password,
        phone: "", city: "Київ", category: "B", contactMethod: "phone",
      });
      if (!ok) setError("Помилка реєстрації. Перевір дані або спробуй інший email.");
    }
    setLoading(false);
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Pressable onPress={onBack} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 14 }}>← Назад</Text>
      </Pressable>

      {/* Mode tabs */}
      <View style={{ flexDirection: "row", backgroundColor: colors.bgCard, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, padding: 4, gap: 4 }}>
        {(["login", "register"] as EmailMode[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => { setMode(m); setError(null); }}
            style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: radii.xs, backgroundColor: mode === m ? colors.red : "transparent" }}
          >
            <Text style={{ color: mode === m ? "#fff" : colors.textSecondary, fontWeight: "700", fontSize: 14 }}>
              {m === "login" ? "Вхід" : "Реєстрація"}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "900", letterSpacing: -0.5 }}>
        {mode === "login" ? "Вхід в кабінет" : "Нова реєстрація"}
      </Text>

      {mode === "register" ? (
        <Field label="Ім'я (необов'язково)" value={name} onChange={setName} placeholder="Іван Коваль" autoFocus />
      ) : null}

      <Field label="Email" value={email} onChange={setEmail} placeholder="your@email.com" keyboard="email-address" autoFocus={mode === "login"} />
      <Field label="Пароль" value={password} onChange={setPassword} placeholder="мінімум 6 символів" secure error={error ?? undefined} />

      {error && mode === "login" ? (
        <View style={{ backgroundColor: colors.redSoft, borderRadius: radii.sm, padding: 12, borderWidth: 1, borderColor: colors.red + "40" }}>
          <Text style={{ color: colors.red, fontWeight: "700", fontSize: 14 }}>⚠️ {error}</Text>
        </View>
      ) : null}

      <BigBtn label={mode === "login" ? "Увійти" : "Зареєструватись ✓"} onPress={handleSubmit} loading={loading} />
    </View>
  );
}

// ─── Phone screen ─────────────────────────────────────────────────────────────

function PhoneScreen({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<EmailMode>("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function normalizePhone(p: string) {
    return p.replace(/\D/g, "").replace(/^38/, "").slice(0, 10);
  }

  function phoneToEmail(p: string) {
    return `${normalizePhone(p)}@phone.lider.ua`;
  }

  async function handleSubmit() {
    setError(null);
    const digits = normalizePhone(phone);
    if (digits.length < 9) { setError("Введіть коректний номер (10 цифр)"); return; }
    if (password.length < 6) { setError("Пароль — мінімум 6 символів"); return; }
    setLoading(true);
    const proxyEmail = phoneToEmail(phone);
    if (mode === "login") {
      const ok = await signIn(proxyEmail, password);
      if (!ok) setError("Невірний телефон або пароль");
    } else {
      const ok = await signUp({
        name: `Учень ${digits.slice(-4)}`,
        email: proxyEmail,
        password,
        phone: `+38${digits}`,
        city: "Київ", category: "B", contactMethod: "phone",
      });
      if (!ok) setError("Помилка. Можливо, цей номер вже зареєстрований.");
    }
    setLoading(false);
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Pressable onPress={onBack} style={{ alignSelf: "flex-start" }}>
        <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 14 }}>← Назад</Text>
      </Pressable>

      <View style={{ flexDirection: "row", backgroundColor: colors.bgCard, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, padding: 4, gap: 4 }}>
        {(["login", "register"] as EmailMode[]).map((m) => (
          <Pressable key={m} onPress={() => { setMode(m); setError(null); }}
            style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: radii.xs, backgroundColor: mode === m ? colors.red : "transparent" }}
          >
            <Text style={{ color: mode === m ? "#fff" : colors.textSecondary, fontWeight: "700", fontSize: 14 }}>
              {m === "login" ? "Вхід" : "Реєстрація"}
            </Text>
          </Pressable>
        ))}
      </View>

      <View>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "900" }}>
          {mode === "login" ? "Вхід за телефоном" : "Реєстрація"}
        </Text>
        <View style={{ backgroundColor: colors.warningSoft, borderRadius: radii.sm, padding: 10, marginTop: 8, borderWidth: 1, borderColor: colors.warning + "44" }}>
          <Text style={{ color: colors.warning, fontSize: 12, fontWeight: "700" }}>
            📱 Dev mode: SMS-верифікація тимчасово відключена.{"\n"}
            Логін через телефон + пароль (без OTP).
          </Text>
        </View>
      </View>

      <Field label="Номер телефону" value={phone} onChange={setPhone} placeholder="+380 50 123 45 67" keyboard="phone-pad" autoFocus />
      <Field label="Пароль" value={password} onChange={setPassword} placeholder="мінімум 6 символів" secure error={error ?? undefined} />

      {error ? (
        <View style={{ backgroundColor: colors.redSoft, borderRadius: radii.sm, padding: 12, borderWidth: 1, borderColor: colors.red + "40" }}>
          <Text style={{ color: colors.red, fontWeight: "700", fontSize: 14 }}>⚠️ {error}</Text>
        </View>
      ) : null}

      <BigBtn label={mode === "login" ? "Увійти" : "Зареєструватись ✓"} onPress={handleSubmit} loading={loading} />
    </View>
  );
}

// ─── Root screen ──────────────────────────────────────────────────────────────

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
          {screen === "choose" && (
            <ChooseScreen onSelect={setScreen} />
          )}
          {screen === "email" && (
            <EmailScreen onBack={() => setScreen("choose")} />
          )}
          {screen === "phone" && (
            <PhoneScreen onBack={() => setScreen("choose")} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
