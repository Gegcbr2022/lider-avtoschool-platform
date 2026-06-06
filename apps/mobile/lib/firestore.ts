/**
 * Firestore operations for the mobile app.
 * All read/write to Firestore goes through this module.
 */
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  type Unsubscribe,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";
import { firebaseApp } from "./firebase";

const db = getFirestore(firebaseApp);

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClubPostDoc = {
  id: string;
  authorId: string;
  authorName: string;
  authorEmoji?: string;
  text: string;
  tag?: string;
  tagColor?: string;
  likesCount: number;
  likedBy?: string[];
  commentsCount: number;
  createdAt: Date | null;
};

export type ClubCommentDoc = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorEmoji?: string;
  text: string;
  likesCount: number;
  likedBy?: string[];
  parentId?: string | null;
  createdAt: Date | null;
};

export type StoryDoc = {
  id: string;
  authorId: string;
  authorName: string;
  authorEmoji?: string;
  text: string;
  tone: "red" | "green" | "yellow" | "dark";
  reactions: number;
  views: number;
  viewedBy?: string[];
  tags: string[];
  createdAt: Date | null;
  expiresAt: Date | null;
};

export type UserProfileDoc = {
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  category?: string;
  avatarEmoji?: string;
  photoURL?: string;
  pushToken?: string;
  updatedAt: Date | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  // Firestore Timestamp
  if (typeof val === "object" && "toDate" in (val as object)) {
    return (val as { toDate(): Date }).toDate();
  }
  return null;
}

function mapPost(id: string, data: DocumentData): ClubPostDoc {
  return {
    id,
    authorId: data.authorId ?? "",
    authorName: data.authorName ?? "Учень",
    authorEmoji: data.authorEmoji,
    text: data.text ?? "",
    tag: data.tag,
    tagColor: data.tagColor,
    likesCount: data.likesCount ?? 0,
    likedBy: data.likedBy ?? [],
    commentsCount: data.commentsCount ?? 0,
    createdAt: toDate(data.createdAt),
  };
}

function mapComment(id: string, data: DocumentData): ClubCommentDoc {
  return {
    id,
    postId: data.postId ?? "",
    authorId: data.authorId ?? "",
    authorName: data.authorName ?? "Учень",
    authorEmoji: data.authorEmoji,
    text: data.text ?? "",
    likesCount: data.likesCount ?? 0,
    likedBy: data.likedBy ?? [],
    parentId: data.parentId ?? null,
    createdAt: toDate(data.createdAt),
  };
}

function mapStory(id: string, data: DocumentData): StoryDoc {
  return {
    id,
    authorId: data.authorId ?? "",
    authorName: data.authorName ?? "Учень",
    authorEmoji: data.authorEmoji,
    text: data.text ?? "",
    tone: data.tone ?? "dark",
    reactions: data.reactions ?? 0,
    views: data.views ?? 0,
    viewedBy: data.viewedBy ?? [],
    tags: data.tags ?? [],
    createdAt: toDate(data.createdAt),
    expiresAt: toDate(data.expiresAt),
  };
}

// ─── Club Posts ───────────────────────────────────────────────────────────────

export function subscribeToClubPosts(
  onUpdate: (posts: ClubPostDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "clubPosts"),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  return onSnapshot(
    q,
    (snap: QuerySnapshot) => {
      const posts = snap.docs.map(d => mapPost(d.id, d.data()));
      onUpdate(posts);
    },
    (err) => onError?.(err)
  );
}

