import { assessLeadRisk, createLeadSchema, hashLeadRiskKey, stripLeadProtectionFields } from "@lider/shared";
import { NextResponse } from "next/server";

const requestBuckets = new Map<string, { count: number; resetAt: number }>();
const leadIpBuckets = new Map<string, { count: number; resetAt: number }>();
const leadPhoneBuckets = new Map<string, { count: number; resetAt: number }>();

// All valid lead sources — inlined here so this route works independently of
// which version of @lider/shared the Vercel build cache contains.
const VALID_LEAD_SOURCES = new Set([
  "website", "popup", "telegram", "referral", "walk-in", "mobile",
  "ai-chat", "admin", "category-page", "documents-page", "contacts-page",
  "branch_card", "category_card", "service_card", "hero_cta",
  "floating_phone", "sticky_mobile", "footer", "cta_link", "documents", "about",
]);

// Values that all schema versions (including the old 11-value cache) accept.
// Used as the Zod-validated source so the schema never rejects on new CTA names.
const SCHEMA_SAFE_SOURCES = new Set([
  "website", "popup", "telegram", "referral", "walk-in", "mobile",
  "ai-chat", "admin", "category-page", "documents-page", "contacts-page",
]);

function safeLeadSource(raw: unknown): { normalized: string; schemaSafe: string } {
  if (typeof raw !== "string" || !raw.trim()) {
    return { normalized: "website", schemaSafe: "website" };
  }
  const s = raw.trim();
  const candidates = [s, s.replace(/_/g, "-"), s.replace(/-/g, "_")];
  let normalized = "website";
  for (const c of candidates) {
    if (VALID_LEAD_SOURCES.has(c)) { normalized = c; break; }
  }
  // For Zod validation, always use a value the cached schema accepts
  const schemaSafe = SCHEMA_SAFE_SOURCES.has(normalized) ? normalized : "website";
  return { normalized, schemaSafe };
}

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

  const { normalized: normalizedSource, schemaSafe } = safeLeadSource(payload.source);
  const rawSource = typeof payload.source === "string" ? payload.source : undefined;

  // Validate with schema-safe source so old cached @lider/shared enum never rejects.
  const enrichedBody = enrichLeadBody(payload, request, schemaSafe);
  const parsed = createLeadSchema.safeParse(enrichedBody);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lead payload", issues: parsed.error.flatten() }, { status: 422 });
  }

  // Replace schemaSafe source with the real normalized source for storage/forwarding.
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

function enrichLeadBody(body: unknown, request: Request, source: string) {
  const payload = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const referer = request.headers.get("referer") ?? undefined;
  const userAgent = request.headers.get("user-agent") ?? undefined;
  const language = typeof payload.language === "string" ? payload.language : request.headers.get("accept-language")?.slice(0, 2);

  return {
    ...payload,
    page: payload.page ?? referer,
    userAgent,
    language: language === "ru" || language === "en" ? language : "uk",
    source, // always a value the Zod schema accepts
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

  if (current.count >= 18) {
    return { ok: false };
  }

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
