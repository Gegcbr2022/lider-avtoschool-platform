import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore, collection, query, orderBy, limit,
  getDocs, onSnapshot, where, deleteDoc, doc,
  type QuerySnapshot, type DocumentData,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCvNtROKFtF-wQPHbiUKxcxVnHlN26R0oI",
  authDomain: "lider-avtoschool.firebaseapp.com",
  projectId: "lider-avtoschool",
  storageBucket: "lider-avtoschool.firebasestorage.app",
  messagingSenderId: "111711727739",
  appId: "1:111711727739:web:fc4b00ba23303c28fd32de",
};

export const firebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

// ─── Types ────────────────────────────────────────────────────────────────────

export type AiLogEntry = {
  id: string;
  question: string;
  answer: string;
  mode: string | null;
  model: string | null;
  latencyMs: number;
  error: string | null;
  userId: string | null;
  appVersion: string;
  platform: string;
  timestamp: Date | null;
};

export type ClubPost = {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  likesCount: number;
  commentsCount: number;
  createdAt: Date | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "object" && "toDate" in (val as object)) {
    return (val as { toDate(): Date }).toDate();
  }
  return null;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getAiLogs(limitCount = 100): Promise<AiLogEntry[]> {
  const q = query(collection(db, "aiLogs"), orderBy("timestamp", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      question: data.question ?? "",
      answer: data.answer ?? "",
      mode: data.mode ?? null,
      model: data.model ?? null,
      latencyMs: data.latencyMs ?? 0,
      error: data.error ?? null,
      userId: data.userId ?? null,
      appVersion: data.appVersion ?? "",
      platform: data.platform ?? "",
      timestamp: toDate(data.timestamp),
    };
  });
}

export async function getClubPosts(limitCount = 50): Promise<ClubPost[]> {
  const q = query(collection(db, "clubPosts"), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      authorId: data.authorId ?? "",
      authorName: data.authorName ?? "",
      text: data.text ?? "",
      likesCount: data.likesCount ?? 0,
      commentsCount: data.commentsCount ?? 0,
      createdAt: toDate(data.createdAt),
    };
  });
}

// ─── Lead types ──────────────────────────────────────────────────────────────

export type FirestoreLead = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  category: string;
  status: string;
  source: string;
  contactMethod?: string;
  message?: string;
  createdAt: Date | null;
};

export type UserProfile = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  category?: string;
  avatarEmoji?: string;
  updatedAt: Date | null;
};

export type ConversationEntry = {
  id: string;
  title: string;
  type: string;
  lastMessage?: string;
  lastMessageAt: Date | null;
  updatedAt: Date | null;
  participantIds: string[];
};

export type SupportThread = {
  id: string;
  userId: string;
  userName: string;
  telegramTopicId?: number;
  status: string;
  lastMessage?: string;
  lastMessageAt: Date | null;
};

export type StoryEntry = {
  id: string;
  authorId: string;
  authorName: string;
  authorEmoji?: string;
  text: string;
  tone: string;
  reactions: number;
  views: number;
  tags: string[];
  createdAt: Date | null;
  expiresAt: Date | null;
};

export type CommentEntry = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  text: string;
  likesCount: number;
  createdAt: Date | null;
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getLeads(limitCount = 200): Promise<FirestoreLead[]> {
  const q = query(collection(db, "leads"), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name ?? "",
      phone: data.phone ?? "",
      email: data.email,
      city: data.city ?? "",
      category: data.category ?? "",
      status: data.status ?? "new",
      source: data.source ?? "",
      contactMethod: data.contactMethod,
      message: data.message,
      createdAt: toDate(data.createdAt),
    };
  });
}

export async function getUserProfiles(limitCount = 100): Promise<UserProfile[]> {
  const q = query(collection(db, "userProfiles"), orderBy("updatedAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name ?? "",
      email: data.email,
      phone: data.phone,
      city: data.city,
      category: data.category,
      avatarEmoji: data.avatarEmoji,
      updatedAt: toDate(data.updatedAt),
    };
  });
}

