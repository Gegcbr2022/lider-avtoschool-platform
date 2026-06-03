// v3: source validated independently — no dependency on @lider/shared enum version
import { assessLeadRisk, hashLeadRiskKey, stripLeadProtectionFields } from "@lider/shared";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestBuckets = new Map<string, { count: number; resetAt: number }>();
const leadIpBuckets = new Map<string, { count: number; resetAt: number }>();
const leadPhoneBuckets = new Map<string, { count: number; resetAt: number }>();

// All valid lead sources — independent of @lider/shared version in Vercel cache.
const VALID_LEAD_SOURCES = new Set([
  "website", "popup", "telegram", "referral", "walk-in", "mobile",
  "ai-chat", "admin", "category-page", "documents-page", "contacts-page",
  "branch_card", "category_card", "service_card", "hero_cta",
  "floating_phone", "sticky_mobile", "footer", "cta_link", "documents", "about",
]);

function safeLeadSource(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) return "website";
  const s = raw.trim();
  for (const c of [s, s.replace(/_/g, "-"), s.replace(/-/g, "_")]) {
    if (VALID_LEAD_SOURCES.has(c)) return c;
  }
  return "website";
}

// Web-edge schema: source is z.string() so any value passes locally.
// Firebase Functions runs its own normalized validation.
const webLeadSchema = z.object({
  name: z.string().trim().max(80).default(""),
  phone: z.string().trim().min(9).max(30),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  city: z.string().trim().min(2).max(80),
  category: z.enum(["A", "A1", "B", "C", "CE"]),
  branchId: z.string().trim().min(2).max(80),
  branch: z.string().trim().max(80).optional(),
  requestType: z.enum(["application", "callback", "consultation", "documents", "category-picker"]).default("application"),
  contactMethod: z.enum(["telegram", "phone", "whatsapp", "email", "any"]).default("telegram"),
  preferredContactMethod: z.enum(["telegram", "phone", "whatsapp", "email", "any"]).optional(),
  documentFiles: z.array(z.string().max(160)).max(8).optional(),
  documents: z.array(z.unknown()).max(8).optional(),
  message: z.string().trim().max(1400).optional(),
  source: z.string().max(80).default("website"), // string, not enum — accepts any source
  sourceDetail: z.string().max(80).optional(),
  utmSource: z.string().trim().max(180).optional(),
  utmMedium: z.string().trim().max(180).optional(),
  utmCampaign: z.string().trim().max(180).optional(),
  utmContent: z.string().trim().max(180).optional(),
  utmTerm: z.string().trim().max(180).optional(),
  referralCode: z.string().trim().max(180).optional(),
  telegramStartParam: z.string().trim().max(180).optional(),
  language: z.enum(["uk", "ru", "en"]).default("uk"),
  page: z.string().trim().max(260).optional(),
  device: z.string().trim().max(80).optional(),
  formStartedAt: z.number().int().positive().optional(),
  companyWebsite: z.string().trim().max(260).optional(),
  turnstileToken: z.string().trim().max(4096).optional(),
  consentAccepted: z.boolean().refine((v) => v, "consent_required"),
  status: z.string().default("new"),
  assignedTo: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(2000).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  ipHash: z.string().max(128).optional(),
  userAgent: z.string().max(260).optional(),
});

