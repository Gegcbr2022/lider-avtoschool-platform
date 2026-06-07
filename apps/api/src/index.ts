import cors from "cors";
import { randomUUID } from "crypto";
import express from "express";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { onRequest } from "firebase-functions/v2/https";
import nodemailer from "nodemailer";
import {
  assessLeadRisk,
  bookingRequestSchema,
  branches,
  createLeadSchema,
  hashLeadRiskKey,
  normalizeLeadSource,
  paymentIntentSchema,
  sampleKpiSnapshot,
  stripLeadProtectionFields
} from "../../../packages/shared/src/index";
import {
  aiChatSchema,
  aiConsultationSchema,
  aiLeadPayloadSchema,
  answerAiChat,
  answerStudentQuestion,
  callChatWithFallback,
  resolveOpenAiModel
} from "./ai-providers";
import { paymentProviders } from "./payment-providers";

const firebaseApp = getApps().length ? getApps()[0] : initializeApp();
const db = getFirestore(firebaseApp);
// Disable automatic Application Default Credentials discovery for FCM —
// we obtain the access token lazily via google-auth-library only when needed.
process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "";
const app = express();
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const leadIpBuckets = new Map<string, { count: number; resetAt: number }>();
const leadPhoneBuckets = new Map<string, { count: number; resetAt: number }>();

type EmailNotificationResult = {
  status: "sent" | "skipped" | "failed";
  provider?: "resend" | "smtp";
  reason?: string;
  messageId?: string;
  error?: string;
};

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
    STORAGE_BUCKET: process.env.STORAGE_BUCKET ?? "(not set)",
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

