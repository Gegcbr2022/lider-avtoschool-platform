import cors from "cors";
import express from "express";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { bookingRequestSchema, leadFormSchema, paymentIntentSchema } from "../../../packages/shared/src/index";
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
  const parsed = leadFormSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(422).json({ error: "Invalid lead payload", issues: parsed.error.flatten() });
    return;
  }

  const lead = {
    ...parsed.data,
    status: "new",
    source: "website",
    createdAt: new Date().toISOString()
  };

  const persistence = await persist("leads", lead);
  await sendLeadToTelegram(lead, persistence.id).catch((error: unknown) => {
    // Telegram logging is optional and must not break lead intake.
    console.error("Telegram lead logging failed", error);
  });
  response.status(201).json({ id: persistence.id, persistence: persistence.mode, lead });
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

  const aiLead = {
    ...parsed.data,
    status: parsed.data.status ?? "new",
    createdAt: parsed.data.createdAt ?? new Date().toISOString()
  };
  const persistence = await persist("aiLeads", aiLead);

  await sendLeadToTelegram({ ...aiLead, source: "ai-chat" }, persistence.id).catch((error: unknown) => {
    console.error("Telegram AI lead logging failed", error);
  });

  response.status(201).json({ id: persistence.id, persistence: persistence.mode, aiLead });
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