export async function createClubPost(params: {
  authorId: string;
  authorName: string;
  authorEmoji?: string;
  text: string;
  tag?: string;
  tagColor?: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, "clubPosts"), {
    ...params,
    likesCount: 0,
    likedBy: [],
    commentsCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function togglePostLike(
  postId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<void> {
  const ref = doc(db, "clubPosts", postId);
  await updateDoc(ref, {
    likedBy: currentlyLiked ? arrayRemove(userId) : arrayUnion(userId),
    likesCount: increment(currentlyLiked ? -1 : 1),
  });
}

export async function deletePost(postId: string): Promise<void> {
  await deleteDoc(doc(db, "clubPosts", postId));
}

// ─── Club Comments ────────────────────────────────────────────────────────────

export function subscribeToComments(
  postId: string,
  onUpdate: (comments: ClubCommentDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "clubComments"),
    where("postId", "==", postId),
    orderBy("createdAt", "asc"),
    limit(100)
  );
  return onSnapshot(
    q,
    (snap) => {
      onUpdate(snap.docs.map(d => mapComment(d.id, d.data())));
    },
    (err) => onError?.(err)
  );
}

export async function createComment(params: {
  postId: string;
  authorId: string;
  authorName: string;
  authorEmoji?: string;
  text: string;
  parentId?: string | null;
}): Promise<void> {
  await addDoc(collection(db, "clubComments"), {
    ...params,
    parentId: params.parentId ?? null,
    likesCount: 0,
    likedBy: [],
    createdAt: serverTimestamp(),
  });
  // Increment commentsCount on the post
  await updateDoc(doc(db, "clubPosts", params.postId), {
    commentsCount: increment(1),
  });
}

export async function toggleCommentLike(
  commentId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<void> {
  await updateDoc(doc(db, "clubComments", commentId), {
    likedBy: currentlyLiked ? arrayRemove(userId) : arrayUnion(userId),
    likesCount: increment(currentlyLiked ? -1 : 1),
  });
}

// ─── Stories ─────────────────────────────────────────────────────────────────

export function subscribeToStories(
  onUpdate: (stories: StoryDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const now = new Date();
  const q = query(
    collection(db, "stories"),
    where("expiresAt", ">", now),
    orderBy("expiresAt", "desc"),
    limit(30)
  );
  return onSnapshot(
    q,
    (snap) => {
      onUpdate(snap.docs.map(d => mapStory(d.id, d.data())));
    },
    (err) => onError?.(err)
  );
}

export async function createStory(params: {
  authorId: string;
  authorName: string;
  authorEmoji?: string;
  text: string;
  tone: "red" | "green" | "yellow" | "dark";
  tags: string[];
}): Promise<string> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h
  const ref = await addDoc(collection(db, "stories"), {
    ...params,
    reactions: 0,
    views: 0,
    viewedBy: [],
    createdAt: serverTimestamp(),
    expiresAt,
  });
  return ref.id;
}

export async function viewStory(storyId: string, userId: string): Promise<void> {
  const ref = doc(db, "stories", storyId);
  await updateDoc(ref, {
    viewedBy: arrayUnion(userId),
    views: increment(1),
  }).catch(() => {}); // non-critical
}

export async function reactToStory(storyId: string): Promise<void> {
  await updateDoc(doc(db, "stories", storyId), {
    reactions: increment(1),
  }).catch(() => {});
}

export async function deleteStory(storyId: string): Promise<void> {
  await deleteDoc(doc(db, "stories", storyId));
}

// ─── User Profiles ────────────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<UserProfileDoc | null> {
  const snap = await getDoc(doc(db, "userProfiles", userId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    userId,
    name: d.name ?? "",
    email: d.email,
    phone: d.phone,
    city: d.city,
    category: d.category,
    avatarEmoji: d.avatarEmoji,
    photoURL: d.photoURL,
    updatedAt: toDate(d.updatedAt),
  };
}

export async function upsertUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfileDoc, "userId" | "updatedAt">>
): Promise<void> {
  await setDoc(
    doc(db, "userProfiles", userId),
    { ...updates, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// ─── Gamification: user stats (real data, no mock) ──────────────────────────────
// Stored on the same userProfiles/{uid} doc (rules already allow owner writes).

export type UserStats = {
  testsCompleted: number;
  bestScorePct: number;
  streakDays: number;
  bestStreak: number;
  lastActiveDate: string | null; // YYYY-MM-DD (local)
  totalCorrect: number;
  totalAnswered: number;
};

export type Award = {
  id: string;
  icon: string;
  title: string;
  description: string;
  group: "tests" | "streak" | "learning" | "practice" | "community" | "graduation";
  earned: boolean;
  progress?: number;
  maxProgress?: number;
  earnedAt?: string;
};

export const EMPTY_STATS: UserStats = {
  testsCompleted: 0, bestScorePct: 0, streakDays: 0, bestStreak: 0,
  lastActiveDate: null, totalCorrect: 0, totalAnswered: 0,
};

function localDayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function wholeDaysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    const snap = await getDoc(doc(db, "userProfiles", userId));
    const d = snap.exists() ? snap.data() : {};
    return {
      testsCompleted: d.testsCompleted ?? 0,
      bestScorePct: d.bestScorePct ?? 0,
      streakDays: d.streakDays ?? 0,
      bestStreak: d.bestStreak ?? d.streakDays ?? 0,
      lastActiveDate: d.lastActiveDate ?? null,
      totalCorrect: d.totalCorrect ?? 0,
      totalAnswered: d.totalAnswered ?? 0,
    };
  } catch {
    return { ...EMPTY_STATS };
  }
}

// Call once when a quiz finishes. Updates count, best score and the daily streak.
export async function recordTestCompletion(
  userId: string,
  params: { correct: number; total: number }
): Promise<UserStats> {
  const today = localDayKey();
  const prev = await getUserStats(userId);
  const scorePct = params.total > 0 ? Math.round((params.correct / params.total) * 100) : 0;

  let streak: number;
  if (prev.lastActiveDate === today) {
    streak = prev.streakDays || 1;                       // already practised today
  } else if (prev.lastActiveDate && wholeDaysBetween(prev.lastActiveDate, today) === 1) {
    streak = (prev.streakDays || 0) + 1;                 // consecutive day
  } else {
    streak = 1;                                          // first ever or streak broken
  }

  const next: UserStats = {
    testsCompleted: prev.testsCompleted + 1,
    bestScorePct: Math.max(prev.bestScorePct, scorePct),
    streakDays: streak,
    bestStreak: Math.max(prev.bestStreak, streak),
    lastActiveDate: today,
    totalCorrect: prev.totalCorrect + params.correct,
    totalAnswered: prev.totalAnswered + params.total,
  };

  await setDoc(
    doc(db, "userProfiles", userId),
    { ...next, updatedAt: serverTimestamp() },
    { merge: true }
  );
  return next;
}

// Derived from stats — no separate storage needed. Returns ClubAward-compatible objects.
export function computeAwards(stats: UserStats): Award[] {
  return [
    { id: "first_test", icon: "🎯", title: "Перший тест", description: "Пройди свій перший тест ПДР",
      group: "tests", earned: stats.testsCompleted >= 1, progress: Math.min(stats.testsCompleted, 1), maxProgress: 1 },
    { id: "ten_tests", icon: "📚", title: "10 тестів", description: "Пройди 10 тестів ПДР",
      group: "tests", earned: stats.testsCompleted >= 10, progress: Math.min(stats.testsCompleted, 10), maxProgress: 10 },
    { id: "fifty_tests", icon: "🏅", title: "50 тестів", description: "Пройди 50 тестів ПДР",
      group: "tests", earned: stats.testsCompleted >= 50, progress: Math.min(stats.testsCompleted, 50), maxProgress: 50 },
    { id: "pass", icon: "✅", title: "Склав іспит", description: "Набери 75%+ у тесті",
      group: "tests", earned: stats.bestScorePct >= 75, progress: Math.min(stats.bestScorePct, 75), maxProgress: 75 },
    { id: "perfect", icon: "💯", title: "Без помилок", description: "Пройди тест на 100%",
      group: "tests", earned: stats.bestScorePct >= 100, progress: Math.min(stats.bestScorePct, 100), maxProgress: 100 },
    { id: "streak_3", icon: "🔥", title: "Серія 3 дні", description: "Займайся 3 дні поспіль",
      group: "streak", earned: stats.bestStreak >= 3, progress: Math.min(stats.bestStreak, 3), maxProgress: 3 },
    { id: "streak_7", icon: "⚡", title: "Серія 7 днів", description: "Займайся 7 днів поспіль",
      group: "streak", earned: stats.bestStreak >= 7, progress: Math.min(stats.bestStreak, 7), maxProgress: 7 },
  ];
}

// ─── НАІС data (sensitive: passport / tax id / registration) ────────────────────
// Stored in a private collection naisData/{uid} (owner + staff only — NOT public).

export type NaisDocument = {
  kind: string;          // "passport" | "taxId" | "medCert" | "registration"
  storagePath: string;
  downloadURL?: string;
  uploadedAt: string;
};

export type NaisData = {
  fullName?: string;
  birthDate?: string;
  passportSeries?: string;
  passportNumber?: string;
  taxId?: string;            // ІПН / код
  registrationAddress?: string;
  medCertNumber?: string;
  documents?: NaisDocument[];
};

export async function getNaisData(uid: string): Promise<NaisData | null> {
  try {
    const snap = await getDoc(doc(db, "naisData", uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      fullName: d.fullName,
      birthDate: d.birthDate,
      passportSeries: d.passportSeries,
      passportNumber: d.passportNumber,
      taxId: d.taxId,
      registrationAddress: d.registrationAddress,
      medCertNumber: d.medCertNumber,
      documents: d.documents ?? [],
    };
  } catch {
    return null;
  }
}

export async function saveNaisData(uid: string, patch: Partial<NaisData>): Promise<void> {
  await setDoc(doc(db, "naisData", uid), { ...patch, updatedAt: serverTimestamp() }, { merge: true });
}

export async function addNaisDocument(uid: string, document: NaisDocument): Promise<void> {
  await setDoc(
    doc(db, "naisData", uid),
    { documents: arrayUnion(document), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// ─── Instructors & practice bookings ────────────────────────────────────────────

export type Instructor = {
  id: string;
  name: string;
  photoEmoji?: string;
  description?: string;
  categories?: string[];
  branchId?: string;
  active?: boolean;
};

export async function getInstructors(): Promise<Instructor[]> {
  try {
    const snap = await getDocs(query(collection(db, "instructors"), limit(50)));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Instructor, "id">) }))
      .filter((i) => i.active !== false);
  } catch {
    return [];
  }
}

export type BookingDoc = {
  id: string;
  studentId: string;
  studentName: string;
  instructorId: string;
  instructorName: string;
  startsAt: string; // ISO datetime
  status: string;
  createdAt: Date | null;
};

export async function createBooking(params: {
  studentId: string;
  studentName: string;
  instructorId: string;
  instructorName: string;
  startsAt: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, "bookings"), {
    ...params,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getMyBookings(studentId: string): Promise<BookingDoc[]> {
  try {
    const snap = await getDocs(
      query(collection(db, "bookings"), where("studentId", "==", studentId), limit(50))
    );
    const rows = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        studentId: data.studentId ?? "",
        studentName: data.studentName ?? "",
        instructorId: data.instructorId ?? "",
        instructorName: data.instructorName ?? "",
        startsAt: data.startsAt ?? "",
        status: data.status ?? "pending",
        createdAt: toDate(data.createdAt),
      };
    });
    return rows.sort((a, b) => (a.startsAt < b.startsAt ? 1 : -1)); // soonest-newest, client-side
  } catch {
    return [];
  }
}

// ─── Lessons: video theory + ПДР sections ──────────────────────────────────────

export type Lesson = {
  id: string;
  title: string;
  description?: string;
  type: "video" | "text";
  videoUrl?: string;
  body?: string;
  category?: string;
  order?: number;
  active?: boolean;
};

export async function getLessons(): Promise<Lesson[]> {
  try {
    const snap = await getDocs(query(collection(db, "lessons"), limit(100)));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Lesson, "id">) }))
      .filter((l) => l.active !== false)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  } catch {
    return [];
  }
}

