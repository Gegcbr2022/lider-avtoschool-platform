"use client";

import {
  branches,
  leadStatusLabels,
  leadStatuses,
  sampleKpiSnapshot,
  sampleLeads,
  samplePayments,
  sampleSlots,
  sampleStudents
} from "@lider/shared";
import { StatusPill } from "@lider/ui";
import type { Lead, LeadSource, LeadStatus } from "@lider/types";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Copy,
  Download,
  Gauge,
  Search,
  Send,
  UsersRound,
  type LucideIcon
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

function exportLeadsCSV(leads: Lead[]) {
  const header = ["ID", "Ім'я", "Телефон", "Місто", "Категорія", "Статус", "Джерело", "Менеджер", "Referral", "UTM Source", "Дата"];
  const rows = leads.map((lead) => [
    lead.id,
    lead.name,
    lead.phone,
    lead.city,
    lead.category,
    lead.status,
    lead.source,
    lead.manager ?? "",
    lead.referralCode ?? "",
    lead.utmSource ?? "",
    lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("uk-UA") : ""
  ]);
  const csvContent = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const stages: LeadStatus[] = leadStatuses.filter((stage) => stage !== "spam");
const allCities = Array.from(new Set(sampleLeads.map((l) => l.city))).sort();
const allSources = Array.from(new Set(sampleLeads.map((l) => l.source))).sort();

export function CrmWorkspace() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "all">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLeads = useMemo(() => {
    return sampleLeads.filter((lead) => {
      const matchesStatus = status === "all" || lead.status === status;
      const matchesCity = cityFilter === "all" || lead.city === cityFilter;
      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
      const text = `${lead.name} ${lead.phone} ${lead.city} ${lead.manager ?? ""} ${lead.source} ${lead.referralCode ?? ""}`.toLowerCase();
      return matchesStatus && matchesCity && matchesSource && text.includes(query.toLowerCase());
    });
  }, [query, status, cityFilter, sourceFilter]);

  function copyPhone(lead: Lead) {
    void navigator.clipboard.writeText(lead.phone);
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  const activeStudents = sampleStudents.filter((student) => student.status === "active").length;
  const verifiedDocuments = sampleStudents.filter((student) => student.documentsStatus === "verified").length;

  return (
    <div className="min-h-screen bg-[#eef6f3]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#dce7e3] bg-[#00362d] px-4 py-5 text-white lg:block">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Автошкола Лідер" width={82} height={35} className="shrink-0" />
          <div>
            <p className="font-semibold">CRM Лідер</p>
            <p className="text-xs text-white/60">production workspace</p>
          </div>
        </div>
        <nav className="mt-8 space-y-1 text-sm">
          {["Dashboard", "Leads", "Students", "Bookings", "Payments", "LMS", "Documents", "Settings"].map(
            (item, index) => (
              <button
                key={item}
                className={`w-full rounded-[10px] px-3 py-2 text-left font-medium transition ${
                  index === 0 ? "bg-white text-[#00362d]" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item}
              </button>
            )
          )}
        </nav>
      </aside>

      <main className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-[#dce7e3] bg-[#f7fbf9]/90 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#171b1a]">Операційний центр</h1>
              <p className="text-sm text-[#5f6f6a]">Ліди, клієнти, практика, платежі, LMS і задачі менеджерів.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f6f6a]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Пошук клієнта, телефону, міста"
                  className="w-full rounded-[12px] border border-[#dce7e3] bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#004d40] sm:w-80"
                />
              </div>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="rounded-[12px] border border-[#dce7e3] bg-white py-2.5 pl-3 pr-8 text-sm outline-none focus:border-[#004d40]"
              >
                <option value="all">Всі міста</option>
                {allCities.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as LeadSource | "all")}
                className="rounded-[12px] border border-[#dce7e3] bg-white py-2.5 pl-3 pr-8 text-sm outline-none focus:border-[#004d40]"
              >
                <option value="all">Всі джерела</option>
                {allSources.map((src) => <option key={src} value={src}>{src}</option>)}
              </select>
              <button
                onClick={() => exportLeadsCSV(filteredLeads)}
                className="inline-flex items-center gap-2 rounded-[12px] border border-[#dce7e3] bg-white px-4 py-2.5 text-sm font-semibold text-[#171b1a] transition hover:border-[#004d40]"
              >
                <Download className="h-4 w-4" aria-hidden />
                CSV
              </button>
              <button className="rounded-[12px] bg-[#ffd600] px-4 py-2.5 text-sm font-semibold text-[#171b1a]">
                Створити заявку
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-6 px-5 py-6 lg:px-8">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardMetric icon={UsersRound} label="Активні ліди" value={String(sampleKpiSnapshot.totalLeads)} detail={`${sampleKpiSnapshot.referralLeads} з рефералкою`} />
            <DashboardMetric icon={Gauge} label="Конверсія" value={`${sampleKpiSnapshot.leadToStudentConversion}%`} detail="лід → учень" />
            <DashboardMetric icon={CircleDollarSign} label="Оплати" value="184k грн" detail="LiqPay, Fondy, Mono" />
            <DashboardMetric icon={CheckCircle2} label="Учні" value={String(activeStudents)} detail={`${verifiedDocuments} з перевіреними документами`} />
          </section>

          <section className="rounded-[18px] border border-[#dce7e3] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <FilterButton active={status === "all"} onClick={() => setStatus("all")}>
                Усі
              </FilterButton>
              {stages.map((stage) => (
                <FilterButton key={stage} active={status === stage} onClick={() => setStatus(stage)}>
                  {leadStatusLabels[stage]}
                </FilterButton>
              ))}
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1040px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#dce7e3] text-left text-xs uppercase tracking-[0.08em] text-[#5f6f6a]">
                    <th className="py-3 pr-4">Клієнт</th>
                    <th className="py-3 pr-4">Місто</th>
                    <th className="py-3 pr-4">Категорія</th>
                    <th className="py-3 pr-4">Статус</th>
                    <th className="py-3 pr-4">Джерело</th>
                    <th className="py-3 pr-4">Referral / UTM</th>
                    <th className="py-3 pr-4">Менеджер</th>
                    <th className="py-3 pr-4">Наступна дія</th>
                    <th className="py-3">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-sm text-[#5f6f6a]">
                        За вибраними фільтрами лідів не знайдено.
                      </td>
                    </tr>
                  ) : null}
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-[#edf5f2] last:border-0">
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-[#171b1a]">{lead.name}</p>
                        <p className="text-xs text-[#5f6f6a]">{lead.phone}</p>
                        <p className="text-xs text-[#5f6f6a]">{lead.id}</p>
                      </td>
                      <td className="py-4 pr-4">{lead.city}</td>
                      <td className="py-4 pr-4 font-semibold">{lead.category}</td>
                      <td className="py-4 pr-4">
                        <StatusPill
                          tone={lead.status === "passed" || lead.status === "enrolled" ? "success" : lead.status === "new" ? "warning" : "neutral"}
                        >
                          {leadStatusLabels[lead.status]}
                        </StatusPill>
                      </td>
                      <td className="py-4 pr-4">{lead.source}</td>
                      <td className="py-4 pr-4">
                        <p className="font-semibold">{lead.referralCode ?? lead.utmSource ?? "-"}</p>
                        <p className="text-xs text-[#5f6f6a]">{lead.telegramStartParam ? `TG: ${lead.telegramStartParam}` : lead.page ?? "-"}</p>
                      </td>
                      <td className="py-4 pr-4">{lead.manager ?? "-"}</td>
                      <td className="py-4 pr-4 text-xs text-[#5f6f6a]">{lead.nextAction ?? "-"}</td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyPhone(lead)}
                            title="Скопіювати номер"
                            className="rounded-[8px] border border-[#dce7e3] p-2 transition hover:border-[#004d40]"
                          >
                            {copiedId === lead.id ? <CheckCircle2 className="h-4 w-4 text-[#004d40]" /> : <Copy className="h-4 w-4 text-[#5f6f6a]" />}
                          </button>
                          {lead.preferredContactMethod === "telegram" && (
                            <a
                              href={`https://t.me/${lead.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Написати в Telegram"
                              className="rounded-[8px] border border-[#dce7e3] p-2 transition hover:border-[#229ED9]"
                            >
                              <Send className="h-4 w-4 text-[#229ED9]" />
                            </a>
                          )}
                          <a
                            href={`tel:${lead.phone.replace(/\s+/g, "")}`}
                            title="Зателефонувати"
                            className="rounded-[8px] border border-[#dce7e3] p-2 transition hover:border-[#004d40]"
                          >
                            <span className="text-xs font-black text-[#004d40]">☎</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
            <div className="rounded-[18px] border border-[#dce7e3] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-semibold text-[#171b1a]">Практика та інструктори</h2>
                <CalendarDays className="h-5 w-5 text-[#004d40]" />
              </div>
              <div className="mt-5 grid gap-3">
                {sampleSlots.map((slot) => {
                  const branch = branches.find((item) => item.id === slot.branchId);
                  return (
                    <div
                      key={slot.id}
                      className="grid gap-3 rounded-[14px] border border-[#dce7e3] p-4 md:grid-cols-[1fr_auto] md:items-center"
                    >
                      <div>
                        <p className="font-semibold text-[#171b1a]">{slot.instructor}</p>
                        <p className="text-sm text-[#5f6f6a]">
                          {branch?.city} · {slot.vehicle} · {new Date(slot.startsAt).toLocaleString("uk-UA")}
                        </p>
                      </div>
                      <StatusPill tone={slot.availableSeats > 1 ? "success" : "warning"}>
                        {slot.availableSeats} місця
                      </StatusPill>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[18px] border border-[#dce7e3] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-semibold text-[#171b1a]">Платежі та сповіщення</h2>
                <Bell className="h-5 w-5 text-[#004d40]" />
              </div>
              <div className="mt-5 space-y-3">
                {samplePayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between gap-4 rounded-[14px] border border-[#dce7e3] p-4"
                  >
                    <div>
                      <p className="font-semibold text-[#171b1a]">{payment.studentName}</p>
                      <p className="text-sm text-[#5f6f6a]">
                        {payment.provider} · {payment.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#171b1a]">{payment.amount.toLocaleString("uk-UA")} грн</p>
                      <StatusPill tone={payment.status === "paid" ? "success" : "warning"}>{payment.status}</StatusPill>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function DashboardMetric({
  icon: Icon,
  label,
  value,
  detail
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-[18px] border border-[#dce7e3] bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-[#004d40]" />
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#5f6f6a]">{label}</p>
      <strong className="mt-2 block text-2xl text-[#171b1a]">{value}</strong>
      <span className="mt-1 block text-sm text-[#5f6f6a]">{detail}</span>
    </article>
  );
}

function FilterButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
        active ? "bg-[#004d40] text-white" : "bg-[#edf5f2] text-[#004d40] hover:bg-[#dcebe6]"
      }`}
    >
      {children}
    </button>
  );
}
