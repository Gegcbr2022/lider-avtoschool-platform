import { aiChatRequestSchema } from "@lider/shared";
import { NextResponse } from "next/server";
import { createAiAnswer } from "../../../../lib/ai-assistant";

export const runtime = "nodejs";

const requestBuckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  if (!allowRequest(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = aiChatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid AI payload", issues: parsed.error.flatten() }, { status: 422 });
  }

  const result = await createAiAnswer(parsed.data.messages);
  const leadPersistence = parsed.data.lead
    ? await persistAiLead(parsed.data.lead, parsed.data.messages.at(-1)?.content)
    : null;

  return NextResponse.json({
    answer: result.answer,
    mode: result.mode,
    model: result.model,
    context: result.context.map((item) => ({ id: item.id, title: item.title })),
    leadPersistence
  });
}

function allowRequest(ip: string) {
  const now = Date.now();
  const current = requestBuckets.get(ip);

  if (!current || current.resetAt < now) {
    requestBuckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (current.count >= MAX_REQUESTS) {
    return false;
  }

  current.count += 1;
  return true;
}

async function persistAiLead(lead: Record<string, unknown>, latestQuestion?: string) {
  const payload = {
    ...lead,
    question: lead.question ?? latestQuestion,
    status: "new",
    createdAt: new Date().toISOString()
  };

  const apiUrl = process.env.API_URL?.replace(/\/$/, "");

  if (!apiUrl || process.env.NODE_ENV !== "production") {
    return { mode: "local-dev-fallback", id: `local-ai-${Date.now()}` };
  }

  try {
    const response = await fetch(`${apiUrl}/ai/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error("AI lead persistence failed", response.status, await response.text());
      return { mode: "api-error", id: null };
    }

    return await response.json();
  } catch (error) {
    console.error("AI lead persistence request failed", error);
    return { mode: "api-error", id: null };
  }
}
