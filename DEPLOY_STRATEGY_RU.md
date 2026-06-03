# Стратегия деплоя — Автошкола «Лідер»

> Сравнение вариантов и рекомендация для текущего и будущего состояния проекта.

---

## Текущая архитектура

```
Browser / Mobile app
        │
        ▼
  Vercel (Next.js)          ← Web frontend + API edge routes
        │
        ▼
Firebase Functions          ← REST API, Firestore, Storage, Auth
(europe-west1)
```

Production URLs:
- Web: `https://lider.bdslab.net`
- API: `https://europe-west1-lider-avtoschool.cloudfunctions.net/api`

---

## Вариант 1: Vercel + Firebase (текущий)

### Плюсы
- **Скорость деплоя**: `vercel --prod` → 60 секунд до live
- **Авто-деплой**: при push в main (если настроен Git integration в Vercel)
- **Serverless масштабирование**: Vercel и Firebase Functions автоматически масштабируются под нагрузку
- **CDN**: статика и Edge Network из коробки
- **Минимум DevOps**: нет серверов, нет обновлений ОС, нет SSL-сертификатов вручную
- **Firebase экосистема**: Auth, Storage, Firestore, Functions — единая платформа
- **Хорошо для текущего стека**: Next.js 15 App Router нативно работает на Vercel

### Минусы
- **Vendor lock-in**: сложнее мигрировать позже
- **ENVs в двух местах**: Vercel Dashboard + Firebase Functions secrets (нужна синхронизация)
- **Serverless ограничения**: 
  - Нет долгоживущих процессов (очереди, cron — нужны обходные пути)
  - Cold start у Firebase Functions (первый запрос медленнее)
  - Максимальное время выполнения Functions (540 сек)
- **Firebase billing**: Spark plan (бесплатно) → Blaze (pay-as-you-go) при масштабировании
- **Firestore читается дорого** при большом количестве запросов (сотни тысяч/день)

### Стоимость при текущей нагрузке (до 1000 заявок/мес)
- Vercel Hobby: **бесплатно**
- Firebase Spark (Firestore + Storage + Functions): **бесплатно**
- При росте до 10k заявок/мес: ~$0–15/мес

---

## Вариант 2: VPS (например, Hetzner, DigitalOcean)

### Плюсы
- **Полный контроль**: любые процессы, любые порты, любая конфигурация
- **Всё в одном месте**: web, api, bot, cron, DB — один сервер
- **Фоновые задачи**: очереди (Bull/BullMQ), cron без Firebase
- **Собственная БД**: PostgreSQL + Redis — богаче Firestore по возможностям запросов
- **Дешевле при стабильной нагрузке**: Hetzner CX21 (2 CPU, 4GB RAM) ~€5/мес
- **Telegram-бот нативно**: pm2/systemd без Firebase Functions overhead

### Минусы
- **DevOps burden**: SSL (Let's Encrypt), nginx, обновления ОС, бэкапы, мониторинг
- **Деплой сложнее**: GitHub Actions CI/CD или ручной `git pull && pm2 reload`
- **Нет авто-масштабирования**: DDoS или пиковая нагрузка → сервер падает
- **Безопасность**: нужно настраивать firewall, fail2ban, SSH keys
- **Time to deploy**: 2–4 часа начальной настройки + поддержка
- **Node.js + Next.js на VPS**: нужен standalone build, что сложнее чем Vercel

### Стоимость
- Hetzner CX21: ~€5/мес (~200 грн)
- + домен, SSL (бесплатно Let's Encrypt), бэкапы

---

## Вариант 3: Гибрид (рекомендуемый путь развития)

```
Browser / Mobile
       │
       ▼
Vercel (Next.js)           ← Web frontend (оставить)
       │
       ├── Firebase Functions ← API для leads, Firestore, Storage, Auth
       │
       └── VPS / Cloud Run  ← Bot server, фоновые jobs, CRM sync
```

### Когда переходить к гибриду
Рассматривать VPS или Cloud Run для отдельных сервисов только при появлении:

| Триггер | Решение |
|---------|---------|
| Telegram-бот с собственной БД и webhook | VPS или Cloud Run для бота |
| Тяжёлые background jobs (PDF генерация, batch email) | Cloud Run job или VPS worker |
| Собственная CRM с Postgres | VPS + Postgres |
| Очереди задач (BullMQ, Redis) | VPS или Railway |
| Высокая нагрузка (>100k запросов/день) | Cloud Run autoscale |
| Аналитический дашборд с complex SQL | Postgres + Metabase на VPS |

---

## Текущая рекомендация

### ✅ Сейчас: оставить Vercel + Firebase

Обоснование:
1. Стек уже работает и задеплоен
2. Нет тяжёлых фоновых процессов
3. Firebase Functions справляются с текущим объёмом
4. Бесплатный план покрывает начальную нагрузку
5. Команда — один-два разработчика без DevOps

### 📅 Когда получить код Telegram-бота
- Поднять отдельный **Cloud Run сервис** или VPS-воркер для бота
- Интегрировать через Firestore как описано в `CLIENT_DB_ARCHITECTURE_RU.md`
- Web (Vercel) и бот работают параллельно через единый Firestore

### 📈 При росте (>5k заявок/мес, CRM для менеджеров, payments)
- Оценить переход API с Firebase Functions на Cloud Run (постоянный процесс, меньше cold start)
- Или полный бэкенд на VPS с PostgreSQL для CRM
- Vercel для фронтенда оставить — он справляется отлично

---

## Текущие ENV и где они хранятся

| ENV | Где |
|-----|-----|
| `NEXT_PUBLIC_*`, `API_URL`, `OPENAI_API_KEY`, `TURNSTILE_*` | Vercel Dashboard → Environment Variables |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_LOG_CHAT_ID` | Firebase Functions secrets |
| `RESEND_API_KEY`, `LEAD_EMAIL_*` | Firebase Functions secrets |
| `STORAGE_BUCKET`, `FIREBASE_PROJECT_ID` | Firebase Functions config |

Детально: `ENV_GUIDE_RU.md`

---

## Деплой-команды (справочник)

```bash
# Web (Vercel)
vercel --prod

# Firebase Functions + API
firebase use production
firebase deploy --only functions

# Firestore rules + indexes
firebase deploy --only firestore:rules,firestore:indexes

# Storage rules
firebase deploy --only storage

# Всё сразу
firebase deploy --only functions,firestore:rules,firestore:indexes,storage
```
