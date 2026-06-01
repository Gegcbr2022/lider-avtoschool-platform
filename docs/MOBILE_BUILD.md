# Mobile Build

The mobile app lives in `apps/mobile` and uses Expo Router.

## Local Development

```bash
npm install
npm run dev:mobile
```

## EAS Builds

```bash
cd apps/mobile
eas build --profile preview --platform android
eas build --profile production --platform ios
```

Before store submission, configure production icons, splash assets, privacy labels, push notification credentials, Apple signing and Google Play service account access.
