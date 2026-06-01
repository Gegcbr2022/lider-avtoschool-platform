import cors from "cors";
import express from "express";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { bookingRequestSchema, leadFormSchema, paymentIntentSchema } from "@lider/shared";
import { aiConsultationSchema, answerStudentQuestion } from "./ai-providers";
import { paymentProviders } from "./payment-providers";

const firebaseApp = getApps().length ? getApps()[0] : initializeApp();
const db = getFirestore(firebaseApp);
const app = express();
const requestCounts = new Map<string, { count: number; resetAt: number }>();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "2mb" }));
app.use(rateLimit);

app.get("/health", (_request, response) => {
  response.json({
    ok: true,
    service: "lider-api",
    timestamp: new Date().toISOString()
  });
});

app.post("/leads", async (request, response) => {
  const parsed = leadFormSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(422).json({ error: "Invalid lead payload", issues: parsed.error.flatten() });
    return;
  }

  const lead = {
    ...parsed.data,
    status: "new",
    source: "website",
    createdAt: new Date().toISOString()
  };

  const persistence = await persist("leads", lead);
  response.status(201).json({ id: persistence.id, persistence: persistence.mode, lead });
});

app.post("/bookings", async (request, response) => {
  const parsed = bookingRequestSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(422).json({ error: "Invalid booking payload", issues: parsed.error.flatten() });
    return;
  }

  const booking = {
    ...parsed.data,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  const persistence = await persist("bookings", booking);
  response.status(201).json({ id: persistence.id, persistence: persistence.mode, booking });
});

app.post("/payments/create-intent", async (request, response) => {
  const parsed = paymentIntentSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(422).json({ error: "Invalid payment payload", issues: parsed.error.flatten() });
    return;
  }

  const provider = paymentProviders[parsed.data.provider];
  const intent = await provider.createIntent(parsed.data);
  const persistence = await persist("paymentIntents", {
    ...parsed.data,
    ...intent,
    status: "pending",
    createdAt: new Date().toISOString()
  });

  response.status(201).json({ id: persistence.id, persistence: persistence.mode, intent });
});

app.post("/telegram/webhook", async (request, response) => {
  const payload = {
    body: request.body,
    receivedAt: new Date().toISOString()
  };
  const persistence = await persist("telegramEvents", payload);
  response.json({ ok: true, persistence: persistence.mode, id: persistence.id });
});

app.post("/ai/consult", async (request, response) => {
  const parsed = aiConsultationSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(422).json({ error: "Invalid AI payload", issues: parsed.error.flatten() });
    return;
  }

  response.json(await answerStudentQuestion(parsed.data));
});

async function persist(collection: string, payload: Record<string, unknown>) {
  try {
    const reference = await db.collection(collection).add(payload);
    return { id: reference.id, mode: "firestore" as const };
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    return { id: `local-${Date.now()}`, mode: "local-dev-fallback" as const };
  }
}

function rateLimit(request: express.Request, response: express.Response, next: express.NextFunction) {
  const key = request.ip ?? "unknown";
  const now = Date.now();
  const current = requestCounts.get(key);

  if (!current || current.resetAt < now) {
    requestCounts.set(key, { count: 1, resetAt: now + 60_000 });
    next();
    return;
  }

  if (current.count >= 120) {
    response.status(429).json({ error: "Rate limit exceeded" });
    return;
  }

  current.count += 1;
  next();
}

export const api = onRequest(
  {
    region: "europe-west1",
    maxInstances: 10,
    cors: true
  },
  app
);
