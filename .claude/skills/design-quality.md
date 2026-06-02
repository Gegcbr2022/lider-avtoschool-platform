# Скилл: Design Quality — Автошкола «Лідер»

Правила дизайна для поддержания качества при итерациях.

## Дизайн-направление

Сайт должен выглядеть как **профессиональный коммерческий сайт украинского бизнеса**, а не AI-шаблон.

**Хорошо:**
- Чистая типографика (Inter, font-black для заголовков)
- Красный акцент (#ff1e1e) только там, где нужен
- Пространство и воздух между секциями
- Реальные фото (не стоковые иллюстрации)
- Аккуратные тени: `shadow-soft`, `shadow-premium`
- Скруглённые карточки: `rounded-[24px]` или `rounded-[18px]`
- Mobile-first: кнопки `min-h-[48px]`, класс `tap-target`

**Плохо:**
- Случайные градиенты без смысла
- Переизбыток анимаций
- "Пластиковый" глянец
- Перегруженная главная (контент — на отдельные страницы)
- Текст мелкий на мобильных

## Цветовая палитра Tailwind

```
lider-red        → #ff1e1e  (основной акцент)
lider-redDark    → #d81414  (hover CTA)
lider-graphite   → #1a1a1a  (текст, dark секции)
lider-muted      → #666666  (второстепенный текст)
lider-line       → #e5e5e5  (бордеры)
lider-background → #f4f4f4  (светлый фон секций)
```

## Типографика

```
Заголовки:   font-black (900), tracking-[-0.02em]
Подзаголовки: font-semibold, leading-7
Мета-текст:  font-black uppercase tracking-[0.14em] text-lider-red
```

## Breakpoints для QA

| Размер | Устройство |
|---|---|
| 360px | Бюджетный Android |
| 390px | iPhone 14 |
| 768px | Планшет |
| 1024px | Ноутбук |
| 1440px | Десктоп |

## CSS-утилиты проекта

- `.tap-target` — `min-height: 48px` для touch-таргетов
- `.red-cta` — красная CTA-кнопка с тенью и hover
- `.motion-section` — scroll-triggered fade-in анимация
- `.safe-bottom` — padding для iOS bottom bar
- `.pride-rail` — горизонтальный scroll галереи с кастомным скроллбаром

## Компоненты из @lider/ui

- `<MetricCard value label detail />` — метрика с hover-анимацией
- `<SectionHeader eyebrow title description />` — заголовок секции
- `<StatusPill tone="success|warning|neutral" />` — badge/pill

## Правило: нет dev-текста в production-копии

Никогда не оставлять в user-facing тексте:
- Упоминания папок (`Images_with_prava`, `design-references`)
- Технические описания структуры (`Структура готова для підключення`)
- TODO-комментарии в JSX
