# CI/CD

GitHub Actions workflow находится в:

```text
.github/workflows/ci.yml
```

Он запускается на push в `main`, `develop`, `staging` и на pull request.

## Проверки

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

## Как смотреть результат

1. Открыть репозиторий GitHub.
2. Перейти во вкладку `Actions`.
3. Открыть последний workflow `CI`.
4. Проверить job `quality`.

## Текущий статус

Последние два запуска `CI` на GitHub завершились успешно.
