# Agent Tasks — Codex

Codex = инженер по точечным изменениям (логика, безопасность, push, платежи, бронь). Отдельная
ветка/эпик, маленькие коммиты блоками. Не трогает секреты/prod Firebase без явного чекпоинта.
UI-полировку оставляет Sonnet.

## Жёсткие правила
- Читать сначала: `docs/PROJECT_AUDIT_2026.md`, `docs/BUGS_AND_RISKS.md`, `docs/ROADMAP_2026.md`,
  `C:\AI_Brain\Projects\Lider\MasterPlan_Opus_Audit_2026-06-08.md`.
- Не ломать функционал; не хардкодить ключи; env только через `.env.example`.
- После каждого блока: `npm run typecheck --workspace @lider/mobile` (+ lint/test где есть);
  для mobile — пересборка APK и ADB-smoke (см. `docs/ANDROID_QA_ADB.md`) + logcat без FATAL.
- В конце — отчёт `git diff --stat` + список изменений + следующий промт.
- **Искать смежные баги, а не только заданные.**

## Очередь (Sprint 1 → далее)
1. **Рейтинг ПДР рерайт** `app/(tabs)/club.tsx:942 LeaderboardView` — подиум топ-3, закреплённая
   строка «Ваше місце», окна Тиждень/Місяць/Всі, порог честности (`totalAnswered≥20` для accuracy),
   бренд-красный, solo/empty-CTA «запроси друзів». Данные уже реальные (`getLeaderboard`). Не вводить мок.
2. **B-07/B-08** — daily/streak readAt при повторной доставке; начать миграцию RNFirebase на модульный API.
3. **Бронь** `app/booking.tsx` — реальные слоты + статус-флоу `pending→confirmed→completed` + push-триггер.
4. **Crashlytics** — `@react-native-firebase/crashlytics` + ключевые события.
5. **App Check** код — убедиться, что инициализация до первых запросов; добавить graceful-degrade в monitor.
6. **Платёжный слой** (когда владелец даст ключи) — провайдер-абстракция, вебхук с проверкой подписи, `payments` rules.

## ГОТОВЫЙ ПРОМТ (вставить в Codex)
```
Ты — Codex, инженер проекта «Лідер» (монорепо npm-workspaces, Expo Router mobile + Next web/admin + Firebase Functions).
Рабочая папка: C:\Avtoschool_APP. Ветка: создай codex/sprint-1-rating от main.

ШАГ 0. Прочитай: docs/PROJECT_AUDIT_2026.md, docs/BUGS_AND_RISKS.md, docs/MOBILE_UX_AUDIT.md,
docs/ROADMAP_2026.md, docs/ANDROID_QA_ADB.md и C:\AI_Brain\Projects\Lider\MasterPlan_Opus_Audit_2026-06-08.md.
Сделай git status; зафиксируй baseline.

ЗАДАЧА (Sprint 1): переписать экран рейтинга ПДР в app/(tabs)/club.tsx (функция LeaderboardView, ~строка 942).
Требования:
- Подиум топ-3 (центр выше, 🥇🥈🥉, аватар, % крупно), аккуратно бренд-красный + золото.
- Список 4..N компактными строками.
- Закреплённая нижняя плашка «Ваше місце: #N» + дельта «+X щоб обігнати <ім'я>».
- Переключатель окон: Тиждень / Місяць / Всі (если нет данных по окнам — отметь TODO и используй всё-время, но НЕ фейк).
- Честность: для сортировки по точності — порог totalAnswered≥20, иначе лига «Новачки».
- Solo/empty-state: дружелюбный, кнопка Share (handleReferral уже есть). Не выдавать одинокого юзера как чемпиона.
- Реплика Лідіка с мотивацией. Тема light+dark. Украинский. Никакого мока.

ПРАВИЛА: маленькие коммиты; не трогай _layout.tsx бейдж и index.tsx карточки (уже исправлены Opus);
не вводи мок-данные; не меняй Firestore-структуру без причины (если нужно — getLeaderboard в lib/firestore.ts).
После: npm run typecheck --workspace @lider/mobile; пересобери APK; ADB-smoke по docs/ANDROID_QA_ADB.md;
logcat без FATAL; сделай скриншоты рейтинга (light+dark). 

ОТЧЁТ: git diff --stat, список изменений, что проверено на устройстве, найденные смежные баги,
и СЛЕДУЮЩИЙ промт (для пункта 3 — бронь). Останься в рамках задачи; не делай UI-«красоту» сверх требований — это сделает Sonnet.
```
