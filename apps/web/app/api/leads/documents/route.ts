import { NextResponse } from "next/server";
import { z } from "zod";

const uploadedDocumentSchema = z.object({
  originalName: z.string().max(260),
  safeName: z.string().max(200),
  storagePath: z.string().max(400),
  contentType: z.string().max(80),
  size: z.number().nonnegative().max(10 * 1024 * 1024),
  uploadedAt: z.string().datetime()
});

const patchSchema = z.object({
  leadId: z.string().min(1).max(128),
  documents: z.array(uploadedDocumentSchema).max(8)
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }

  if (process.env.NODE_ENV === "production") {
    if (!process.env.API_URL) {
      return NextResponse.json({ error: "API_URL not configured" }, { status: 503 });
    }

    const apiResponse = await fetch(
      `${process.env.API_URL.replace(/\/$/, "")}/leads/${parsed.data.leadId}/documents`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: parsed.data.documents })
      }
    ).catch(() => null);

    // Non-critical: files are in Storage, matched by leadId path
    if (!apiResponse?.ok) {
      return NextResponse.json({ ok: true, forwarded: false });
    }

    return NextResponse.json({ ok: true, forwarded: true });
  }

  return NextResponse.json({ ok: true, forwarded: false, documents: parsed.data.documents });
}
