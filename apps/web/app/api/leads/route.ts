import { createLeadSchema } from "@lider/shared";
import { NextResponse } from "next/server";

const requestBuckets = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  const rateLimitResult = checkRateLimit(request);

  if (!rateLimitResult.ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // Extract and verify Turnstile token (graceful: skipped if key not configured)
  const rawPayload = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const { turnstileToken, ...leadPayload } = rawPayload;
  const turnstileResult = await verifyTurnstile(turnstileToken as string | undefined, request);
  if (!turnstileResult.success) {
    return NextResponse.json({ error: "CAPTCHA verification failed. Please try again." }, { status: 422 });
  }

  const enrichedBody = enrichLeadBody(leadPayload, request);
  const parsed = createLeadSchema.safeParse(enrichedBody);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lead payload", issues: parsed.error.flatten() }, { status: 422 });
  }

  if (process.env.NODE_ENV === "production") {
    if (!process.env.API_URL) {
      return NextResponse.json({ error: "API_URL is not configured" }, { status: 503 });
    }

    const apiResponse = await fetch(`${process.env.API_URL.replace(/\/$/, "")}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data)
    });

    if (!apiResponse.ok) {
      return NextResponse.json({ error: "Lead API is unavailable" }, { status: 502 });
    }

    return NextResponse.json(await apiResponse.json(), { status: apiResponse.status });
  }

  return NextResponse.json({
    id: `web-${Date.now()}`,
    status: "accepted",
    lead: parsed.data
  });
}

function enrichLeadBody(body: unknown, request: Request) {
  const payload = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const referer = request.headers.get("referer") ?? undefined;
  const userAgent = request.headers.get("user-agent") ?? undefined;
  const language = typeof payload.language === "string" ? payload.language : request.headers.get("accept-language")?.slice(0, 2);

  return {
    ...payload,
    page: payload.page ?? referer,
    userAgent,
    language: language === "ru" || language === "en" ? language : "uk",
    source: payload.source ?? "website",
    preferredContactMethod: payload.preferredContactMethod ?? payload.contactMethod,
    updatedAt: new Date().toISOString()
  };
}

async function verifyTurnstile(token: string | undefined, request: Request): Promise<{ success: boolean; skipped?: boolean }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    return { success: true, skipped: true };
  }

  if (!token) {
    return { success: false };
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    undefined;

  try {
    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (ip) formData.append("remoteip", ip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData
    });

    if (!res.ok) return { success: true, skipped: true };

    const data = await res.json() as { success?: boolean };
    return { success: Boolean(data.success) };
  } catch {
    return { success: true, skipped: true };
  }
}

function checkRateLimit(request: Request) {
  const key =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
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
