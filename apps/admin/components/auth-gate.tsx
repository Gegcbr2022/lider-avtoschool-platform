"use client";

// ─── Admin Auth Gate ──────────────────────────────────────────────────────────
// SECURITY BUG-064: the CRM was rendered with no authentication at all. This gate
// requires a Firebase email/password login AND a custom claim role of "admin" or
// "manager" before the workspace is shown. Custom claims are set server-side with
// the Admin SDK (see AI_Brain/Projects/Lider/OwnerActionRequired.md → "Admin доступ").

import {
  getIdTokenResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";

type GateStatus = "loading" | "anon" | "denied" | "ok";

const ALLOWED_ROLES = ["admin", "manager"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<GateStatus>("loading");
  const [role, setRole] = useState<string | null>(null);

  // Login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        setStatus("anon");
        setRole(null);
        return;
      }
      try {
        // force-refresh so a freshly-granted claim is picked up
        const token = await getIdTokenResult(user, true);
        const claimRole = typeof token.claims.role === "string" ? token.claims.role : null;
        setRole(claimRole);
        setStatus(claimRole && ALLOWED_ROLES.includes(claimRole) ? "ok" : "denied");
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
      // onAuthStateChanged will resolve status/role
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
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

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-500">
          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          Перевірка доступу…
        </div>
      </div>
    );
  }

  // ─── Access denied (signed in but no admin claim) ─────────────────────────
  if (status === "denied") {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto text-2xl">🚫</div>
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
      </div>
    );
  }

  // ─── Login screen ─────────────────────────────────────────────────────────
  if (status === "anon") {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="max-w-sm w-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black">Л</span>
            </div>
            <div>
              <h1 className="font-black text-neutral-900 dark:text-white leading-none">Адмін · Лідер</h1>
              <p className="text-xs text-neutral-400 mt-0.5">Вхід для персоналу</p>
            </div>
          </div>

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
      </div>
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
