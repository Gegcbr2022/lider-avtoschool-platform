import cors from "cors";
import express from "express";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { onRequest } from "firebase-functions/v2/https";
import nodemailer from "nodemailer";
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

app.get("/health/email", (_request, response) => {
  const cfg = {
    LEAD_EMAIL_ENABLED: process.env.LEAD_EMAIL_ENABLED ?? "(not set)",
    LEAD_EMAIL_TO: process.env.LEAD_EMAIL_TO ? "✓ set" : "(not set)",
    LEAD_EMAIL_FROM: process.env.LEAD_EMAIL_FROM ? "✓ set" : "(not set)",
    LEAD_EMAIL_CC: process.env.LEAD_EMAIL_CC ? "✓ set" : "(empty — ok)",
    RESEND_API_KEY: process.env.RESEND_API_KEY ? "✓ set" : "(not set)",
    SMTP_HOST: process.env.SMTP_HOST ?? "(not set)",
    SMTP_PORT: process.env.SMTP_PORT ?? "(not set)",
    SMTP_USER: process.env.SMTP_USER ? "✓ set" : "(not set)",
    SMTP_PASS: process.env.SMTP_PASS ? "✓ set" : "(not set)"
  };

  const enabled = process.env.LEAD_EMAIL_ENABLED === "true";
  const hasResend = Boolean(process.env.RESEND_API_KEY);
  const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  const hasTransport = hasResend || hasSmtp;
  const hasTo = Boolean(process.env.LEAD_EMAIL_TO);

  const ready = enabled && hasTransport && hasTo;
  const issues: string[] = [];

  if (!enabled) issues.push("LEAD_EMAIL_ENABLED is not 'true' — must be exactly the string true");
  if (!hasTransport) issues.push("No transport: set RESEND_API_KEY or all of SMTP_HOST + SMTP_USER + SMTP_PASS");
  if (!hasTo) issues.push("LEAD_EMAIL_TO is empty");

  response.json({ ready, cfg, issues, provider: hasResend ? "resend" : hasSmtp ? "smtp" : "none" });
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
    console.error("Telegram lead logging failed", error);
  });
  await sendLeadEmail(lead, persistence.id).catch((error: unknown) => {
    console.error("Lead email failed", error);
  });
  response.status(201).json({ id: persistence.id, persistence: persistence.mode, lead });
});

app.patch("/leads/:leadId/documents", async (request, response) => {
  const { leadId } = request.params;
  const { documents } = request.body as { documents?: unknown[] };

  if (!leadId || !Array.isArray(documents) || documents.length === 0) {
    response.status(422).json({ error: "Invalid payload" });
    return;
  }

  try {
    await db.collection("leads").doc(leadId).update({
      documents,
      updatedAt: new Date().toISOString()
    });

    // Forward documents to Telegram as actual files
    await sendDocumentsToTelegram(
      documents as Array<{ storagePath: string; contentType: string; originalName: string }>,
      leadId
    ).catch((error: unknown) => {
      console.error("Telegram document upload failed", error);
    });

    response.json({ ok: true });
  } catch (error) {
    console.error("Failed to update lead documents", error);
    response.status(500).json({ error: "Failed to update lead" });
  }
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

  const phone = String(lead.phone ?? "-");
  const phoneClean = phone.replace(/\D/g, "");
  const referral = lead.referralCode ?? lead.telegramStartParam ?? lead.utmSource;
  const hasDocuments = Array.isArray(lead.documents) && lead.documents.length > 0;
  const hasDocumentFiles = Array.isArray(lead.documentFiles) && lead.documentFiles.length > 0;

  const messageParts = [
    "🚘 <b>Нова заявка</b>",
    `🆔 <code>${leadId}</code>`,
    "",
    `👤 <b>${String(lead.name ?? "-")}</b>`,
    `📞 <a href="tel:+${phoneClean}">${phone}</a>`,
    lead.email ? `📧 ${String(lead.email)}` : null,
    "",
    `📍 ${String(lead.city ?? "-")}  |  ${String(lead.branchId ?? "-")}`,
    `🏷 Категорія: <b>${String(lead.category ?? "-")}</b>`,
    `📲 Зв'язок: ${String(lead.contactMethod ?? lead.preferredContactMethod ?? "-")}`,
    `🔗 Джерело: ${String(lead.source ?? "-")}`,
    referral ? `🎯 Реферал: ${String(referral)}` : null,
    "",
    lead.message && String(lead.message).trim() ? `💬 ${String(lead.message).trim()}` : null,
    hasDocuments || hasDocumentFiles
      ? `📎 Документів: ${hasDocuments ? (lead.documents as unknown[]).length : (lead.documentFiles as unknown[]).length} шт.`
      : null,
    "",
    `⏱ ${new Date(String(lead.createdAt ?? "")).toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" })}`
  ]
    .filter((line) => line !== null)
    .join("\n");

  const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const result = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: messageParts,
      parse_mode: "HTML",
      disable_web_page_preview: true
    })
  });

  if (!result.ok) {
    const body = await result.text();
    throw new Error(`Telegram sendMessage failed with ${result.status}: ${body}`);
  }
}

