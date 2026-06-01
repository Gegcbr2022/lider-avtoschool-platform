# Deployment

## Environments

Use separate Firebase projects and hosting environments:

- `dev`
- `staging`
- `production`

Copy `.firebaserc.example` to `.firebaserc` and replace project IDs.

## Required Variables

- `NEXT_PUBLIC_SITE_URL`
- `APP_DOMAIN`
- `API_URL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- provider secrets for payments, Telegram, analytics and AI

## Commands

```bash
npm ci
npm run typecheck
npm run build
firebase deploy --only functions,firestore:rules,storage
```

Deploy `apps/web` and `apps/admin` to Vercel, Netlify, Firebase Hosting or another Next.js-compatible platform. The site does not hard-code a domain; SEO and canonical URLs come from environment variables.
