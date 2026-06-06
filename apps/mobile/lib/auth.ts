// ─── Auth & session management ────────────────────────────────────────────────
import { createContext, useContext } from "react";

export type AuthMode = "guest" | "authenticated" | "unauthenticated";

export type UserRole = "student" | "instructor" | "manager" | "admin";

export type User = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  category?: "A" | "A1" | "B" | "C" | "CE";
  avatarInitials: string;
  avatarEmoji?: string;
  photoURL?: string;
  emailVerified?: boolean;
  isGuest: boolean;
  role?: UserRole;
};

export type AuthState = {
  mode: AuthMode;
  user: User | null;
  isLoading: boolean;
};

// Minimal signup — just email + password. Phone/city/category added in profile later.
export type SignUpData = {
  name: string;
  email: string;
  password: string;
};

export type AuthContextValue = AuthState & {
  signInAsGuest: () => void;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (data: SignUpData) => Promise<boolean>;
  signInWithGoogle: () => Promise<{ success: boolean; cancelled?: boolean; error?: string }>;
  signOut: () => void;
  forgotPassword: (email: string) => Promise<{ sent: boolean; error?: string }>;
  requireAuth: (onSuccess: () => void) => void;
};

export const GUEST_USER: User = {
  id: "guest",
  name: "Гість",
  avatarInitials: "Г",
  avatarEmoji: "🚗",
  isGuest: true,
};

export const AuthContext = createContext<AuthContextValue>({
  mode: "unauthenticated",
  user: null,
  isLoading: false,
  signInAsGuest: () => {},
  signIn: async () => false,
  signUp: async () => false,
  signInWithGoogle: async () => ({ success: false }),
  signOut: () => {},
  forgotPassword: async () => ({ sent: false }),
  requireAuth: () => {},
});

export const useAuth = () => useContext(AuthContext);

export type GuestFeature =
  | "browse_courses"
  | "demo_test"
  | "faq"
  | "chat_limited"
  | "view_prices"
  | "onboarding"
  | "progress"
  | "booking"
  | "save_results"
  | "referral"
  | "club";

export function isGuestAllowed(feature: GuestFeature): boolean {
  return (["browse_courses", "demo_test", "faq", "chat_limited", "view_prices", "onboarding"] as GuestFeature[])
    .includes(feature);
}
