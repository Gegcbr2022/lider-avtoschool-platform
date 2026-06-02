import cors from "cors";
import express from "express";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import {
  bookingRequestSchema,
  branches,
  createLeadSchema,
  paymentIntentSchema,
  sampleKpiSnapshot
} from "../../../packages/shared/src/index";
import {
  aiChatSchema,
  aiConsultationSchema,
  aiLeadPayloadSchema,
  answerAiChat,
  answerStudentQuestion
} from "./ai-providers";
import { paymentProviders } from "./payment-providers";

const firebaseApp = getApps().length ? getApps()[0] : initializeApp();
const db = getFirestore(firebaseApp);
const app = express();
const requestCounts = new Map<string, { count: number; resetAt: number }>();

app.use(
  cors({
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    }
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(rateLimit);

app.get("/health", (_request, response) => {
  response.json({
    ok: true,
    service: "lider-api",
    timestamp: new Date().toISOString()
  });
});

app.post("/leads", async (request, response) => {
  const parsed = createLeadSchema.safeParse(enrichLeadPayload(request));

  if (!parsed.success) {
    response.status(422).json({ error: "Invalid lead payload", issues: parsed.error.flatten() });
    return;
  }

  const createdAt = parsed.data.createdAt ?? new Date().toISOString();
  const lead = {
    ...parsed.data,
    status: parsed.data.status ?? "new",
    source: parsed.data.source ?? "website",
    preferredContactMethod: parsed.data.preferredContactMethod ?? parsed.data.contactMethod,
    createdAt,
    updatedAt: parsed.data.updatedAt ?? createdAt
  };

  const persistence = await persist("leads", lead);
  await persist("auditLogs", {
    entityType: "lead",
    entityId: persistence.id,
    action: "created",
    actor: "public-form",
    source: lead.source,
    createdAt
  }).catch((error: unknown) => {
    console.error("Lead audit log failed", error);
  });
  await sendLeadToTelegram(lead, persistence.id).catch((error: unknown) => {
    // Telegram logging is optional and must not break lead intake.
    console.error("Telegram lead logging failed", error);
  });
  response.status(201).json({ id: persistence.id, persistence: persistence.mode, lead });
});

app.get("/kpi/summary", async (_request, response) => {
  try {
    const snapshot = await buildKpiSnapshot();
    response.json({ mode: "firestore", snapshot });
  } catch (error) {
    console.error("KPI summary fallback used", error);
    response.json({ mode: "sample", snapshot: sampleKpiSnapshot });
  }
});

app.post("/bookings", async (request, response) => {
  const parsed = bookingRequestSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(422).json({ error: "Invalid booking payload", issues: parsed.error.flatten() });
    return;
  }

  const booking = {
    ...parsed.data,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  const persistence = await persist("bookings", booking);
  response.status(201).json({ id: persistence.id, persistence: persistence.mode, booking });
});

app.post("/payments/create-intent", async (request, response) => {
  const parsed = paymentIntentSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(422).json({ error: "Invalid payment payload", issues: parsed.error.flatten() });
    return;
  }

  try {
    const provider = paymentProviders[parsed.data.provider];
    const intent = await provider.createIntent(parsed.data);
    const persistence = await persist("paymentIntents", {
      ...parsed.data,
      ...intent,
      status: "pending",
      createdAt: new Date().toISOString()
    });

    response.status(201).json({ id: persistence.id, persistence: persistence.mode, intent });
  } catch (error) {
    response.status(501).json({
      error: "Payment provider is not configured",
      message: error instanceof Error ? error.message : "Unknown provider error"
    });
  }
});

app.post("/telegram/webhook", async (request, response) => {
  if (!isValidTelegramWebhook(request)) {
    response.status(401).json({ error: "Invalid Telegram webhook secret" });
    return;
  }

  const payload = {
    body: request.body,
    receivedAt: new Date().toISOString()
  };
  const persistence = await persist("telegramEvents", payload);
  response.json({ ok: true, persistence: persistence.mode, id: persistence.id });
});

app.post("/ai/consult", async (request, response) => {
  const parsed = aiConsultationSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(422).json({ error: "Invalid AI payload", issues: parsed.error.flatten() });
    return;
  }

  response.json(await answerStudentQuestion(parsed.data));
});