async function sendDocumentsToTelegram(
  documents: Array<{ storagePath: string; contentType: string; originalName: string }>,
  leadId: string
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_LOG_CHAT_ID;

  if (!botToken || !chatId || documents.length === 0) {
    return;
  }

  let bucket: ReturnType<ReturnType<typeof getStorage>["bucket"]>;

  try {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    bucket = getStorage().bucket(bucketName);
  } catch (err) {
    console.warn("Firebase Storage not available, skipping document upload to Telegram:", err);
    return;
  }

  for (const doc of documents) {
    try {
      const file = bucket.file(doc.storagePath);
      const [buffer] = await file.download();

      const isImage =
        doc.contentType.startsWith("image/") &&
        !doc.contentType.includes("heic");
      const endpoint = `https://api.telegram.org/bot${botToken}/${isImage ? "sendPhoto" : "sendDocument"}`;
      const fieldName = isImage ? "photo" : "document";

      const form = new FormData();
      form.append("chat_id", chatId);
      form.append("caption", `📎 ${doc.originalName}  |  ID: ${leadId}`);
      form.append(fieldName, new Blob([new Uint8Array(buffer)], { type: doc.contentType }), doc.originalName);

      const result = await fetch(endpoint, { method: "POST", body: form });

      if (!result.ok) {
        const body = await result.text();
        console.error(`Telegram send file failed (${doc.originalName}): ${result.status} ${body}`);
      }
    } catch (error) {
      console.error(`Failed to send ${doc.storagePath} to Telegram`, error);
    }
  }
}

function createMailTransport() {
  if (process.env.RESEND_API_KEY) {
    return nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: {
        user: "resend",
        pass: process.env.RESEND_API_KEY
      }
    });
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  return null;
}

