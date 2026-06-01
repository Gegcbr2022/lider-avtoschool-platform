# Security

## Controls In Place

- TypeScript strict mode.
- Zod validation for public API payloads.
- Firestore and Storage rules with RBAC boundaries.
- Basic API rate limiting.
- Environment-based domain and API configuration.
- Provider secrets kept out of source control.

## Production Checklist

- Enable Firebase App Check for web and mobile clients.
- Store secrets in Firebase, Vercel, Netlify or cloud secret manager.
- Add audit log writes for staff mutations.
- Add webhook signature verification for payment providers and Telegram.
- Add Sentry and PostHog only after privacy review.
- Run dependency scanning and security review before production release.

## Current Dependency Audit

`npm audit fix` was run without force. It removed the high-severity Firebase CLI tar finding by upgrading `firebase-tools`. Remaining moderate findings are transitive advisories in Next/Expo/Firebase dependency trees where npm currently proposes breaking downgrades or provider-level fixes. Do not run `npm audit fix --force` without validating framework compatibility.
