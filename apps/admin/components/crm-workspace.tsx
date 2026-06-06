"use client";

import { leadStatusLabels, leadStatuses } from "@lider/shared";
import { StatusPill } from "@lider/ui";
import type { LeadStatus } from "@lider/types";
import {
 Activity, AlertCircle, BarChart3, Bell, BookOpen, Bot, Calendar,
 CheckCircle2, ChevronRight, CircleDollarSign, Copy, Download, FileText,
 Gauge, GraduationCap, MapPin, MessageSquare, Plus, Search, Settings, Shield,
 Trash2, Users, UsersRound, type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
 adminDeleteComment, adminDeletePost, adminDeleteStory,
 addInstructor, deleteInstructor, getBookings, getInstructorsAdmin, updateBookingStatus,
 addLesson, deleteLesson, getLessonsAdmin,
 addServiceCenter, deleteServiceCenter, getServiceCentersAdmin,
 getAiLogs, getClubPosts, getComments, getConversations, getConversationsAdmin, getConversationMessages,
 getDashboardStats, getLeads, getNaisRecords, getStories, getSupportThreads,
 getUserProfiles,
 setUserRole,
 type AiLogEntry, type BookingAdmin, type ClubPost, type CommentEntry, type ConversationEntry, type ConversationMessage,
 type FirestoreLead, type InstructorAdmin, type LessonAdmin, type NaisRecord, type ServiceCenterAdmin, type StoryEntry, type SupportThread, type UserProfile,
} from "../lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isGood = status === "enrolled" || status === "passed" || status === "closed";
  const isBad = status === "lost" || status === "spam";
  const colorClass = isGood ? "bg-[#e6f0ee] text-lider-green" : isBad ? "bg-[#fff1f1] text-lider-red" : "bg-lider-line/50 text-lider-muted";
  
  return (
    <span className={`px-2 py-1 inline-flex rounded-[8px] text-[11px] uppercase tracking-wider font-black ${colorClass}`}>
      {status}
    </span>
  );
}


type Section =
 | "dashboard" | "leads" | "users" | "chat" | "chatmonitor"
 | "posts" | "stories" | "comments"
 | "nais" | "instructors" | "bookings" | "lessons" | "servicecenters"
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
 <div className="flex items-center gap-3 text-lider-muted py-10">
 <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
 Завантаження...
 </div>
 );
}

function ErrorBox({ message }: { message: string }) {
 return (
 <div className="bg-[#fff1f1] /20 border border-lider-red/20 rounded-[24px] p-4">
 <div className="flex items-center gap-2 text-lider-red font-bold mb-1"><AlertCircle size={16} /> Помилка Firebase</div>
 <p className="text-sm text-lider-red">{message}</p>
 <p className="text-xs text-red-400 mt-1">Переконайся, що Firestore Rules дозволяють читання для адміна.</p>
 </div>
 );
}