async function sendLeadEmail(lead: Record<string, unknown>, leadId: string) {
  console.log(`[email] sendLeadEmail called for ${leadId}. LEAD_EMAIL_ENABLED=${process.env.LEAD_EMAIL_ENABLED}`);

  if (process.env.LEAD_EMAIL_ENABLED !== "true") {
    console.log(`[email] skipped: LEAD_EMAIL_ENABLED="${process.env.LEAD_EMAIL_ENABLED}" (must be exactly "true")`);
    return;
  }

  const transport = createMailTransport();

  if (!transport) {
    console.warn(`[email] skipped: no transport. RESEND_API_KEY=${Boolean(process.env.RESEND_API_KEY)} SMTP_HOST=${process.env.SMTP_HOST}`);
    return;
  }

  const toBase = process.env.LEAD_EMAIL_TO;

  if (!toBase) {
    console.warn("[email] skipped: LEAD_EMAIL_TO is not set");
    return;
  }

  const branchId = String(lead.branchId ?? "");
  const branchEmail =
    (branchId === "kyiv" ? process.env.LEAD_EMAIL_TO_KYIV : undefined) ??
    (branchId === "sloviansk" ? process.env.LEAD_EMAIL_TO_SLOVIANSK : undefined) ??
    (branchId === "kramatorsk" ? process.env.LEAD_EMAIL_TO_KRAMATORSK : undefined) ??
    (branchId === "dnipro" ? process.env.LEAD_EMAIL_TO_DNIPRO : undefined) ??
    (branchId === "dobropillia" ? process.env.LEAD_EMAIL_TO_DOBROPILLIA : undefined);

  const to = branchEmail ?? toBase;
  const cc = process.env.LEAD_EMAIL_CC;
  const from = process.env.LEAD_EMAIL_FROM ?? `"Лідер CRM" <${toBase.split(",")[0].trim()}>`;

  const referral = lead.referralCode ?? lead.telegramStartParam ?? lead.utmSource;
  const documents = Array.isArray(lead.documents) ? lead.documents : [];
  const docList = documents.length
    ? documents
        .map((d: unknown) => {
          const doc = d as Record<string, unknown>;
          return `<li>${String(doc.originalName ?? doc.name ?? "-")} (${String(doc.storagePath ?? doc.status ?? "-")})</li>`;
        })
        .join("")
    : "<li>Немає прикріплених файлів</li>";

  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:#ff1e1e;border-bottom:2px solid #ff1e1e;padding-bottom:8px">
    🚘 Нова заявка — Автошкола «Лідер»
  </h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:6px 0;color:#666;width:140px">ID заявки</td><td style="padding:6px 0;font-weight:bold">${leadId}</td></tr>
    <tr><td style="padding:6px 0;color:#666">Ім'я</td><td style="padding:6px 0;font-weight:bold">${String(lead.name ?? "-")}</td></tr>
    <tr><td style="padding:6px 0;color:#666">Телефон</td><td style="padding:6px 0"><a href="tel:${String(lead.phone ?? "").replace(/\D/g, "")}">${String(lead.phone ?? "-")}</a></td></tr>
    ${lead.email ? `<tr><td style="padding:6px 0;color:#666">Email</td><td style="padding:6px 0">${String(lead.email)}</td></tr>` : ""}
    <tr><td style="padding:6px 0;color:#666">Місто</td><td style="padding:6px 0">${String(lead.city ?? "-")}</td></tr>
    <tr><td style="padding:6px 0;color:#666">Філія</td><td style="padding:6px 0">${String(lead.branchId ?? "-")}</td></tr>
    <tr><td style="padding:6px 0;color:#666">Категорія</td><td style="padding:6px 0;font-weight:bold">${String(lead.category ?? "-")}</td></tr>
    <tr><td style="padding:6px 0;color:#666">Спосіб зв'язку</td><td style="padding:6px 0">${String(lead.preferredContactMethod ?? lead.contactMethod ?? "-")}</td></tr>
    <tr><td style="padding:6px 0;color:#666">Джерело</td><td style="padding:6px 0">${String(lead.source ?? "-")}</td></tr>
    ${referral ? `<tr><td style="padding:6px 0;color:#666">Реферал</td><td style="padding:6px 0">${String(referral)}</td></tr>` : ""}
    ${lead.utmSource ? `<tr><td style="padding:6px 0;color:#666">UTM Source</td><td style="padding:6px 0">${String(lead.utmSource)}</td></tr>` : ""}
    ${lead.page ? `<tr><td style="padding:6px 0;color:#666">Сторінка</td><td style="padding:6px 0">${String(lead.page)}</td></tr>` : ""}
    <tr><td style="padding:6px 0;color:#666">Мова</td><td style="padding:6px 0">${String(lead.language ?? "uk")}</td></tr>
    <tr><td style="padding:6px 0;color:#666">Дата</td><td style="padding:6px 0">${new Date(String(lead.createdAt ?? "")).toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" })}</td></tr>
  </table>
  ${lead.message ? `<div style="margin-top:16px;padding:12px;background:#f4f4f4;border-radius:8px"><p style="color:#666;font-size:12px;margin:0 0 4px">Коментар</p><p style="margin:0;font-size:14px">${String(lead.message)}</p></div>` : ""}
  <div style="margin-top:16px">
    <p style="color:#666;font-size:12px;margin:0 0 6px">Документи</p>
    <ul style="margin:0;padding-left:20px;font-size:13px">${docList}</ul>
  </div>
  <p style="margin-top:24px;font-size:12px;color:#aaa">Автошкола «Лідер» · lider.bdslab.net</p>
</div>`.trim();

  console.log(`[email] sending to=${to} cc=${cc ?? "none"} from=${from}`);

  try {
    await transport.sendMail({
      from,
      to,
      cc,
      subject: `Нова заявка з сайту Лідер — ${String(lead.name ?? "-")}, ${String(lead.category ?? "-")}, ${String(lead.city ?? "-")}`,
      html
    });
    console.log(`[email] ✓ sent for leadId=${leadId} to=${to}`);
  } catch (error) {
    console.error("[email] ✗ sendMail failed:", error);
    // Re-throw so the caller logs it too
    throw error;
  }
}

export const api = onRequest(
  {
    region: "europe-west1",
    maxInstances: 10
  },
  app
);
