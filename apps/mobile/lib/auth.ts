// ─── Auth & session management ────────────────────────────────────────────────
import { createContext, useContext } from "react";

export type AuthMode = "guest" | "authenticated" | "unauthenticated";

export type User = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  category?: "A" | "A1" | "B" | "C" | "CE";
  avatarInitials: string;
  isGuest: boolean;
};

export type AuthState = {
  mode: AuthMode;
  user: User | null;
  isLoading: boolean;
};

export type AuthContextValue = AuthState & {
  signInAsGuest: () => void;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (data: SignUpData) => Promise<boolean>;
  signOut: () => void;
  requireAuth: (onSuccess: () => void) => void;
};

export type SignUpData = {
  name: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  category: "A" | "A1" | "B" | "C" | "CE";
  contactMethod: "telegram" | "phone" | "whatsapp";
};

// ─── Guest user singleton ─────────────────────────────────────────────────────

export const GUEST_USER: User = {
  id: "guest",
  name: "Гість",
  phone: "",
  avatarInitials: "Г",
  isGuest: true,
};

// ─── Context ─────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue>({
  mode: "unauthenticated",
  user: null,
  isLoading: false,
  signInAsGuest: () => {},
  signIn: async () => false,
  signUp: async () => false,
  signOut: () => {},
  requireAuth: () => {},
});

export const useAuth = () => useContext(AuthContext);

// ─── Guest-only feature guard ─────────────────────────────────────────────────

export function isGuestAllowed(feature: GuestFeature): boolean {
  return GUEST_ALLOWED_FEATURES.includes(feature);
}

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

const GUEST_ALLOWED_FEATURES: GuestFeature[] = [
  "browse_courses",
  "demo_test",
  "faq",
  "chat_limited",
  "view_prices",
  "onboarding",
];
