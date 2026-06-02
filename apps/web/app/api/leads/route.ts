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

  const enrichedBody = enrichLeadBody(body, request);
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
