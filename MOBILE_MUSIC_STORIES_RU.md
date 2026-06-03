# Музыка для Stories — Архитектура и Ограничения

> Объясняем, почему нельзя просто «встроить Spotify как в TikTok», и что использовать вместо этого.

---

## Почему Spotify / Apple Music нельзя встроить как TikTok

TikTok имеет **лицензионные соглашения** с мейджор-лейблами (Universal, Sony, Warner) и независимыми издателями. Это многомиллионные сделки, позволяющие воспроизводить музыку в своём приложении.

### Что нельзя делать без лицензии

| Действие | Статус |
|---|---|
| Воспроизводить треки Spotify/Apple Music в своём приложении | ❌ Запрещено |
| Использовать Spotify/Apple Music аудио как фон для Stories | ❌ Нарушение ToS |
| Скачивать треки для оффлайн-использования в Stories | ❌ Запрещено |
| Использовать full-длину треков без лицензии | ❌ DMCA / авторские права |

### Что разрешено

| Действие | Статус |
|---|---|
| Открывать Spotify/Apple Music трек как deep link | ✅ Разрешено |
| Показывать 30-секундный preview (если API это предоставляет) | ✅ Разрешено (Spotify Web API) |
| Использовать royalty-free музыку | ✅ Разрешено |
| Загружать собственные треки (с правами) | ✅ Разрешено |
| Использовать YouTube Music API / Embed (с ограничениями) | ⚠️ Требует проверки ToS |

---

## Варианты реализации

### Вариант 1: Royalty-Free (рекомендуется для старта)

**Ресурсы:**
- **Pixabay Music** (бесплатно, нет атрибуции для коммерческого) → https://pixabay.com/music/
- **Free Music Archive** → https://freemusicarchive.org
- **ccMixter** (Creative Commons) → https://ccmixter.org
- **Incompetech** (Kevin MacLeod) → https://incompetech.com

**Подготовка:**
1. Загрузить 5-10 коротких треков (30-60 секунд) в Firebase Storage
2. Хранить в `audio/stories/{trackId}.mp3`
3. Сделать публично доступными (Storage Rules)
4. В мобильном приложении — воспроизводить через `expo-av`

```typescript
// Будущая интеграция с expo-av
import { Audio } from "expo-av";

async function playStoryTrack(url: string) {
  const { sound } = await Audio.Sound.createAsync({ uri: url });
  await sound.playAsync();
  return sound; // сохранить для остановки
}
```

**Стоимость:** бесплатно (Pixabay), Firebase Storage ~$0.026/GB/мес

---

### Вариант 2: Spotify Deep Link (только ссылка, без воспроизведения)

Пользователь видит "🎵 Drive Mood" → тап → открывается Spotify.

```typescript
import { Linking } from "react-native";

// Открыть трек в Spotify
Linking.openURL("spotify:track:TRACK_ID");
// или в браузере
Linking.openURL("https://open.spotify.com/track/TRACK_ID");
```

**Ограничения:** пользователь должен иметь Spotify. Аудио НЕ воспроизводится внутри приложения.

---

### Вариант 3: Spotify Web API Preview (30 сек)

Spotify API предоставляет `preview_url` — 30-секундный превью трека в MP3.

**Проблема:** нужна регистрация приложения в Spotify Developer Dashboard + OAuth. Не факт, что это разрешено для use-case "фон для Stories" — нужно проверять ToS.

```typescript
// Получить preview URL
const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
  headers: { Authorization: `Bearer ${accessToken}` }
});
const track = await response.json();
const previewUrl = track.preview_url; // может быть null
```

---

### Вариант 4: Партнёрский музыкальный каталог

Сервисы для работы с лицензионной музыкой в приложениях:
- **Epidemic Sound** — $15/мес, api.epidemicsound.com
- **Artlist** — лицензия для приложений
- **Soundtrack by Twitch** — для прямых трансляций
- **Musicbed** — для коммерческих продуктов

**Когда использовать:** при наличии >10k MAU и желании монетизации через Stories.

---

## Текущая реализация в приложении

### Архитектура типов (готова)

```typescript
// apps/mobile/lib/mobile-data.ts

export type StoryMusicSource = "local" | "royalty_free" | "spotify_link" | "apple_music_link" | "custom_upload";

export type StoryMusicTrack = {
  id: string;
  title: string;
  artist?: string;
  source: StoryMusicSource;
  previewUrl?: string;
  externalUrl?: string;
  durationSec?: number;
  license: "mock" | "royalty_free" | "licensed" | "external_link_only";
  mood: "drive" | "calm" | "victory" | "city" | "meme";
};
```

### Текущие mock-треки

| Название | Настроение | Источник |
|---|---|---|
| Drive Mood | 🚗 drive | mock |
| First Ride | 😌 calm | mock |
| Місто чекає | 🌆 city | mock |
| No Panic Parking | 😎 meme | mock |
| Права в Дії | 🏆 victory | mock |
| Road Trip | 🚗 drive | royalty_free (Pixabay) |

---

## Что нужно сделать для production

### Шаг 1: Добавить `expo-av`

```bash
npx expo install expo-av
```

Обновить `apps/mobile/package.json` и пересобрать (`expo prebuild`).

### Шаг 2: Загрузить royalty-free треки

1. Скачать 5+ треков с Pixabay Music
2. Загрузить в Firebase Storage: `audio/stories/`
3. Обновить `storyMusicTracks` в `mobile-data.ts` с реальными `previewUrl`

### Шаг 3: Реализовать плеер

```typescript
// apps/mobile/lib/audio.ts
import { Audio } from "expo-av";

let currentSound: Audio.Sound | null = null;

export async function playTrack(url: string) {
  await stopTrack();
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  const { sound } = await Audio.Sound.createAsync({ uri: url });
  currentSound = sound;
  await sound.playAsync();
}

export async function stopTrack() {
  if (currentSound) {
    await currentSound.stopAsync();
    await currentSound.unloadAsync();
    currentSound = null;
  }
}
```

### Шаг 4: Music Picker UI

Добавить секцию в Create Story sheet:
- Горизонтальный список треков
- Иконка 🎵 + название
- Визуализатор (mock progress bar)
- Кнопка Preview (если `previewUrl` есть)

---

## ENV для будущих интеграций

| ENV | Где | Назначение |
|---|---|---|
| `EXPO_PUBLIC_SPOTIFY_CLIENT_ID` | Vercel + Mobile | Spotify Web API |
| `SPOTIFY_CLIENT_SECRET` | Firebase Functions | Server-side Spotify auth |
| `EPIDEMIC_SOUND_API_KEY` | Firebase Functions | Epidemic Sound catalog |
| `FIREBASE_STORAGE_BUCKET` | Firebase Functions | Уже есть — для audio upload |

---

## TL;DR — Что делать прямо сейчас

1. **Сейчас**: использовать mock названия треков (уже реализовано) + показывать в Story viewer
2. **Следующий шаг**: добавить `expo-av` + 3-5 Pixabay треков в Firebase Storage
3. **При росте (>5k MAU)**: Epidemic Sound ($15/мес) для полноценного каталога
4. **NOT до того**: не встраивать Spotify/Apple Music напрямую без лицензионного соглашения

---

## Файлы проекта

- `apps/mobile/lib/mobile-data.ts` → `StoryMusicTrack`, `storyMusicTracks`
- `apps/mobile/app/(tabs)/club.tsx` → StoryViewer, CreateStorySheet (music badge)
- `MOBILE_PRODUCT_ROADMAP_RU.md` → Фаза 3 (Stories)
