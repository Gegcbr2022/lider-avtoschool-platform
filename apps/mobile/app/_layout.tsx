import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createNotificationChannels,
  registerPushToken,
  requestNotificationPermission,
  setupNotificationListeners,
} from "../lib/notifications";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { firebaseAuth } from "../lib/firebase";
import { initAppCheck } from "../lib/appCheck";
import { AuthContext } from "../lib/auth";
import type { AuthContextValue, AuthMode, SignUpData, User } from "../lib/auth";
import { GUEST_USER } from "../lib/auth";
import { API_BASE } from "../lib/api";
import { ThemeProvider, darkColors as colors, radii, spacing } from "../lib/theme";
import { configureGoogleSignIn, signInWithGoogle as googleSignIn, signOutFromGoogle } from "../lib/googleAuth";

// ─── Avatar emoji pool ────────────────────────────────────────────────────────
const AVATAR_EMOJIS = ["🚗", "🏎️", "🚦", "🛞", "🏁", "🚘", "🧭", "⭐", "🔥", "😎", "🚙", "🛣️"];

function pickAvatar(uid: string): string {
  const idx = uid.charCodeAt(0) % AVATAR_EMOJIS.length;
  return AVATAR_EMOJIS[idx];
}

// ─── Convert Firebase user to our User type ───────────────────────────────────

function toAppUser(fb: FirebaseUser): User {
  const isPhoneProxy = fb.email?.endsWith("@phone.lider.ua") ?? false;
  const displayName = fb.displayName ?? (isPhoneProxy ? "Учень" : fb.email?.split("@")[0] ?? "Учень");
  return {
    id: fb.uid,
    name: displayName,
    phone: fb.phoneNumber ?? "",
    email: isPhoneProxy ? undefined : (fb.email ?? undefined),
    avatarInitials: displayName.slice(0, 2).toUpperCase(),
    avatarEmoji: fb.photoURL ? undefined : pickAvatar(fb.uid),
    photoURL: fb.photoURL ?? undefined,
    emailVerified: fb.emailVerified,
    isGuest: fb.isAnonymous,
  };
}

