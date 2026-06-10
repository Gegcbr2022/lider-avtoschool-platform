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
  runTransaction,
  orderBy,
  where,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteField,
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
  authorRole?: string;
  text: string;
  tag?: string;
  tagColor?: string;
  mediaUrl?: string;
  mediaPath?: string;
  mediaType?: "image";
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  status?: "published" | "draft";
  visibility?: "school" | "public";
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
  kind?: "custom" | "pdrResult";
  result?: {
    correct: number;
    total: number;
    percent: number;
    passed: boolean;
    mode?: string;
    licenseCategory?: string;
    elapsedSeconds?: number;
  };
  tone: "red" | "green" | "yellow" | "dark";
  reactions: number;
  views: number;
  viewedBy?: string[];
  reactedBy?: string[];
  tags: string[];
  mediaUrl?: string;
  mediaPath?: string;
  mediaType?: "image";
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  status?: "published" | "draft";
  visibility?: "school" | "public";
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
  role?: string;
  pushToken?: string;
  updatedAt: Date | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Firestore rejects `undefined` field values — strip them before any addDoc/setDoc call.
function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  // Firestore Timestamp
  if (typeof val === "object" && "toDate" in (val as object)) {
    return (val as { toDate(): Date }).toDate();
  }
  return null;
}

export function createFirestoreId(collectionName: string): string {
  return doc(collection(db, collectionName)).id;
}

function mapPost(id: string, data: DocumentData): ClubPostDoc {
  return {
    id,
    authorId: data.authorId ?? "",
    authorName: data.authorName ?? "Учень",
    authorEmoji: data.authorEmoji,
    authorRole: data.authorRole,
    text: data.text ?? "",
    tag: data.tag,
    tagColor: data.tagColor,
    mediaUrl: data.mediaUrl,
    mediaPath: data.mediaPath,
    mediaType: data.mediaType,
    fileName: data.fileName,
    fileSize: data.fileSize,
    width: data.width,
    height: data.height,
    status: data.status,
    visibility: data.visibility,
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
    kind: data.kind,
    result: data.result,
    tone: data.tone ?? "dark",
    reactions: data.reactions ?? 0,
    views: data.views ?? 0,
    viewedBy: data.viewedBy ?? [],
    reactedBy: data.reactedBy ?? [],
    tags: data.tags ?? [],
    mediaUrl: data.mediaUrl,
    mediaPath: data.mediaPath,
    mediaType: data.mediaType,
    fileName: data.fileName,
    fileSize: data.fileSize,
    width: data.width,
    height: data.height,
    status: data.status,
    visibility: data.visibility,
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
  id?: string;
  authorId: string;
  authorName: string;
  authorEmoji?: string;
  authorRole?: string;
  text: string;
  tag?: string;
  tagColor?: string;
  mediaUrl?: string;
  mediaPath?: string;
  mediaType?: "image";
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  status?: "published" | "draft";
  visibility?: "school" | "public";
}): Promise<string> {
  const { id, ...data } = params;
  const postRef = id ? doc(db, "clubPosts", id) : doc(collection(db, "clubPosts"));
  // Firestore rejects undefined field values — stripUndefined before writing
  await setDoc(postRef, {
    ...stripUndefined(data),
    status: data.status ?? "published",
    visibility: data.visibility ?? "school",
    likesCount: 0,
    likedBy: [],
    commentsCount: 0,
    createdAt: serverTimestamp(),
  });
  return postRef.id;
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
    ...stripUndefined(params),
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
  id?: string;
  authorId: string;
  authorName: string;
  authorEmoji?: string;
  text: string;
  kind?: "custom" | "pdrResult";
  result?: {
    correct: number;
    total: number;
    percent: number;
    passed: boolean;
    mode?: string;
    licenseCategory?: string;
    elapsedSeconds?: number;
  };
  tone: "red" | "green" | "yellow" | "dark";
  tags: string[];
  mediaUrl?: string;
  mediaPath?: string;
  mediaType?: "image";
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  status?: "published" | "draft";
  visibility?: "school" | "public";
}): Promise<string> {
  const { id, ...data } = params;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h
  const storyRef = id ? doc(db, "stories", id) : doc(collection(db, "stories"));
  // Firestore rejects undefined field values — stripUndefined before writing
  await setDoc(storyRef, {
    ...stripUndefined(data),
    status: data.status ?? "published",
    visibility: data.visibility ?? "school",
    reactions: 0,
    views: 0,
    viewedBy: [],
    reactedBy: [],
    createdAt: serverTimestamp(),
    expiresAt,
  });
  return storyRef.id;
}

