# UI Bug Audit

Дата аудиту: 2026-06-02
Проєкт: автошкола «Лідер», production polish перед рекламним трафіком.

## Статуси

| ID | Severity | Проблема | Ризик для користувача | Виправлення | Статус |
| --- | --- | --- | --- | --- | --- |
| UI-01 | Critical | Popup заявки на iPhone SE виходив за верхній край екрана, кнопка закриття була недоступна. | Користувач не може закрити форму або нормально залишити заявку. | Перероблено popup у мобільний bottom sheet з `max-height: 100dvh`, sticky-кнопкою закриття та внутрішнім скроллом. | Fixed, verified |
| UI-02 | High | Popup мав вкладений скролл у формі та міг погано поводитися з клавіатурою. | Частина полів могла бути недоступна на маленькому екрані. | Скролл перенесено на контейнер popup, форма стала звичайним блоком. | Fixed, verified |
| UI-03 | High | Головна сторінка була занадто сухою для реклами, бракувало фото, історій, соціального доказу. | Нижча довіра та конверсія з першого екрану. | Додано hero-фото, блоки занять, майданчика, випускників, преміальні benefits і відгуки. | Fixed |
| UI-04 | High | Частина клієнтських текстів містила технічні слова: CRM, API, Firebase, Next.js, CMS, LMS. | Користувач бачить внутрішню кухню замість зрозумілої автошколи. | Очищено тексти головної, SEO-сторінок, shared-контенту та видимих компонентів. | Fixed |
| UI-05 | High | Mobile-first CTA були розкидані, не вистачало швидких дій однією рукою. | Користувачу складніше подзвонити або залишити заявку з мобільного. | Додано нижню мобільну панель: дзвінок, Telegram, WhatsApp, запис. | Fixed |
| UI-06 | Medium | Мобільне меню було відсутнє у сучасному drawer-форматі з CTA. | Повільніша навігація на мобільних екранах. | Додано анімоване меню з backdrop, великими пунктами і CTA. | Fixed |
| UI-07 | Medium | Соціальні мережі виглядали слабко та не мали впізнаваних кольорів. | Менше довіри та гірша сканованість блоку. | Додано квадратні кольорові іконки: Facebook, Instagram, YouTube, Telegram, WhatsApp. | Fixed |
| UI-08 | Medium | Блок філіалів був недостатньо интерактивним і не фокусувався на активному місті. | Складніше знайти адресу, карту і контакт. | Додано активний selector філіалу з анімацією, картою, адресою, маршрутом і дзвінком. | Fixed |
| UI-09 | Medium | FAQ був статичним і займав багато уваги. | Питання перед записом гірше скануються на мобільному. | Додано сучасний accordion. | Fixed |
| UI-10 | Medium | AI-чат міг перетинатися з нижньою мобільною CTA-панеллю. | Плаваючі кнопки перекривають одна одну. | AI-чат на мобільному з'являється після скроллу, popup має вищий z-index, оновлено max-height. | Fixed, verified |
| UI-11 | Medium | Старі зелено-жовті акценти конфліктували з red/white style guide. | Візуальна система виглядала зібраною не до кінця. | Перекрашено UI tokens, кнопки, форми, reviews, graduates, error/not-found. | Fixed |
| UI-12 | Low | Службові порожні або зайві слова в описах відгуків і сторінок. | Знижує відчуття premium-продукту. | Переписано мікротексти на клієнтський тон. | Fixed |

## Обов'язкова мобільна перевірка

| Device | Viewport | Popup fit | Close accessible | Inner scroll | Keyboard risk | Статус |
| --- | --- | --- | --- | --- | --- | --- |
| iPhone SE | 375x667 | Pass | Pass | Pass | Pass | Verified |
| iPhone 13 | 390x844 | Pass | Pass | Pass | Pass | Verified |
| iPhone 15 Pro Max | 430x932 | Pass | Pass | Pass | Pass | Verified |
| Galaxy S21 | 360x800 | Pass | Pass | Pass | Pass | Verified |
| Galaxy A54 | 412x915 | Pass | Pass | Pass | Pass | Verified |
| Pixel | 393x851 | Pass | Pass | Pass | Pass | Verified |

## Verification Artifacts

- Popup screenshots: `output/popup-qa/`
- UI screenshots: `output/ui-qa/`
- Checks passed: no horizontal overflow on mobile/desktop, visible technical terms removed from web UI, mobile menu/FAQ/branch selector/AI chat interactions verified, images load after scroll.
