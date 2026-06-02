# Скилл: Deploy Checklist — Автошкола «Лідер»

Пошаговый чеклист деплоя. Подробности — в `DEPLOY.md`.

## Перед деплоем

```bash
# 1. Убедись что на ветке main
git checkout main && git pull

# 2. Запусти проверки
npm run lint
npm run typecheck
npm run build

# 3. Проверь что нет секретов в diff
git diff -- . ':!package-lock.json' | grep -i "key\|token\|secret\|password"
```

## Деплой Web (Vercel)

```bash
vercel --prod --yes
```

ENV переменные в Vercel dashboard (обязательные):
- `NEXT_PUBLIC_SITE_URL=https://lider.bdslab.net`
- `API_URL=https://europe-west1-lider-avtoschool-prod.cloudfunctions.net/api`
- `OPENAI_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_LOG_CHAT_ID`

## Деплой Firebase

```bash
firebase use production
npm run build --workspace @lider/api
firebase deploy --only functions,firestore:rules,firestore:indexes,storage
```

## Smoke QA (минимум)

После деплоя открой https://lider.bdslab.net/ и проверь:
1. Главная загружается
2. Форма заявки отправляется
3. Переключатель языка работает
4. Мобильное меню открывается
5. Console.errors нет

## Rollback

```bash
# Web — через Vercel dashboard: Deployments → Promote previous
# Firebase functions:
firebase functions:rollback
```