function EmptyBox({ label, icon }: { label: string; icon: React.ReactNode }) {
 return (
 <div className="bg-lider-background rounded-[24px] border border-lider-line p-12 text-center">
 <div className="mb-3 opacity-30 flex justify-center">{icon}</div>
 <p className="text-lider-muted font-semibold">{label}</p>
 </div>
 );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, Icon, accent = false }: {
 label: string; value: string | number; sub?: string;
 Icon: LucideIcon; accent?: boolean;
}) {
 return (
 <div className={`rounded-[24px] p-5 border flex flex-col gap-2 ${accent ? "bg-lider-red border-red-500 text-white" : "bg-white border-lider-line "}`}>
 <div className="flex items-center justify-between">
 <span className={`text-sm font-bold uppercase tracking-wider ${accent ? "text-red-200" : "text-lider-muted"}`}>{label}</span>
 <Icon size={18} className={accent ? "text-red-200" : "text-lider-muted"} />
 </div>
 <span className={`text-4xl font-black tracking-[-0.04em] ${accent ? "text-white" : "text-lider-graphite "}`}>{value}</span>
 {sub ? <span className={`text-xs font-semibold ${accent ? "text-red-200" : "text-lider-muted"}`}>{sub}</span> : null}
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
 <h2 className="text-3xl font-black tracking-[-0.04em] tracking-[-0.04em] text-lider-graphite mb-1">Дашборд</h2>
 <p className="text-lider-muted text-sm">Реальний стан проєкту — Firestore live data</p>
 </div>
 <div>
 <h3 className="text-xs font-bold uppercase tracking-widest text-lider-muted mb-3">Firebase · Реальні дані</h3>
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
 <h2 className="text-3xl font-black tracking-[-0.04em] tracking-[-0.04em] text-lider-graphite ">Заявки (Leads)</h2>
 <p className="text-lider-muted text-sm">{filtered.length} з {leads.length} · Firestore collection: leads</p>
 </div>
 <button
 onClick={() => exportCSV(filtered, "leads", ["name", "phone", "email", "city", "category", "status", "source"])}
 className="flex items-center gap-2 px-4 py-2.5 bg-lider-graphite text-white rounded-[16px] font-bold text-sm hover:opacity-80 transition-opacity"
 >
 <Download size={14} /> CSV
 </button>
 </div>

 <div className="flex flex-wrap gap-3">
 <div className="relative flex-1 min-w-[200px]">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lider-muted" />
 <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук по імені, телефону..."
 className="w-full pl-9 pr-4 py-2.5 bg-white border border-lider-line rounded-[16px] text-sm focus:outline-none focus:border-lider-red focus:ring-1 focus:ring-lider-red" />
 </div>
 <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-lider-line rounded-[16px] text-sm">
 <option value="">Всі міста</option>
 {cities.map(c => <option key={c} value={c}>{c}</option>)}
 </select>
 <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-lider-line rounded-[16px] text-sm">
 <option value="">Всі статуси</option>
 {statuses.map(s => <option key={s} value={s}>{s}</option>)}
 </select>
 </div>

 {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : filtered.length === 0 ? (
 <EmptyBox label="Немає заявок" icon={<UsersRound size={32} />} />
 ) : (
 <div className="bg-white rounded-[24px] border border-lider-line overflow-hidden">
 <table className="w-full text-sm">
              <thead className="bg-[#fcfcfc]">
                <tr className="border-b border-lider-line">
                  {["Ім'я", "Телефон", "Місто", "Кат.", "Статус", "Джерело", "Дата"].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-lider-muted/80">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-lider-line">
                {filtered.map(l => (
                  <tr key={l.id} className="hover:bg-lider-background transition-colors group cursor-pointer">
                    <td className="px-5 py-4 font-bold text-lider-graphite">{l.name}</td>
                    <td className="px-5 py-4 text-lider-graphite font-semibold tabular-nums text-sm">{l.phone}</td>
                    <td className="px-5 py-4 text-lider-muted">{l.city || "—"}</td>
                    <td className="px-5 py-4"><span className="px-2 py-1 bg-lider-line/30 rounded-lg text-xs font-bold text-lider-graphite">{l.category || "—"}</span></td>
                    <td className="px-5 py-4"><StatusBadge status={l.status as any} /></td>
                    <td className="px-5 py-4 text-lider-muted text-xs">{l.source}</td>
                    <td className="px-5 py-4 text-lider-muted text-[13px] font-medium tabular-nums whitespace-nowrap">{fmtDate(l.createdAt)}</td>
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

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
 student: { label: "Учень", color: "bg-blue-50 text-blue-700 /30 " },
 instructor: { label: "Інструктор", color: "bg-[#e6f0ee] text-lider-green /30 " },
 manager: { label: "Менеджер", color: "bg-purple-50 text-purple-700 /30 " },
 admin: { label: "Адмін", color: "bg-[#fff1f1] text-lider-red " },
};

function UserRoleBadge({ role }: { role?: string }) {
 if (!role) return <span className="px-2 py-1 rounded-lg text-xs bg-lider-line/30 text-lider-muted">учень</span>;
 const r = ROLE_LABELS[role] ?? { label: role, color: "bg-lider-line/30 text-lider-muted" };
 return <span className={`px-2 py-1 rounded-lg text-xs font-bold ${r.color}`}>{r.label}</span>;
}

function UsersSection() {
 const [users, setUsers] = useState<UserProfile[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [search, setSearch] = useState("");
 const [settingRole, setSettingRole] = useState<string | null>(null);

 useEffect(() => {
 getUserProfiles(200).then(setUsers).catch(e => setError(e?.message ?? "Помилка")).finally(() => setLoading(false));
 }, []);

 const filtered = useMemo(() => {
 if (!search) return users;
 const q = search.toLowerCase();
 return users.filter(u => u.name.toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q));
 }, [users, search]);

 async function handleSetRole(userId: string, role: string | null) {
 setSettingRole(userId);
 try {
 await setUserRole(userId, role);
 setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role ?? undefined } : u));
 } catch (e: unknown) {
 alert("Помилка: " + (e instanceof Error ? e.message : String(e)));
 } finally {
 setSettingRole(null);
 }
 }

 return (
 <div className="space-y-6">
 <div>
 <h2 className="text-3xl font-black tracking-[-0.04em] tracking-[-0.04em] text-lider-graphite ">Користувачі</h2>
 <p className="text-lider-muted text-sm">{filtered.length} з {users.length} · userProfiles</p>
 </div>
 <div className="relative max-w-sm">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lider-muted" />
 <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук..."
 className="w-full pl-9 pr-4 py-2.5 bg-white border border-lider-line rounded-[16px] text-sm focus:outline-none focus:border-lider-red focus:ring-1 focus:ring-lider-red" />
 </div>
 {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : filtered.length === 0 ? (
 <EmptyBox label="Немає користувачів" icon={<Users size={32} />} />
 ) : (
 <div className="grid gap-3">
 {filtered.map(u => (
 <div key={u.id} className="bg-white rounded-[24px] border border-lider-line p-4 flex items-center gap-4 flex-wrap">
 <div className="w-10 h-10 rounded-full bg-red-100 /30 flex items-center justify-center text-xl shrink-0">
 {u.avatarEmoji ?? "🚗"}
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-bold text-lider-graphite truncate">{u.name}</p>
 <p className="text-xs text-lider-muted mt-0.5">{u.email ?? "—"} · {u.phone ?? "немає телефону"} · {u.city ?? "—"}</p>
 <p className="text-xs text-lider-muted font-mono mt-0.5 truncate">{u.id}</p>
 </div>
 {u.category ? <span className="px-2 py-1 bg-[#fff1f1] text-lider-red rounded-lg text-xs font-bold shrink-0">Кат. {u.category}</span> : null}
 <UserRoleBadge role={u.role} />
 {/* Role management dropdown */}
 <div className="flex items-center gap-1 shrink-0">
 {settingRole === u.id ? (
 <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
 ) : (
 <select
 value={u.role ?? ""}
 onChange={e => handleSetRole(u.id, e.target.value || null)}
 className="text-xs border border-lider-line rounded-lg px-2 py-1.5 bg-white text-neutral-700 focus:outline-none focus:border-lider-red focus:ring-1 focus:ring-lider-red cursor-pointer"
 >
 <option value="">учень (default)</option>
 <option value="instructor">🚗 Інструктор</option>
 <option value="manager">👩‍💼 Менеджер</option>
 <option value="admin">🛡 Адмін</option>
 </select>
 )}
 </div>
 <span className="text-xs text-lider-muted shrink-0">{formatRelative(u.updatedAt)}</span>
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
 <h2 className="text-3xl font-black tracking-[-0.04em] tracking-[-0.04em] text-lider-graphite ">Чат / Підтримка</h2>
 <p className="text-lider-muted text-sm">{conversations.length} чатів · conversations</p>
 </div>

 {threads.length > 0 ? (
 <div className="bg-blue-50 /20 border border-blue-200 rounded-[24px] p-4">
 <p className="text-sm font-bold text-blue-700 mb-1">Telegram Bridge — {threads.length} активних топіків</p>
 <p className="text-xs text-blue-600 ">Кожен клієнт = окремий топік у supergroup. Відповідай у Telegram — відповідь з&apos;явиться в додатку.</p>
 </div>
 ) : (
 <div className="bg-amber-50 /20 border border-amber-200 rounded-[24px] p-4">
 <p className="text-sm font-bold text-amber-700 mb-1">Telegram Bridge не налаштовано</p>
 <p className="text-xs text-amber-600 ">Увімкни Topics у supergroup та зроби бота адміністратором — інструкції в OwnerActionRequired.md.</p>
 </div>
 )}

 {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : conversations.length === 0 ? (
 <EmptyBox label="Чатів поки немає — з&apos;являться після першого повідомлення з додатку" icon={<MessageSquare size={32} />} />
 ) : (
 <div className="space-y-2">
 {conversations.map(conv => {
 const thread = threadMap.get(conv.id);
 return (
 <div key={conv.id} className="bg-white rounded-[24px] border border-lider-line p-4 flex items-start gap-4">
 <div className="w-10 h-10 rounded-full bg-blue-100 /30 flex items-center justify-center text-blue-600 font-black shrink-0">
 💬
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5">
 <span className="font-bold text-sm text-lider-graphite ">{conv.title}</span>
 <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${conv.type === "support" ? "bg-blue-100 text-blue-700 /30 " : "bg-lider-line/30 text-lider-muted"}`}>{conv.type}</span>
 {thread ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#e6f0ee] text-lider-green ">TG #{thread.telegramTopicId}</span> : null}
 </div>
 {conv.lastMessage ? <p className="text-sm text-lider-muted truncate">{conv.lastMessage}</p> : <p className="text-sm text-lider-muted italic">Немає повідомлень</p>}
 <div className="flex items-center gap-3 mt-1 text-xs text-lider-muted">
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
 <h2 className="text-3xl font-black tracking-[-0.04em] tracking-[-0.04em] text-lider-graphite ">Пости клубу</h2>
 <p className="text-lider-muted text-sm">clubPosts · {posts.length} постів · Firebase</p>
 </div>
 {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : posts.length === 0 ? (
 <EmptyBox label="Постів ще немає" icon={<MessageSquare size={32} />} />
 ) : (
 <div className="space-y-3">
 {posts.map(post => (
 <div key={post.id} className="bg-white rounded-[24px] border border-lider-line p-4 flex gap-4">
 <div className="w-10 h-10 rounded-full bg-red-100 /30 flex items-center justify-center text-lider-red font-black text-sm shrink-0">
 {post.authorName.slice(0, 1)}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <span className="font-bold text-sm text-lider-graphite ">{post.authorName}</span>
 <span className="text-xs text-lider-muted">{formatRelative(post.createdAt)}</span>
 </div>
 <p className="text-sm text-neutral-700 line-clamp-2">{post.text}</p>
 <div className="flex items-center gap-4 mt-2 text-xs text-lider-muted">
 <span>♥ {post.likesCount}</span>
 <span>💬 {post.commentsCount}</span>
 <span className="font-mono text-neutral-300">{post.id.slice(0, 8)}</span>
 </div>
 </div>
 <button onClick={() => handleDelete(post.id)} className="shrink-0 w-8 h-8 rounded-lg bg-[#fff1f1] /20 flex items-center justify-center text-lider-red hover:bg-red-100 transition-colors">
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
 red: "bg-red-100 text-lider-red",
 green: "bg-[#e6f0ee] text-lider-green ",
 yellow: "bg-amber-100 text-amber-700 /30 ",
 dark: "bg-lider-line/30 text-neutral-700 ",
 };

 function StoryRow({ s }: { s: StoryEntry }) {
 const isExpired = !s.expiresAt || s.expiresAt <= now;
 return (
 <div className={`bg-white rounded-[24px] border p-4 flex gap-4 ${isExpired ? "opacity-50 border-lider-line " : "border-lider-line "}`}>
 <div className="w-10 h-10 rounded-full bg-lider-line/30 flex items-center justify-center text-xl shrink-0">
 {s.authorEmoji ?? "🚗"}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <span className="font-bold text-sm text-lider-graphite ">{s.authorName}</span>
 <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${TONE_COLORS[s.tone] ?? TONE_COLORS.dark}`}>{s.tone}</span>
 {isExpired ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-lider-line/30 text-lider-muted">expired</span> : null}
 </div>
 <p className="text-sm text-neutral-700 line-clamp-2">{s.text}</p>
 <div className="flex items-center gap-4 mt-1 text-xs text-lider-muted">
 <span>♥ {s.reactions}</span>
 <span>👁 {s.views}</span>
 <span>{formatRelative(s.createdAt)}</span>
 {s.expiresAt && !isExpired ? <span className="text-lider-green">expires {formatRelative(s.expiresAt)}</span> : null}
 </div>
 </div>
 <button onClick={() => handleDelete(s.id)} className="shrink-0 w-8 h-8 rounded-lg bg-[#fff1f1] /20 flex items-center justify-center text-lider-red hover:bg-red-100 transition-colors">
 <Trash2 size={14} />
 </button>
 </div>
 );
 }

 return (
 <div className="space-y-6">
 <div>
 <h2 className="text-3xl font-black tracking-[-0.04em] tracking-[-0.04em] text-lider-graphite ">Stories</h2>
 <p className="text-lider-muted text-sm">{active.length} активних · {expired.length} expired · stories collection</p>
 </div>
 {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : stories.length === 0 ? (
 <EmptyBox label="Stories ще немає" icon={<CircleDollarSign size={32} />} />
 ) : (
 <div className="space-y-6">
 {active.length > 0 ? (
 <div>
 <h3 className="text-xs font-bold uppercase tracking-widest text-lider-muted mb-3">Активні ({active.length})</h3>
 <div className="space-y-2">{active.map(s => <StoryRow key={s.id} s={s} />)}</div>
 </div>
 ) : null}
 {expired.length > 0 ? (
 <div>
 <h3 className="text-xs font-bold uppercase tracking-widest text-lider-muted mb-3">Закінчились ({expired.length})</h3>
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
 <h2 className="text-3xl font-black tracking-[-0.04em] tracking-[-0.04em] text-lider-graphite ">Коментарі</h2>
 <p className="text-lider-muted text-sm">{filtered.length} з {comments.length} · clubComments</p>
 </div>
 <div className="relative max-w-sm">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lider-muted" />
 <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук..."
 className="w-full pl-9 pr-4 py-2.5 bg-white border border-lider-line rounded-[16px] text-sm focus:outline-none focus:border-lider-red focus:ring-1 focus:ring-lider-red" />
 </div>
 {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : filtered.length === 0 ? (
 <EmptyBox label="Коментарів немає" icon={<MessageSquare size={32} />} />
 ) : (
 <div className="bg-white rounded-[24px] border border-lider-line overflow-hidden">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-lider-line ">
 {["Автор", "Коментар", "Пост ID", "Лайки", "Дата", ""].map(h => (
 <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-lider-muted">{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {filtered.slice(0, 100).map(c => (
 <tr key={c.id} className="border-b border-neutral-50 /50 hover:bg-lider-background :bg-lider-graphite/30">
 <td className="px-4 py-3 font-bold text-sm text-lider-graphite whitespace-nowrap">{c.authorName}</td>
 <td className="px-4 py-3 text-sm text-lider-muted max-w-xs truncate">{c.text}</td>
 <td className="px-4 py-3 text-xs text-lider-muted font-mono">{c.postId.slice(0, 8)}</td>
 <td className="px-4 py-3 text-xs text-lider-muted">♥ {c.likesCount}</td>
 <td className="px-4 py-3 text-xs text-lider-muted whitespace-nowrap">{formatRelative(c.createdAt)}</td>
 <td className="px-4 py-2">
 <button onClick={() => handleDelete(c.id)} className="w-7 h-7 rounded-lg bg-[#fff1f1] /20 flex items-center justify-center text-lider-red hover:bg-red-100">
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
 <h2 className="text-3xl font-black tracking-[-0.04em] tracking-[-0.04em] text-lider-graphite ">AI Логи · Лідик</h2>
 <p className="text-lider-muted text-sm">aiLogs · {stats.total} запитів · Firebase</p>
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
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lider-muted" />
 <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук по питанню або userId..."
 className="w-full pl-9 pr-4 py-2.5 bg-white border border-lider-line rounded-[16px] text-sm focus:outline-none focus:border-lider-red focus:ring-1 focus:ring-lider-red" />
 </div>

 {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : (
 <div className="bg-white rounded-[24px] border border-lider-line overflow-hidden">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-lider-line ">
 {["Час", "Питання", "Модель", "Latency", "userId", "Статус"].map(h => (
 <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-lider-muted">{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {filtered.slice(0, 50).map(log => (
 <tr key={log.id} className="border-b border-neutral-50 /50 hover:bg-lider-background :bg-lider-graphite/30">
 <td className="px-4 py-3 text-xs text-lider-muted whitespace-nowrap">{formatRelative(log.timestamp)}</td>
 <td className="px-4 py-3 max-w-xs"><p className="truncate font-medium text-lider-graphite ">{log.question}</p></td>
 <td className="px-4 py-3 text-xs text-lider-muted font-mono">{log.model ?? "—"}</td>
 <td className="px-4 py-3 text-xs font-mono text-lider-muted">{log.latencyMs}ms</td>
 <td className="px-4 py-3 text-xs text-lider-muted font-mono">{log.userId ? log.userId.slice(0, 8) : "guest"}</td>
 <td className="px-4 py-3">
 {log.error ? (
 <span className="px-2 py-1 bg-red-100 text-lider-redrounded-lg text-xs font-bold">{log.error}</span>
 ) : (
 <span className="px-2 py-1 bg-[#e6f0ee] text-lider-green rounded-lg text-xs font-bold">✓ ok</span>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 {filtered.length === 0 ? <div className="text-center py-12 text-lider-muted"><Bot size={32} className="mx-auto mb-3 opacity-30" /><p>Логів немає</p></div> : null}
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
 <h2 className="text-3xl font-black tracking-[-0.04em] tracking-[-0.04em] text-lider-graphite ">Питання ПДР</h2>
 <p className="text-lider-muted text-sm">200 питань · apps/mobile/lib/pdr-questions.ts</p>
 </div>
 <div className="bg-amber-50 /20 border border-amber-200 rounded-[24px] p-5">
 <p className="font-bold text-amber-700 mb-2">Банк питань зберігається у коді</p>
 <p className="text-sm text-amber-600 mb-3">
 200 реальних питань у <code className="font-mono bg-amber-100 /40 px-1 rounded">apps/mobile/lib/pdr-questions.ts</code>. Редагування через код або через Firestore (потребує міграції).
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
 <h2 className="text-3xl font-black tracking-[-0.04em] tracking-[-0.04em] text-lider-graphite ">Push-сповіщення</h2>
 <p className="text-lider-muted text-sm">FCM (Firebase Cloud Messaging)</p>
 </div>
 <div className="bg-blue-50 /20 border border-blue-200 rounded-[24px] p-5">
 <p className="font-bold text-blue-700 mb-2">Архітектура готова, FCM не активовано</p>
 <ul className="text-sm text-blue-600 space-y-1 list-disc list-inside">
 <li>Firebase Console → Cloud Messaging → Enable</li>
 <li>Встановити <code className="font-mono bg-blue-100 /40 px-1 rounded">expo-notifications</code> у мобільному app</li>
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
 <h2 className="text-3xl font-black tracking-[-0.04em] tracking-[-0.04em] text-lider-graphite ">Налаштування</h2>
 <p className="text-lider-muted text-sm">Конфігурація проєкту</p>
 </div>
 <div className="bg-white rounded-[24px] border border-lider-line p-6 space-y-4">
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
 <label className="text-xs font-bold uppercase tracking-wider text-lider-muted block mb-1">{label}</label>
 <p className="text-sm font-mono text-neutral-700 ">{value}</p>
 </div>
 ))}
 </div>
 </div>
 );
}

// ─── Section: НАІС ДОКУМЕНТИ ──────────────────────────────────────────────────

function naisCopyText(r: NaisRecord): string {
 return [
 `ПІБ: ${r.fullName ?? "—"}`,
 `Дата народження: ${r.birthDate ?? "—"}`,
 `Паспорт: ${[r.passportSeries, r.passportNumber].filter(Boolean).join(" ") || "—"}`,
 `ІПН: ${r.taxId ?? "—"}`,
 `Адреса реєстрації: ${r.registrationAddress ?? "—"}`,
 `Медсправка №: ${r.medCertNumber ?? "—"}`,
 ].join("\n");
}

const DOC_LABELS: Record<string, string> = {
 passport: "Паспорт/ID", taxId: "Код (ІПН)", registration: "Прописка", medCert: "Медсправка",
};

function NaisSection() {
 const [records, setRecords] = useState<NaisRecord[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [search, setSearch] = useState("");
 const [copiedId, setCopiedId] = useState<string | null>(null);

 useEffect(() => {
 getNaisRecords(200).then(setRecords).catch(e => setError(e?.message ?? "Помилка")).finally(() => setLoading(false));
 }, []);

 const filtered = useMemo(() => {
 if (!search) return records;
 const q = search.toLowerCase();
 return records.filter(r => (r.fullName ?? "").toLowerCase().includes(q) || (r.taxId ?? "").includes(q) || r.id.includes(q));
 }, [records, search]);

 async function copy(r: NaisRecord) {
 try {
 await navigator.clipboard.writeText(naisCopyText(r));
 setCopiedId(r.id);
 setTimeout(() => setCopiedId(c => (c === r.id ? null : c)), 1500);
 } catch { /* clipboard blocked */ }
 }

 return (
 <div className="space-y-6">
 <div>
 <h2 className="text-3xl font-black tracking-[-0.04em] tracking-[-0.04em] text-lider-graphite ">Документи НАІС</h2>
 <p className="text-lider-muted text-sm">{filtered.length} з {records.length} · дані учнів для внесення в НАІС МВС · naisData</p>
 </div>

 <div className="relative max-w-sm">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lider-muted" />
 <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук по ПІБ, ІПН..."
 className="w-full pl-9 pr-4 py-2.5 bg-white border border-lider-line rounded-[16px] text-sm focus:outline-none focus:border-lider-red focus:ring-1 focus:ring-lider-red" />
 </div>

 {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : filtered.length === 0 ? (
 <EmptyBox label="Дані ще не заповнені учнями" icon={<FileText size={32} />} />
 ) : (
 <div className="grid gap-4 md:grid-cols-2">
 {filtered.map(r => (
 <div key={r.id} className="bg-white rounded-[24px] border border-lider-line p-5 space-y-3">
 <div className="flex items-center justify-between">
 <div className="min-w-0">
 <p className="font-black text-lider-graphite truncate">{r.fullName || "Без імені"}</p>
 <p className="text-xs text-lider-muted">оновлено {formatRelative(r.updatedAt)} · {r.id.slice(0, 8)}</p>
 </div>
 <button onClick={() => copy(r)}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-lider-red text-white rounded-lg font-bold text-xs hover:bg-red-700 shrink-0">
 <Copy size={13} /> {copiedId === r.id ? "Скопійовано!" : "Копіювати"}
 </button>
 </div>

 <pre className="text-xs font-mono whitespace-pre-wrap bg-lider-background rounded-[16px] p-3 text-neutral-700 leading-relaxed">{naisCopyText(r)}</pre>

 {r.documents.length > 0 ? (
 <div className="flex flex-wrap gap-2">
 {r.documents.map((d, i) => (
 d.downloadURL ? (
 <a key={i} href={d.downloadURL} target="_blank" rel="noopener noreferrer"
 className="flex items-center gap-1.5 px-2.5 py-1.5 bg-lider-line/30 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-200">
 <FileText size={12} /> {DOC_LABELS[d.kind] ?? d.kind}
 </a>
 ) : (
 <span key={i} className="px-2.5 py-1.5 bg-lider-line/30 rounded-lg text-xs text-lider-muted">{DOC_LABELS[d.kind] ?? d.kind}</span>
 )
 ))}
 </div>
 ) : (
 <p className="text-xs text-lider-muted italic">Фото документів ще не завантажені</p>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 );
}

// ─── Section: ІНСТРУКТОРИ ──────────────────────────────────────────────────────

function InstructorsSection() {
 const [items, setItems] = useState<InstructorAdmin[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [adding, setAdding] = useState(false);
 // new instructor form
 const [name, setName] = useState("");
 const [emoji, setEmoji] = useState("🧑‍🏫");
 const [desc, setDesc] = useState("");
 const [cats, setCats] = useState("B");
 const [branch, setBranch] = useState("kyiv");

 function reload() {
 setLoading(true);
 getInstructorsAdmin().then(setItems).catch(e => setError(e?.message ?? "Помилка")).finally(() => setLoading(false));
 }
 useEffect(reload, []);

 async function handleAdd() {
 if (!name.trim()) return;
 setAdding(true);
 try {
 await addInstructor({
 name: name.trim(), photoEmoji: emoji.trim() || "🧑‍🏫",
 description: desc.trim(),
 categories: cats.split(",").map(c => c.trim()).filter(Boolean),
 branchId: branch.trim(), active: true,
 });
 setName(""); setDesc(""); setCats("B");
 reload();
 } catch { alert("Не вдалось додати"); } finally { setAdding(false); }
 }

 async function handleDelete(id: string) {
 if (!confirm("Видалити інструктора?")) return;
 await deleteInstructor(id).catch(() => alert("Помилка"));
 setItems(prev => prev.filter(i => i.id !== id));
 }

 const inputCls = "px-3 py-2 bg-white border border-lider-line rounded-lg text-sm focus:outline-none focus:border-lider-red focus:ring-1 focus:ring-lider-red";

 return (
 <div className="space-y-6">
 <div>
 <h2 className="text-3xl font-black tracking-[-0.04em] tracking-[-0.04em] text-lider-graphite ">Інструктори</h2>
 <p className="text-lider-muted text-sm">{items.length} · керування інструкторами для запису на практику</p>
 </div>

 {/* Add form */}
 <div className="bg-white rounded-[24px] border border-lider-line p-4 space-y-3">
 <p className="text-sm font-bold text-neutral-700 ">Додати інструктора</p>
 <div className="grid gap-2 md:grid-cols-2">
 <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Ім'я та прізвище" />
 <input className={inputCls} value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="Емодзі (🧑‍🏫)" />
 <input className={inputCls} value={cats} onChange={e => setCats(e.target.value)} placeholder="Категорії через кому (B, C)" />
 <input className={inputCls} value={branch} onChange={e => setBranch(e.target.value)} placeholder="Філія (kyiv)" />
 </div>
 <textarea className={`${inputCls} w-full`} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Опис (досвід, авто, підхід)" rows={2} />
 <button onClick={handleAdd} disabled={adding || !name.trim()}
 className="flex items-center gap-1.5 px-4 py-2 bg-lider-red text-white rounded-lg font-bold text-sm hover:bg-red-700 disabled:opacity-50">
 <Plus size={14} /> {adding ? "Додавання…" : "Додати"}
 </button>
 </div>

 {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : items.length === 0 ? (
 <EmptyBox label="Інструкторів ще немає" icon={<GraduationCap size={32} />} />
 ) : (
 <div className="grid gap-3 md:grid-cols-2">
 {items.map(i => (
 <div key={i.id} className="bg-white rounded-[24px] border border-lider-line p-4 flex gap-3">
 <div className="w-11 h-11 rounded-full bg-red-100 /30 flex items-center justify-center text-xl shrink-0">{i.photoEmoji ?? "🧑‍🏫"}</div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <p className="font-bold text-lider-graphite ">{i.name}</p>
 {i.active === false ? <span className="text-xs text-lider-muted">(неактивний)</span> : null}
 </div>
 {i.description ? <p className="text-xs text-lider-muted mt-0.5 line-clamp-2">{i.description}</p> : null}
 <p className="text-xs text-lider-muted mt-1">Кат.: {i.categories?.join(", ") || "—"} · {i.branchId ?? "—"}</p>
 </div>
 <button onClick={() => handleDelete(i.id)} className="shrink-0 w-8 h-8 rounded-lg bg-[#fff1f1] /20 flex items-center justify-center text-lider-red hover:bg-red-100 self-start">
 <Trash2 size={14} />
 </button>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}

// ─── Section: ЗАПИСИ (bookings) ────────────────────────────────────────────────

function BookingsSection() {
 const [items, setItems] = useState<BookingAdmin[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 getBookings(200).then(setItems).catch(e => setError(e?.message ?? "Помилка")).finally(() => setLoading(false));
 }, []);

 async function setStatus(id: string, status: string) {
 await updateBookingStatus(id, status).catch(() => alert("Помилка"));
 setItems(prev => prev.map(b => (b.id === id ? { ...b, status } : b)));
 }

 function fmtDT(iso: string) {
 const d = new Date(iso);
 return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
 }
 const STATUS: Record<string, string> = { pending: "Очікує", confirmed: "Підтверджено", cancelled: "Скасовано", done: "Проведено" };

 return (
 <div className="space-y-6">
 <div>
 <h2 className="text-3xl font-black tracking-[-0.04em] tracking-[-0.04em] text-lider-graphite ">Записи на практику</h2>
 <p className="text-lider-muted text-sm">{items.length} · bookings</p>
 </div>
 {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : items.length === 0 ? (
 <EmptyBox label="Записів ще немає" icon={<Calendar size={32} />} />
 ) : (
 <div className="bg-white rounded-[24px] border border-lider-line overflow-hidden">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-lider-line ">
 {["Учень", "Інструктор", "Дата/час", "Статус", "Дії"].map(h => (
 <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-lider-muted">{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {items.map(b => (
 <tr key={b.id} className="border-b border-neutral-50 /50">
 <td className="px-4 py-3 font-bold text-lider-graphite ">{b.studentName}</td>
 <td className="px-4 py-3 text-lider-muted ">{b.instructorName}</td>
 <td className="px-4 py-3 text-lider-muted text-xs whitespace-nowrap">{fmtDT(b.startsAt)}</td>
 <td className="px-4 py-3">
 <span className={`px-2 py-1 rounded-lg text-xs font-bold ${b.status === "confirmed" ? "bg-[#e6f0ee] text-lider-green " : b.status === "cancelled" ? "bg-[#fff1f1] text-orange-700 " : "bg-lider-line/30 text-lider-muted"}`}>{STATUS[b.status] ?? b.status}</span>
 </td>
 <td className="px-4 py-2">
 <div className="flex gap-1.5">
 {b.status !== "confirmed" ? (
 <button onClick={() => setStatus(b.id, "confirmed")} className="px-2.5 py-1 bg-lider-green text-white rounded-lg text-xs font-bold hover:bg-green-700">Підтвердити</button>
 ) : null}
 {b.status !== "cancelled" ? (
 <button onClick={() => setStatus(b.id, "cancelled")} className="px-2.5 py-1 bg-neutral-200 text-lider-muted rounded-lg text-xs font-bold hover:bg-neutral-300">Скасувати</button>
 ) : null}
 </div>
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

// ─── Section: УРОКИ / ПДР ──────────────────────────────────────────────────────

function LessonsSection() {
 const [items, setItems] = useState<LessonAdmin[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [adding, setAdding] = useState(false);
 const [type, setType] = useState<"video" | "text">("video");
 const [title, setTitle] = useState("");
 const [desc, setDesc] = useState("");
 const [videoUrl, setVideoUrl] = useState("");
 const [body, setBody] = useState("");
 const [category, setCategory] = useState("");

 function reload() {
 setLoading(true);
 getLessonsAdmin().then(setItems).catch(e => setError(e?.message ?? "Помилка")).finally(() => setLoading(false));
 }
 useEffect(reload, []);

 async function handleAdd() {
 if (!title.trim()) return;
 setAdding(true);
 try {
 await addLesson({
 title: title.trim(), description: desc.trim(), type,
 videoUrl: type === "video" ? videoUrl.trim() : "",
 body: type === "text" ? body.trim() : "",
 category: category.trim(), order: items.length + 1, active: true,
 });
 setTitle(""); setDesc(""); setVideoUrl(""); setBody(""); setCategory("");
 reload();
 } catch { alert("Не вдалось додати"); } finally { setAdding(false); }
 }
 async function handleDelete(id: string) {
 if (!confirm("Видалити матеріал?")) return;
 await deleteLesson(id).catch(() => alert("Помилка"));
 setItems(prev => prev.filter(i => i.id !== id));
 }

 const inputCls = "px-3 py-2 bg-white border border-lider-line rounded-lg text-sm focus:outline-none focus:border-lider-red focus:ring-1 focus:ring-lider-red";

 return (
 <div className="space-y-6">
 <div>
 <h2 className="text-3xl font-black tracking-[-0.04em] tracking-[-0.04em] text-lider-graphite ">Уроки / ПДР</h2>
 <p className="text-lider-muted text-sm">{items.length} · відео-теорія та розділи ПДР для застосунку</p>
 </div>

 {/* Add form */}
 <div className="bg-white rounded-[24px] border border-lider-line p-4 space-y-3">
 <div className="flex gap-2">
 <button onClick={() => setType("video")} className={`px-3 py-1.5 rounded-lg text-sm font-bold ${type === "video" ? "bg-lider-red text-white" : "bg-lider-line/30 text-lider-muted"}`}>🎬 Відео</button>
 <button onClick={() => setType("text")} className={`px-3 py-1.5 rounded-lg text-sm font-bold ${type === "text" ? "bg-lider-red text-white" : "bg-lider-line/30 text-lider-muted"}`}>📖 ПДР текст</button>
 </div>
 <div className="grid gap-2 md:grid-cols-2">
 <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Назва" />
 <input className={inputCls} value={category} onChange={e => setCategory(e.target.value)} placeholder="Категорія (напр. Знаки)" />
 </div>
 <input className={`${inputCls} w-full`} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Короткий опис" />
 {type === "video" ? (
 <input className={`${inputCls} w-full`} value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Посилання на відео (YouTube)" />
 ) : (
 <textarea className={`${inputCls} w-full`} value={body} onChange={e => setBody(e.target.value)} placeholder="Текст розділу ПДР" rows={4} />
 )}
 <button onClick={handleAdd} disabled={adding || !title.trim()} className="flex items-center gap-1.5 px-4 py-2 bg-lider-red text-white rounded-lg font-bold text-sm hover:bg-red-700 disabled:opacity-50">
 <Plus size={14} /> {adding ? "Додавання…" : "Додати матеріал"}
 </button>
 </div>

 {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : items.length === 0 ? (
 <EmptyBox label="Матеріалів ще немає" icon={<BookOpen size={32} />} />
 ) : (
 <div className="space-y-2">
 {items.map(l => (
 <div key={l.id} className="bg-white rounded-[24px] border border-lider-line p-4 flex items-center gap-3">
 <span className="text-xl">{l.type === "video" ? "🎬" : "📖"}</span>
 <div className="flex-1 min-w-0">
 <p className="font-bold text-lider-graphite ">{l.title}</p>
 <p className="text-xs text-lider-muted truncate">{l.category ? `${l.category} · ` : ""}{l.type === "video" ? (l.videoUrl || "немає посилання") : (l.description || "текст")}</p>
 </div>
 <button onClick={() => handleDelete(l.id)} className="shrink-0 w-8 h-8 rounded-lg bg-[#fff1f1] /20 flex items-center justify-center text-lider-red hover:bg-red-100">
 <Trash2 size={14} />
 </button>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}

// ─── Section: СЕРВІСНІ ЦЕНТРИ МВС ───────────────────────────────────────────────

function ServiceCentersSection() {
 const [items, setItems] = useState<ServiceCenterAdmin[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [adding, setAdding] = useState(false);
 const [name, setName] = useState("Сервісний центр МВС");
 const [cityV, setCityV] = useState("");
 const [address, setAddress] = useState("");
 const [mapsQuery, setMapsQuery] = useState("");

 function reload() {
 setLoading(true);
 getServiceCentersAdmin().then(setItems).catch(e => setError(e?.message ?? "Помилка")).finally(() => setLoading(false));
 }
 useEffect(reload, []);

 async function handleAdd() {
 if (!name.trim() || !cityV.trim()) return;
 setAdding(true);
 try {
 await addServiceCenter({
 name: name.trim(), city: cityV.trim(), address: address.trim(),
 mapsQuery: (mapsQuery.trim() || `${name.trim()} ${address.trim()} ${cityV.trim()}`.trim()),
 order: items.length + 1, active: true,
 });
 setCityV(""); setAddress(""); setMapsQuery("");
 reload();
 } catch { alert("Не вдалось додати"); } finally { setAdding(false); }
 }
 async function handleDelete(id: string) {
 if (!confirm("Видалити центр?")) return;
 await deleteServiceCenter(id).catch(() => alert("Помилка"));
 setItems(prev => prev.filter(i => i.id !== id));
 }

 const inputCls = "px-3 py-2 bg-white border border-lider-line rounded-lg text-sm focus:outline-none focus:border-lider-red focus:ring-1 focus:ring-lider-red";

 return (
 <div className="space-y-6">
 <div>
 <h2 className="text-3xl font-black tracking-[-0.04em] tracking-[-0.04em] text-lider-graphite ">Сервісні центри МВС</h2>
 <p className="text-lider-muted text-sm">{items.length} · показуються в застосунку з маршрутом на карті</p>
 </div>
 <div className="bg-white rounded-[24px] border border-lider-line p-4 space-y-3">
 <p className="text-sm font-bold text-neutral-700 ">Додати центр</p>
 <div className="grid gap-2 md:grid-cols-2">
 <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Назва" />
 <input className={inputCls} value={cityV} onChange={e => setCityV(e.target.value)} placeholder="Місто" />
 <input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} placeholder="Адреса" />
 <input className={inputCls} value={mapsQuery} onChange={e => setMapsQuery(e.target.value)} placeholder="Запит для Google Maps (опц.)" />
 </div>
 <button onClick={handleAdd} disabled={adding || !name.trim() || !cityV.trim()} className="flex items-center gap-1.5 px-4 py-2 bg-lider-red text-white rounded-lg font-bold text-sm hover:bg-red-700 disabled:opacity-50">
 <Plus size={14} /> {adding ? "Додавання…" : "Додати"}
 </button>
 </div>
 {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : items.length === 0 ? (
 <EmptyBox label="Центрів ще немає" icon={<MapPin size={32} />} />
 ) : (
 <div className="space-y-2">
 {items.map(c => (
 <div key={c.id} className="bg-white rounded-[24px] border border-lider-line p-4 flex items-center gap-3">
 <span className="text-xl">🏛️</span>
 <div className="flex-1 min-w-0">
 <p className="font-bold text-lider-graphite ">{c.name}</p>
 <p className="text-xs text-lider-muted">{c.address ? `${c.address}, ` : ""}{c.city}</p>
 </div>
 <button onClick={() => handleDelete(c.id)} className="shrink-0 w-8 h-8 rounded-lg bg-[#fff1f1] /20 flex items-center justify-center text-lider-red hover:bg-red-100">
 <Trash2 size={14} />
 </button>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}

// ─── SIDEBAR NAV ──────────────────────────────────────────────────────────────

// ─── Section: ЧАТИ (АНАЛІЗ) ──────────────────────────────────────────────────

function ChatMonitorSection() {
 const [convs, setConvs] = useState<ConversationEntry[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [search, setSearch] = useState("");
 const [selectedId, setSelectedId] = useState<string | null>(null);
 const [messages, setMessages] = useState<ConversationMessage[]>([]);
 const [msgsLoading, setMsgsLoading] = useState(false);

 useEffect(() => {
 getConversationsAdmin()
 .then(setConvs)
 .catch(e => setError(e?.message ?? "Помилка завантаження"))
 .finally(() => setLoading(false));
 }, []);

 const filtered = useMemo(() => {
 if (!search.trim()) return convs;
 const q = search.toLowerCase();
 return convs.filter(c =>
 c.title.toLowerCase().includes(q) ||
 (c.createdByName ?? "").toLowerCase().includes(q)
 );
 }, [convs, search]);

 function selectConv(id: string) {
 setSelectedId(id);
 setMessages([]);
 setMsgsLoading(true);
 getConversationMessages(id)
 .then(setMessages)
 .catch(() => setMessages([]))
 .finally(() => setMsgsLoading(false));
 }

 function exportCsv() {
 const selected = convs.find(c => c.id === selectedId);
 if (!selected || messages.length === 0) return;
 type MsgRow = { conv: string; sender: string; text: string; time: string };
 const rows: MsgRow[] = messages.map(m => ({
 conv: selected.title,
 sender: m.senderName,
 text: m.text,
 time: m.createdAt ? m.createdAt.toLocaleString("uk-UA") : "—",
 }));
 exportCSV<MsgRow>(rows, `chat-${selected.id}`, ["conv", "sender", "text", "time"]);
 }

 function typePill(type: string) {
 if (type === "manager") return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 /40 text-blue-700 ">менеджер</span>;
 if (type === "instructor") return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 /40 text-lider-green ">інструктор</span>;
 return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-neutral-200 text-lider-muted ">підтримка</span>;
 }

 const selectedConv = convs.find(c => c.id === selectedId) ?? null;

 return (
 <div className="space-y-4">
 <div className="flex items-center justify-between flex-wrap gap-2">
 <div>
 <h2 className="text-3xl font-black tracking-[-0.04em] tracking-[-0.04em] text-lider-graphite ">Чати (аналіз)</h2>
 <p className="text-lider-muted text-sm">{convs.length} розмов · натисни на чат, щоб переглянути повідомлення</p>
 </div>
 {selectedId && (
 <button
 onClick={exportCsv}
 disabled={msgsLoading || messages.length === 0}
 className="flex items-center gap-1.5 px-4 py-2 bg-lider-graphite text-white rounded-lg font-bold text-sm hover:bg-neutral-700 disabled:opacity-40"
 >
 <Download size={14} /> Експорт CSV
 </button>
 )}
 </div>

 {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : (
 <div className="flex gap-4 min-h-[480px]">
 {/* Left: conversation list */}
 <div className="w-80 shrink-0 flex flex-col gap-2">
 <div className="relative">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lider-muted" />
 <input
 value={search}
 onChange={e => setSearch(e.target.value)}
 placeholder="Пошук за ім'ям…"
 className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-lider-line rounded-[16px] focus:outline-none focus:border-lider-red focus:ring-1 focus:ring-lider-red"
 />
 </div>
 {filtered.length === 0 ? (
 <EmptyBox label="Розмов не знайдено" icon={<MessageSquare size={28} />} />
 ) : (
 <div className="space-y-1 overflow-y-auto max-h-[600px] pr-1">
 {filtered.map(c => (
 <button
 key={c.id}
 onClick={() => selectConv(c.id)}
 className={`w-full text-left rounded-[16px] border px-3 py-2.5 transition-colors ${
 selectedId === c.id
 ? "bg-lider-red border-red-500 text-white"
 : "bg-white border-lider-line hover:bg-lider-background :bg-lider-graphite"
 }`}
 >
 <div className="flex items-center justify-between gap-2 mb-0.5">
 <span className={`font-bold text-sm truncate ${selectedId === c.id ? "text-white" : "text-lider-graphite "}`}>{c.title}</span>
 {typePill(c.type)}
 </div>
 {c.createdByName && (
 <p className={`text-xs truncate ${selectedId === c.id ? "text-red-200" : "text-lider-muted"}`}>👤 {c.createdByName}</p>
 )}
 {c.lastMessage && (
 <p className={`text-xs truncate mt-0.5 ${selectedId === c.id ? "text-red-100" : "text-lider-muted"}`}>{c.lastMessage}</p>
 )}
 <p className={`text-xs mt-0.5 ${selectedId === c.id ? "text-red-200" : "text-lider-muted"}`}>{formatRelative(c.updatedAt)}</p>
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Right: message thread */}
 <div className="flex-1 bg-white rounded-[24px] border border-lider-line flex flex-col overflow-hidden">
 {!selectedConv ? (
 <div className="flex-1 flex items-center justify-center text-lider-muted font-semibold">
 ← Вибери розмову
 </div>
 ) : (
 <>
 {/* Thread header */}
 <div className="px-5 py-3 border-b border-lider-line flex items-center gap-3">
 <div className="flex-1 min-w-0">
 <p className="font-black text-lider-graphite truncate">{selectedConv.title}</p>
 <div className="flex items-center gap-2 mt-0.5 flex-wrap">
 {typePill(selectedConv.type)}
 {selectedConv.createdByName && (
 <span className="text-xs text-lider-muted">👤 {selectedConv.createdByName}</span>
 )}
 {!msgsLoading && (
 <span className="text-xs text-lider-muted">{messages.length} повід.</span>
 )}
 </div>
 </div>
 </div>
 {/* Messages */}
 <div className="flex-1 overflow-y-auto p-4 space-y-2">
 {msgsLoading ? (
 <Spinner />
 ) : messages.length === 0 ? (
 <EmptyBox label="Повідомлень немає" icon={<MessageSquare size={28} />} />
 ) : (
 messages.map(m => {
 // heuristic: if senderId matches first participantId, treat as client (right/red)
 const isClient = selectedConv.participantIds[0] === m.senderId || selectedConv.participantIds.length === 0;
 return (
 <div key={m.id} className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
 <div className={`max-w-[72%] rounded-[24px] px-4 py-2.5 ${isClient ? "bg-lider-red text-white" : "bg-lider-line/30 text-lider-graphite "}`}>
 <p className={`text-xs font-bold mb-0.5 ${isClient ? "text-red-200" : "text-lider-muted"}`}>{m.senderName}</p>
 <p className="text-sm break-words">{m.text}</p>
 <p className={`text-xs mt-1 text-right ${isClient ? "text-red-200" : "text-lider-muted"}`}>{m.createdAt ? m.createdAt.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
 </div>
 </div>
 );
 })
 )}
 </div>
 </>
 )}
 </div>
 </div>
 )}
 </div>
 );
}

const NAV_ITEMS: { id: Section; label: string; Icon: LucideIcon }[] = [
 { id: "dashboard", label: "Дашборд", Icon: Gauge },
 { id: "leads", label: "Заявки", Icon: UsersRound },
 { id: "users", label: "Користувачі", Icon: Users },
 { id: "chat", label: "Чат / Підтримка", Icon: MessageSquare },
 { id: "chatmonitor", label: "💬 Чати (аналіз)", Icon: MessageSquare },
 { id: "posts", label: "Пости клубу", Icon: BarChart3 },
 { id: "stories", label: "Stories", Icon: CircleDollarSign },
 { id: "comments", label: "Коментарі", Icon: MessageSquare },
 { id: "nais", label: "Документи НАІС", Icon: FileText },
 { id: "instructors", label: "Інструктори", Icon: GraduationCap },
 { id: "bookings", label: "Записи", Icon: Calendar },
 { id: "lessons", label: "Уроки / ПДР", Icon: BookOpen },
 { id: "servicecenters", label: "Сервісні центри", Icon: MapPin },
 { id: "ailogs", label: "AI Логи", Icon: Bot },
 { id: "pdrquestions", label: "ПДР Питання", Icon: CheckCircle2 },
 { id: "notifications", label: "Повідомлення", Icon: Bell },
 { id: "settings", label: "Налаштування", Icon: Settings },
];

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export function CrmWorkspace() {
 const [section, setSection] = useState<Section>("dashboard");
 const [sidebarOpen, setSidebarOpen] = useState(true);

 return (
 <div className="min-h-screen bg-lider-background flex">
 {/* Sidebar */}
 <aside className={`${sidebarOpen ? "w-60" : "w-16"} shrink-0 bg-white border-r border-lider-line flex flex-col transition-all duration-200`}>
 <div className={`h-16 flex items-center ${sidebarOpen ? "px-5" : "justify-center"} border-b border-lider-line `}>
 {sidebarOpen ? (
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 bg-lider-red rounded-lg flex items-center justify-center">
 <span className="text-white font-black text-xs">Л</span>
 </div>
 <span className="font-black text-sm text-lider-graphite ">Адмін · Лідер</span>
 </div>
 ) : (
 <div className="w-7 h-7 bg-lider-red rounded-lg flex items-center justify-center">
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
 className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[16px] text-sm font-semibold transition-colors ${active ? "bg-lider-red text-white" : "text-lider-muted hover:bg-lider-line/30 :bg-lider-graphite"}`}
 >
 <Icon size={16} className="shrink-0" />
 {sidebarOpen ? <span className="flex-1 text-left">{label}</span> : null}
 </button>
 );
 })}
 </nav>

 <button
 onClick={() => setSidebarOpen(o => !o)}
 className="h-12 flex items-center justify-center border-t border-lider-line text-lider-muted hover:text-lider-muted text-sm"
 >
 {sidebarOpen ? "◀" : "▶"}
 </button>
 </aside>

 {/* Main */}
 <main className="flex-1 overflow-auto">
 <div className="h-16 border-b border-lider-line bg-white flex items-center justify-between px-6">
 <div className="flex items-center gap-2 text-sm text-lider-muted">
 <span>Автошкола Лідер</span>
 <ChevronRight size={14} />
 <span className="font-bold text-lider-graphite ">{NAV_ITEMS.find(n => n.id === section)?.label}</span>
 </div>
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-[16px] bg-lider-red flex items-center justify-center text-white font-black text-sm">А</div>
 </div>
 </div>

 <div className="p-6 max-w-7xl">
 {section === "dashboard" && <DashboardSection />}
 {section === "leads" && <LeadsSection />}
 {section === "users" && <UsersSection />}
 {section === "chat" && <ChatInboxSection />}
 {section === "chatmonitor" && <ChatMonitorSection />}
 {section === "posts" && <PostsSection />}
 {section === "stories" && <StoriesSection />}
 {section === "comments" && <CommentsSection />}
 {section === "nais" && <NaisSection />}
 {section === "instructors" && <InstructorsSection />}
 {section === "bookings" && <BookingsSection />}
 {section === "lessons" && <LessonsSection />}
 {section === "servicecenters" && <ServiceCentersSection />}
 {section === "ailogs" && <AiLogsSection />}
 {section === "pdrquestions" && <PDRQuestionsSection />}
 {section === "notifications" && <NotificationsSection />}
 {section === "settings" && <SettingsSection />}
 </div>
 </main>
 </div>
 );
}
