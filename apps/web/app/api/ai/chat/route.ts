import { aiChatRequestSchema, branches } from "@lider/shared";
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
  const payload = buildCreateLeadPayload(lead, latestQuestion);

  if (!payload) {
    return { mode: "missing-required-fields", id: null };
  }

  if (!payload.consentAccepted) {
    return { mode: "missing-consent", id: null };
  }

  const apiUrl = process.env.API_URL?.replace(/\/$/, "");

  if (!apiUrl || process.env.NODE_ENV !== "production") {
    return { mode: "local-dev-fallback", id: `local-ai-${Date.now()}` };
  }

  try {
    const response = await fetch(`${apiUrl}/leads`, {
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

const leadCategories = ["A", "A1", "B", "C", "CE"] as const;

function buildCreateLeadPayload(lead: Record<string, unknown>, latestQuestion?: string) {
  const name = normalizeText(lead.name) || "AI chat lead";
  const phone = normalizeText(lead.phone) || normalizeText(lead.telegram);
  const city = normalizeText(lead.city) || "Київ";

  if (!phone) {
    return null;
  }

  const question = normalizeText(lead.question) || latestQuestion;
  const comment = normalizeText(lead.comment);
  const createdAt = new Date().toISOString();
  const contactMethod = normalizeText(lead.telegram) ? "telegram" : "phone";

  return {
    name,
    phone,
    city,
    category: normalizeCategory(lead.category),
    branchId: inferBranchId(city),
    requestType: "consultation",
    contactMethod,
    preferredContactMethod: contactMethod,
    message: [comment, question].filter(Boolean).join("\n"),
    source: "ai-chat",
    consentAccepted: lead.consentAccepted === true,
    status: "new",
    language: "uk",
    page: "/ai-chat",
    createdAt,
    updatedAt: createdAt
  };
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCategory(value: unknown) {
  return leadCategories.includes(value as (typeof leadCategories)[number]) ? value : "B";
}

function inferBranchId(city: string) {
  const normalizedCity = city.toLowerCase();
  const branch = branches.find((item) => item.city.toLowerCase().includes(normalizedCity));

  return branch?.id ?? branches[0]?.id ?? "kyiv";
}