export async function POST(request: Request) {
  const rateLimitResult = checkRateLimit(request);

  if (!rateLimitResult.ok) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const payload = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const activity = recordLeadRiskActivity(payload, request);
  const risk = assessLeadRisk({
    payload,
    ipAttempts: activity.ipAttempts,
    phoneAttempts: activity.phoneAttempts,
    userAgent: request.headers.get("user-agent") ?? undefined
  });

  if (risk.honeypotFilled) {
    console.warn("Lead honeypot rejected at web edge", { reasons: risk.reasons, score: risk.score });
    return NextResponse.json({ id: `web-spam-${Date.now()}`, status: "accepted" }, { status: 202 });
  }

  if (risk.reject) {
    console.warn("Lead rejected by web risk limit", { reasons: risk.reasons, score: risk.score });
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const captchaEnabled = process.env.LEAD_CAPTCHA_ENABLED === "true";
  if (captchaEnabled && risk.captchaRequired && !readString(payload.turnstileToken)) {
    console.warn("Lead captcha required at web edge", { reasons: risk.reasons, score: risk.score });
    return NextResponse.json({ error: "captcha_required" }, { status: 403 });
  }

  const rawSource = typeof payload.source === "string" ? payload.source : undefined;
  const normalizedSource = safeLeadSource(rawSource);
  const enrichedBody = enrichLeadBody(payload, request, normalizedSource);
  const parsed = webLeadSchema.safeParse(enrichedBody);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lead payload", issues: parsed.error.flatten() }, { status: 422 });
  }

  const finalData = {
    ...parsed.data,
    source: normalizedSource,
    ...(rawSource && rawSource !== normalizedSource ? { sourceDetail: rawSource } : {}),
  };

  if (process.env.NODE_ENV === "production") {
    if (!process.env.API_URL) {
      return NextResponse.json({ error: "API_URL is not configured" }, { status: 503 });
    }

    const proxyHeaders: Record<string, string> = { "Content-Type": "application/json" };
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");
    if (forwardedFor) proxyHeaders["x-forwarded-for"] = forwardedFor;
    else if (realIp) proxyHeaders["x-forwarded-for"] = realIp;
    if (userAgent) proxyHeaders["user-agent"] = userAgent;

    const apiResponse = await fetch(`${process.env.API_URL.replace(/\/$/, "")}/leads`, {
      method: "POST",
      headers: proxyHeaders,
      body: JSON.stringify(finalData)
    }).catch(() => null);

    if (!apiResponse) {
      return NextResponse.json({ error: "Lead API is unavailable" }, { status: 502 });
    }

    const apiPayload = await readApiPayload(apiResponse);

    if (!apiResponse.ok) {
      return NextResponse.json(apiPayload ?? { error: "Lead API is unavailable" }, { status: apiResponse.status });
    }

    return NextResponse.json(apiPayload ?? {}, { status: apiResponse.status });
  }

  return NextResponse.json({
    id: `web-${Date.now()}`,
    status: "accepted",
    lead: stripLeadProtectionFields(finalData as Parameters<typeof stripLeadProtectionFields>[0])
  });
}

function enrichLeadBody(body: unknown, request: Request, normalizedSource: string) {
  const payload = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const referer = request.headers.get("referer") ?? undefined;
  const userAgent = request.headers.get("user-agent") ?? undefined;
  const language = typeof payload.language === "string" ? payload.language : request.headers.get("accept-language")?.slice(0, 2);

  return {
    ...payload,
    page: payload.page ?? referer,
    userAgent,
    language: language === "ru" || language === "en" ? language : "uk",
    source: normalizedSource,
    preferredContactMethod: payload.preferredContactMethod ?? payload.contactMethod,
    updatedAt: new Date().toISOString()
  };
}

function checkRateLimit(request: Request) {
  const key = hashLeadRiskKey(getRequestIp(request) ?? "unknown", "ip") ?? "ip_unknown";
  const now = Date.now();
  const current = requestBuckets.get(key);
  if (!current || current.resetAt < now) {
    requestBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return { ok: true };
  }
  if (current.count >= 18) return { ok: false };
  current.count += 1;
  return { ok: true };
}

function recordLeadRiskActivity(payload: Record<string, unknown>, request: Request) {
  const ipKey = hashLeadRiskKey(getRequestIp(request) ?? "unknown", "ip") ?? "ip_unknown";
  const phoneKey = hashLeadRiskKey(payload.phone, "phone");
  return {
    ipAttempts: bumpBucket(leadIpBuckets, ipKey, 60_000),
    phoneAttempts: phoneKey ? bumpBucket(leadPhoneBuckets, phoneKey, 10 * 60_000) : 0
  };
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

function getRequestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? undefined;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function readApiPayload(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