// ─── Service centers (МВС) ──────────────────────────────────────────────────────

export type ServiceCenter = {
  id: string;
  name: string;
  city: string;
  address?: string;
  mapsQuery?: string;  // text used for Google Maps directions/search
  order?: number;
  active?: boolean;
};

export async function getServiceCenters(): Promise<ServiceCenter[]> {
  try {
    const snap = await getDocs(query(collection(db, "serviceCenters"), limit(200)));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<ServiceCenter, "id">) }))
      .filter((c) => c.active !== false)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  } catch {
    return [];
  }
}

// ─── Conversations / Chat ─────────────────────────────────────────────────────

export type ConversationType = "support" | "manager" | "instructor" | "system";

export type ConversationDoc = {
  id: string;
  participantIds: string[];
  type: ConversationType;
  title: string;
  lastMessage?: string;
  lastMessageAt: Date | null;
  updatedAt: Date | null;
  unreadCount?: number;
};

export type MessageDoc = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Date | null;
  readBy?: string[];
};

export function subscribeToConversations(
  userId: string,
  onUpdate: (convs: ConversationDoc[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "conversations"),
    where("participantIds", "array-contains", userId),
    orderBy("updatedAt", "desc"),
    limit(20)
  );
  return onSnapshot(q, (snap) => {
    onUpdate(
      snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          participantIds: data.participantIds ?? [],
          type: data.type ?? "support",
          title: data.title ?? "Чат",
          lastMessage: data.lastMessage,
          lastMessageAt: toDate(data.lastMessageAt),
          updatedAt: toDate(data.updatedAt),
          unreadCount: data.unreadCount ?? 0,
        };
      })
    );
  });
}

