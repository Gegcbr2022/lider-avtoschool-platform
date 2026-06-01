import { leadFormSchema } from "@lider/shared";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = leadFormSchema.safeParse(body);

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