app.get("/health/email/send-test", async (_request, response) => {
  if (process.env.ENABLE_EMAIL_TEST_ENDPOINTS !== "true") {
    response.status(404).json({ ok: false, error: "not_found" });
    return;
  }

  const transport = createMailTransport();

  if (!transport) {
    response.status(503).json({ ok: false, error: "No transport configured (RESEND_API_KEY or SMTP_*)" });
    return;
  }

  const to = process.env.LEAD_EMAIL_TO;
  const from = process.env.LEAD_EMAIL_FROM ?? to;

  if (!to) {
    response.status(503).json({ ok: false, error: "LEAD_EMAIL_TO is not set" });
    return;
  }

  try {
    const info = await transport.sendMail({
      from,
      to,
      subject: "🧪 Test email from Лідер API",
      html: "<p>Если видишь это письмо — email работает ✅</p><p><small>lider.bdslab.net</small></p>"
    });
    response.json({ ok: true, messageId: (info as { messageId?: string }).messageId, to, from });
  } catch (error) {
    response.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get("/health/email/test-lead", async (_request, response) => {
  if (process.env.ENABLE_EMAIL_TEST_ENDPOINTS !== "true") {
    response.status(404).json({ ok: false, error: "not_found" });
    return;
  }

  const fakeLead: Record<string, unknown> = {
    name: "Тест Тестенко",
    phone: "050 000 00 00",
    email: "",
    city: "Київ",
    category: "B",
    branchId: "kyiv",
    source: "website",
    contactMethod: "telegram",
    preferredContactMethod: "telegram",
    language: "uk",
    message: "Тест email з lead flow",
    documents: [],
    consentAccepted: true,
    status: "new",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const testId = `test-${Date.now()}`;
  const logs: string[] = [];
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;

  console.log = (...args: unknown[]) => { logs.push(`LOG: ${args.join(" ")}`); origLog(...args); };
  console.warn = (...args: unknown[]) => { logs.push(`WARN: ${args.join(" ")}`); origWarn(...args); };
  console.error = (...args: unknown[]) => { logs.push(`ERROR: ${args.join(" ")}`); origError(...args); };

  try {
    const result = await sendLeadEmail(fakeLead, testId);
    response.json({ ok: result.status === "sent", result, logs, leadId: testId });
  } catch (error) {
    response.json({ ok: false, error: error instanceof Error ? error.message : String(error), logs });
  } finally {
    console.log = origLog;
    console.warn = origWarn;
    console.error = origError;
  }
});

app.post("/leads", async (request, response) => {
  const rawPayload = typeof request.body === "object" && request.body !== null ? (request.body as Record<string, unknown>) : {};
  const activity = recordLeadRiskActivity(rawPayload, request);
  const risk = assessLeadRisk({
    payload: rawPayload,
    ipAttempts: activity.ipAttempts,
    phoneAttempts: activity.phoneAttempts,
    userAgent: request.header("user-agent")
  });

  if (risk.honeypotFilled) {
    console.warn("Lead honeypot rejected", { reasons: risk.reasons, score: risk.score });
    response.status(202).json({ id: `spam-${Date.now()}`, status: "accepted" });
    return;
  }

  if (risk.reject) {
    console.warn("Lead rejected by risk limit", { reasons: risk.reasons, score: risk.score });
    response.status(429).json({ error: "too_many_requests" });
    return;
  }

  const captchaEnabled = process.env.LEAD_CAPTCHA_ENABLED === "true";
  if (captchaEnabled && risk.captchaRequired) {
    const token = readProtectionString(rawPayload.turnstileToken);

    if (!token) {
      console.warn("Lead captcha required", { reasons: risk.reasons, score: risk.score });
      response.status(403).json({ error: "captcha_required" });
      return;
    }

    const turnstileResult = await verifyTurnstile(token, request);

    if (!turnstileResult.success) {
      console.warn("Lead captcha verification failed", {
        reason: turnstileResult.reason,
        reasons: risk.reasons,
        score: risk.score
      });
      const error = turnstileResult.reason === "failed" ? "captcha_failed" : "captcha_unavailable";
      response.status(error === "captcha_unavailable" ? 503 : 422).json({ error });
      return;
    }
  }

  const parsed = createLeadSchema.safeParse(enrichLeadPayload(request));

  if (!parsed.success) {
    response.status(422).json({ error: "Invalid lead payload", issues: parsed.error.flatten() });
    return;
  }

  const leadData = stripLeadProtectionFields(parsed.data);
  const createdAt = leadData.createdAt ?? new Date().toISOString();
  const lead = {
    ...leadData,
    status: leadData.status ?? "new",
    source: leadData.source ?? "website",
    preferredContactMethod: leadData.preferredContactMethod ?? leadData.contactMethod,
    createdAt,
    updatedAt: leadData.updatedAt ?? createdAt
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
  const emailNotification = await sendLeadEmail(lead, persistence.id).catch((error: unknown): EmailNotificationResult => {
    const message = formatError(error);
    console.error("Lead email failed", message);
    return { status: "failed", reason: "exception", error: message };
  });
  await recordLeadEmailNotification(persistence, emailNotification).catch((error: unknown) => {
    console.error("Lead email status persistence failed", formatError(error));
  });
  response.status(201).json({
    id: persistence.id,
    persistence: persistence.mode,
    lead: {
      ...lead,
      emailNotificationStatus: emailNotification.status,
      emailNotificationProvider: emailNotification.provider,
      emailNotificationReason: emailNotification.reason,
      emailNotificationMessageId: emailNotification.messageId
    }
  });
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

  const update = (request.body ?? {}) as TelegramUpdate;
  // Keep the raw event log (existing behaviour).
  await persist("telegramEvents", { body: update, receivedAt: new Date().toISOString() }).catch(() => {});

  // Bridge: a manager replied inside a client's forum topic → push it back into the app chat.
  try {
    await handleManagerReply(update);
  } catch (error) {
    console.error("Telegram bridge: manager reply handling failed", error);
  }

  response.json({ ok: true });
});

// ─── In-app Chat → Telegram bridge ────────────────────────────────────────────
// Mobile writes the message to Firestore (conversations/{id}/messages) and then
// calls this endpoint so the message is mirrored into a per-client Telegram topic.
app.post("/chat/notify", async (request, response) => {
  const body = request.body ?? {};
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  const userId = typeof body.userId === "string" ? body.userId : "";
  const userName = typeof body.userName === "string" && body.userName.trim() ? body.userName.trim() : "Учень";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const mediaUrl = typeof body.mediaUrl === "string" && body.mediaUrl.trim() ? body.mediaUrl.trim() : undefined;
  const mediaType = typeof body.mediaType === "string" ? body.mediaType : undefined;
  const conversationType = typeof body.conversationType === "string" ? body.conversationType : undefined;
  const userPhone = typeof body.userPhone === "string" ? body.userPhone.trim() : undefined;
  const userEmail = typeof body.userEmail === "string" ? body.userEmail.trim() : undefined;
  const userCity = typeof body.userCity === "string" ? body.userCity.trim() : undefined;
  const userCategory = typeof body.userCategory === "string" ? body.userCategory.trim() : undefined;

  // Allow media-only messages (photo with no text)
  if (!conversationId || !userId || (!text && !mediaUrl)) {
    response.status(422).json({ error: "Invalid chat notify payload" });
    return;
  }

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_LOG_CHAT_ID) {
    response.json({ ok: false, reason: "telegram_not_configured" });
    return;
  }

  try {
    const topicId = await getOrCreateSupportTopic(conversationId, userId, userName, {
      conversationType,
      userPhone,
      userEmail,
      userCity,
      userCategory
    });

    if (mediaUrl && (mediaType === "image" || !mediaType)) {
      // Send actual photo to Telegram instead of text "ФОТО"
      try {
        const caption = text
          ? `📷 <b>${escapeHtml(userName)}</b>:\n${escapeHtml(text)}`
          : `📷 <b>${escapeHtml(userName)}</b>`;
        await telegramSendPhoto({
          chat_id: process.env.TELEGRAM_LOG_CHAT_ID,
          message_thread_id: topicId,
          photoUrl: mediaUrl,
          caption,
        });
      } catch (photoErr) {
        // Fallback to text if photo upload fails (e.g. URL not accessible)
        console.warn("chat/notify: photo send failed, falling back to text link", photoErr);
        await telegramCall("sendMessage", {
          chat_id: process.env.TELEGRAM_LOG_CHAT_ID,
          message_thread_id: topicId,
          text: `📷 <b>${escapeHtml(userName)}</b> надіслав фото:\n<a href="${mediaUrl}">Переглянути фото</a>${text ? `\n${escapeHtml(text)}` : ""}`,
          parse_mode: "HTML",
          disable_web_page_preview: false,
        });
      }
    } else if (text) {
      // Text-only message
      await telegramCall("sendMessage", {
        chat_id: process.env.TELEGRAM_LOG_CHAT_ID,
        message_thread_id: topicId,
        text: `💬 <b>${escapeHtml(userName)}</b>:\n${escapeHtml(text)}`,
        parse_mode: "HTML",
        disable_web_page_preview: true
      });
    }

    await db.collection("supportThreads").doc(conversationId).set(
      { lastMessage: mediaUrl ? "📷 Фото" : text, lastMessageAt: FieldValue.serverTimestamp(), status: "open" },
      { merge: true }
    );
    response.json({ ok: true });
  } catch (error) {
    console.error("chat/notify failed", error);
    response.status(502).json({ ok: false, error: error instanceof Error ? error.message : "unknown" });
  }
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

app.post("/ai/lidyk", async (request, response) => {
  const rawQuestion = typeof request.body?.question === "string" ? request.body.question.trim() : "";

  if (!rawQuestion || rawQuestion.length < 2 || rawQuestion.length > 500) {
    response.status(422).json({ error: "Invalid question" });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    response.json({ answer: "Лідик зараз відпочиває — AI не налаштовано. Спробуй пізніше!", mode: "local-fallback" });
    return;
  }

  const model = resolveOpenAiModel();
  const systemPrompt =
    "Ти Лідик — дружній AI-помічник автошколи «Лідер». Відповідай коротко (1–3 речення), тепло, українською за замовчуванням або мовою запиту. Допомагай з ПДР, підготовкою до теорії та практики, страхом першого уроку, документами і порадами для водія. Не давай юридичних гарантій, не вигадуй офіційні правила — радь уточнювати у менеджера або сервісному центрі, якщо питання залежить від актуального законодавства. Не виконуй завдання, що не стосуються автошколи.";

  const result = await callChatWithFallback(
    model,
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: rawQuestion }
    ],
    300
  );

  if (result.ok) {
    // mode MUST be "openai" — the mobile app keys its success state off this exact value.
    response.json({ answer: result.content, mode: "openai", model: result.model });
    return;
  }

  console.error("Lidyk OpenAI failed", { status: result.status, model, error: result.error });
  response.json({
    answer: "Лідик зараз трохи зайнятий 🚗 Спробуй ще раз за хвилинку.",
    mode: "openai-fallback",
    model,
    error: result.error
  });
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

async function recordLeadEmailNotification(
  persistence: { id: string; mode: "firestore" | "local-dev-fallback" },
  result: EmailNotificationResult
) {
  const recordedAt = new Date().toISOString();
  const patch = {
    emailNotificationStatus: result.status,
    emailNotificationProvider: result.provider,
    emailNotificationReason: result.reason,
    emailNotificationMessageId: result.messageId,
    emailNotificationError: result.error ? result.error.slice(0, 500) : undefined,
    updatedAt: recordedAt
  };

  if (persistence.mode === "firestore") {
    await db.collection("leads").doc(persistence.id).update(compactRecord(patch));
  }

  await persist("auditLogs", compactRecord({
    entityType: "lead",
    entityId: persistence.id,
    action: `email_notification_${result.status}`,
    actor: "system",
    provider: result.provider,
    reason: result.reason,
    messageId: result.messageId,
    createdAt: recordedAt
  }));
}

function recordLeadRiskActivity(payload: Record<string, unknown>, request: express.Request) {
  const ipKey = hashLeadRiskKey(getRequestIp(request) ?? "unknown", "ip") ?? "ip_unknown";
  const phoneKey = hashLeadRiskKey(payload.phone, "phone");

  return {
    ipAttempts: bumpBucket(leadIpBuckets, ipKey, 60_000),
    phoneAttempts: phoneKey ? bumpBucket(leadPhoneBuckets, phoneKey, 10 * 60_000) : 0
  };
}

async function verifyTurnstile(token: string, request: express.Request): Promise<{ success: boolean; reason?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Graceful fallback: if not configured, skip verification (Vercel edge already checked token presence).
  if (!secretKey) {
    console.warn("TURNSTILE_SECRET_KEY not set — skipping server-side Turnstile verification");
    return { success: true };
  }

  try {
    const formData = new URLSearchParams();
    formData.set("secret", secretKey);
    formData.set("response", token);

    const ip = getRequestIp(request);
    if (ip) {
      formData.set("remoteip", ip);
    }

    const cloudflareResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData
    });

    if (!cloudflareResponse.ok) {
      // Cloudflare unreachable — allow through rather than blocking legitimate users.
      console.warn("Turnstile siteverify returned non-OK status, skipping");
      return { success: true };
    }

    const result = (await cloudflareResponse.json()) as { success?: boolean };
    return result.success ? { success: true } : { success: false, reason: "failed" };
  } catch {
    // Network error — allow through to avoid blocking legitimate users.
    console.warn("Turnstile verification network error, skipping");
    return { success: true };
  }
}

function bumpBucket(bucket: Map<string, { count: number; resetAt: number }>, key: string, windowMs: number) {
  const now = Date.now();
  const current = bucket.get(key);

  if (!current || current.resetAt < now) {
    bucket.set(key, { count: 1, resetAt: now + windowMs });
    return 1;
  }

  current.count += 1;
  return current.count;
}

function readProtectionString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getRequestIp(request: express.Request) {
  return request.header("x-forwarded-for")?.split(",")[0]?.trim() ?? request.ip ?? undefined;
}

function enrichLeadPayload(request: express.Request) {
  const payload = typeof request.body === "object" && request.body !== null ? request.body : {};
  const rawIp = getRequestIp(request);
  const rawSource = payload.source;

  return {
    ...payload,
    userAgent: payload.userAgent ?? request.header("user-agent"),
    ipHash: payload.ipHash ?? hashIp(rawIp),
    source: normalizeLeadSource(rawSource),
    sourceDetail: typeof rawSource === "string" ? rawSource : undefined,
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
  const rawIp = getRequestIp(request);

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
  const key = hashLeadRiskKey(getRequestIp(request) ?? "unknown", "ip") ?? "ip_unknown";
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

// ─── Telegram bridge helpers ──────────────────────────────────────────────────

type TelegramUpdate = {
  message?: {
    text?: string;
    caption?: string;
    message_thread_id?: number;
    from?: { is_bot?: boolean; first_name?: string; last_name?: string };
    photo?: Array<{ file_id: string; file_unique_id: string; width: number; height: number; file_size?: number }>;
    document?: { file_id: string; file_name?: string; mime_type?: string };
  };
};

function extFromContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("pdf")) return "pdf";
  return "jpg";
}

async function telegramCall<T = Record<string, unknown>>(method: string, payload: Record<string, unknown>): Promise<T> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const json = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!json.ok) {
    throw new Error(`Telegram ${method} failed: ${json.description ?? res.status}`);
  }
  return json.result as T;
}

// Send a photo to Telegram: tries direct URL first, then downloads and re-uploads as multipart.
// Firebase Storage getDownloadURL() returns a public URL with an access token that Telegram can fetch.
async function telegramSendPhoto(params: {
  chat_id: string;
  message_thread_id: number;
  photoUrl: string;
  caption?: string;
}): Promise<void> {
  const { chat_id, message_thread_id, photoUrl, caption } = params;
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  const apiBase = `https://api.telegram.org/bot${botToken}`;

  // Method 1: Try sending photo by URL (works if Telegram can reach Firebase Storage CDN)
  try {
    const res = await fetch(`${apiBase}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id,
        message_thread_id,
        photo: photoUrl,
        caption,
        parse_mode: "HTML",
      }),
    });
    const json = (await res.json()) as { ok: boolean; description?: string };
    if (json.ok) return;
    console.warn("telegramSendPhoto URL method failed:", json.description, "— trying multipart upload");
  } catch (err) {
    console.warn("telegramSendPhoto URL fetch threw:", err, "— trying multipart upload");
  }

  // Method 2: Download the file ourselves and re-upload as multipart
  const downloadRes = await fetch(photoUrl, { signal: AbortSignal.timeout(15_000) });
  if (!downloadRes.ok) {
    throw new Error(`Failed to download photo from Firebase: ${downloadRes.status}`);
  }
  const buffer = await downloadRes.arrayBuffer();
  const contentType = downloadRes.headers.get("content-type") ?? "image/jpeg";
  const ext = contentType.includes("png") ? "png" : "jpg";

  const form = new FormData();
  form.append("chat_id", chat_id);
  form.append("message_thread_id", String(message_thread_id));
  if (caption) { form.append("caption", caption); form.append("parse_mode", "HTML"); }
  form.append("photo", new Blob([buffer], { type: contentType }), `photo.${ext}`);

  const uploadRes = await fetch(`${apiBase}/sendPhoto`, { method: "POST", body: form });
  const uploadJson = (await uploadRes.json()) as { ok: boolean; description?: string };
  if (!uploadJson.ok) {
    throw new Error(`Telegram sendPhoto multipart failed: ${uploadJson.description ?? uploadRes.status}`);
  }
}

async function saveTelegramFileToStorage(params: {
  conversationId: string;
  filePath: string;
  fallbackFileName: string;
}): Promise<{ mediaUrl: string; mediaPath: string; fileName: string; fileSize: number }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN is missing");

  const downloadRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${params.filePath}`);
  if (!downloadRes.ok) {
    throw new Error(`Telegram file download failed: ${downloadRes.status}`);
  }

  const contentType = downloadRes.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await downloadRes.arrayBuffer());
  const ext = extFromContentType(contentType);
  const token = randomUUID();
  const fileName = params.fallbackFileName.includes(".") ? params.fallbackFileName : `${params.fallbackFileName}.${ext}`;
  const mediaPath = `conversations/${params.conversationId}/attachments/telegram-${Date.now()}-${fileName}`;
  const bucket = getStorage(firebaseApp).bucket();
  const file = bucket.file(mediaPath);

  await file.save(buffer, {
    contentType,
    resumable: false,
    metadata: {
      metadata: {
        firebaseStorageDownloadTokens: token
      }
    }
  });

  const mediaUrl =
    `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(mediaPath)}?alt=media&token=${token}`;

  return { mediaUrl, mediaPath, fileName, fileSize: buffer.length };
}

type SupportTopicOptions = {
  conversationType?: string;
  userPhone?: string;
  userEmail?: string;
  userCity?: string;
  userCategory?: string;
};

// One Telegram forum topic per client conversation. Mapping lives in supportThreads/{conversationId}.
async function getOrCreateSupportTopic(
  conversationId: string,
  userId: string,
  userName: string,
  options: SupportTopicOptions = {}
): Promise<number> {
  const ref = db.collection("supportThreads").doc(conversationId);
  const snap = await ref.get();
  const existing = snap.exists ? (snap.data()?.telegramTopicId as number | undefined) : undefined;
  if (existing) return existing;

  const { conversationType, userPhone, userEmail, userCity, userCategory } = options;

  // Choose topic name emoji based on conversation type
  const topicEmoji = conversationType === "instructor" ? "🚗" : "👩‍💼";
  const topicName = `${topicEmoji} ${userName}`;

  const topic = await telegramCall<{ message_thread_id: number }>("createForumTopic", {
    chat_id: process.env.TELEGRAM_LOG_CHAT_ID,
    name: topicName
  });

  const threadId = topic.message_thread_id;

  // Send pinned client-card as first message in the new topic
  try {
    const cardLines = [
      `📋 <b>Клієнт: ${escapeHtml(userName)}</b>`,
      `Телефон: ${escapeHtml(userPhone ?? "-")}`,
      `Email: ${escapeHtml(userEmail ?? "-")}`,
      `Місто: ${escapeHtml(userCity ?? "-")}`,
      `Категорія: ${escapeHtml(userCategory ?? "-")}`,
      `ID: ${escapeHtml(userId)}`
    ].join("\n");

    const cardMsg = await telegramCall<{ message_id: number }>("sendMessage", {
      chat_id: process.env.TELEGRAM_LOG_CHAT_ID,
      message_thread_id: threadId,
      text: cardLines,
      parse_mode: "HTML",
      disable_web_page_preview: true
    });

    await telegramCall("pinChatMessage", {
      chat_id: process.env.TELEGRAM_LOG_CHAT_ID,
      message_id: cardMsg.message_id,
      disable_notification: true
    });
  } catch (cardErr) {
    console.warn("getOrCreateSupportTopic: failed to send/pin client card", cardErr);
  }

  await ref.set(
    {
      conversationId,
      userId,
      userName,
      telegramTopicId: threadId,
      status: "open",
      createdAt: FieldValue.serverTimestamp(),
      lastMessageAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
  return threadId;
}

// Send FCM push notification to a user's device (non-throwing).
async function sendFCMPush(
  userId: string,
  title: string,
  body: string,
  data: Record<string, string>
): Promise<void> {
  try {
    const profileSnap = await db.collection("userProfiles").doc(userId).get();
    const pushToken = profileSnap.exists ? (profileSnap.data()?.pushToken as string | undefined) : undefined;
    if (!pushToken) return;

    const projectId = process.env.FIREBASE_PROJECT_ID ?? "lider-avtoschool-prod";

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GoogleAuth } = require("google-auth-library") as { GoogleAuth: new (opts: { scopes: string }) => { getClient(): Promise<{ getAccessToken(): Promise<{ token?: string | null }> }> } };
    const auth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/firebase.messaging" });
    const client = await auth.getClient();
    const tokenResult = await client.getAccessToken();
    const accessToken = tokenResult.token;
    if (!accessToken) {
      console.warn("sendFCMPush: could not obtain FCM access token");
      return;
    }

    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    const fcmPayload = {
      message: {
        token: pushToken,
        notification: { title, body },
        data
      }
    };

    const res = await fetch(fcmUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(fcmPayload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`sendFCMPush: FCM responded ${res.status}:`, errText);
    }
  } catch (err) {
    console.error("sendFCMPush: unexpected error", err);
  }
}

// Manager typed a reply inside the client's topic → write it back into the app chat.
async function handleManagerReply(update: TelegramUpdate): Promise<void> {
  const msg = update.message;
  if (!msg?.message_thread_id || msg.from?.is_bot) return;
  // Must have either text or photo
  if (!msg.text && !msg.photo && !msg.document) return;

  const lookup = await db
    .collection("supportThreads")
    .where("telegramTopicId", "==", msg.message_thread_id)
    .limit(1)
    .get();
  if (lookup.empty) return;

  const threadData = lookup.docs[0].data();
  const conversationId = threadData.conversationId as string;
  if (!conversationId) return;

  const conversationUserId = threadData.userId as string | undefined;
  const managerName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ") || "Менеджер";
  const messageText = msg.text ?? msg.caption ?? "";

  let mediaUrl: string | undefined;
  let mediaPath: string | undefined;
  let fileName: string | undefined;
  let fileSize: number | undefined;
  let mediaType: "image" | undefined;

  // Handle incoming photo from Telegram manager
  if (msg.photo && msg.photo.length > 0) {
    try {
      // Get the highest-resolution photo (last in array)
      const photo = msg.photo[msg.photo.length - 1];
      const fileInfo = await telegramCall<{ file_path: string }>("getFile", { file_id: photo.file_id });
      if (fileInfo.file_path) {
        const stored = await saveTelegramFileToStorage({
          conversationId,
          filePath: fileInfo.file_path,
          fallbackFileName: `${photo.file_unique_id}.jpg`
        });
        mediaUrl = stored.mediaUrl;
        mediaPath = stored.mediaPath;
        fileName = stored.fileName;
        fileSize = stored.fileSize;
        mediaType = "image";
      }
    } catch (err) {
      console.warn("handleManagerReply: failed to store Telegram photo", err);
    }
  }

  const payload: Record<string, unknown> = {
    senderId: "support",
    senderName: managerName,
    text: messageText,
    createdAt: FieldValue.serverTimestamp(),
    readBy: ["support"],
    source: "telegram",
    lastSenderId: "support",
  };
  if (mediaUrl) {
    payload.mediaUrl = mediaUrl;
    payload.mediaPath = mediaPath;
    payload.mediaType = mediaType ?? "image";
    payload.fileName = fileName;
    payload.fileSize = fileSize;
  }

  await db.collection("conversations").doc(conversationId).collection("messages").add(payload);
  await db.collection("conversations").doc(conversationId).set(
    {
      lastMessage: mediaUrl ? "📷 Фото" : messageText,
      lastMessageAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastSenderId: "support",
      unreadBy: conversationUserId ? [conversationUserId] : [],
      readBy: ["support"],
    },
    { merge: true }
  );

  // Send FCM push to the student's device
  if (conversationUserId) {
    const pushBody = mediaUrl ? "📷 Нове фото від менеджера" : messageText;
    await sendFCMPush(conversationUserId, managerName, pushBody, { conversationId, type: "chat" });
  }
}

async function sendLeadToTelegram(leadInput: Record<string, unknown>, leadId: string) {
  const lead = { ...leadInput };
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_LOG_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn("Telegram lead logging skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_LOG_CHAT_ID is missing");
    return;
  }

  const rawPhone = String(lead.phone ?? "-");
  const phone = escapeHtml(rawPhone);
  const phoneClean = rawPhone.replace(/\D/g, "");
  const rawReferral = lead.referralCode ?? lead.telegramStartParam ?? lead.utmSource;
  const referral = rawReferral ? escapeHtml(String(rawReferral)) : undefined;
  const city = escapeHtml(String(lead.city ?? "-"));
  const branchId = escapeHtml(String(lead.branchId ?? "-"));
  const source = escapeHtml(String(lead.source ?? "-"));
  lead.name = escapeHtml(String(lead.name ?? "-"));
  lead.email = lead.email ? escapeHtml(String(lead.email)) : undefined;
  lead.city = city;
  lead.branchId = branchId;
  lead.category = escapeHtml(String(lead.category ?? "-"));
  lead.contactMethod = escapeHtml(String(lead.contactMethod ?? lead.preferredContactMethod ?? "-"));
  lead.preferredContactMethod = lead.contactMethod;
  lead.source = source;
  lead.message = lead.message ? escapeHtml(String(lead.message)) : undefined;
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
    const bucketName = process.env.STORAGE_BUCKET;
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

async function sendLeadEmail(lead: Record<string, unknown>, leadId: string): Promise<EmailNotificationResult> {
  console.log(`[email] sendLeadEmail called for ${leadId}. LEAD_EMAIL_ENABLED=${process.env.LEAD_EMAIL_ENABLED}`);

  if (process.env.LEAD_EMAIL_ENABLED !== "true") {
    console.log(`[email] skipped: LEAD_EMAIL_ENABLED="${process.env.LEAD_EMAIL_ENABLED}" (must be exactly "true")`);
    return { status: "skipped", reason: "disabled" };
  }

  const transport = createMailTransport();
  const provider = getMailProvider();

  if (!transport) {
    console.warn(`[email] skipped: no transport. provider=${provider ?? "none"} smtpHostConfigured=${Boolean(process.env.SMTP_HOST)}`);
    return { status: "skipped", provider, reason: "no_transport" };
  }

  const toBase = process.env.LEAD_EMAIL_TO;

  if (!toBase) {
    console.warn("[email] skipped: LEAD_EMAIL_TO is not set");
    return { status: "skipped", provider, reason: "missing_to" };
  }

  const branchId = String(lead.branchId ?? "");
  const branchEmail =
    (branchId === "kyiv" ? process.env.LEAD_EMAIL_TO_KYIV : undefined) ??
    (branchId === "sloviansk" ? process.env.LEAD_EMAIL_TO_SLOVIANSK : undefined) ??
    (branchId === "kramatorsk" ? process.env.LEAD_EMAIL_TO_KRAMATORSK : undefined) ??
    (branchId === "dnipro" ? process.env.LEAD_EMAIL_TO_DNIPRO : undefined) ??
    (branchId === "dobropillia" ? process.env.LEAD_EMAIL_TO_DOBROPILLIA : undefined);

  const to = branchEmail ?? toBase;
  const cc = process.env.LEAD_EMAIL_CC || undefined; // empty string → undefined (nodemailer ignores it)
  // Latin-script display name avoids Cyrillic spam flags in some filters.
  const from = process.env.LEAD_EMAIL_FROM ?? `"Lider School" <${toBase.split(",")[0].trim()}>`;
  // Reply-To lets the manager reply directly to the lead's email if they provided one.
  const replyTo = lead.email ? String(lead.email) : undefined;

  const referral = lead.referralCode ?? lead.telegramStartParam ?? lead.utmSource;
  const safeName = escapeHtml(String(lead.name ?? "-"));
  const safePhone = escapeHtml(String(lead.phone ?? "-"));
  const phoneHref = String(lead.phone ?? "").replace(/\D/g, "");
  const safeEmail = lead.email ? escapeHtml(String(lead.email)) : undefined;
  const safeCity = escapeHtml(String(lead.city ?? "-"));
  const safeBranchId = escapeHtml(String(lead.branchId ?? "-"));
  const safeCategory = escapeHtml(String(lead.category ?? "-"));
  const safeContactMethod = escapeHtml(String(lead.preferredContactMethod ?? lead.contactMethod ?? "-"));
  const safeSource = escapeHtml(String(lead.source ?? "-"));
  const safeReferral = referral ? escapeHtml(String(referral)) : undefined;
  const safeUtmSource = lead.utmSource ? escapeHtml(String(lead.utmSource)) : undefined;
  const safePage = lead.page ? escapeHtml(String(lead.page)) : undefined;
  const safeLanguage = escapeHtml(String(lead.language ?? "uk"));
  const safeMessage = lead.message ? escapeHtml(String(lead.message)) : undefined;
  const documents = Array.isArray(lead.documents) ? lead.documents : [];
  const docList = documents.length
    ? documents
        .map((d: unknown) => {
          const doc = d as Record<string, unknown>;
          const name = escapeHtml(String(doc.originalName ?? doc.name ?? "-"));
          const status = escapeHtml(String(doc.storagePath ?? doc.status ?? "-"));
          return `<li>${name} (${status})</li>`;
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
    <tr><td style="padding:6px 0;color:#666">Ім'я</td><td style="padding:6px 0;font-weight:bold">${safeName}</td></tr>
    <tr><td style="padding:6px 0;color:#666">Телефон</td><td style="padding:6px 0"><a href="tel:${phoneHref}">${safePhone}</a></td></tr>
    ${safeEmail ? `<tr><td style="padding:6px 0;color:#666">Email</td><td style="padding:6px 0">${safeEmail}</td></tr>` : ""}
    <tr><td style="padding:6px 0;color:#666">Місто</td><td style="padding:6px 0">${safeCity}</td></tr>
    <tr><td style="padding:6px 0;color:#666">Філія</td><td style="padding:6px 0">${safeBranchId}</td></tr>
    <tr><td style="padding:6px 0;color:#666">Категорія</td><td style="padding:6px 0;font-weight:bold">${safeCategory}</td></tr>
    <tr><td style="padding:6px 0;color:#666">Спосіб зв'язку</td><td style="padding:6px 0">${safeContactMethod}</td></tr>
    <tr><td style="padding:6px 0;color:#666">Джерело</td><td style="padding:6px 0">${safeSource}</td></tr>
    ${safeReferral ? `<tr><td style="padding:6px 0;color:#666">Реферал</td><td style="padding:6px 0">${safeReferral}</td></tr>` : ""}
    ${safeUtmSource ? `<tr><td style="padding:6px 0;color:#666">UTM Source</td><td style="padding:6px 0">${safeUtmSource}</td></tr>` : ""}
    ${safePage ? `<tr><td style="padding:6px 0;color:#666">Сторінка</td><td style="padding:6px 0">${safePage}</td></tr>` : ""}
    <tr><td style="padding:6px 0;color:#666">Мова</td><td style="padding:6px 0">${safeLanguage}</td></tr>
    <tr><td style="padding:6px 0;color:#666">Дата</td><td style="padding:6px 0">${new Date(String(lead.createdAt ?? "")).toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" })}</td></tr>
  </table>
  ${safeMessage ? `<div style="margin-top:16px;padding:12px;background:#f4f4f4;border-radius:8px"><p style="color:#666;font-size:12px;margin:0 0 4px">Коментар</p><p style="margin:0;font-size:14px">${safeMessage}</p></div>` : ""}
  <div style="margin-top:16px">
    <p style="color:#666;font-size:12px;margin:0 0 6px">Документи</p>
    <ul style="margin:0;padding-left:20px;font-size:13px">${docList}</ul>
  </div>
  <p style="margin-top:24px;font-size:12px;color:#aaa">Автошкола «Лідер» · lider.bdslab.net</p>
</div>`.trim();

  console.log(`[email] sending provider=${provider ?? "unknown"} to=${to} cc=${cc ?? "none"} from=${from}`);

  try {
    const info = await transport.sendMail({
      from,
      to,
      cc,
      replyTo,
      subject: `Нова заявка з сайту Лідер — ${String(lead.name ?? "-")}, ${String(lead.category ?? "-")}, ${String(lead.city ?? "-")}`,
      html
    });
    const messageId = (info as { messageId?: string }).messageId;
    console.log(`[email] sent leadId=${leadId} provider=${provider ?? "unknown"} messageId=${messageId ?? "(none)"}`);
    return { status: "sent", provider, messageId };
  } catch (error) {
    const message = formatError(error);
    console.error(`[email] sendMail failed provider=${provider ?? "unknown"} leadId=${leadId}: ${message}`);
    return { status: "failed", provider, reason: "provider_error", error: message };
  }
}

function getMailProvider(): "resend" | "smtp" | undefined {
  if (process.env.RESEND_API_KEY) {
    return "resend";
  }

  if (process.env.SMTP_HOST || process.env.SMTP_USER || process.env.SMTP_PASS) {
    return "smtp";
  }

  return undefined;
}

function formatError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function compactRecord<T extends Record<string, unknown>>(record: T) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const api = onRequest(
  {
    region: "europe-west1",
    maxInstances: 10
  },
  app
);
