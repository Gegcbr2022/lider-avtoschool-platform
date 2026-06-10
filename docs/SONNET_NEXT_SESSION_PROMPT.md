# Промт для нової сесії Claude Sonnet (підготував Opus, 2026-06-11)

> Скопіюй усе нижче у нову сесію Claude Sonnet. Це точкове завдання-поліровка після Opus Project-Lead review.

---

Ти — Claude Sonnet у ролі senior React Native UI engineer та product designer. Продовжуй роботу після
Opus Project-Lead review на проекті автошколи **«Лідер»** (`c:\Avtoschool_APP`, гілка
`opus/sprint-2-game-loop`). Мова інтерфейсу — **українська**, звіти — російською. Бренд `#ff1e1e`,
маскот «Лідік». Це Expo Router + RN 19 + Firebase моно-репо (тільки npm).

## Контекст: що вже зроблено (НЕ переробляй)
- Головна (`app/(tabs)/index.tsx`) — дашборд на реальних `getUserStats`. Готово.
- Навчання (`app/(tabs)/learning.tsx`) — Opus переписав на **реальні** дані (`getUserStats` +
  `buildPdrCoachPlan(loadPdrProgress)`): етап дороги, % готовності, контекстна репліка Лідіка,
  блок «Слабкі теми» з порожнім станом. Мок «Крок 1 з 4 / 25%» прибрано. Готово.
- Тренажер ПДР (`app/(tabs)/tests.tsx`, 2243 рядки) — повний game loop: теми, марафон, екзамен МВС,
  дуель, AI-пояснення Лідіка. Готово.
- Рейтинг (`app/(tabs)/club.tsx` → `LeaderboardView`) — подіум, sticky «моє місце», сегмент
  Тиждень/Місяць/Всі, реальна агрегація `stats_<week/month>`. Готово.
- Профіль (`app/(tabs)/profile.tsx`, `_layout.tsx`) — бейдж «1» виправлено. НЕ відкочувати фільтр
  `daily-test`/`streak` у `_layout.tsx:70`.

## Твої завдання (рівно ці, по diff, без масштабного рефактора)

### Задача 1 (P1) — deep-link у Тренажер: прибрати «глухі» картки
**Проблема:** у `learning.tsx` картки «Пробний іспит» і «Тренування ПДР», а також hero-CTA, усі
викликають `router.push("/(tabs)/tests")` без параметра. `tests.tsx` не читає params → завжди
відкривається загальне меню, а не обіцяний режим.

**Зроби:**
1. У `tests.tsx` додай `const params = useLocalSearchParams<{ mode?: string; focus?: string }>()`
   (import з `expo-router`).
2. У головному компоненті екрана (там, де `startMarathon`, `coachPlan`, меню режимів — близько рядків
   1600–2200) додай `useEffect`, який один раз авто-стартує режим за `params.mode`:
   - `exam` → запустити екзамен МВС (стратифіковані 20 питань — функція вже є: `getStratifiedExamQuestions`).
   - `mistakes` → запустити роботу над помилками (`startMistakes` / існуюча логіка mistakes).
   - `topic` + `params.focus` (назва категорії) → запустити тему.
   - Гард: стартувати лише якщо `quizState === "idle"` і ще не стартували (через `useRef` прапорець),
     щоб back/повторний фокус не перезапускав вікторину.
3. У `learning.tsx` онови маршрути:
   - hero-CTA: для готового учня → `/(tabs)/tests?mode=exam`; інакше → `/(tabs)/tests`.
   - картка «Пробний іспит» → `/(tabs)/tests?mode=exam`.
   - картки «Слабкі теми» (рядки топіків) → `/(tabs)/tests?mode=mistakes`.

**Acceptance:** тап «Пробний іспит» одразу відкриває екзамен (20 питань, таймер), а не меню;
тап слабкої теми → робота над помилками; back повертає в меню без зациклення; гість не падає.

### Задача 2 (P2) — Лідік як проводник: єдині контекстні репліки
**Проблема:** репліки Лідіка хардкодяться по екранах; `LidikGuide` рендерить лише статичний текст.

**Зроби:**
1. Створи `apps/mobile/lib/lidik-tips.ts` з `getContextualLidikTip(screen, ctx)`, де
   `screen: "home" | "learning" | "tests" | "rating" | "profile"` і
   `ctx: { started: boolean; examReady: boolean; recommendedCategory?: string | null; rank?: number | null }`.
   Поверни коротку українську репліку (1 речення) під ситуацію. Приклади тону — у
   `docs/LIDIK_COACH_CONCEPT.md` (якщо нема — у промті власника). Без інфантильності, без тиску.
2. Підключи у `learning.tsx` (hero вже бере `plan.summary` — можеш лишити або замінити на helper для
   єдиного стилю) і в порожньому стані рейтингу `club.tsx`. **Не чіпай** AI-чат Лідіка в `tests.tsx`
   (`LidykExplainModal`) і вкладку `assistant` — це окремий живий функціонал.

**Acceptance:** репліки відповідають стану учня (новачок / тренується / готовий до іспиту), один
джерело правди, без дублювання рядків по екранах.

### Задача 3 — фінальна поліровка (light + dark, малі екрани)
- Прогон по екранах Головна / Навчання / Тренажер / Рейтинг / Профіль у **light і dark**.
- Жодних хардкод-кольорів поза легітимними (знаки ПДР на кольоровому фоні — ок). Решта — токени теми.
- Touch targets ≥ 44px, тексти не обрізаються на вузькому Android (≤360dp).

## Команди перевірки (саме ці)
```
npm run typecheck                                   # root, має бути exit 0
cd apps/mobile && npx tsc -p tsconfig.json --noEmit  # mobile, exit 0
```
APK + ADB (за наявності): див. `docs/ANDROID_QA_ADB.md`. Пакет `ua.lider.avtoschool`.

## Заборони
- Не переписувати game loop / leaderboard / badge-логіку — вони готові.
- Не вводити мок-дані. Не хардкодити кольори/секрети.
- Не відкочувати фільтр бейджа в `_layout.tsx:70`.
- Не робити масовий рефактор; працюй мінімальним diff.

## Формат звіту
1. Таблиця змінених файлів (файл / зміна / причина).
2. Результат `typecheck` (root + mobile) з exit-кодами.
3. Скрін/ADB-нотатки light+dark (якщо запускав).
4. Що НЕ вдалось перевірити — чесно.