export async function getConversations(limitCount = 100): Promise<ConversationEntry[]> {
  const q = query(collection(db, "conversations"), orderBy("updatedAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title ?? "Чат",
      type: data.type ?? "support",
      lastMessage: data.lastMessage,
      lastMessageAt: toDate(data.lastMessageAt),
      updatedAt: toDate(data.updatedAt),
      participantIds: data.participantIds ?? [],
    };
  });
}

export async function getSupportThreads(limitCount = 100): Promise<SupportThread[]> {
  const q = query(collection(db, "supportThreads"), orderBy("lastMessageAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId ?? "",
      userName: data.userName ?? "",
      telegramTopicId: data.telegramTopicId,
      status: data.status ?? "open",
      lastMessage: data.lastMessage,
      lastMessageAt: toDate(data.lastMessageAt),
    };
  });
}

export async function getStories(limitCount = 100): Promise<StoryEntry[]> {
  const q = query(collection(db, "stories"), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      authorId: data.authorId ?? "",
      authorName: data.authorName ?? "",
      authorEmoji: data.authorEmoji,
      text: data.text ?? "",
      tone: data.tone ?? "dark",
      reactions: data.reactions ?? 0,
      views: data.views ?? 0,
      tags: data.tags ?? [],
      createdAt: toDate(data.createdAt),
      expiresAt: toDate(data.expiresAt),
    };
  });
}

export async function getComments(limitCount = 200): Promise<CommentEntry[]> {
  const q = query(collection(db, "clubComments"), orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      postId: data.postId ?? "",
      authorId: data.authorId ?? "",
      authorName: data.authorName ?? "",
      text: data.text ?? "",
      likesCount: data.likesCount ?? 0,
      createdAt: toDate(data.createdAt),
    };
  });
}

// ─── Moderation ───────────────────────────────────────────────────────────────

export async function adminDeletePost(postId: string): Promise<void> {
  await deleteDoc(doc(db, "clubPosts", postId));
}

export async function adminDeleteComment(commentId: string): Promise<void> {
  await deleteDoc(doc(db, "clubComments", commentId));
}

export async function adminDeleteStory(storyId: string): Promise<void> {
  await deleteDoc(doc(db, "stories", storyId));
}

export async function getDashboardStats() {
  const [aiLogsSnap, postsSnap, leadsSnap] = await Promise.all([
    getDocs(query(collection(db, "aiLogs"), limit(1000))),
    getDocs(query(collection(db, "clubPosts"), limit(1000))),
    getDocs(query(collection(db, "leads"), limit(1000))),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const aiLogsToday = aiLogsSnap.docs.filter(d => {
    const ts = toDate(d.data().timestamp);
    return ts && ts >= today;
  }).length;

  const leadsToday = leadsSnap.docs.filter(d => {
    const ts = toDate(d.data().createdAt);
    return ts && ts >= today;
  }).length;

  // Get total users from leads as proxy (no direct users collection)
  const totalLeads = leadsSnap.size;
  const totalAiQueries = aiLogsSnap.size;
  const totalPosts = postsSnap.size;

  // Calculate avg latency
  let totalLatency = 0;
  let latencyCount = 0;
  aiLogsSnap.docs.forEach(d => {
    const ms = d.data().latencyMs;
    if (typeof ms === "number" && ms > 0) { totalLatency += ms; latencyCount++; }
  });
  const avgLatencyMs = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;

  // Error rate
  const errors = aiLogsSnap.docs.filter(d => d.data().error).length;
  const errorRate = totalAiQueries > 0 ? Math.round((errors / totalAiQueries) * 100) : 0;

  return {
    totalLeads, leadsToday,
    totalAiQueries, aiLogsToday,
    totalPosts,
    avgLatencyMs, errorRate,
  };
}
