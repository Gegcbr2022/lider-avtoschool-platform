# Журнал изменений

## 2026-06-02

- Проверено состояние GitHub: remote настроен, `main` синхронизирован с `origin/main`, открытых PR и issues не найдено.
- Проверен GitHub Actions: последние два workflow `CI` завершились успешно.
- Удалены реальные секреты из `.env.example`; пример окружения заменён безопасными пустыми значениями.
- Добавлена переменная `ALLOWED_ORIGINS` для CORS API.
- Добавлена переменная `TELEGRAM_WEBHOOK_SECRET` для проверки Telegram webhook.
- Синхронизирован локальный API URL с Firebase dev project `lider-avtoschool-dev`.
- Обновлены филиалы: добавлено Доброполье.
- Обновлены цены и длительности услуг по фактическому контенту автошколы.
- Добавлены карточки переподготовки A, A1, B и C.
- Подключён реальный логотип к web/admin.
- Добавлен favicon в web/admin приложения.
- Исходный украинский контент автошколы перенесён в `docs/source-content/`.
- Улучшена обработка ошибок лид-формы.
- API route `/api/leads` теперь корректно отвечает на битый JSON и требует `API_URL` в production.
- CORS в Functions API ограничен разрешёнными origin.
- Demo payment adapter больше не работает как успешная заглушка в production.
- Telegram webhook в production требует secret token.
- Firestore rules ужесточены для `bookings` и `payments`: студент видит только собственный scope.
- Storage rules ужесточены для `student-documents`: запись разрешена сотрудникам или владельцу.
- Старые устаревшие статус-отчёты и дубли документации удалены.
- Создана единая русскоязычная документация в корне проекта.
- Выполнены `npm install`, `lint`, `typecheck`, `test`, `build`.
- Выполнен Playwright smoke публичного сайта: desktop, форма заявки, mobile, console health.

## 2026-06-01

- Создан initial production platform scaffold.
- Добавлены web, admin, mobile, api и shared packages.
- Добавлены Firebase rules, indexes и CI.
