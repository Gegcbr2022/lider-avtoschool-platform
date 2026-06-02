"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, BrainCircuit, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { trackEvent } from "../lib/analytics";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type LeadDraft = {
  name: string;
  phone: string;
  telegram: string;
  city: string;
  category: "A" | "A1" | "B" | "C" | "CE";
  comment: string;
};

const starterMessages: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Вітаю! Я AI-помічник автошколи «Лідер». Запитайте про ціни, категорії, документи, філії, практику або ПДР."
  }
];

const quickPrompts = [
  "Скільки коштує категорія B?",
  "Які документи потрібні?",
  "Підібрати категорію прав",
  "Де найближча філія?"
];

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [leadMode, setLeadMode] = useState(false);
  const [leadStatus, setLeadStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [leadDraft, setLeadDraft] = useState<LeadDraft>({
    name: "",
    phone: "",
    telegram: "",
    city: "",
    category: "B",
    comment: ""
  });
  const unreadPulse = useMemo(() => !isOpen && messages.length === 1, [isOpen, messages.length]);

  useEffect(() => {
    function onOpenAiChat() {
      openChat("external");
    }

    window.addEventListener("lider-open-ai-chat", onOpenAiChat);
    return () => window.removeEventListener("lider-open-ai-chat", onOpenAiChat);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("lider-ai-chat-state", { detail: { open: isOpen } }));
  }, [isOpen]);

  function openChat(source: string) {
    setIsOpen(true);
    trackEvent("ai_chat_open", { source });
  }

  function closeChat() {
    setIsOpen(false);
  }

  async function submitMessage(event?: FormEvent<HTMLFormElement>, forcedPrompt?: string) {
    event?.preventDefault();
    const content = (forcedPrompt ?? input).trim();

    if (!content || isSending) {
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);
    trackEvent("ai_message_sent", { length: content.length });

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.slice(-10),
          intent: content.includes("категор") ? "category-picker" : undefined
        })
      });
      const payload = (await response.json()) as { answer?: string };

      if (!response.ok) {
        throw new Error(payload.answer ?? "AI request failed");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            payload.answer ??
            "Можу допомогти з навчанням, категоріями, документами, цінами, філіями та записом. Напишіть питання ще раз."
        }
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Зараз відповідаю у резервному режимі. Напишіть місто, категорію і телефон, менеджер уточнить старт навчання."
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLeadStatus("saving");

    const lead = {
      ...leadDraft,
      question: messages.filter((message) => message.role === "user").at(-1)?.content,
      source: "ai-chat"
    };

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.slice(-8),
            {
              role: "user",
              content: `Користувач залишив заявку: ${leadDraft.city}, категорія ${leadDraft.category}.`
            }
          ],
          lead,
          intent: "consultation"
        })
      });

      if (!response.ok) {
        setLeadStatus("error");
        return;
      }

      window.localStorage.setItem("lider-lead-submitted", "true");
      window.dispatchEvent(new CustomEvent("lider-lead-created"));
      trackEvent("ai_lead_created", { city: leadDraft.city, category: leadDraft.category });
      setLeadStatus("saved");
      setLeadMode(false);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Дякую, заявку передано менеджеру. Він зв'яжеться з вами та уточнить філію, графік і старт навчання."
        }
      ]);
    } catch {
      setLeadStatus("error");
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {isOpen ? (
          <motion.section
            className="w-[calc(100vw-2.5rem)] max-w-[410px] overflow-hidden rounded-[24px] border border-lider-line bg-white shadow-[0_28px_90px_rgba(0,0,0,0.22)]"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            aria-label="AI-помічник автошколи"
          >
            <header className="flex items-center justify-between gap-3 bg-lider-green px-4 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-lider-yellow text-lider-graphite">
                  <Bot size={22} />
                  <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-lider-green bg-[#42e785]" />
                </span>
                <div>
                  <p className="text-sm font-semibold">AI-помічник Лідер</p>
                  <p className="text-xs text-white/70">онлайн, відповідає за кілька секунд</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeChat}
                aria-label="Закрити AI-чат"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/12 transition hover:bg-white/20"
              >
                <X size={17} />
              </button>
            </header>

            <div className="max-h-[58vh] space-y-3 overflow-y-auto bg-[#f7fbf9] px-4 py-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[86%] rounded-[18px] px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-lider-green text-white"
                        : "border border-lider-line bg-white text-lider-graphite"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isSending ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-lider-line bg-white px-3 py-2 text-xs font-semibold text-lider-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Думаю над відповіддю
                </div>
              ) : null}
            </div>

            <div className="border-t border-lider-line bg-white p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => submitMessage(undefined, prompt)}
                    className="rounded-full bg-[#edf5f2] px-3 py-1.5 text-xs font-semibold text-lider-green transition hover:bg-[#dceee8]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <AnimatePresence initial={false}>
                {leadMode ? (
                  <motion.form
                    onSubmit={submitLead}
                    className="mb-3 grid gap-2 rounded-[18px] border border-lider-line bg-[#f9fcfa] p-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        required
                        value={leadDraft.name}
                        onChange={(event) => setLeadDraft((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Ім'я"
                        className="rounded-[12px] border border-lider-line px-3 py-2 text-sm outline-none focus:border-lider-green"
                      />
                      <input
                        required
                        value={leadDraft.phone}
                        onChange={(event) => setLeadDraft((current) => ({ ...current, phone: event.target.value }))}
                        placeholder="Телефон"
                        className="rounded-[12px] border border-lider-line px-3 py-2 text-sm outline-none focus:border-lider-green"
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        value={leadDraft.telegram}
                        onChange={(event) => setLeadDraft((current) => ({ ...current, telegram: event.target.value }))}
                        placeholder="Telegram"
                        className="rounded-[12px] border border-lider-line px-3 py-2 text-sm outline-none focus:border-lider-green"
                      />
                      <input
                        required
                        value={leadDraft.city}
                        onChange={(event) => setLeadDraft((current) => ({ ...current, city: event.target.value }))}
                        placeholder="Місто"
                        className="rounded-[12px] border border-lider-line px-3 py-2 text-sm outline-none focus:border-lider-green"
                      />
                    </div>
                    <select
                      value={leadDraft.category}
                      onChange={(event) =>
                        setLeadDraft((current) => ({
                          ...current,
                          category: event.target.value as LeadDraft["category"]
                        }))
                      }
                      className="rounded-[12px] border border-lider-line px-3 py-2 text-sm outline-none focus:border-lider-green"
                    >
                      {["A", "A1", "B", "C", "CE"].map((category) => (
                        <option key={category} value={category}>
                          Категорія {category}
                        </option>
                      ))}
                    </select>
                    <input
                      value={leadDraft.comment}
                      onChange={(event) => setLeadDraft((current) => ({ ...current, comment: event.target.value }))}
                      placeholder="Коментар або зручний час"
                      className="rounded-[12px] border border-lider-line px-3 py-2 text-sm outline-none focus:border-lider-green"
                    />
                    <button
                      type="submit"
                      disabled={leadStatus === "saving"}
                      className="rounded-[12px] bg-lider-yellow px-4 py-2.5 text-sm font-semibold text-lider-graphite transition hover:bg-[#ffdf33]"
                    >
                      {leadStatus === "saving" ? "Передаємо..." : "Передати менеджеру"}
                    </button>
                    {leadStatus === "saved" ? (
                      <p className="text-xs font-semibold text-[#14733d]">Заявку прийнято.</p>
                    ) : null}
                    {leadStatus === "error" ? (
                      <p className="text-xs font-semibold text-red-600">Не вдалося передати заявку.</p>
                    ) : null}
                  </motion.form>
                ) : null}
              </AnimatePresence>

              <form onSubmit={submitMessage} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLeadMode((current) => !current)}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#edf5f2] text-lider-green transition hover:bg-[#dceee8]"
                  aria-label="Залишити заявку"
                >
                  <BrainCircuit size={19} />
                </button>
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Напишіть питання..."
                  maxLength={1000}
                  className="min-w-0 flex-1 rounded-[14px] border border-lider-line px-4 py-3 text-sm outline-none focus:border-lider-green"
                />
                <button
                  type="submit"
                  disabled={isSending}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-lider-green text-white transition hover:bg-[#063f36]"
                  aria-label="Надіслати питання"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => (isOpen ? closeChat() : openChat("floating-button"))}
        className={`ai-chat-launcher group relative inline-flex h-16 w-16 items-center justify-center rounded-[22px] bg-lider-green text-white shadow-[0_16px_45px_rgba(0,77,64,0.32)] transition hover:-translate-y-1 hover:bg-[#063f36] ${
          unreadPulse ? "animate-bounce" : ""
        }`}
        aria-label="Відкрити AI-помічника"
      >
        <span className="absolute inset-0 rounded-[22px] bg-lider-yellow/30 blur-xl transition group-hover:bg-lider-yellow/45" />
        <MessageCircle className="relative" size={28} />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-lider-yellow text-[10px] font-black text-lider-graphite">
          AI
        </span>
        <span className="absolute -bottom-1 -left-1 h-4 w-4 rounded-full border-2 border-white bg-[#42e785]" />
        <Sparkles className="absolute -left-2 -top-2 h-4 w-4 text-lider-yellow" />
      </button>
    </div>
  );
}
