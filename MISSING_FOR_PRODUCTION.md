# Missing For Production

Актуальный список недостающих production-блоков для платформы автошколы "Лідер".
Дата ревизии: 2026-06-08. Источник истины по mobile: установленный APK + ADB-smoke.

## P0 / P1 Перед Релизом

- Admin 2FA для ролей `admin` и `manager`: Firebase MFA или TOTP-gate в админке.
- Backup runbook: `docs/BACKUP.md` с PITR, ежедневным экспортом и проверкой восстановления.
- Rules tests: emulator-проверки для `payments`, `userBonuses` и чувствительных коллекций.
- Guest empty states: убрать мок-прогресс на production-экранах mobile для гостя.
- Push: заменить stub `expo-notifications` на FCM/Notifee-совместимый поток.
- Payments: включить реального провайдера только после ключей владельца; сейчас провайдеры безопасно остаются stub.
- Release credentials: production Android keystore, Play Console, privacy/terms URL; iOS требует Apple Developer.
- Crashlytics/Analytics: подключить после подтверждения Firebase-настроек.

## Уже Подключено

- Admin AuthGate: `apps/admin/app/page.tsx` закрывает CRM через `AuthGate` и custom claim `role`.
- Firestore `aiLogs`: правило требует Firebase Auth, включая anonymous auth для гостей.
- Web lead documents: загрузка файлов подключена к Firebase Storage через `apps/web/lib/storage-upload.ts`.
- Lead document metadata: `apps/web/app/api/leads/documents/route.ts` best-effort отправляет metadata в API.
- Storage rule для публичных документов: `lead-documents/{leadId}/{fileName}` разрешает create для image/pdf до 10 MB.
- Mobile НАІС-документы: `student-documents/{uid}` и `naisData/{uid}` защищены owner/staff rules.

## Риски И Owner Actions

- Public upload в `lead-documents` чувствителен к квоте Storage. Перед масштабным трафиком включить App Check enforce или backend signed upload/session.
- 2FA в Firebase MFA может потребовать включения Identity Platform в Firebase Console.
- Backup/PITR заявлены как включенные в инфраструктурной памяти проекта, но нужен документированный runbook и регулярный restore-drill.
- Платежи, партнеры, видео-контент, AI-бюджет, Play/App Store credentials и Telegram broadcast права остаются на владельце.

## Проверять Перед Production

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- Mobile release build: `$env:EXPO_NO_METRO_WORKSPACE_ROOT = "1"; .\gradlew.bat assembleRelease`
- ADB install/smoke установленного APK и logcat без `FATAL EXCEPTION`.