export function subscribeToMessages(
  conversationId: string,
  onUpdate: (msgs: MessageDoc[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc"),
    limit(200)
  );
  return onSnapshot(q, (snap) => {
    onUpdate(
      snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          senderId: data.senderId ?? "",
          senderName: data.senderName ?? "",
          text: data.text ?? "",
          createdAt: toDate(data.createdAt),
          readBy: data.readBy ?? [],
        };
      })
    );
  });
}

export async function sendMessage(
  conversationId: string,
  params: { senderId: string; senderName: string; text: string }
): Promise<void> {
  await addDoc(
    collection(db, "conversations", conversationId, "messages"),
    { ...params, createdAt: serverTimestamp(), readBy: [params.senderId] }
  );
  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage: params.text,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// Find-or-create a conversation of a given type (support / manager / instructor).
// Uses only the participantIds+updatedAt index; filters type client-side to avoid
// a compound index. The backend Telegram bridge mirrors each thread to a topic.
export async function ensureConversation(
  userId: string,
  userName: string,
  type: ConversationType,
  title: string
): Promise<string> {
  const q = query(
    collection(db, "conversations"),
    where("participantIds", "array-contains", userId),
    orderBy("updatedAt", "desc"),
    limit(10)
  );
  const snap = await getDocs(q);
  const existing = snap.docs.find((d) => d.data().type === type);
  if (existing) return existing.id;

  const ref = await addDoc(collection(db, "conversations"), {
    participantIds: [userId, type],
    type,
    title,
    lastMessage: null,
    lastMessageAt: null,
    updatedAt: serverTimestamp(),
    createdBy: userId,
    createdByName: userName,
  });
  return ref.id;
}

// Back-compat wrapper.
export async function ensureSupportConversation(userId: string, userName: string): Promise<string> {
  return ensureConversation(userId, userName, "support", "Підтримка");
}
