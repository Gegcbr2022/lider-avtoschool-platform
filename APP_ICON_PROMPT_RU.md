# Промт для генерации иконки приложения «Автошкола Лідер»

> Готовый промт для ChatGPT (DALL·E), Midjourney, Stable Diffusion или Adobe Firefly.
> Используйте его вместе с загруженным логотипом автошколы.

---

## Промт для AI-генерации (основной)

```
Create a mobile app icon for a Ukrainian driving school called "Лідер" (Leader).

Style requirements:
- Modern, clean mobile app icon (iOS + Android)
- Brand accent color: #ff1e1e (red) or #004d40 (deep green)
- Feeling: speed, road, confidence, trust
- NO small text — icons must be legible at 48x48px
- Simple, premium, memorable
- Suitable for both iOS rounded-rect and Android adaptive icon
- No copyright-infringing elements
- Background: clean, solid or minimal gradient

Make 4 variations:

1. MINIMAL — Abstract road or steering wheel using just geometric shapes, red or green on white/light background. Ultra clean.

2. DYNAMIC — Stylized car silhouette or "Л" letterform in motion (speed lines), bold red accent, dark background. Energy and movement.

3. PREMIUM — A shield or emblem with a subtle road/wheel element, deep green (#004d40) with gold (#ffd600) accent. Professional driving school feel.

4. FRIENDLY MASCOT — Small friendly car character "Лідик" (a cute red car with eyes), warm color palette, slightly playful. Suitable for a driving school that wants to feel approachable to young learners.

Technical specs:
- 1024x1024px canvas
- No transparency for iOS version
- Safe zone: keep all key elements within inner 820x820px circle
- Android adaptive icon: provide foreground layer on transparent background (for #004d40 background)
- Flat design preferred, subtle shadows OK
```

---

## Промт для Midjourney

```
/imagine mobile app icon, driving school "Лідер", Ukraine, red #ff1e1e accent, steering wheel or road symbol, clean geometric design, white background, no text, 1024x1024, flat design, premium feel, Behance dribbble style --ar 1:1 --v 6
```

---

## Промт для вариации с маскотом

```
/imagine cute friendly car mascot "Лідик", small red cartoon car with big round eyes, simple clean design, Ukrainian driving school app icon, white or light background, no text, flat illustration, mobile app icon style, 1024x1024 --ar 1:1 --v 6
```

---

## Технические требования для финальной иконки

### iOS (App Store)

| Параметр | Значение |
|---|---|
| Размер | 1024×1024 px |
| Формат | PNG |
| Прозрачность | Запрещена (альфа-канал = нет) |
| Закругление | iOS добавляет автоматически |
| Safe zone | Все важные элементы в 820×820 px |

### Android (Google Play + Adaptive Icon)

| Параметр | Значение |
|---|---|
| Размер | 1024×1024 px |
| Формат | PNG |
| Тип | Adaptive Icon (foreground + background отдельно) |
| Foreground слой | Иконка на прозрачном фоне, вписана в 66% canvas (672px) |
| Background слой | Цвет `#004d40` (уже задан в `app.config.ts`) |
| Safe zone | Ключевые элементы в центральных 66% |

---

## Текущая конфигурация в проекте

```typescript
// apps/mobile/app.config.ts
android: {
  package: "ua.lider.avtoschool",
  adaptiveIcon: {
    backgroundColor: "#004d40"  // ← фон для adaptive icon
  }
}
```

Файл foreground-иконки нужно добавить в:
```
apps/mobile/assets/adaptive-icon.png   ← foreground (1024×1024, прозрачный фон)
apps/mobile/assets/icon.png            ← основная иконка (1024×1024, без прозрачности)
apps/mobile/assets/splash.png         ← splash экран
apps/mobile/assets/favicon.png        ← для веба
```

И прописать в `app.config.ts`:
```typescript
const config: ExpoConfig = {
  // ...
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#004d40"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#004d40"
    }
  }
};
```

---

## Цветовая палитра бренда

| Цвет | HEX | Использование |
|---|---|---|
| Зелёный (основной) | `#004d40` | Фон адаптивной иконки, акцент |
| Красный (CTA) | `#ff1e1e` | Активные элементы |
| Жёлтый (акцент) | `#ffd600` | Бейджи, детали |
| Графит | `#171b1a` | Текст |
| Белый | `#ffffff` | Фон |

---

## Рекомендуемый подход

1. Использовать промт выше в ChatGPT с загруженным основным логотипом
2. Выбрать из 4 вариантов или скомбинировать
3. Финальную версию передать дизайнеру для технической подготовки (safe zone, adaptive layers)
4. После готовности — добавить файлы в `apps/mobile/assets/` и обновить `app.config.ts`

---

## Связанные файлы

- `apps/mobile/app.config.ts` — конфиг приложения
- `MOBILE_PRODUCT_ROADMAP_RU.md` — дорожная карта
- `MOBILE_RELEASE_GUIDE_RU.md` — гайд по релизу в сторы
