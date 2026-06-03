import { NextResponse } from "next/server";

export const runtime = "nodejs";

const requestBuckets = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowRequest(ip)) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  const question = typeof (body as Record<string, unknown>)?.question === "string"
    ? ((body as Record<string, unknown>).question as string).trim()
    : "";

  if (!question || question.length < 2 || question.length > 500) {
    return NextResponse.json({ error: "Invalid question" }, { status: 422 });
  }

  if (!process.env.API_URL) {
    return NextResponse.json({ answer: "Лідик зараз недоступний. Спробуй пізніше!", mode: "fallback" });
  }

  const apiResponse = await fetch(`${process.env.API_URL.replace(/\/$/, "")}/ai/lidyk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  }).catch(() => null);

  if (!apiResponse?.ok) {
    return NextResponse.json({ answer: "Лідик думає... Спробуй ще раз! 🚗", mode: "fallback" });
  }

  const data = await apiResponse.json() as Record<string, unknown>;
  return NextResponse.json(data);
}

function allowRequest(ip: string) {
  const now = Date.now();
  const bucket = requestBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    requestBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (bucket.count >= 15) return false;
  bucket.count += 1;
  return true;
}
