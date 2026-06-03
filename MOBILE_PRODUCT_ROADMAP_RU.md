# Дорожная карта мобильного приложения — Автошкола «Лідер»

> Продуктовая стратегия: от кабинета ученика до живого клуба водителей.
> Цель: приложение, в которое хочется возвращаться каждый день — не только на время учёбы.

---

## Текущий статус: Driver Club + Stories prototype

Приложение работает как Expo managed workflow. Вкладки: Головна, Навчання, Практика, Тести, Клуб, Помічник, Кабінет.

---

## Фаза 1 — MVP (Кабінет учня) ✅

| Функция | Статус |
|---|---|
| Прогресс обучения (теория/практика) | ✅ mock |
| Расписание занятий | ✅ mock |
| Документы учня | ✅ mock |
| Уведомления | ✅ mock |
| Реферальный код | ✅ mock |
| ПДР тренажёр (тесты) | ✅ mock |
| Навигация 7 табов | ✅ готово |
| Записаться на практику | ✅ UI готово |
| Оплата | ✅ mock, провайдеры не подключены |

---

## Фаза 2 — Driver Club ✅

| Функция | Статус |
|---|---|
| Streak (серия дней) + progress bar | ✅ |
| Ежедневный тест ПДР | ✅ |
| Маскот «Лідик» (адаптивные сообщения) | ✅ |
| 25 наград по 7 категориям | ✅ mock |
| Клубная лента (4 поста) | ✅ mock |
| Подсказка дня | ✅ |
| Чек-лист водія | ✅ mock |
| Реферальный блок | ✅ mock |
| MascotMessage компонент | ✅ reusable |

---

## Фаза 3 — Stories + Community + AI 🚧 (prototype)

| Функция | Статус |
|---|---|
| Stories row (горизонтальная лента) | ✅ mock |
| Story Viewer (полноэкранный просмотр) | ✅ mock |
| Create Story sheet (шаблоны) | ✅ prototype |
| Музыкальные бейджи в stories | ✅ mock titles |
| Lidyk AI assistant (quick prompts) | ✅ mock responses |
| Mascot error/empty states (9 состояний) | ✅ reusable |
| Фильтры наград по категориям | ✅ |
| ClubThreadPost тип для Firestore | ✅ schema ready |
| ClubStory тип для Firestore | ✅ schema ready |
| Реальная загрузка медиа | ❌ нужен backend |
| Модерация контента | ❌ нужен backend |
| Комментарии | ❌ нужен backend |
| AI API (OpenAI/Claude) | ❌ нужен API key |
| Права на музыку | ❌ только mock titles |

---

## Фаза 4 — Push Notifications

| Функция | Когда |
|---|---|
| Напоминание про streak | После Firestore sync |
| "Серія під загрозою" за 2ч до полуночи | push trigger |
| Новый пост в клубной ленте | опционально |
| Расписание занятий | push от менеджера |
| Новая награда разблокирована | event trigger |

**Зависимости:**
- `expo-notifications`
- FCM токен при регистрации
- `google-services.json` / `GoogleService-Info.plist`

---

## Фаза 5 — Firestore sync (backend)

| Данные | Firestore collection |
|---|---|
| Streak + лучший результат | `clubUsers/{userId}/streak` |
| Прогресс наград | `clubUsers/{userId}/awards` |
| Stories | `stories/{storyId}` (TTL 24h) |
| Лента постов | `clubPosts/{postId}` |
| Чек-лист | `clubUsers/{userId}/checklist` |
| AI история чата | опционально |

**Matching:**  
Связь по `phoneNormalized` с `leads` и `clients` (см. `CLIENT_DB_ARCHITECTURE_RU.md`)

---

## Фаза 6 — Модерация

> Stories и лента требуют модерации перед публичным запуском.

