"use client";

// ─── Admin Auth Gate ──────────────────────────────────────────────────────────
// SECURITY BUG-064/065: CRM requires Firebase email/password, an admin/manager
// custom claim, and an enrolled Firebase TOTP MFA factor before rendering.

import {
  getIdTokenResult,
  getMultiFactorResolver,
  multiFactor,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  TotpMultiFactorGenerator,
  type MultiFactorError,
  type MultiFactorResolver,
  type TotpSecret,
  type User,
} from "firebase/auth";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { auth } from "../lib/firebase";

type GateStatus = "loading" | "anon" | "mfa" | "mfa-setup" | "denied" | "ok";

const ALLOWED_ROLES = ["admin", "manager"];
const TOTP_FACTOR_ID = TotpMultiFactorGenerator.FACTOR_ID;

function authCode(error: unknown): string {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";
}

function formatFirebaseMfaError(error: unknown): string {
  const code = authCode(error);

  if (code === "auth/invalid-verification-code") return "Невірний код. Перевір застосунок-аутентифікатор.";
  if (code === "auth/code-expired") return "Код застарів. Введи новий код з аутентифікатора.";
  if (code === "auth/unsupported-first-factor") return "Для MFA потрібен email/password або інший підтримуваний перший фактор.";
  if (code === "auth/admin-restricted-operation") return "Увімкни Multi-factor authentication / TOTP у Firebase Console.";
  if (code === "auth/operation-not-allowed") return "Увімкни MFA/TOTP у Firebase Authentication settings.";
  if (code === "auth/requires-recent-login") return "Потрібен свіжий вхід. Вийди та зайди ще раз.";

  return code ? `Помилка MFA: ${code}` : "Не вдалось підтвердити MFA.";
}

function hasTotpFactor(user: User): boolean {
  return multiFactor(user).enrolledFactors.some((factor) => factor.factorId === TOTP_FACTOR_ID);
}

function LoginShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6">
      {children}
    </div>
  );
}

