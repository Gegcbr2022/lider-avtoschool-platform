import { leadFormSchema } from "@lider/shared";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = leadFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lead payload", issues: parsed.error.flatten() }, { status: 422 });
  }

  return NextResponse.json({
    id: `web-${Date.now()}`,
    status: "accepted",
    lead: parsed.data
  });
}
