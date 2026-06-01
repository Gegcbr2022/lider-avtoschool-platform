# API

Base URL is controlled by `API_URL`.

## Endpoints

- `GET /health` - service status.
- `POST /leads` - creates a CRM lead from the public site or mobile app.
- `POST /bookings` - requests a practice slot.
- `POST /payments/create-intent` - creates a provider payment intent.
- `POST /telegram/webhook` - accepts Telegram updates.
- `POST /ai/consult` - answers a student question through an AI adapter.

## Validation

All public mutations use Zod schemas from `@lider/shared`. Invalid payloads return `422` with flattened issue details.

## Security

The API includes a basic per-IP rate limiter. Production should add Firebase App Check, Cloud Armor or hosting-level WAF rules for public endpoints.
