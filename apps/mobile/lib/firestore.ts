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

// ─── Conversations / Chat ─────────────────────────────────────────────────────

export type ConversationDoc = {
  id: string;
  participantIds: string[];
  type: "support" | "instructor" | "system";
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

export async function ensureSupportConversation(
  userId: string,
  userName: string
): Promise<string> {
  // Uses only the participantIds+updatedAt index (no compound type filter needed).
  // We fetch a small page and find the support convo client-side to avoid
  // requiring a separate composite index for participantIds+type.
  const q = query(
    collection(db, "conversations"),
    where("participantIds", "array-contains", userId),
    orderBy("updatedAt", "desc"),
    limit(10)
  );
  const snap = await getDocs(q);
  const existing = snap.docs.find((d) => d.data().type === "support");
  if (existing) return existing.id;

  // Create new
  const ref = await addDoc(collection(db, "conversations"), {
    participantIds: [userId, "support"],
    type: "support",
    title: "Підтримка",
    lastMessage: null,
    lastMessageAt: null,
    updatedAt: serverTimestamp(),
    createdBy: userId,
    createdByName: userName,
  });
  return ref.id;
}
