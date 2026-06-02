# MOBILE UI POLISH REPORT

Дата: 2026-06-02

## Что было сломано

- В шапке использовалась текстовая имитация логотипа с буквой `Л`, а не реальный файл бренда.
- Мобильное меню рендерилось внутри sticky-header с `backdrop-filter`; из-за этого `position: fixed` ограничивался высотой шапки, и drawer открывался не на весь экран.
- В мобильном меню не хватало WhatsApp, языкового переключателя, крупного CTA и полноценного закрытия без конфликта с попапом.
- Плавающая нижняя панель и кнопка онлайн-чата могли перекрывать форму заявки на мобильном.
- Социальные ссылки выглядели как generic-иконки, а не как брендовые каналы.
- На публичных текстах оставалась техническая формулировка про ИИ-помощника.

## Что исправлено

- Добавлен компонент `BrandLogo` и подключен реальный логотип: `apps/web/public/logo.png`.
- Логотип используется в desktop/mobile header и в верхней части мобильного drawer; ссылка ведет на главную, `alt="Логотип автошколи Лідер"`.
- Фавикон проверен: `apps/web/app/favicon.ico` визуально соответствует логотипу.
- Мобильное меню перенесено через portal в `document.body`, теперь overlay покрывает весь viewport.
- Drawer получил backdrop, X-close, закрытие по backdrop, закрытие по клику на пункт меню, CTA `Залишити заявку`, кнопки `Подзвонити`, `Telegram`, `WhatsApp`, языки `UA/RU/EN`.
- Попап заявки слушает состояние mobile menu и не открывается поверх него; если меню открывается, активный попап закрывается.
- На секции заявки мобильная quick-панель и закрытая кнопка онлайн-чата скрываются, чтобы не перекрывать форму.
- Социальный блок сохранил структуру, но получил отдельный компонент `SocialIcon` с цветными square brand icons, `aria-label`, hover и `target="_blank"` для веб-ссылок.
- Видимая техническая формулировка про ИИ заменена на `онлайн-помічник` / `чат`; запрещенные публичные термины из ТЗ не найдены в видимом тексте.

## Изображения

Использованы существующие изображения:

- `apps/web/public/logo.png`
- `apps/web/public/images/hero-driving-school.png`
- `apps/web/public/images/lesson-premium.png`
- `apps/web/public/images/practice-ground-premium.png`
- `apps/web/public/images/graduates-premium.png`

Добавлены новые generated/legal-use изображения:

- `apps/web/public/images/car-interior-lesson.png`
- `apps/web/public/images/exam-road-signs.png`
- `apps/web/public/images/license-success.png`

Все новые изображения подключены через `next/image` с `alt` и `sizes`. WebP/AVIF вручную не конвертировались, потому что локальные конвертеры `magick`/`cwebp` недоступны; runtime-оптимизацию выполняет Next Image.

## Анимации и стиль

- Добавлены scroll reveal для секций, hover-подъем карточек, мягкая анимация метрик, active feedback для tap-кнопок.
- Drawer, попап и чат используют Framer Motion; анимации остаются короткими и не перегружают мобильный интерфейс.
- `prefers-reduced-motion` соблюдается через глобальное отключение длительных transition/animation.
- Основная палитра сохранена в premium red `#ff1e1e`, белый/серый/графит.

## Mobile QA

Проверка выполнялась через Playwright Chromium fallback, потому что отдельный Browser/IAB-инструмент в сессии не был доступен.

- Viewport: `390x844`, mobile touch mode.
- Mobile menu: X-close, backdrop-close, click-on-link close - пройдено.
- Drawer geometry: overlay `844px`, drawer `820px`.
- Horizontal overflow: `clientWidth=390`, `scrollWidth=390`, `bodyScrollWidth=390`.
- Popup conflict: при открытом menu попап не появился (`popupWhileMenu=0`).
- Popup close: кнопка закрытия формы видима.
- Онлайн-помощник: открывается и закрывается.
- Signup section: quick-панель скрывается (`opacity=0`, `pointer-events=none`), чат не перекрывает форму.
- Desktop overflow: `clientWidth=1440`, `scrollWidth=1440`.
- Visible banned terms: `[]`.

## Проверки

- `npm run lint` - passed.
- `npm run typecheck` - passed.
- `npm run test` - passed.
- `npm run build` - passed.

## Рекомендации

- Для идеального retina-качества лучше заменить `apps/web/public/logo.png` на исходник 2x/3x или SVG того же бренда. Текущий файл всего `167x72`, поэтому логотип отображается компактно, чтобы не мылиться.
- После получения брендовых фото автошколы заменить generated-сцены на реальные фотографии учеников, инструкторов, авто и филиалов.
- Добавить отдельную production-проверку после деплоя: мобильное меню, отправка формы, карта филиалов, социальные ссылки, online-chat.