app.post("/ai/chat", async (request, response) => {
  const parsed = aiChatSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(422).json({ error: "Invalid AI chat payload", issues: parsed.error.flatten() });
    return;
  }

  const result = await answerAiChat(parsed.data);
  response.json(result);
});

app.post("/ai/leads", async (request, response) => {
  const parsed = aiLeadPayloadSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(422).json({ error: "Invalid AI lead payload", issues: parsed.error.flatten() });
    return;
  }

  const leadPayload = createLeadFromAiPayload(parsed.data, request);
  const validatedLead = createLeadSchema.safeParse(leadPayload);

  if (!validatedLead.success) {
    response.status(422).json({ error: "Invalid normalized AI lead payload", issues: validatedLead.error.flatten() });
    return;
  }

  const lead = {
    ...validatedLead.data,
    source: "ai-chat",
    preferredContactMethod: validatedLead.data.preferredContactMethod ?? validatedLead.data.contactMethod
  };
  const persistence = await persist("leads", lead);
  await persist("auditLogs", {
    entityType: "lead",
    entityId: persistence.id,
    action: "created",
    actor: "ai-chat",
    source: lead.source,
    createdAt: lead.createdAt
  }).catch((error: unknown) => {
    console.error("AI lead audit log failed", error);
  });

  await sendLeadToTelegram(lead, persistence.id).catch((error: unknown) => {
    console.error("Telegram AI lead logging failed", error);
  });

  response.status(201).json({ id: persistence.id, persistence: persistence.mode, lead });
});

async function persist(collection: string, payload: Record<string, unknown>) {
  try {
    const reference = await db.collection(collection).add(payload);
    return { id: reference.id, mode: "firestore" as const };
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    return { id: `local-${Date.now()}`, mode: "local-dev-fallback" as const };
  }
}

function enrichLeadPayload(request: express.Request) {
  const payload = typeof request.body === "object" && request.body !== null ? request.body : {};
  const rawIp = request.ip ?? request.header("x-forwarded-for")?.split(",")[0]?.trim();

  return {
    ...payload,
    userAgent: payload.userAgent ?? request.header("user-agent"),
    ipHash: payload.ipHash ?? hashIp(rawIp),
    source: payload.source ?? "website",
    preferredContactMethod: payload.preferredContactMethod ?? payload.contactMethod,
    updatedAt: payload.updatedAt ?? new Date().toISOString()
  };
}

const leadCategories = ["A", "A1", "B", "C", "CE"] as const;

