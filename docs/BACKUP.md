# Firestore Backup Runbook

Дата ревизии: 2026-06-08. Требование ТЗ A3: ежедневный неудаляемый бэкап и понятная процедура восстановления.

## Цель

- Восстановить Firestore после случайного удаления, ошибочного деплоя rules/API или компрометации приложения.
- Иметь два слоя защиты: PITR для быстрого отката и ежедневный экспорт/managed backup для отдельной точки восстановления.
- Не хранить секреты, service account JSON или production credentials в репозитории.

## Production-Принципы

- Production Firebase не трогаем из локальной машины без явного подтверждения владельца.
- Все команды ниже выполняются только владельцем/ответственным DevOps с выбранным production project.
- Backup bucket должен быть в отдельной зоне доступа, с retention/immutability policy и без публичного доступа.
- Минимальный restore-drill: 1 раз в месяц восстановить backup в отдельный test/staging project и проверить чтение ключевых коллекций.

## Layer 1: Firestore PITR

PITR дает восстановление на точку времени в пределах окна хранения Firestore.

Проверка статуса:

```bash
gcloud firestore databases describe --database="(default)" --project="$FIREBASE_PROJECT_ID"
```

Включение PITR, если он выключен:

```bash
gcloud firestore databases update --database="(default)" \
  --project="$FIREBASE_PROJECT_ID" \
  --enable-pitr
```

Что проверить:

- `pointInTimeRecoveryEnablement` включен.
- Владелец знает актуальный `FIREBASE_PROJECT_ID`.
- Команда выполняется под аккаунтом с ролью Firestore Admin / Owner.

## Layer 2: Daily Managed Backup

Рекомендуемый вариант: Firestore managed backup schedule с retention не меньше 14 дней.

Проверка расписаний:

```bash
gcloud firestore backups schedules list \
  --database="(default)" \
  --project="$FIREBASE_PROJECT_ID"
```

Создание daily schedule, если расписания нет:

```bash
gcloud firestore backups schedules create \
  --database="(default)" \
  --project="$FIREBASE_PROJECT_ID" \
  --recurrence=daily \
  --retention=14d
```

Проверка backup-точек:

```bash
gcloud firestore backups list \
  --project="$FIREBASE_PROJECT_ID"
```

## Layer 3: Immutable Export Bucket

Если нужен off-database экспорт, используем отдельный bucket с retention policy.

Создание bucket:

```bash
gcloud storage buckets create "gs://$BACKUP_BUCKET" \
  --project="$FIREBASE_PROJECT_ID" \
  --location=europe-west1 \
  --uniform-bucket-level-access
```

Retention policy:

```bash
gcloud storage buckets update "gs://$BACKUP_BUCKET" --retention-period=1209600
gcloud storage buckets retention lock "gs://$BACKUP_BUCKET"
```

Важно: `retention lock` необратим для выбранного периода. Выполнять только после подтверждения владельца.

Ежедневный экспорт можно запускать через Cloud Scheduler + Cloud Run/Functions или вручную:

```bash
gcloud firestore export "gs://$BACKUP_BUCKET/firestore/$(date +%F)" \
  --project="$FIREBASE_PROJECT_ID" \
  --async
```

## Restore Drill

Восстановление всегда сначала проверяем в отдельном staging/test project.

Managed backup restore:

```bash
gcloud firestore databases restore \
  --source-backup="$BACKUP_NAME" \
  --destination-database="restored-$(date +%Y%m%d)" \
  --project="$FIREBASE_PROJECT_ID"
```

Export import в staging:

```bash
gcloud firestore import "gs://$BACKUP_BUCKET/firestore/YYYY-MM-DD" \
  --project="$STAGING_FIREBASE_PROJECT_ID"
```

Smoke checklist после restore:

- Коллекции `leads`, `userProfiles`, `naisData`, `bookings`, `conversations`, `clubPosts`, `lessons` читаются.
- Sensitive collections (`naisData`, `aiLogs`) не стали публичными: проверить rules в staging.
- Admin может открыть CRM только через AuthGate + role claim + 2FA.
- Восстановленные данные не подключены к production API случайно.

## Incident Flow

1. Остановить источник повреждения: отключить проблемную функцию/API key/deploy.
2. Зафиксировать точку времени инцидента в UTC.
3. Выбрать PITR или backup/export restore.
4. Восстановить в staging и проверить smoke checklist.
5. Только после подтверждения владельца переносить восстановление в production.
6. Записать incident note в `AI_Brain/Projects/Lider/Changelog.md`.

## Owner Responsibilities

- Хранить доступы Google Cloud/Firebase вне репозитория.
- Подтвердить retention period и бюджет backup storage.
- Назначить ответственного за ежемесячный restore-drill.
- Не удалять backup bucket и не отключать PITR без письменного решения владельца.
