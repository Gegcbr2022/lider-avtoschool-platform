# Roadmap 2026 — Автошкола «Лідер»

Принципы: Monobank ≤3 нажатия · качество>количество · источник истины = APK+ADB · безопасность
по умолчанию · украинский основной · никаких мок-данных на проде. После каждого эпика:
`typecheck → assembleRelease → ADB-smoke → Changelog`.

## Спринты

| Sprint | Цель | Ключевые задачи | Файлы | Проверки | Acceptance |
|---|---|---|---|---|---|
| **S0 Стабилизация** | Чистая база | `git status` чист, чистка корня (png/xml/log в `.gitignore`), доки=код, CI зелёный | `.gitignore`, `docs/*`, `README.md` | lint/typecheck/test/build | Зелёный CI, корень чист |
| **S1 Mobile UI critical** | Убрать «ущербность» | ✅ бейдж профиля; ✅ карточки 2×2; рерайт **рейтинга** (подиум/закреп/окна/честность/solo); empty-states | `_layout.tsx`, `index.tsx`, `club.tsx` | ADB light+dark, 360px | Рейтинг с подиумом; бейдж не горит; вау на главной |
| **S2 PDR game loop** | Удержание | Дуэли ПДР 1v1; «екзамен-режим» с таймером; «слабкі теми» по ошибкам; стрик-механика честная | `tests.tsx`, `pdr-*.ts`, `firestore.ts` | ADB | Дуэль играется; слабые темы видны |
| **S3 Лідік AI наставник** | Персонализация | План «що вчити сьогодні» из stats+ошибок; разбор ошибок; «до екзамену N днів» | `assistant.tsx`, `api` AI-роуты | ADB+API | Лідік даёт персональный план |
| **S4 Club/Stories/engagement** | Вирусность | Сторис автошколы (admin push), реакции, реферальная программа с трекингом | `club.tsx`, admin | ADB | Реферал считается; сторис от школы |
| **S5 Web conversion/SEO** | Лиды | Квиз «яка категорія?», калькулятор ціни, SEO-лендинги по містах, schema.org, city в lead | `apps/web` | Lighthouse≥90 | +конверсия, корректный source/city |
| **S6 Admin CRM** | Операционка | Pipeline статусов, источники, менеджеры, комментарии, экспорт, аналитика конверсии | `apps/admin` | — | CRM управляет лидами |
| **S7 Firebase/security/prod** | Релиз-готовность | App Check enforce-решение, prod keystore, Crashlytics, rules-тесты | `eas.json`, `appCheck.ts`, rules | `test:rules` | Подписан prod, App Check ок |
| **S8 Android release QA** | Стор | Play-листинг, версии, APK-smoke, офлайн ПДР, стресс monkey | `app.config.ts`, store | ADB monkey | Готов к Play |
| **S9 Growth/killer** | Рост | Платёжный слой (S3-деньги), дорожная карта ученика, push-кампании, агрегатор сервисов | api, mobile | e2e | Монетизация работает |

## Приоритеты «сейчас»

1. **S1** добить рейтинг (единственная крупная UI-задача, что осталась после фиксов бейджа/карточек).
2. **S7** App Check + keystore (релизный блокер, частично на владельце).
3. **S2/S3** game loop + Лідік-наставник — главный драйвер удержания и «killer» ощущения.

## Зависимости от владельца (блокируют код)

Эквайринг-ключи (S9), контент видео+ПДР (S3/S4), партнёры (страховка/юрист), Apple Dev,
Play keystore, Telegram-права. Полный список — `FIREBASE_SETUP_CHECKLIST.md` и
`C:\AI_Brain\Projects\Lider\OwnerActionRequired.md`.
