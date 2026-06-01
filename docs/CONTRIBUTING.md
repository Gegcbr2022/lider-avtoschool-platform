# Правила разработки

## Ветки

- `main` — стабильная ветка.
- `develop` — интеграционная ветка, если команда начнёт её использовать.
- `staging` — release candidate ветка, если нужен отдельный предпрод.

## Перед commit

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Сообщения commit

Рекомендуемый стиль:

```text
feat(web): add lead capture
fix(api): validate payment amount
docs: update deployment guide
```

## Секреты

Нельзя коммитить реальные `.env`, токены, ключи API и приватные credential-файлы.
