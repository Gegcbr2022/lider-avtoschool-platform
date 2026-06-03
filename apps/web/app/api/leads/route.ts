// v4: pure pass-through proxy to Firebase Functions.
// All source validation and normalization is handled by Firebase Functions
// (which has normalizeLeadSource + updated enum). This route has zero
// dependency on @lider/shared version to avoid Vercel webpack cache issues.
import { NextResponse } from "next/server";

const requestBuckets = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  // Edge rate limit (18 req/min per IP)
  if (!checkRateLimit(request)) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // Honeypot: if companyWebsite is filled, silently accept but discard
  if (
    typeof body === "object" && body !== null &&
    typeof (body as Record<string, unknown>).companyWebsite === "string" &&
    ((body as Record<string, unknown>).companyWebsite as string).trim()
  ) {
    return NextResponse.json({ id: `web-spam-${Date.now()}`, status: "accepted" }, { status: 202 });
  }

  if (process.env.NODE_ENV !== "production" || !process.env.API_URL) {
    // Dev / misconfigured: echo back the payload
    return NextResponse.json({ id: `web-dev-${Date.now()}`, status: "accepted", body }, { status: 200 });
  }

  // Forward to Firebase Functions — all validation happens there
  const proxyHeaders: Record<string, string> = { "Content-Type": "application/json" };
  const fwd = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ua = request.headers.get("user-agent");
  if (fwd) proxyHeaders["x-forwarded-for"] = fwd;
  else if (realIp) proxyHeaders["x-forwarded-for"] = realIp;
  if (ua) proxyHeaders["user-agent"] = ua;

  const apiResponse = await fetch(`${process.env.API_URL.replace(/\/$/, "")}/leads`, {
    method: "POST",
    headers: proxyHeaders,
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!apiResponse) {
    return NextResponse.json({ error: "Lead API is unavailable" }, { status: 502 });
  }

  let apiData: unknown;
  try { apiData = await apiResponse.json(); } catch { apiData = null; }

  return NextResponse.json(apiData ?? { error: "Lead API is unavailable" }, {
    status: apiResponse.status,
  });
}

function checkRateLimit(request: Request): boolean {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
  const key = `rl_${ip}`;
  const now = Date.now();
  const bucket = requestBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    requestBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (bucket.count >= 18) return false;
  bucket.count++;
  return true;
}