| Механизм | Приоритет |
|---|---|
| Кнопка «Поскаржитися» на пост | Высокий |
| Модерация Stories перед публикацией | Высокий |
| Автоматическая фильтрация токсичного контента | Средний |
| Верификация «Выпускник» (по leadId) | Средний |
| Бан/мьют пользователей | Низкий |
| Панель модератора в admin CRM | Низкий |

---

## Фаза 7 — Монетизация и реферальная механика

| Функция | Описание |
|---|---|
| Реферальный код | ✅ UI готово, нужен Firestore |
| Бонус за реферала | скидка или доп. занятие |
| Клубная карта выпускника | NFT-like visual badge |
| Premium доступ к расширенным тестам | будущее |
| Страховые партнёры | блок «Корисні послуги» |

---

## Фаза 8 — Telegram-бот интеграция

Связь мобильного приложения с ботом через Firestore:

```
Mobile app → Firestore (clubUsers, leads, clients)
Telegram bot → Firestore (botUsers)
matching: phoneNormalized
```

Подробно: `CLIENT_DB_ARCHITECTURE_RU.md`

---

## Фаза 9 — Safety & Privacy

| Пункт | Статус |
|---|---|
| Данные пользователя только для себя | нужен Firebase Auth |
| Stories: только для залогиненных | нужен auth guard |
| GDPR/ЗПД: право на удаление данных | нужна реализация |
| Медиа загрузка: безопасное хранение | Firebase Storage rules |
| Персональные данные не в Stories | policy |
| Музыка: только licensed/royalty-free | перед продакшн |

---

## Фаза 10 — Production release

| Шаг | Гайд |
|---|---|
| Android APK debug (BlueStacks) | `LOCAL_ANDROID_BUILD_RU.md` |
| Android AAB + Google Play | `MOBILE_RELEASE_GUIDE_RU.md` |
| iOS IPA + App Store | `MOBILE_RELEASE_GUIDE_RU.md` |
| App icon генерация | `APP_ICON_PROMPT_RU.md` |
| Firebase config | `google-services.json` + `GoogleService-Info.plist` |

---

## Архитектурные принципы

### Почему Expo (managed workflow)
- Нет нативного кода вручную
- `expo prebuild` генерирует android/ и ios/ автоматически
- EAS Build для облачных сборок
- `expo-notifications`, `expo-router`, `expo-constants` из коробки

### Почему Firestore (не своя БД)
- Единый источник данных для web, mobile, Telegram-бота
- Realtime listeners для streak и постов
- Security Rules на уровне документов

### Удержание пользователей (engagement)
- **Daily habit**: streak → ежедневный возврат
- **Progress gamification**: награды + прогресс-бары → желание разблокировать
- **Social proof**: stories выпускников → мотивация для текущих учеников
- **Community**: лента постов → ощущение принадлежности
- **Mascot Лідик**: мягкие напоминания, не токсичные
- **AI помощник**: снижение барьера для вопросов
- **Referral**: пользователь становится каналом привлечения

---

## Метрики продукта

| Метрика | Цель |
|---|---|
| DAU/MAU ratio | > 30% (healthy habit app) |
| Streak retention (d7) | > 40% |
| Story creation rate | > 5% MAU |
| Awards earned per user (monthly) | > 2 |
| AI assistant prompts per session | > 1 |
| Referral conversion | > 5% от кода |

---

## Файлы проекта

| Файл | Описание |
|---|---|
| `LOCAL_ANDROID_BUILD_RU.md` | Сборка APK локально (Windows + BlueStacks) |
| `MOBILE_RELEASE_GUIDE_RU.md` | Релиз в Google Play + App Store через EAS |
| `APP_ICON_PROMPT_RU.md` | Промт для генерации иконки приложения |
| `CLIENT_DB_ARCHITECTURE_RU.md` | Архитектура Firestore для web + mobile + bot |
| `DEPLOY_STRATEGY_RU.md` | Vercel + Firebase vs VPS |
| `MISSING_FOR_PRODUCTION.md` | Текущий статус всех компонентов |