export async function viewStory(storyId: string, userId: string): Promise<void> {
  const ref = doc(db, "stories", storyId);
  try {
    const snap = await getDoc(ref);
    const viewedBy = snap.exists() ? ((snap.data().viewedBy ?? []) as string[]) : [];
    if (viewedBy.includes(userId)) return;
    await updateDoc(ref, {
      viewedBy: arrayUnion(userId),
      views: increment(1),
    });
  } catch {
    // non-critical
  }
}

export async function reactToStory(
  storyId: string,
  userId: string,
  currentlyReacted: boolean
): Promise<void> {
  await updateDoc(doc(db, "stories", storyId), {
    reactedBy: currentlyReacted ? arrayRemove(userId) : arrayUnion(userId),
    reactions: increment(currentlyReacted ? -1 : 1),
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
    role: d.role,
    updatedAt: toDate(d.updatedAt),
  };
}

// Fetch the user's role from Firestore userProfiles.
// Falls back to "student" if no role field is set.
export async function getUserRole(userId: string): Promise<string> {
  try {
    const snap = await getDoc(doc(db, "userProfiles", userId));
    if (!snap.exists()) return "student";
    return snap.data().role ?? "student";
  } catch {
    return "student";
  }
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
  group: "tests" | "streak" | "learning" | "practice" | "community" | "games" | "graduation";
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

export function getWeekKey(d = new Date()): string {
  const y = d.getFullYear();
  const d_copy = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = d_copy.getUTCDay() || 7;
  d_copy.setUTCDate(d_copy.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d_copy.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d_copy.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${y}-W${String(weekNo).padStart(2, "0")}`;
}

export function getMonthKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
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

  const weekKey = getWeekKey();
  const monthKey = getMonthKey();

  await setDoc(
    doc(db, "userProfiles", userId),
    { 
      ...next, 
      updatedAt: serverTimestamp(),
      [`stats_${weekKey}`]: increment(params.total),
      [`correct_${weekKey}`]: increment(params.correct),
      [`stats_${monthKey}`]: increment(params.total),
      [`correct_${monthKey}`]: increment(params.correct),
      currentWeek: weekKey,
      currentMonth: monthKey,
    },
    { merge: true }
  );
  return next;
}

// Derived from stats — no separate storage needed. Returns ClubAward-compatible objects.
export function computeAwards(stats: UserStats): Award[] {
  const correct100 = stats.totalCorrect >= 100;
  const correct500 = stats.totalCorrect >= 500;
  return [
    // ─── Tests ────────────────────────────────────────────────────────────────
    { id: "first_test", icon: "🎯", title: "Перший тест", description: "Пройди свій перший тест ПДР",
      group: "tests", earned: stats.testsCompleted >= 1, progress: Math.min(stats.testsCompleted, 1), maxProgress: 1 },
    { id: "five_tests", icon: "📖", title: "5 тестів", description: "Пройди 5 тестів ПДР",
      group: "tests", earned: stats.testsCompleted >= 5, progress: Math.min(stats.testsCompleted, 5), maxProgress: 5 },
    { id: "ten_tests", icon: "📚", title: "10 тестів", description: "Пройди 10 тестів ПДР",
      group: "tests", earned: stats.testsCompleted >= 10, progress: Math.min(stats.testsCompleted, 10), maxProgress: 10 },
    { id: "twenty_five_tests", icon: "🏋️", title: "25 тестів", description: "Пройди 25 тестів — справжній тренінг",
      group: "tests", earned: stats.testsCompleted >= 25, progress: Math.min(stats.testsCompleted, 25), maxProgress: 25 },
    { id: "fifty_tests", icon: "🏅", title: "50 тестів", description: "Пройди 50 тестів ПДР",
      group: "tests", earned: stats.testsCompleted >= 50, progress: Math.min(stats.testsCompleted, 50), maxProgress: 50 },
    { id: "pass", icon: "✅", title: "Іспит складений", description: "Набери 75%+ у тесті",
      group: "tests", earned: stats.bestScorePct >= 75, progress: Math.min(stats.bestScorePct, 75), maxProgress: 75 },
    { id: "excellent", icon: "🌟", title: "Відмінник", description: "Набери 90%+ у тесті",
      group: "tests", earned: stats.bestScorePct >= 90, progress: Math.min(stats.bestScorePct, 90), maxProgress: 90 },
    { id: "perfect", icon: "💯", title: "Ідеальний результат", description: "Пройди тест на 100%",
      group: "tests", earned: stats.bestScorePct >= 100, progress: Math.min(stats.bestScorePct, 100), maxProgress: 100 },
    { id: "correct_100", icon: "🧠", title: "100 правильних", description: "Дай 100 правильних відповідей",
      group: "tests", earned: correct100, progress: Math.min(stats.totalCorrect, 100), maxProgress: 100 },
    { id: "correct_500", icon: "🔬", title: "500 правильних", description: "Дай 500 правильних відповідей — майстер ПДР",
      group: "tests", earned: correct500, progress: Math.min(stats.totalCorrect, 500), maxProgress: 500 },

    // ─── Streak ───────────────────────────────────────────────────────────────
    { id: "streak_1", icon: "✨", title: "Перший день", description: "Розпочни свою серію навчання",
      group: "streak", earned: stats.bestStreak >= 1, progress: Math.min(stats.bestStreak, 1), maxProgress: 1 },
    { id: "streak_3", icon: "🔥", title: "Серія 3 дні", description: "Займайся 3 дні поспіль",
      group: "streak", earned: stats.bestStreak >= 3, progress: Math.min(stats.bestStreak, 3), maxProgress: 3 },
    { id: "streak_7", icon: "⚡", title: "Серія тиждень", description: "7 днів поспіль — ти незупинний",
      group: "streak", earned: stats.bestStreak >= 7, progress: Math.min(stats.bestStreak, 7), maxProgress: 7 },
    { id: "streak_14", icon: "🌊", title: "2 тижні поспіль", description: "14 днів безперервного навчання",
      group: "streak", earned: stats.bestStreak >= 14, progress: Math.min(stats.bestStreak, 14), maxProgress: 14 },
    { id: "streak_30", icon: "🏆", title: "Місяць навчання", description: "30 днів поспіль — справжній чемпіон",
      group: "streak", earned: stats.bestStreak >= 30, progress: Math.min(stats.bestStreak, 30), maxProgress: 30 },

    // ─── Learning ─────────────────────────────────────────────────────────────
    { id: "first_topic", icon: "📘", title: "Перша тема", description: "Пройди першу тему ПДР",
      group: "learning", earned: stats.testsCompleted >= 1, progress: Math.min(stats.testsCompleted, 1), maxProgress: 1 },
    { id: "category_b", icon: "🚗", title: "Категорія B", description: "Почав вивчення категорії B",
      group: "learning", earned: stats.testsCompleted >= 1, progress: Math.min(stats.testsCompleted, 1), maxProgress: 1 },
    { id: "signs_master", icon: "🛑", title: "Майстер знаків", description: "Пройди 5 тестів по знаках ПДР",
      group: "learning", earned: stats.testsCompleted >= 5, progress: Math.min(stats.testsCompleted, 5), maxProgress: 5 },
    { id: "intersection_master", icon: "🚦", title: "Майстер перехресть", description: "Опануй правила проїзду перехресть",
      group: "learning", earned: stats.bestScorePct >= 80 && stats.testsCompleted >= 3, progress: Math.min(stats.testsCompleted, 3), maxProgress: 3 },
    { id: "safety_pro", icon: "🛡️", title: "Безпека руху", description: "Відмінні знання правил безпеки",
      group: "learning", earned: stats.bestScorePct >= 85, progress: Math.min(stats.bestScorePct, 85), maxProgress: 85 },

    // ─── Practice ─────────────────────────────────────────────────────────────
    { id: "first_practice", icon: "🗓️", title: "Перша практика", description: "Запишись на перше практичне заняття",
      group: "practice", earned: false, progress: 0, maxProgress: 1 },
    { id: "first_instructor", icon: "🚘", title: "Перша розмова з інструктором", description: "Напиши першому інструктору",
      group: "practice", earned: false, progress: 0, maxProgress: 1 },

    // ─── Games ────────────────────────────────────────────────────────────────
    { id: "first_minigame", icon: "🎮", title: "Перша міні-гра", description: "Запусти будь-яке коротке тренування",
      group: "games", earned: false, progress: 0, maxProgress: 1 },
    { id: "reaction_driver", icon: "⚡", title: "Реакція водія", description: "Пройди гру на реакцію або дорожні ситуації",
      group: "games", earned: false, progress: 0, maxProgress: 1 },

    // ─── Community ────────────────────────────────────────────────────────────
    { id: "first_story", icon: "📸", title: "Перша Історія", description: "Опублікуй першу Історію у Клубі",
      group: "community", earned: false, progress: 0, maxProgress: 1 },
    { id: "first_post", icon: "✍️", title: "Перший пост", description: "Напиши перший пост у Клубній стрічці",
      group: "community", earned: false, progress: 0, maxProgress: 1 },
    { id: "first_photo", icon: "📷", title: "Перше фото", description: "Надішли перше фото у чаті",
      group: "community", earned: false, progress: 0, maxProgress: 1 },

    // ─── Graduation ───────────────────────────────────────────────────────────
    { id: "exam_ready", icon: "🎓", title: "Готовий до іспиту", description: "Набери 85%+ — ти готовий до МВС",
      group: "graduation", earned: stats.bestScorePct >= 85, progress: Math.min(stats.bestScorePct, 85), maxProgress: 85 },
    { id: "comeback", icon: "🌅", title: "Повернення", description: "Повернувся після паузи і продовжив навчання",
      group: "graduation", earned: stats.testsCompleted >= 2, progress: Math.min(stats.testsCompleted, 2), maxProgress: 2 },
    { id: "no_mistakes", icon: "✨", title: "Без помилок", description: "Пройди тест без жодної помилки",
      group: "graduation", earned: stats.bestScorePct >= 100, progress: Math.min(stats.bestScorePct, 100), maxProgress: 100 },
    { id: "night_owl", icon: "🌙", title: "Нічна сова", description: "Позаймайся у вечірній час",
      group: "graduation", earned: false, progress: 0, maxProgress: 1 },
    { id: "early_start", icon: "☀️", title: "Ранній старт", description: "Почни тренування зранку",
      group: "graduation", earned: false, progress: 0, maxProgress: 1 },
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
  const { documents: _documents, ...safePatch } = patch;
  await setDoc(doc(db, "naisData", uid), { ...safePatch, updatedAt: serverTimestamp() }, { merge: true });
}

export async function addNaisDocument(uid: string, document: NaisDocument): Promise<void> {
  const ref = doc(db, "naisData", uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() && Array.isArray(snap.data().documents)
    ? (snap.data().documents as NaisDocument[])
    : [];
  const documents = [...existing.filter((d) => d.kind !== document.kind), document];
  await setDoc(
    ref,
    { documents, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// ─── Instructors & practice bookings ────────────────────────────────────────────

export type Instructor = {
  id: string;
  name: string;
  accountUserId?: string;
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

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type BookingSlotStatus = "open" | "available" | "booked" | "blocked";

export type BookingSlotDoc = {
  id: string;
  instructorId: string;
  instructorName?: string;
  instructorUserId?: string;
  startsAt: string;
  endsAt?: string;
  status: BookingSlotStatus;
  branchId?: string;
  carLabel?: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type BookingDoc = {
  id: string;
  studentId: string;
  studentName: string;
  instructorId: string;
  instructorName: string;
  instructorUserId?: string;
  studentPhone?: string;
  slotId?: string;
  startsAt: string; // ISO datetime
  endsAt?: string;
  branchId?: string;
  carLabel?: string;
  status: BookingStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
  confirmedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
};

function normalizeBookingStatus(value: unknown): BookingStatus {
  if (value === "confirmed" || value === "completed" || value === "cancelled") {
    return value;
  }
  if (value === "done") {
    return "completed";
  }
  return "pending";
}

function normalizeSlotStatus(value: unknown): BookingSlotStatus {
  if (value === "available" || value === "booked" || value === "blocked") {
    return value;
  }
  return "open";
}

function toIsoString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  const date = toDate(value);
  return date?.toISOString() ?? "";
}

function bookingSlotFromDoc(id: string, data: DocumentData): BookingSlotDoc {
  return {
    id,
    instructorId: String(data.instructorId ?? ""),
    instructorName: data.instructorName ? String(data.instructorName) : undefined,
    instructorUserId: data.instructorUserId ? String(data.instructorUserId) : undefined,
    startsAt: toIsoString(data.startsAt),
    endsAt: data.endsAt ? toIsoString(data.endsAt) : undefined,
    status: normalizeSlotStatus(data.status),
    branchId: data.branchId ? String(data.branchId) : undefined,
    carLabel: data.carLabel ? String(data.carLabel) : undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function bookingFromDoc(id: string, data: DocumentData): BookingDoc {
  return {
    id,
    studentId: String(data.studentId ?? ""),
    studentName: String(data.studentName ?? "Учень"),
    instructorId: String(data.instructorId ?? ""),
    instructorName: String(data.instructorName ?? "Інструктор"),
    instructorUserId: data.instructorUserId ? String(data.instructorUserId) : undefined,
    studentPhone: data.studentPhone ? String(data.studentPhone) : undefined,
    slotId: data.slotId ? String(data.slotId) : undefined,
    startsAt: toIsoString(data.startsAt),
    endsAt: data.endsAt ? toIsoString(data.endsAt) : undefined,
    branchId: data.branchId ? String(data.branchId) : undefined,
    carLabel: data.carLabel ? String(data.carLabel) : undefined,
    status: normalizeBookingStatus(data.status),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    confirmedAt: toDate(data.confirmedAt),
    completedAt: toDate(data.completedAt),
    cancelledAt: toDate(data.cancelledAt),
  };
}

export async function getAvailableBookingSlots(
  instructorId: string,
  daysAhead = 21,
): Promise<BookingSlotDoc[]> {
  try {
    const now = Date.now();
    const horizon = now + daysAhead * 24 * 60 * 60 * 1000;
    const snap = await getDocs(
      query(collection(db, "bookingSlots"), where("instructorId", "==", instructorId), limit(100)),
    );

    return snap.docs
      .map((d) => bookingSlotFromDoc(d.id, d.data()))
      .filter((slot) => slot.startsAt)
      .filter((slot) => slot.status === "open" || slot.status === "available")
      .filter((slot) => {
        const time = Date.parse(slot.startsAt);
        return Number.isFinite(time) && time >= now && time <= horizon;
      })
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  } catch {
    return [];
  }
}

export async function createBooking(params: {
  studentId: string;
  studentName: string;
  instructorId: string;
  instructorName: string;
  instructorUserId?: string;
  studentPhone?: string;
  slotId?: string;
  startsAt: string;
  endsAt?: string;
  branchId?: string;
  carLabel?: string;
}): Promise<string> {
  const bookingRef = doc(collection(db, "bookings"));
  const payload = stripUndefined({
    ...params,
    status: "pending" satisfies BookingStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (!params.slotId) {
    await setDoc(bookingRef, payload);
    return bookingRef.id;
  }

  const slotRef = doc(db, "bookingSlots", params.slotId);
  await runTransaction(db, async (tx) => {
    const slotSnap = await tx.get(slotRef);
    if (!slotSnap.exists()) {
      throw new Error("slot-not-found");
    }
    const slot = bookingSlotFromDoc(slotSnap.id, slotSnap.data());
    if (slot.instructorId !== params.instructorId) {
      throw new Error("slot-instructor-mismatch");
    }
    if (slot.startsAt && slot.startsAt !== params.startsAt) {
      throw new Error("slot-time-mismatch");
    }
    if (slot.status !== "open" && slot.status !== "available") {
      throw new Error("slot-unavailable");
    }

    tx.set(bookingRef, payload);
    tx.update(
      slotRef,
      stripUndefined({
        status: "booked",
        bookedBy: params.studentId,
        bookingId: bookingRef.id,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  return bookingRef.id;
}

export async function getMyBookings(studentId: string): Promise<BookingDoc[]> {
  try {
    const snap = await getDocs(
      query(collection(db, "bookings"), where("studentId", "==", studentId), limit(50))
    );
    const rows = snap.docs.map((d) => bookingFromDoc(d.id, d.data()));
    return rows.sort((a, b) => (a.startsAt < b.startsAt ? 1 : -1)); // soonest-newest, client-side
  } catch {
    return [];
  }
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  const patch = stripUndefined({
    status,
    updatedAt: serverTimestamp(),
    confirmedAt: status === "confirmed" ? serverTimestamp() : undefined,
    completedAt: status === "completed" ? serverTimestamp() : undefined,
    cancelledAt: status === "cancelled" ? serverTimestamp() : undefined,
  });
  await updateDoc(doc(db, "bookings", bookingId), patch);
}

// Fetch bookings where the caller is the instructor. Supports both the new
// accountUserId link and older bookings that only stored instructors/{id}.
export async function getInstructorBookings(instructorUserId: string): Promise<BookingDoc[]> {
  try {
    const instructorSnap = await getDocs(
      query(collection(db, "instructors"), where("accountUserId", "==", instructorUserId), limit(1))
    );
    const linkedInstructorId = instructorSnap.docs[0]?.id;
    const queries = [
      getDocs(query(collection(db, "bookings"), where("instructorUserId", "==", instructorUserId), limit(50))),
      getDocs(query(collection(db, "bookings"), where("instructorId", "==", instructorUserId), limit(50))),
    ];
    if (linkedInstructorId && linkedInstructorId !== instructorUserId) {
      queries.push(getDocs(query(collection(db, "bookings"), where("instructorId", "==", linkedInstructorId), limit(50))));
    }

    const snaps = await Promise.all(queries);
    const seen = new Set<string>();
    const rows = snaps
      .flatMap((snap) => snap.docs)
      .filter((d) => {
        if (seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      })
      .map((d) => bookingFromDoc(d.id, d.data()));
    return rows.sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1)); // chronological
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
  unreadBy?: string[];
  readBy?: string[];
  lastSenderId?: string;
  createdByName?: string;
  createdByPhone?: string;
  studentId?: string;
  studentName?: string;
  studentPhone?: string;
  instructorId?: string;
  instructorName?: string;
};

export type MessageDoc = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Date | null;
  readBy?: string[];
  deliveredAt?: Date | null;
  deliveredTo?: string[];
  deliveryStatus?: "sent" | "delivered";
  mediaUrl?: string;
  mediaPath?: string;
  mediaType?: "image" | "video" | "document";
  thumbnailUrl?: string;
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  senderRole?: string;
  senderPhone?: string;
  reactions?: Record<string, string>;
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
          unreadBy: data.unreadBy ?? [],
          readBy: data.readBy ?? [],
          lastSenderId: data.lastSenderId,
          createdByName: data.createdByName,
          createdByPhone: data.createdByPhone,
          studentId: data.studentId,
          studentName: data.studentName,
          studentPhone: data.studentPhone,
          instructorId: data.instructorId,
          instructorName: data.instructorName,
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
          deliveredAt: toDate(data.deliveredAt),
          deliveredTo: data.deliveredTo ?? [],
          deliveryStatus: data.deliveryStatus,
          mediaUrl: data.mediaUrl,
          mediaPath: data.mediaPath,
          mediaType: data.mediaType,
          thumbnailUrl: data.thumbnailUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          width: data.width,
          height: data.height,
          senderRole: data.senderRole,
          senderPhone: data.senderPhone,
          reactions: data.reactions ?? {},
        };
      })
    );
  });
}

export async function sendMessage(
  conversationId: string,
  params: {
    senderId: string;
    senderName: string;
    senderRole?: string;
    text: string;
    mediaUrl?: string;
    mediaPath?: string;
    mediaType?: "image" | "video" | "document";
    thumbnailUrl?: string;
    fileName?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    senderPhone?: string;
  }
): Promise<string> {
  const convRef = doc(db, "conversations", conversationId);
  const convSnap = await getDoc(convRef);
  const participantIds = convSnap.exists() ? ((convSnap.data().participantIds ?? []) as string[]) : [];
  const unreadBy = participantIds.filter((participantId) => participantId && participantId !== params.senderId);
  const payload = stripUndefined({
    senderId: params.senderId,
    senderName: params.senderName,
    senderRole: params.senderRole,
    text: params.text,
    createdAt: serverTimestamp(),
    readBy: [params.senderId],
    deliveredTo: [],
    deliveryStatus: "sent",
    mediaUrl: params.mediaUrl,
    mediaPath: params.mediaPath,
    mediaType: params.mediaUrl ? (params.mediaType ?? "image") : undefined,
    thumbnailUrl: params.thumbnailUrl,
    fileName: params.fileName,
    fileSize: params.fileSize,
    width: params.width,
    height: params.height,
    senderPhone: params.senderPhone,
    reactions: {},
  });
  const messageRef = await addDoc(collection(db, "conversations", conversationId, "messages"), payload);
  const fallbackLastMessage =
    params.mediaType === "document"
      ? `📎 ${params.fileName ?? "Файл"}`
      : params.mediaUrl
        ? "📷 Фото"
        : "";
  await updateDoc(convRef, {
    lastMessage: params.text || fallbackLastMessage,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastSenderId: params.senderId,
    unreadBy,
    readBy: [params.senderId],
  });
  return messageRef.id;
}

export async function markConversationRead(
  conversationId: string,
  userId: string
): Promise<void> {
  await updateDoc(doc(db, "conversations", conversationId), {
    unreadBy: arrayRemove(userId),
    readBy: arrayUnion(userId),
    lastReadAt: serverTimestamp(),
    lastReadBy: userId,
  }).catch(() => {});
}

export async function markMessagesRead(
  conversationId: string,
  userId: string,
  messages: MessageDoc[]
): Promise<void> {
  const unreadIncoming = messages
    .filter((message) => message.senderId !== userId && !message.readBy?.includes(userId))
    .slice(-30);

  await Promise.all(
    unreadIncoming.map((message) =>
      updateDoc(doc(db, "conversations", conversationId, "messages", message.id), {
        readBy: arrayUnion(userId),
        readAt: serverTimestamp(),
      }).catch(() => {})
    )
  );
}

export async function setMessageReaction(
  conversationId: string,
  messageId: string,
  userId: string,
  emoji: string | null
): Promise<void> {
  await updateDoc(doc(db, "conversations", conversationId, "messages", messageId), {
    [`reactions.${userId}`]: emoji ?? deleteField(),
    reactionUpdatedAt: serverTimestamp(),
  });
}

// Find-or-create a conversation of a given type (support / manager / instructor).
// Uses only the participantIds+updatedAt index; filters type client-side to avoid
// a compound index. The backend Telegram bridge mirrors each thread to a topic.
export async function ensureConversation(
  userId: string,
  userName: string,
  type: ConversationType,
  title: string,
  userPhone?: string
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
    unreadBy: [],
    readBy: [],
    updatedAt: serverTimestamp(),
    createdBy: userId,
    createdByName: userName,
    createdByPhone: userPhone ?? "",
  });
  return ref.id;
}

// Back-compat wrapper.
export async function ensureSupportConversation(userId: string, userName: string): Promise<string> {
  return ensureConversation(userId, userName, "support", "Підтримка");
}

// Instructor↔student conversation keyed by BOTH real uids so Firestore rules
// (participantIds.hasAny([uid])) allow read/write for both sides. Queries by the
// caller's own uid (read-safe), matches the convo containing the other party.
export async function ensureInstructorConversation(params: {
  callerId: string;
  studentId: string;
  studentName: string;
  studentPhone?: string;
  instructorId: string;
  instructorName: string;
}): Promise<string> {
  const { callerId, studentId, studentName, studentPhone, instructorId, instructorName } = params;
  const q = query(
    collection(db, "conversations"),
    where("participantIds", "array-contains", callerId),
    orderBy("updatedAt", "desc"),
    limit(15)
  );
  const snap = await getDocs(q);
  const existing = snap.docs.find((d) => {
    const x = d.data();
    const p: string[] = x.participantIds ?? [];
    return x.type === "instructor" && p.includes(studentId) && p.includes(instructorId);
  });
  if (existing) return existing.id;

  const ref = await addDoc(collection(db, "conversations"), {
    participantIds: [studentId, instructorId],
    type: "instructor",
    title: `Інструктор · ${studentName}`,
    studentId,
    studentName,
    studentPhone: studentPhone ?? "",
    instructorId,
    instructorName,
    lastMessage: null,
    lastMessageAt: null,
    unreadBy: [],
    readBy: [],
    updatedAt: serverTimestamp(),
    createdBy: callerId,
    createdByName: callerId === instructorId ? instructorName : studentName,
  });
  return ref.id;
}

// ─── PDR Progress (cross-device sync via userPdrProgress/{uid}) ───────────────

export async function savePdrProgressToFirestore(
  uid: string,
  mistakes: Record<string, object>,
  topicProgress: Record<string, object>,
  updatedAt?: string
): Promise<void> {
  await setDoc(
    doc(db, "userPdrProgress", uid),
    {
      mistakes,
      topicProgress,
      updatedAt: updatedAt ?? new Date().toISOString(),
      syncedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function loadPdrProgressFromFirestore(uid: string): Promise<{
  mistakes: Record<string, object>;
  topicProgress: Record<string, object>;
  updatedAt?: string;
} | null> {
  try {
    const snap = await getDoc(doc(db, "userPdrProgress", uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      mistakes: (data.mistakes as Record<string, object>) ?? {},
      topicProgress: (data.topicProgress as Record<string, object>) ?? {},
      updatedAt: data.updatedAt as string | undefined,
    };
  } catch {
    return null;
  }
}

// ─── Leaderboard (reads from userProfiles — already world-readable by signed-in) ──

export type LeaderboardEntry = {
  uid: string;
  displayName: string;
  avatarEmoji?: string;
  city?: string;
  licenseCategory?: string;
  totalAnswered: number;
  accuracyPct: number;
  bestScorePct: number;
  streakDays: number;
};

export async function getLeaderboard(limitCount = 20, timeWindow: "all" | "week" | "month" = "all"): Promise<LeaderboardEntry[]> {
  try {
    let orderByField = "totalAnswered";
    const weekKey = getWeekKey();
    const monthKey = getMonthKey();
    
    if (timeWindow === "week") {
      orderByField = `stats_${weekKey}`;
    } else if (timeWindow === "month") {
      orderByField = `stats_${monthKey}`;
    }

    const snap = await getDocs(
      query(collection(db, "userProfiles"), orderBy(orderByField, "desc"), limit(limitCount))
    );
    return snap.docs
      .map((d) => {
        const data = d.data();
        let answered = (data.totalAnswered as number) ?? 0;
        let correct = (data.totalCorrect as number) ?? 0;
        
        if (timeWindow === "week") {
          answered = (data[`stats_${weekKey}`] as number) ?? 0;
          correct = (data[`correct_${weekKey}`] as number) ?? 0;
        } else if (timeWindow === "month") {
          answered = (data[`stats_${monthKey}`] as number) ?? 0;
          correct = (data[`correct_${monthKey}`] as number) ?? 0;
        }

        return {
          uid: d.id,
          displayName: ((data.name as string | undefined)?.split(" ")[0]) ?? "Учень",
          avatarEmoji: data.avatarEmoji as string | undefined,
          city: data.city as string | undefined,
          licenseCategory: data.category as string | undefined,
          totalAnswered: answered,
          accuracyPct: answered > 0 ? Math.round((correct / answered) * 100) : 0,
          bestScorePct: (data.bestScorePct as number) ?? 0,
          streakDays: (data.streakDays as number) ?? 0,
        };
      })
      .filter((e) => e.totalAnswered > 0);
  } catch {
    return [];
  }
}

// ─── Лідер-бали (bonus system) ────────────────────────────────────────────────

export type BonusTx = {
  type: "earn" | "spend";
  amount: number;
  reason: string;
  createdAt: string;
};

export type UserBonusDoc = {
  balance: number;
  totalEarned: number;
  history: BonusTx[];
  updatedAt: Date | null;
};

export const EMPTY_BONUS: UserBonusDoc = { balance: 0, totalEarned: 0, history: [], updatedAt: null };

export async function getUserBonusBalance(uid: string): Promise<UserBonusDoc> {
  try {
    const snap = await getDoc(doc(db, "userBonuses", uid));
    if (!snap.exists()) return { ...EMPTY_BONUS };
    const d = snap.data();
    return {
      balance: (d.balance as number) ?? 0,
      totalEarned: (d.totalEarned as number) ?? 0,
      history: (d.history as BonusTx[]) ?? [],
      updatedAt: toDate(d.updatedAt),
    };
  } catch {
    return { ...EMPTY_BONUS };
  }
}

export async function addUserBonus(uid: string, amount: number, reason: string): Promise<void> {
  const ref = doc(db, "userBonuses", uid);
  const snap = await getDoc(ref);
  const prev = snap.exists() ? snap.data() : { balance: 0, totalEarned: 0, history: [] };
  const prevBalance = (prev.balance as number) ?? 0;
  const prevEarned = (prev.totalEarned as number) ?? 0;
  const prevHistory = (prev.history as BonusTx[]) ?? [];

  const tx: BonusTx = { type: amount >= 0 ? "earn" : "spend", amount, reason, createdAt: new Date().toISOString() };
  await setDoc(ref, {
    balance: Math.max(0, prevBalance + amount),
    totalEarned: amount > 0 ? prevEarned + amount : prevEarned,
    history: [...prevHistory.slice(-19), tx],
    updatedAt: serverTimestamp(),
  });
}