// ─── Error boundary ───────────────────────────────────────────────────────────

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={errStyles.wrap}>
      <Text style={errStyles.emoji}>🚧</Text>
      <Text style={errStyles.title}>Лідик загубив конус</Text>
      <Text style={errStyles.msg}>Щось пішло не так. Спробуй перезапустити.</Text>
      <ScrollView style={errStyles.detail}>
        <Text style={errStyles.detailText}>{error.message}</Text>
      </ScrollView>
      <Pressable style={errStyles.btn} onPress={retry}>
        <Text style={errStyles.btnText}>Спробувати ще раз</Text>
      </Pressable>
    </View>
  );
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [mode, setMode] = useState<AuthMode>("unauthenticated");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authGateVisible, setAuthGateVisible] = useState(false);
  const authGateCallback = useRef<(() => void) | undefined>(undefined);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Configure Google Sign-In + App Check once
  useEffect(() => {
    configureGoogleSignIn();
    initAppCheck();
  }, []);

  // ─── Setup push notifications (Android channels + request permission) ───────
  useEffect(() => {
    void createNotificationChannels();
    const cleanup = setupNotificationListeners();
    return cleanup;
  }, []);

  // Register push token when authenticated user is known
  useEffect(() => {
    if (mode !== "authenticated" || !user?.id) return;
    void requestNotificationPermission().then((status) => {
      if (status === "granted") {
        void registerPushToken(user.id);
      }
    });
  }, [mode, user?.id]);

  // ─── Listen to Firebase auth state (persists across restarts) ─────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (fbUser) => {
      if (fbUser) {
        const appUser = toAppUser(fbUser);
        setUser(appUser);
        setMode(fbUser.isAnonymous ? "guest" : "authenticated");
      } else {
        setUser(null);
        setMode("unauthenticated");
      }
      setIsLoading(false);
    });
    return unsub;
  }, []);

  // ─── Navigate once auth state is resolved ─────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    if (mode === "unauthenticated") {
      router.replace("/onboarding");
    } else {
      router.replace("/(tabs)");
    }
  }, [isLoading, mode]);

  // ─── Auth actions ──────────────────────────────────────────────────────────

  const signInAsGuest = useCallback(async () => {
    try {
      await Promise.race([
        signInAnonymously(firebaseAuth),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Guest auth timeout")), 5000)
        ),
      ]);
    } catch {
      setUser(GUEST_USER);
      setMode("guest");
      setIsLoading(false);
      router.replace("/(tabs)");
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      return true;
    } catch {
      return false;
    }
  }, []);

  const signUp = useCallback(async (data: SignUpData): Promise<boolean> => {
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, data.email, data.password);
      await updateProfile(cred.user, { displayName: data.name });
      sendEmailVerification(cred.user).catch(() => {});
      fetch(`${API_BASE}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          phone: "",
          city: "Не вказано",
          category: "B",
          contactMethod: "phone",
          source: "mobile",
          branchId: "kyiv",
          consentAccepted: true,
        }),
      }).catch(() => {});
      return true;
    } catch {
      return false;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    return await googleSignIn();
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<{ sent: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim().toLowerCase(), {
        // handleCodeInApp: false — link opens in browser (default, works for password reset)
        url: "https://lider-avtoschool.firebaseapp.com/__/auth/action",
        handleCodeInApp: false,
      });
      return { sent: true };
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? "";
      if (code === "auth/user-not-found") {
        // Firebase security: silently succeed to prevent user enumeration
        return { sent: true };
      }
      if (code === "auth/invalid-email") {
        return { sent: false, error: "Невірний формат email" };
      }
      if (code === "auth/too-many-requests") {
        return { sent: false, error: "Забагато запитів. Зачекайте хвилину та спробуйте ще раз." };
      }
      return { sent: false, error: `Firebase помилка: ${code || "network"}` };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutFromGoogle();
      await firebaseSignOut(firebaseAuth);
    } catch {
      setUser(null);
      setMode("unauthenticated");
      router.replace("/onboarding");
    }
  }, []);

  const requireAuth = useCallback(
    (onSuccess: () => void) => {
      if (mode === "authenticated") {
        onSuccess();
        return;
      }
      authGateCallback.current = onSuccess;
      setAuthGateVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    },
    [mode, fadeAnim]
  );

  const closeAuthGate = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setAuthGateVisible(false));
  }, [fadeAnim]);

  const authValue: AuthContextValue = {
    mode,
    user,
    isLoading,
    signInAsGuest,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    forgotPassword,
    requireAuth,
  };

  if (isLoading) {
    return (
      <View style={splashStyles.wrap}>
        <Text style={splashStyles.logo}>🚗</Text>
        <Text style={splashStyles.brand}>Лідер</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
    <SafeAreaProvider>
      <AuthContext.Provider value={authValue}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="diagnostic" />
          <Stack.Screen name="documents" />
          <Stack.Screen name="booking" />
          <Stack.Screen name="lessons" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <StatusBar style="light" />

        {/* Auth gate modal */}
        <Modal
          visible={authGateVisible}
          transparent
          animationType="none"
          onRequestClose={closeAuthGate}
        >
          <Animated.View style={[gateStyles.overlay, { opacity: fadeAnim }]}>
            <Pressable style={gateStyles.backdrop} onPress={closeAuthGate} />
            <View style={gateStyles.sheet}>
              <View style={gateStyles.handle} />
              <Text style={gateStyles.emoji}>🔐</Text>
              <Text style={gateStyles.title}>Увійдіть, щоб продовжити</Text>
              <Text style={gateStyles.msg}>
                Ця функція доступна зареєстрованим учням. Вхід займає 30 секунд.
              </Text>
              <Pressable
                style={gateStyles.btnPrimary}
                onPress={() => { closeAuthGate(); router.push("/auth?mode=register"); }}
              >
                <Text style={gateStyles.btnPrimaryText}>Зареєструватись</Text>
              </Pressable>
              <Pressable
                style={gateStyles.btnSecondary}
                onPress={() => { closeAuthGate(); router.push("/auth?mode=login"); }}
              >
                <Text style={gateStyles.btnSecondaryText}>Увійти</Text>
              </Pressable>
              <Pressable style={gateStyles.btnGhost} onPress={closeAuthGate}>
                <Text style={gateStyles.btnGhostText}>Залишитись як гість</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Modal>
      </AuthContext.Provider>
    </SafeAreaProvider>
    </ThemeProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const splashStyles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 12 },
  logo: { fontSize: 56 },
  brand: { color: colors.textPrimary, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
});

const errStyles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 32 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: "900", marginBottom: 8 },
  msg: { color: colors.textSecondary, fontSize: 15, textAlign: "center", marginBottom: 16 },
  detail: { maxHeight: 120, width: "100%", backgroundColor: colors.bgCard, borderRadius: 10, padding: 10, marginBottom: 20 },
  detailText: { color: colors.red, fontSize: 11 },
  btn: { backgroundColor: colors.red, borderRadius: radii.md, paddingHorizontal: 28, paddingVertical: 14 },
  btnText: { color: colors.white, fontWeight: "900", fontSize: 15 },
});

const gateStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)" },
  sheet: {
    backgroundColor: colors.bgSheet,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.sm },
  emoji: { fontSize: 48, marginBottom: spacing.xs },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: "900", textAlign: "center" },
  msg: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: "center", marginBottom: spacing.md },
  btnPrimary: { width: "100%", backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 16, alignItems: "center" },
  btnPrimaryText: { color: colors.white, fontWeight: "800", fontSize: 16 },
  btnSecondary: { width: "100%", borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" },
  btnSecondaryText: { color: colors.textSecondary, fontWeight: "700", fontSize: 15 },
  btnGhost: { paddingVertical: 10 },
  btnGhostText: { color: colors.textTertiary, fontSize: 13 },
});