function createLeadFromAiPayload(payload: Record<string, unknown>, request: express.Request) {
  const city = normalizeText(payload.city) || "Київ";
  const phone = normalizeText(payload.phone) || normalizeText(payload.telegram);
  const createdAt = normalizeDate(payload.createdAt);
  const contactMethod = normalizeText(payload.telegram) ? "telegram" : "phone";
  const rawIp = request.ip ?? request.header("x-forwarded-for")?.split(",")[0]?.trim();

  return {
    name: normalizeText(payload.name) || "AI chat lead",
    phone,
    city,
    category: normalizeCategory(payload.category),
    branchId: inferBranchId(city),
    requestType: "consultation",
    contactMethod,
    preferredContactMethod: contactMethod,
    message: [normalizeText(payload.comment), normalizeText(payload.question)].filter(Boolean).join("\n"),
    source: "ai-chat",
    consentAccepted: payload.consentAccepted === true,
    status: "new",
    language: inferLanguage(request),
    page: "/ai-chat",
    createdAt,
    updatedAt: createdAt,
    ipHash: hashIp(rawIp),
    userAgent: request.header("user-agent")
  };
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCategory(value: unknown) {
  return leadCategories.includes(value as (typeof leadCategories)[number])
    ? (value as (typeof leadCategories)[number])
    : "B";
}

function normalizeDate(value: unknown) {
  const text = normalizeText(value);

  if (text && !Number.isNaN(Date.parse(text))) {
    return new Date(text).toISOString();
  }

  return new Date().toISOString();
}

function inferBranchId(city: string) {
  const normalizedCity = city.toLowerCase();
  const branch = branches.find((item) => item.city.toLowerCase().includes(normalizedCity));

  return branch?.id ?? branches[0]?.id ?? "kyiv";
}

function inferLanguage(request: express.Request) {
  const header = request.header("accept-language")?.toLowerCase() ?? "";

  if (header.startsWith("ru")) {
    return "ru";
  }

  if (header.startsWith("en")) {
    return "en";
  }

  return "uk";
}

async function buildKpiSnapshot() {
  const [leadsSnapshot, studentsSnapshot] = await Promise.all([
    db.collection("leads").limit(1000).get(),
    db.collection("students").limit(1000).get()
  ]);
  const leads = leadsSnapshot.docs.map((document) => document.data());
  const students = studentsSnapshot.docs.map((document) => document.data());
  const leadsBySource: Record<string, number> = {};
  const leadsByCity: Record<string, number> = {};
  const popularCategories = { A: 0, A1: 0, B: 0, C: 0, CE: 0 };

  for (const lead of leads) {
    const source = String(lead.source ?? "website");
    const city = String(lead.city ?? "-");
    const category = String(lead.category ?? "B") as keyof typeof popularCategories;

    leadsBySource[source] = (leadsBySource[source] ?? 0) + 1;
    leadsByCity[city] = (leadsByCity[city] ?? 0) + 1;

    if (category in popularCategories) {
      popularCategories[category] += 1;
    }
  }

  return {
    totalLeads: leads.length,
    leadsBySource,
    leadToStudentConversion: leads.length ? Math.round((students.length / leads.length) * 100) : 0,
    studentToLicenseConversion: students.length
      ? Math.round((students.filter((student) => student.examStatus === "passed").length / students.length) * 100)
      : 0,
    popularCategories,
    leadsByCity,
    telegramLeads: leads.filter((lead) => lead.source === "telegram").length,
    popupLeads: leads.filter((lead) => lead.source === "popup").length,
    formLeads: leads.filter((lead) => lead.source === "website").length,
    referralLeads: leads.filter((lead) => Boolean(lead.referralCode)).length
  };
}

function hashIp(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return `ip_${Math.abs(hash).toString(36)}`;
}

function rateLimit(request: express.Request, response: express.Response, next: express.NextFunction) {
  const key = request.ip ?? "unknown";
  const now = Date.now();
  const current = requestCounts.get(key);

  if (!current || current.resetAt < now) {
    requestCounts.set(key, { count: 1, resetAt: now + 60_000 });
    next();
    return;
  }

  if (current.count >= 120) {
    response.status(429).json({ error: "Rate limit exceeded" });
    return;
  }

  current.count += 1;
  next();
}

function isAllowedOrigin(origin: string | undefined) {
  if (!origin) {
    return true;
  }

  const configuredOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.ADMIN_SITE_URL,
    ...(process.env.ALLOWED_ORIGINS ?? "").split(",")
  ]
    .filter(Boolean)
    .map((value) => value!.trim().replace(/\/$/, ""));

  if (configuredOrigins.includes(origin.replace(/\/$/, ""))) {
    return true;
  }

  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function isValidTelegramWebhook(request: express.Request) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!expectedSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.header("x-telegram-bot-api-secret-token") === expectedSecret;
}

async function sendLeadToTelegram(lead: Record<string, unknown>, leadId: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_LOG_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn("Telegram lead logging skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_LOG_CHAT_ID is missing");
    return;
  }

  const message = [
    "🚘 Нова заявка",
    `ID: ${leadId}`,
    `Ім'я: ${String(lead.name ?? "-")}`,
    `Телефон: ${String(lead.phone ?? "-")}`,
    `Місто: ${String(lead.city ?? "-")}`,
    `Категорія: ${String(lead.category ?? "-")}`,
    `Філія: ${String(lead.branchId ?? "-")}`,
    `Джерело: ${String(lead.source ?? "-")}`,
    `Коментар: ${String(lead.message ?? "-")}`,
    `Створено: ${String(lead.createdAt ?? "-")}`
  ].join("\n");

  const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const result = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      disable_web_page_preview: true
    })
  });

  if (!result.ok) {
    const body = await result.text();
    throw new Error(`Telegram sendMessage failed with ${result.status}: ${body}`);
  }
}

export const api = onRequest(
  {
    region: "europe-west1",
    maxInstances: 10
  },
  app
);
