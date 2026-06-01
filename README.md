# Автошкола «Лідер» Platform

Production-oriented monorepo for the public site, CRM/admin panel, student mobile app, Firebase API, shared domain packages, infrastructure and documentation.

## Apps

- `apps/web` - Next.js public website with SEO-ready pages and lead capture.
- `apps/admin` - Next.js CRM/admin workspace for leads, students, bookings, payments and LMS progress.
- `apps/mobile` - Expo Router student app shell for Android and iOS.
- `apps/api` - Firebase Cloud Functions API with validated endpoints.

## Packages

- `packages/types` - shared TypeScript contracts.
- `packages/shared` - business data, validation schemas and sample domain state.
- `packages/ui` - shared design tokens and React UI primitives.
- `packages/config` - environment and deployment configuration helpers.

## Quick Start

```bash
npm install
npm run typecheck
npm run dev:web
```

Copy `.env.example` to `.env.local` for local web/admin development and to platform-specific secret stores for deployed environments.

## Publishing

- GitHub setup: `docs/GITHUB_PUBLISH.md`
- Mobile store release: `docs/STORE_RELEASE.md`
- Full audit: `PROJECT_AUDIT.md`
- Release status: `FINAL_RELEASE_REPORT.md`
