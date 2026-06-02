"use client";

import { branches, sampleLeads, samplePayments, sampleSlots } from "@lider/shared";
import { StatusPill } from "@lider/ui";
import type { LeadStatus } from "@lider/types";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  Search,
  UsersRound,
  type LucideIcon
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

const stages: LeadStatus[] = ["new", "contacted", "consultation", "contract", "paid", "learning", "completed"];

const stageLabels: Record<LeadStatus, string> = {
  new: "Нові",
  contacted: "Контакт",
  consultation: "Консультація",
  contract: "Договір",
  paid: "Оплата",
  learning: "Навчання",
  completed: "Завершено"
};

export function CrmWorkspace() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LeadStatus | "all">("all");

  const filteredLeads = useMemo(() => {
    return sampleLeads.filter((lead) => {
      const matchesStatus = status === "all" || lead.status === status;
      const text = `${lead.name} ${lead.phone} ${lead.city} ${lead.manager}`.toLowerCase();
      return matchesStatus && text.includes(query.toLowerCase());
    });
  }, [query, status]);

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
              <button className="rounded-[12px] bg-[#ffd600] px-4 py-2.5 text-sm font-semibold text-[#171b1a]">
                Створити заявку
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-6 px-5 py-6 lg:px-8">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardMetric icon={UsersRound} label="Активні ліди" value="128" detail="+14 за тиждень" />
            <DashboardMetric icon={Gauge} label="Конверсія" value="34%" detail="з заявки в оплату" />
            <DashboardMetric icon={CircleDollarSign} label="Оплати" value="184k грн" detail="LiqPay, Fondy, Mono" />
            <DashboardMetric icon={CheckCircle2} label="Завершення LMS" value="76%" detail="середній прогрес" />
          </section>

          <section className="rounded-[18px] border border-[#dce7e3] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <FilterButton active={status === "all"} onClick={() => setStatus("all")}>
                Усі
              </FilterButton>
              {stages.map((stage) => (
                <FilterButton key={stage} active={status === stage} onClick={() => setStatus(stage)}>
                  {stageLabels[stage]}
                </FilterButton>
              ))}
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#dce7e3] text-left text-xs uppercase tracking-[0.08em] text-[#5f6f6a]">
                    <th className="py-3 pr-4">Клієнт</th>
                    <th className="py-3 pr-4">Місто</th>
                    <th className="py-3 pr-4">Категорія</th>
                    <th className="py-3 pr-4">Статус</th>
                    <th className="py-3 pr-4">Джерело</th>
                    <th className="py-3 pr-4">Менеджер</th>
                    <th className="py-3">Наступна дія</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-[#edf5f2] last:border-0">
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-[#171b1a]">{lead.name}</p>
                        <p className="text-xs text-[#5f6f6a]">{lead.phone}</p>
                      </td>
                      <td className="py-4 pr-4">{lead.city}</td>
                      <td className="py-4 pr-4 font-semibold">{lead.category}</td>
                      <td className="py-4 pr-4">
                        <StatusPill
                          tone={lead.status === "paid" ? "success" : lead.status === "new" ? "warning" : "neutral"}
                        >
                          {stageLabels[lead.status]}
                        </StatusPill>
                      </td>
                      <td className="py-4 pr-4">{lead.source}</td>
                      <td className="py-4 pr-4">{lead.manager}</td>
                      <td className="py-4">{lead.nextAction}</td>
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
