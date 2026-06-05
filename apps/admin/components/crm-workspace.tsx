"use client";

import { leadStatusLabels, leadStatuses } from "@lider/shared";
import { StatusPill } from "@lider/ui";
import type { LeadStatus } from "@lider/types";
import {
  Activity, AlertCircle, BarChart3, Bell, Bot,
  CheckCircle2, ChevronRight, CircleDollarSign, Download,
  Gauge, MessageSquare, Search, Settings, Shield,
  Trash2, Users, UsersRound, type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  adminDeleteComment, adminDeletePost, adminDeleteStory,
  getAiLogs, getClubPosts, getComments, getConversations,
  getDashboardStats, getLeads, getStories, getSupportThreads,
  getUserProfiles,
  type AiLogEntry, type ClubPost, type CommentEntry, type ConversationEntry,
  type FirestoreLead, type StoryEntry, type SupportThread, type UserProfile,
} from "../lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section =
  | "dashboard" | "leads" | "users" | "chat"
  | "posts" | "stories" | "comments"
  | "ailogs" | "pdrquestions" | "notifications" | "settings";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("uk-UA");
}

function formatRelative(d: Date | null) {
  if (!d) return "—";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "щойно";
  if (diff < 3600) return `${Math.floor(diff / 60)} хв тому`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} год тому`;
  return `${Math.floor(diff / 86400)} дн. тому`;
}

function exportCSV<T extends Record<string, unknown>>(rows: T[], filename: string, header: (keyof T)[]) {
  const csv = [
    header.map(String).join(","),
    ...rows.map(r => header.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a"); a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Loading + Error helpers ──────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center gap-3 text-neutral-500 py-10">
      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      Завантаження...
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-red-600 font-bold mb-1"><AlertCircle size={16} /> Помилка Firebase</div>
      <p className="text-sm text-red-500">{message}</p>
      <p className="text-xs text-red-400 mt-1">Переконайся, що Firestore Rules дозволяють читання для адміна.</p>
    </div>
  );
}

function EmptyBox({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center">
      <div className="mb-3 opacity-30 flex justify-center">{icon}</div>
      <p className="text-neutral-500 font-semibold">{label}</p>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, Icon, accent = false }: {
  label: string; value: string | number; sub?: string;
  Icon: LucideIcon; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 border flex flex-col gap-2 ${accent ? "bg-red-600 border-red-500 text-white" : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"}`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-bold uppercase tracking-wider ${accent ? "text-red-200" : "text-neutral-500"}`}>{label}</span>
        <Icon size={18} className={accent ? "text-red-200" : "text-neutral-400"} />
      </div>
      <span className={`text-3xl font-black ${accent ? "text-white" : "text-neutral-900 dark:text-white"}`}>{value}</span>
      {sub ? <span className={`text-xs font-semibold ${accent ? "text-red-200" : "text-neutral-400"}`}>{sub}</span> : null}
    </div>
  );
}

// ─── Section: DASHBOARD ───────────────────────────────────────────────────────

function DashboardSection() {
  const [stats, setStats] = useState({
    totalLeads: 0, leadsToday: 0,
    totalAiQueries: 0, aiLogsToday: 0,
    totalPosts: 0, avgLatencyMs: 0, errorRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white mb-1">Дашборд</h2>
        <p className="text-neutral-500 text-sm">Реальний стан проєкту — Firestore live data</p>
      </div>
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">Firebase · Реальні дані</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Заявок (leads)" value={loading ? "…" : stats.totalLeads} sub={`+${stats.leadsToday} сьогодні`} Icon={UsersRound} accent />
          <StatCard label="AI запити (Лідик)" value={loading ? "…" : stats.totalAiQueries} sub={`+${stats.aiLogsToday} сьогодні`} Icon={Bot} />
          <StatCard label="Пости клубу" value={loading ? "…" : stats.totalPosts} Icon={MessageSquare} />
          <StatCard label="Avg Лідик" value={loading ? "…" : `${stats.avgLatencyMs}ms`} sub={`${stats.errorRate}% помилок`} Icon={Activity} />
        </div>
      </div>
    </div>
  );
}

// ─── Section: LEADS (real Firestore) ─────────────────────────────────────────

function LeadsSection() {
  const [leads, setLeads] = useState<FirestoreLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  useEffect(() => {
    getLeads(300)
      .then(setLeads)
      .catch(e => setError(e?.message ?? "Помилка завантаження"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let r = leads;
    if (search) { const q = search.toLowerCase(); r = r.filter(l => l.name.toLowerCase().includes(q) || l.phone.includes(q)); }
    if (statusFilter) r = r.filter(l => l.status === statusFilter);
    if (cityFilter) r = r.filter(l => l.city === cityFilter);
    return r;
  }, [leads, search, statusFilter, cityFilter]);

  const cities = useMemo(() => Array.from(new Set(leads.map(l => l.city))).sort(), [leads]);
  const statuses = useMemo(() => Array.from(new Set(leads.map(l => l.status))).sort(), [leads]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">Заявки (Leads)</h2>
          <p className="text-neutral-500 text-sm">{filtered.length} з {leads.length} · Firestore collection: leads</p>
        </div>
        <button
          onClick={() => exportCSV(filtered, "leads", ["name", "phone", "email", "city", "category", "status", "source"])}
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity"
        >
          <Download size={14} /> CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук по імені, телефону..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-red-500" />
        </div>
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="px-3 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm">
          <option value="">Всі міста</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm">
          <option value="">Всі статуси</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : filtered.length === 0 ? (
        <EmptyBox label="Немає заявок" icon={<UsersRound size={32} />} />
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800">
                {["Ім'я", "Телефон", "Місто", "Кат.", "Статус", "Джерело", "Дата"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                  <td className="px-4 py-3 font-bold text-neutral-900 dark:text-white">{l.name}</td>
                  <td className="px-4 py-3 text-neutral-500 font-mono text-xs">{l.phone}</td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">{l.city}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-xs font-bold">{l.category}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-bold ${l.status === "enrolled" || l.status === "passed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : l.status === "lost" || l.status === "spam" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"}`}>{l.status}</span></td>
                  <td className="px-4 py-3 text-neutral-400 text-xs">{l.source}</td>
                  <td className="px-4 py-3 text-neutral-400 text-xs whitespace-nowrap">{fmtDate(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Section: USERS ───────────────────────────────────────────────────────────

function UsersSection() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getUserProfiles(200).then(setUsers).catch(e => setError(e?.message ?? "Помилка")).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(u => u.name.toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q));
  }, [users, search]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">Користувачі</h2>
        <p className="text-neutral-500 text-sm">{filtered.length} з {users.length} · userProfiles</p>
      </div>
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук..."
          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-red-500" />
      </div>
      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : filtered.length === 0 ? (
        <EmptyBox label="Немає користувачів" icon={<Users size={32} />} />
      ) : (
        <div className="grid gap-3">
          {filtered.map(u => (
            <div key={u.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-xl shrink-0">
                {u.avatarEmoji ?? "🚗"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-neutral-900 dark:text-white truncate">{u.name}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{u.email ?? "—"} · {u.phone ?? "немає телефону"} · {u.city ?? "—"}</p>
              </div>
              {u.category ? <span className="px-2 py-1 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-xs font-bold shrink-0">Кат. {u.category}</span> : null}
              <span className="text-xs text-neutral-400 shrink-0">{formatRelative(u.updatedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section: CHAT / SUPPORT INBOX ────────────────────────────────────────────

function ChatInboxSection() {
  const [conversations, setConversations] = useState<ConversationEntry[]>([]);
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getConversations(100), getSupportThreads(100)])
      .then(([convs, ts]) => { setConversations(convs); setThreads(ts); })
      .catch(e => setError(e?.message ?? "Помилка"))
      .finally(() => setLoading(false));
  }, []);

  // Map threadId to telegramTopicId for quick lookup
  const threadMap = useMemo(() => {
    const m = new Map<string, SupportThread>();
    threads.forEach(t => m.set(t.id, t));
    return m;
  }, [threads]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">Чат / Підтримка</h2>
        <p className="text-neutral-500 text-sm">{conversations.length} чатів · conversations</p>
      </div>

      {threads.length > 0 ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
          <p className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-1">Telegram Bridge — {threads.length} активних топіків</p>
          <p className="text-xs text-blue-600 dark:text-blue-500">Кожен клієнт = окремий топік у supergroup. Відповідай у Telegram — відповідь з&apos;явиться в додатку.</p>
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1">Telegram Bridge не налаштовано</p>
          <p className="text-xs text-amber-600 dark:text-amber-500">Увімкни Topics у supergroup та зроби бота адміністратором — інструкції в OwnerActionRequired.md.</p>
        </div>
      )}

      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : conversations.length === 0 ? (
        <EmptyBox label="Чатів поки немає — з&apos;являться після першого повідомлення з додатку" icon={<MessageSquare size={32} />} />
      ) : (
        <div className="space-y-2">
          {conversations.map(conv => {
            const thread = threadMap.get(conv.id);
            return (
              <div key={conv.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-black shrink-0">
                  💬
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm text-neutral-900 dark:text-white">{conv.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${conv.type === "support" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-neutral-100 text-neutral-600"}`}>{conv.type}</span>
                    {thread ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">TG #{thread.telegramTopicId}</span> : null}
                  </div>
                  {conv.lastMessage ? <p className="text-sm text-neutral-500 truncate">{conv.lastMessage}</p> : <p className="text-sm text-neutral-400 italic">Немає повідомлень</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                    <span>{formatRelative(conv.lastMessageAt)}</span>
                    <span className="font-mono">{conv.id.slice(0, 8)}</span>
                    <span>{conv.participantIds.length} учасників</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Section: POSTS ───────────────────────────────────────────────────────────

function PostsSection() {
  const [posts, setPosts] = useState<ClubPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClubPosts(100).then(setPosts).catch(e => setError(e?.message ?? "Помилка")).finally(() => setLoading(false));
  }, []);

  async function handleDelete(postId: string) {
    if (!confirm("Видалити пост?")) return;
    await adminDeletePost(postId).catch(() => alert("Помилка видалення"));
    setPosts(prev => prev.filter(p => p.id !== postId));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">Пости клубу</h2>
        <p className="text-neutral-500 text-sm">clubPosts · {posts.length} постів · Firebase</p>
      </div>
      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : posts.length === 0 ? (
        <EmptyBox label="Постів ще немає" icon={<MessageSquare size={32} />} />
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-black text-sm shrink-0">
                {post.authorName.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-neutral-900 dark:text-white">{post.authorName}</span>
                  <span className="text-xs text-neutral-400">{formatRelative(post.createdAt)}</span>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">{post.text}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-neutral-400">
                  <span>♥ {post.likesCount}</span>
                  <span>💬 {post.commentsCount}</span>
                  <span className="font-mono text-neutral-300">{post.id.slice(0, 8)}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(post.id)} className="shrink-0 w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section: STORIES ─────────────────────────────────────────────────────────

function StoriesSection() {
  const [stories, setStories] = useState<StoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStories(100).then(setStories).catch(e => setError(e?.message ?? "Помилка")).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Видалити story?")) return;
    await adminDeleteStory(id).catch(() => alert("Помилка видалення"));
    setStories(prev => prev.filter(s => s.id !== id));
  }

  const now = new Date();
  const active = stories.filter(s => s.expiresAt && s.expiresAt > now);
  const expired = stories.filter(s => !s.expiresAt || s.expiresAt <= now);

  const TONE_COLORS: Record<string, string> = {
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    yellow: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    dark: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400",
  };

  function StoryRow({ s }: { s: StoryEntry }) {
    const isExpired = !s.expiresAt || s.expiresAt <= now;
    return (
      <div className={`bg-white dark:bg-neutral-900 rounded-2xl border p-4 flex gap-4 ${isExpired ? "opacity-50 border-neutral-100 dark:border-neutral-800" : "border-neutral-200 dark:border-neutral-800"}`}>
        <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xl shrink-0">
          {s.authorEmoji ?? "🚗"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm text-neutral-900 dark:text-white">{s.authorName}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${TONE_COLORS[s.tone] ?? TONE_COLORS.dark}`}>{s.tone}</span>
            {isExpired ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-500">expired</span> : null}
          </div>
          <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">{s.text}</p>
          <div className="flex items-center gap-4 mt-1 text-xs text-neutral-400">
            <span>♥ {s.reactions}</span>
            <span>👁 {s.views}</span>
            <span>{formatRelative(s.createdAt)}</span>
            {s.expiresAt && !isExpired ? <span className="text-green-600">expires {formatRelative(s.expiresAt)}</span> : null}
          </div>
        </div>
        <button onClick={() => handleDelete(s.id)} className="shrink-0 w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">Stories</h2>
        <p className="text-neutral-500 text-sm">{active.length} активних · {expired.length} expired · stories collection</p>
      </div>
      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : stories.length === 0 ? (
        <EmptyBox label="Stories ще немає" icon={<CircleDollarSign size={32} />} />
      ) : (
        <div className="space-y-6">
          {active.length > 0 ? (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">Активні ({active.length})</h3>
              <div className="space-y-2">{active.map(s => <StoryRow key={s.id} s={s} />)}</div>
            </div>
          ) : null}
          {expired.length > 0 ? (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">Закінчились ({expired.length})</h3>
              <div className="space-y-2">{expired.map(s => <StoryRow key={s.id} s={s} />)}</div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─── Section: COMMENTS ────────────────────────────────────────────────────────

function CommentsSection() {
  const [comments, setComments] = useState<CommentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getComments(300).then(setComments).catch(e => setError(e?.message ?? "Помилка")).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return comments;
    const q = search.toLowerCase();
    return comments.filter(c => c.text.toLowerCase().includes(q) || c.authorName.toLowerCase().includes(q));
  }, [comments, search]);

  async function handleDelete(id: string) {
    if (!confirm("Видалити коментар?")) return;
    await adminDeleteComment(id).catch(() => alert("Помилка видалення"));
    setComments(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">Коментарі</h2>
        <p className="text-neutral-500 text-sm">{filtered.length} з {comments.length} · clubComments</p>
      </div>
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук..."
          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-red-500" />
      </div>
      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : filtered.length === 0 ? (
        <EmptyBox label="Коментарів немає" icon={<MessageSquare size={32} />} />
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800">
                {["Автор", "Коментар", "Пост ID", "Лайки", "Дата", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map(c => (
                <tr key={c.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                  <td className="px-4 py-3 font-bold text-sm text-neutral-900 dark:text-white whitespace-nowrap">{c.authorName}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400 max-w-xs truncate">{c.text}</td>
                  <td className="px-4 py-3 text-xs text-neutral-400 font-mono">{c.postId.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500">♥ {c.likesCount}</td>
                  <td className="px-4 py-3 text-xs text-neutral-400 whitespace-nowrap">{formatRelative(c.createdAt)}</td>
                  <td className="px-4 py-2">
                    <button onClick={() => handleDelete(c.id)} className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:bg-red-100">
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Section: AI LOGS ─────────────────────────────────────────────────────────

function AiLogsSection() {
  const [logs, setLogs] = useState<AiLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAiLogs(200).then(setLogs).catch(e => setError(e?.message ?? "Помилка")).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return logs;
    const q = search.toLowerCase();
    return logs.filter(l => l.question.toLowerCase().includes(q) || (l.userId ?? "").toLowerCase().includes(q) || (l.model ?? "").toLowerCase().includes(q));
  }, [logs, search]);

  const stats = useMemo(() => {
    const errors = logs.filter(l => l.error).length;
    const avgMs = logs.length > 0 ? Math.round(logs.reduce((s, l) => s + (l.latencyMs || 0), 0) / logs.length) : 0;
    return { total: logs.length, errors, errorRate: logs.length > 0 ? Math.round(errors / logs.length * 100) : 0, avgMs };
  }, [logs]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">AI Логи · Лідик</h2>
        <p className="text-neutral-500 text-sm">aiLogs · {stats.total} запитів · Firebase</p>
      </div>

      {!loading && !error ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Всього запитів" value={stats.total} Icon={Bot} accent />
          <StatCard label="Помилок" value={`${stats.errorRate}%`} sub={`${stats.errors} помилок`} Icon={AlertCircle} />
          <StatCard label="Avg latency" value={`${stats.avgMs}ms`} Icon={Activity} />
          <StatCard label="Унікальних питань" value={new Set(logs.map(l => l.question)).size} Icon={MessageSquare} />
        </div>
      ) : null}

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук по питанню або userId..."
          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-red-500" />
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800">
                {["Час", "Питання", "Модель", "Latency", "userId", "Статус"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(log => (
                <tr key={log.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                  <td className="px-4 py-3 text-xs text-neutral-400 whitespace-nowrap">{formatRelative(log.timestamp)}</td>
                  <td className="px-4 py-3 max-w-xs"><p className="truncate font-medium text-neutral-900 dark:text-white">{log.question}</p></td>
                  <td className="px-4 py-3 text-xs text-neutral-400 font-mono">{log.model ?? "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono text-neutral-500">{log.latencyMs}ms</td>
                  <td className="px-4 py-3 text-xs text-neutral-400 font-mono">{log.userId ? log.userId.slice(0, 8) : "guest"}</td>
                  <td className="px-4 py-3">
                    {log.error ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-xs font-bold">{log.error}</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-xs font-bold">✓ ok</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? <div className="text-center py-12 text-neutral-400"><Bot size={32} className="mx-auto mb-3 opacity-30" /><p>Логів немає</p></div> : null}
        </div>
      )}
    </div>
  );
}

// ─── Section: PDR QUESTIONS ───────────────────────────────────────────────────

function PDRQuestionsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">Питання ПДР</h2>
        <p className="text-neutral-500 text-sm">200 питань · apps/mobile/lib/pdr-questions.ts</p>
      </div>
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
        <p className="font-bold text-amber-700 dark:text-amber-400 mb-2">Банк питань зберігається у коді</p>
        <p className="text-sm text-amber-600 dark:text-amber-500 mb-3">
          200 реальних питань у <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">apps/mobile/lib/pdr-questions.ts</code>. Редагування через код або через Firestore (потребує міграції).
        </p>
        <p className="text-xs text-amber-500">Наступний крок: змігрувати PDR_QUESTIONS до Firestore collection <code className="font-mono">pdrQuestions</code> і підключити тут CRUD.</p>
      </div>
    </div>
  );
}

// ─── Section: NOTIFICATIONS ───────────────────────────────────────────────────

function NotificationsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">Push-сповіщення</h2>
        <p className="text-neutral-500 text-sm">FCM (Firebase Cloud Messaging)</p>
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
        <p className="font-bold text-blue-700 dark:text-blue-400 mb-2">Архітектура готова, FCM не активовано</p>
        <ul className="text-sm text-blue-600 dark:text-blue-500 space-y-1 list-disc list-inside">
          <li>Firebase Console → Cloud Messaging → Enable</li>
          <li>Встановити <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">expo-notifications</code> у мобільному app</li>
          <li>Зберігати FCM token у <code className="font-mono">userProfiles/{"{uid}"}/fcmToken</code></li>
          <li>Cloud Function: слухати нові messages і відправляти push</li>
        </ul>
      </div>
    </div>
  );
}

// ─── Section: SETTINGS ────────────────────────────────────────────────────────

function SettingsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">Налаштування</h2>
        <p className="text-neutral-500 text-sm">Конфігурація проєкту</p>
      </div>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
        {[
          ["Firebase Project", "lider-avtoschool"],
          ["AI Model", "gpt-5-mini (reasoning, ~2-3s, reasoning_effort=minimal)"],
          ["API Endpoint", "https://api-jd6b6vy57a-ew.a.run.app"],
          ["Telegram Bot", "@lideravtoschool_bot"],
          ["Telegram Supergroup", "-1003847749003"],
          ["Webhook", "https://api-jd6b6vy57a-ew.a.run.app/telegram/webhook ✅"],
          ["Mobile apiUrl", "https://api-jd6b6vy57a-ew.a.run.app (app.config.ts)"],
        ].map(([label, value]) => (
          <div key={label}>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">{label}</label>
            <p className="text-sm font-mono text-neutral-700 dark:text-neutral-300">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SIDEBAR NAV ──────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Section; label: string; Icon: LucideIcon }[] = [
  { id: "dashboard",     label: "Дашборд",      Icon: Gauge },
  { id: "leads",         label: "Заявки",        Icon: UsersRound },
  { id: "users",         label: "Користувачі",   Icon: Users },
  { id: "chat",          label: "Чат / Підтримка", Icon: MessageSquare },
  { id: "posts",         label: "Пости клубу",   Icon: BarChart3 },
  { id: "stories",       label: "Stories",       Icon: CircleDollarSign },
  { id: "comments",      label: "Коментарі",     Icon: MessageSquare },
  { id: "ailogs",        label: "AI Логи",        Icon: Bot },
  { id: "pdrquestions",  label: "ПДР Питання",   Icon: CheckCircle2 },
  { id: "notifications", label: "Повідомлення",  Icon: Bell },
  { id: "settings",      label: "Налаштування",  Icon: Settings },
];

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export function CrmWorkspace() {
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-60" : "w-16"} shrink-0 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-all duration-200`}>
        <div className={`h-16 flex items-center ${sidebarOpen ? "px-5" : "justify-center"} border-b border-neutral-100 dark:border-neutral-800`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-xs">Л</span>
              </div>
              <span className="font-black text-sm text-neutral-900 dark:text-white">Адмін · Лідер</span>
            </div>
          ) : (
            <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">Л</span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = section === id;
            return (
              <button
                key={id} onClick={() => setSection(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${active ? "bg-red-600 text-white" : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}
              >
                <Icon size={16} className="shrink-0" />
                {sidebarOpen ? <span className="flex-1 text-left">{label}</span> : null}
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="h-12 flex items-center justify-center border-t border-neutral-100 dark:border-neutral-800 text-neutral-400 hover:text-neutral-600 text-sm"
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <span>Автошкола Лідер</span>
            <ChevronRight size={14} />
            <span className="font-bold text-neutral-900 dark:text-white">{NAV_ITEMS.find(n => n.id === section)?.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-sm">А</div>
          </div>
        </div>

        <div className="p-6 max-w-7xl">
          {section === "dashboard"     && <DashboardSection />}
          {section === "leads"         && <LeadsSection />}
          {section === "users"         && <UsersSection />}
          {section === "chat"          && <ChatInboxSection />}
          {section === "posts"         && <PostsSection />}
          {section === "stories"       && <StoriesSection />}
          {section === "comments"      && <CommentsSection />}
          {section === "ailogs"        && <AiLogsSection />}
          {section === "pdrquestions"  && <PDRQuestionsSection />}
          {section === "notifications" && <NotificationsSection />}
          {section === "settings"      && <SettingsSection />}
        </div>
      </main>
    </div>
  );
}