function BrandHeader({ eyebrow = "Вхід для персоналу" }: { eyebrow?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-black">Л</span>
      </div>
      <div>
        <h1 className="font-black text-neutral-900 dark:text-white leading-none">Адмін · Лідер</h1>
        <p className="text-xs text-neutral-400 mt-0.5">{eyebrow}</p>
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GateStatus>("loading");
  const [role, setRole] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Existing MFA sign-in challenge
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaSubmitting, setMfaSubmitting] = useState(false);

  // First-time TOTP enrollment for claimed admin/manager accounts
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
  const [enrollCode, setEnrollCode] = useState("");
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const totpUri = useMemo(() => {
    if (!totpSecret || !currentUser?.email) return "";
    return totpSecret.generateQrCodeUrl(currentUser.email, "Автошкола Лідер Admin");
  }, [totpSecret, currentUser?.email]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user: User | null) => {
      setCurrentUser(user);

      if (!user) {
        setStatus("anon");
        setRole(null);
        setTotpSecret(null);
        setEnrollCode("");
        setMfaResolver(null);
        return;
      }

      try {
        // Force-refresh so a freshly-granted claim is picked up.
        const token = await getIdTokenResult(user, true);
        const claimRole = typeof token.claims.role === "string" ? token.claims.role : null;
        setRole(claimRole);

        if (!claimRole || !ALLOWED_ROLES.includes(claimRole)) {
          setStatus("denied");
          return;
        }

        setStatus(hasTotpFactor(user) ? "ok" : "mfa-setup");
      } catch {
        setStatus("denied");
      }
    });
    return unsub;
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      // onAuthStateChanged will resolve role + MFA enrollment state.
    } catch (err) {
      const code = authCode(err);

      if (code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, err as MultiFactorError);
        const hasTotp = resolver.hints.some((hint) => hint.factorId === TOTP_FACTOR_ID);

        if (!hasTotp) {
          setError("Для адмінки потрібен TOTP MFA. У цього акаунта enrolled інший тип другого фактора.");
          return;
        }

        setMfaResolver(resolver);
        setMfaCode("");
        setStatus("mfa");
        return;
      }

      setError(
        code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found"
          ? "Невірний email або пароль"
          : code === "auth/too-many-requests"
          ? "Забагато спроб. Зачекайте хвилину."
          : `Помилка входу: ${code || "network"}`
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMfaSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const resolver = mfaResolver;
    const hint = resolver?.hints.find((item) => item.factorId === TOTP_FACTOR_ID);
    const code = mfaCode.trim().replace(/\s+/g, "");

    if (!resolver || !hint) {
      setError("MFA-сесія застаріла. Увійди ще раз.");
      setStatus("anon");
      return;
    }

    if (!/^\d{6,8}$/.test(code)) {
      setError("Введи 6-значний код з аутентифікатора.");
      return;
    }

    setMfaSubmitting(true);
    try {
      const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code);
      await resolver.resolveSignIn(assertion);
      setMfaResolver(null);
      setMfaCode("");
      setStatus("loading");
    } catch (err) {
      setError(formatFirebaseMfaError(err));
    } finally {
      setMfaSubmitting(false);
    }
  }

  async function handleStartEnrollment() {
    if (!currentUser) return;
    setEnrollError(null);

    try {
      const session = await multiFactor(currentUser).getSession();
      const secret = await TotpMultiFactorGenerator.generateSecret(session);
      setTotpSecret(secret);
    } catch (err) {
      setEnrollError(formatFirebaseMfaError(err));
    }
  }

  async function handleCompleteEnrollment(e: React.FormEvent) {
    e.preventDefault();

    if (!currentUser || !totpSecret) return;

    const code = enrollCode.trim().replace(/\s+/g, "");
    if (!/^\d{6,8}$/.test(code)) {
      setEnrollError("Введи 6-значний код з аутентифікатора.");
      return;
    }

    setEnrollSubmitting(true);
    setEnrollError(null);

    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(totpSecret, code);
      await multiFactor(currentUser).enroll(assertion, "Адмін TOTP");
      await getIdTokenResult(currentUser, true);
      setTotpSecret(null);
      setEnrollCode("");
      setStatus("ok");
    } catch (err) {
      setEnrollError(formatFirebaseMfaError(err));
    } finally {
      setEnrollSubmitting(false);
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <LoginShell>
        <div className="flex items-center gap-3 text-neutral-500">
          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          Перевірка доступу…
        </div>
      </LoginShell>
    );
  }

  // ─── Existing MFA challenge ───────────────────────────────────────────────
  if (status === "mfa") {
    return (
      <LoginShell>
        <form onSubmit={handleMfaSignIn} className="max-w-sm w-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 space-y-5">
          <BrandHeader eyebrow="Двофакторний вхід" />
          <div>
            <h2 className="text-lg font-black text-neutral-900 dark:text-white">Код з аутентифікатора</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Введи одноразовий TOTP-код для завершення входу в CRM.
            </p>
          </div>
          <input
            inputMode="numeric"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            placeholder="123456"
            autoComplete="one-time-code"
            required
            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm tracking-[0.25em] focus:outline-none focus:border-red-500"
          />
          {error ? <p className="text-sm text-red-500 font-semibold">{error}</p> : null}
          <button
            type="submit"
            disabled={mfaSubmitting}
            className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50"
          >
            {mfaSubmitting ? "Перевірка…" : "Підтвердити"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMfaResolver(null);
              setMfaCode("");
              void signOut(auth);
            }}
            className="w-full py-2 text-neutral-500 text-sm font-bold"
          >
            Увійти іншим акаунтом
          </button>
        </form>
      </LoginShell>
    );
  }

  // ─── TOTP enrollment required ─────────────────────────────────────────────
  if (status === "mfa-setup") {
    return (
      <LoginShell>
        <div className="max-w-lg w-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 space-y-5">
          <BrandHeader eyebrow="Налаштування 2FA" />
          <div>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white">Потрібна двофакторна авторизація</h2>
            <p className="text-sm text-neutral-500 mt-2">
              Для ролі {role ?? "staff"} CRM відкриється тільки після прив'язки TOTP-коду в Google Authenticator,
              1Password, Authy або іншому сумісному застосунку.
            </p>
          </div>

          {!totpSecret ? (
            <button
              type="button"
              onClick={handleStartEnrollment}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700"
            >
              Створити TOTP-секрет
            </button>
          ) : (
            <form onSubmit={handleCompleteEnrollment} className="space-y-4">
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-4 space-y-3">
                <p className="text-xs font-black uppercase text-neutral-500">Secret key</p>
                <code className="block break-all rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 text-sm text-neutral-900 dark:text-white">
                  {totpSecret.secretKey}
                </code>
                {totpUri ? (
                  <>
                    <p className="text-xs font-black uppercase text-neutral-500">otpauth URI</p>
                    <textarea
                      readOnly
                      value={totpUri}
                      className="w-full min-h-24 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 text-xs text-neutral-700 dark:text-neutral-200"
                    />
                  </>
                ) : null}
                <p className="text-xs leading-5 text-neutral-500">
                  Додай secret вручну або імпортуй otpauth URI у свій менеджер паролів, потім введи поточний код нижче.
                </p>
              </div>
              <input
                inputMode="numeric"
                value={enrollCode}
                onChange={(e) => setEnrollCode(e.target.value)}
                placeholder="123456"
                autoComplete="one-time-code"
                required
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm tracking-[0.25em] focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                disabled={enrollSubmitting}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {enrollSubmitting ? "Прив'язка…" : "Увімкнути 2FA"}
              </button>
            </form>
          )}

          {enrollError ? <p className="text-sm text-red-500 font-semibold">{enrollError}</p> : null}
          <button
            type="button"
            onClick={() => signOut(auth)}
            className="w-full py-2 text-neutral-500 text-sm font-bold"
          >
            Вийти
          </button>
        </div>
      </LoginShell>
    );
  }

  // ─── Access denied (signed in but no admin claim) ─────────────────────────
  if (status === "denied") {
    return (
      <LoginShell>
        <div className="max-w-sm w-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto text-2xl">!</div>
          <h1 className="text-xl font-black text-neutral-900 dark:text-white">Немає доступу</h1>
          <p className="text-sm text-neutral-500">
            Ваш акаунт не має прав адміністратора{role ? ` (роль: ${role})` : ""}. Зверніться до власника, щоб видати claim
            <code className="font-mono mx-1 bg-neutral-100 dark:bg-neutral-800 px-1 rounded">role=admin</code>.
          </p>
          <button
            onClick={() => signOut(auth)}
            className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold text-sm hover:opacity-80"
          >
            Вийти
          </button>
        </div>
      </LoginShell>
    );
  }

  // ─── Login screen ─────────────────────────────────────────────────────────
  if (status === "anon") {
    return (
      <LoginShell>
        <form onSubmit={handleLogin} className="max-w-sm w-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 space-y-5">
          <BrandHeader />

          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="username"
              required
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-red-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              autoComplete="current-password"
              required
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          {error ? <p className="text-sm text-red-500 font-semibold">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? "Вхід…" : "Увійти"}
          </button>
        </form>
      </LoginShell>
    );
  }

  // ─── Authorized ───────────────────────────────────────────────────────────
  return (
    <>
      {children}
      <button
        onClick={() => signOut(auth)}
        title="Вийти"
        className="fixed top-3 right-4 z-50 px-3 py-1.5 bg-neutral-900/90 dark:bg-white/90 text-white dark:text-neutral-900 rounded-lg font-bold text-xs hover:opacity-100 opacity-80 shadow-lg"
      >
        Вийти
      </button>
    </>
  );
}
