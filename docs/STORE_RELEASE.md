# Store Release

The mobile app is an Expo Router app that can produce both Android and iOS builds through EAS.

## Accounts Needed

- Expo account.
- Apple Developer Program membership for iOS.
- Google Play Console account for Android.
- Firebase project for Auth, Firestore, Storage, Cloud Functions and push notification credentials.

## Build Commands

```bash
cd apps/mobile
npx eas login
npx eas build:configure
npx eas build --profile preview --platform android
npx eas build --profile preview --platform ios
npx eas build --profile production --platform all
```

## Before Submission

- Replace placeholder icon/splash assets with final brand assets.
- Configure privacy labels for App Store.
- Add Google Play data safety declarations.
- Configure push notification credentials.
- Set production `API_URL`.
- Test login, documents, booking, payments and notifications on real devices.
