# Firebase / App Check / Release — что владелец донастраивает руками

> Код не может это сделать — нужны действия в консолях. Отмечай ✅ по мере выполнения.
> Секреты НЕ коммитить: только в `.env`/Vercel/Firebase secrets.

## A. App Check (горящее — на эмуляторе сейчас 403)

В логах: `RNFBAppCheck ... 403 App attestation failed` каждые ~4 мин. Это значит App Check
сконфигурирован, но окружение не аттестовано.

1. ☐ **Решить режим:** Firebase Console → App Check → API (Firestore, Storage, Functions):
   - **Monitor** (рекомендую сейчас) — собирать метрики, НЕ блокировать. Безопасно для текущих юзеров.
   - **Enforce** — включать только когда уверены, что все клиенты шлют валидный токен.
2. ☐ **Android Play Integrity:** App Check → Apps → Android (`ua.lider.avtoschool`) → включить
   **Play Integrity**. Добавить SHA-256 приложения (из keystore) в Project Settings → Android app.
3. ☐ **Debug-token для эмулятора/дев-устройства:** запустить debug-сборку, в logcat найти строку
   `Enter this debug secret into the allow list: <TOKEN>` → App Check → Manage debug tokens → добавить.
   (Без этого эмулятор всегда будет 403 — это норм для прод-сборки на эмуле.)
4. ☐ Проверить, что `lib/appCheck.ts` инициализируется до первых запросов Firestore/Storage.

## B. Подпись и релиз Android

5. ☐ **Production upload keystore** (сейчас debug-подпись!): `keytool -genkey -v -keystore lider-upload.jks ...`
   Хранить вне репо. Прописать в EAS credentials или `android/app/build.gradle` signingConfigs (через env).
6. ☐ **SHA-1 и SHA-256** upload+app-signing ключей → Firebase Console (для Google Sign-In и App Check).
7. ☐ **Google Play Console:** создать приложение `ua.lider.avtoschool`, заполнить листинг
   (скриншоты есть в репо), Data Safety, контент-рейтинг, privacy URL.
8. ☐ Включить **Play App Signing**; добавить полученный SHA-256 в Firebase.

## C. Auth

9. ☐ **Anonymous Auth** — включён (на нём держится правило `aiLogs`). Не выключать.
10. ☐ **Google Sign-In** — Web + Android Client IDs корректны; SHA добавлены.
11. ☐ **Email Templates** (verify/reset) — кастомизировать под бренд + SPF/DKIM домена, чтобы письма
    не уходили в спам (известная проблема).
12. ☐ Решить **SMS OTP** (ТЗ 1.А): Firebase Phone Auth → reCAPTCHA/App Check + квоты.

## D. Данные / бэкап / безопасность (по памяти — уже сделано, проверить)

13. ☑ PITR + ежедневные бэкапы включены — **проверить** неудаляемость старого бэкапа (ТЗ A3):
    экспорт в отдельный bucket с retention lock / отдельные права.
14. ☑ Admin-claim выдан владельцу; TOTP MFA для staff (коммит `cec842b`).
15. ☐ Firestore/Storage rules — прогнать тесты: `npm run test:rules` (эмулятор Firestore).
16. ☐ Убедиться, что в проде нет sensitive `console.log`.

## E. Платежи (blocked — деньги)

17. ☐ Эквайринг: **Monobank Acquiring** (рекоменд.) — токен/мерчант; вебхук-URL + проверка подписи.
18. ☐ Apple Pay / Google Pay merchant ID.
19. ☐ Цены курса, «Лідер+», условия рассрочки → `packages/shared/src/index.ts`.

## F. Аналитика / мониторинг

20. ☐ **Crashlytics** (`@react-native-firebase/crashlytics`) — подключить + dSYM/mapping upload.
21. ☐ Analytics / PostHog / GA4 — события воронки (опц.).
22. ☐ Sentry (web/admin) — опц.

## G. Контент и интеграции (blocked на владельце)

23. ☐ Видео-уроки (ссылки/файлы) + полный текст ПДР по разделам.
24. ☐ Партнёры: страховщик/брокер, юрист, СТО/мойки (revenue share).
25. ☐ Telegram bot: права на broadcast/канал, включить Topics (TG-мост уже в API).
26. ☐ Реальные слоты инструкторов (календарь) для брони.

## H. Окружения / домены

27. ☐ Проверить, что mobile `API_URL` указывает на **prod** Functions (по памяти был DEV).
28. ☐ Vercel env (web/admin) — prod значения; домен-алиас.
29. ☐ Firebase project: dev/staging/prod разделение (если нужно).
