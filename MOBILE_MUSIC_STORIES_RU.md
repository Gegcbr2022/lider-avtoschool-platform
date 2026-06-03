# Stories без музики — MVP як Telegram Stories

> Рішення (2026-06-03): Stories в MVP виходять без музики, як Telegram Stories. Музика — future feature.

---

## Рішення для MVP

Stories реалізовані без музики:

- Немає music badge у viewer
- Немає music picker у Create Story sheet
- `musicTitle` прибрано з типу `ClubStory`
- `mockMusicTracks`, `storyMusicTracks`, `StoryMusicTrack`, `StoryMusicSource` — видалено з коду
- `expo-av` не встановлюємо (не потрібен для MVP)

Stories MVP включає:
- Горизонтальна лента (як Telegram/Instagram)
- Fullscreen viewer з кольоровим фоном, автором, містом
- Реакції (♥ + кількість)
- Теги (теорія / практика / права / etc.)
- Create Story sheet з 6 шаблонами
- Модераційне попередження

---

## Чому музика не потрібна для запуску

| Питання | Відповідь |
|---|---|
| Чи можна запустити Stories без музики? | ✅ Так. Telegram Stories — без музики. |
| Чи є Stories без музики менш цінними? | ❌ Ні. Контент важливіший за фон. |
| Чи потрібен `expo-av` для MVP? | ❌ Ні. Тільки після додавання audio. |
| Коли музика? | Після отримання реального каталогу (royalty-free). |

---

## Чому не можна вбудувати Spotify/Apple Music як TikTok

TikTok має **ліцензійні угоди** з Universal, Sony, Warner — багатомільйонні контракти.

| Дія | Статус |
|---|---|
| Відтворювати треки Spotify/Apple Music у своєму додатку | ❌ Заборонено |
| Використовувати Spotify/Apple Music як фон Stories | ❌ Порушення ToS |
| Відкривати трек як deep link | ✅ Дозволено |
| Використовувати royalty-free музику | ✅ Дозволено |

---

## Future: як додати музику після MVP

### Варіант 1 (рекомендовано): Royalty-Free каталог

Ресурси:
- **Pixabay Music** — безкоштовно, без атрибуції для комерційних → pixabay.com/music
- **Free Music Archive** → freemusicarchive.org
- **Incompetech** (Kevin MacLeod) → incompetech.com

Кроки:
1. Завантажити 5-10 коротких треків (30-60 сек) у Firebase Storage
2. Зберігати в `audio/stories/{trackId}.mp3`
3. Додати `expo-av` (`npx expo install expo-av`)
4. Оновити `ClubStory` тип — додати `musicUrl?: string` (не `musicTitle`)

### Варіант 2: Spotify Deep Link (тільки посилання)

Користувач бачить "🎵 Drive Mood" → тап → відкривається Spotify.
Аудіо НЕ відтворюється всередині додатку.

### Варіант 3 (при >10k MAU): Партнерський каталог

- **Epidemic Sound** — $15/міс, api.epidemicsound.com
- **Artlist** — ліцензія для додатків

---

## Stories MVP можна виходити вже зараз

✅ Mock медіа/картки замість реального upload  
✅ Реакції  
✅ Шаблони (6 штук)  
✅ Теги  
✅ Create Story sheet  
✅ Модераційне попередження  
❌ Музика — не в MVP, можлива пізніше через royalty-free/licensed каталог  
❌ Реальний upload фото/відео — потребує Firebase Storage + модерація

---

## Файли проекту

- `apps/mobile/lib/mobile-data.ts` → `ClubStory` (без `musicTitle`), `mockStories`
- `apps/mobile/app/(tabs)/club.tsx` → `StoryViewer`, `CreateStorySheet` (без music UI)
- `MOBILE_PRODUCT_ROADMAP_RU.md` → Фаза 3 (Stories)
- `MISSING_FOR_PRODUCTION.md` → статус Stories та music
