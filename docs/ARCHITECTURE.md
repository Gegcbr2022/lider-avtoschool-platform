# Architecture

The platform is a monorepo with separate deployable apps and shared domain packages.

## Runtime Surfaces

- Public site: `apps/web`, Next.js App Router, SEO metadata, sitemap, lead form and content routes.
- Admin CRM: `apps/admin`, Next.js dashboard for leads, students, payments, bookings and LMS operations.
- Mobile: `apps/mobile`, Expo Router student app for Android and iOS.
- API: `apps/api`, Firebase Cloud Functions with Express and Zod validation.

## Shared Packages

- `@lider/types` owns contracts used across apps.
- `@lider/shared` owns branches, services, schemas and safe sample domain state.
- `@lider/ui` owns common React UI primitives and design tokens.
- `@lider/config` owns environment-driven URLs and domain configuration.

## Data Backbone

Firebase is the default backend:

- Authentication for admin, manager and student roles.
- Firestore for leads, students, bookings, lessons, payments and audit logs.
- Storage for student documents and public assets.
- Cloud Functions for API boundaries, webhooks, payment intents, Telegram and AI adapters.

The architecture keeps payment and AI providers behind adapter interfaces so LiqPay, Fondy, Monobank, OpenAI, Claude, Gemini, OpenRouter or local models can be replaced without rewriting product flows.
