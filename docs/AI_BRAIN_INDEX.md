# AI_Brain Index — `C:\AI_Brain\Projects\Lider`

Стратегическая база знаний проекта (Obsidian-vault). 38 файлов. Ниже — карта источников.
Назначение части файлов выведено из названия — **проверяй перед тем, как полагаться** (доки могут
отставать от кода; источник истины по факту — код + APK).

## Авторитетные / актуальные (читать первыми)
| Файл | Что содержит | Актуальность |
|---|---|---|
| `MasterPlan_Opus_Audit_2026-06-08.md` | Исполнительный бриф для агентов, gap-анализ по коду, спринты, чек-лист | **Высокая** (но push/2FA с тех пор закрыты) |
| `MasterPlan_Sprint27plus.md` | Эпики E1–E12, killer-фичи, последовательность | Высокая |
| `OwnerActionRequired.md` | Полный список действий владельца | Высокая |
| `Bugs.md` | Реестр багов (BUG-0xx) | Средняя — сверять с `docs/BUGS_AND_RISKS.md` |
| `Changelog.md` | История изменений | Поддерживать |
| `Monetization.md` | Модель монетизации | Высокая |

## Продукт / видение
`Vision.md`, `OriginalVision.md`, `Features.md`, `FeatureMatrix.md`, `Ideas.md`,
`ProductGapAnalysis.md` (⚠️ устарел: реал ~50%, не 22%), `UserJourney.md`, `SuperAppRoadmap.md`,
`Roadmap.md`, `Competitors.md`.

## Дизайн / UX
`DesignSystem.md`, `BrandBook.md`, `UX_Redesign_v12.md`, `ProfileArchitecture.md`, `ClubArchitecture.md`.

## Технические / инфра
`Firebase.md`, `FirebaseAuthSetup.md`, `AI_Logging.md`, `Resilience.md`,
`ProductionAudit.md`, `ProductionReadiness.md`, `ProductionSetupGuide.md`,
`MobileApp.md`, `MobileProductionChecklist.md`, `AppStoreLaunch.md`.

## Бизнес / операции
`AdminPanel.md`, `CRM.md`, `Marketing.md`, `Website.md`, `TelegramBridge.md`, `Audit_and_Plan.md`, `Tasks.md`.

## Замеченные противоречия (doc-drift)
- `ProductGapAnalysis.md` занижает готовность (22% vs реал ~50%) — устарел.
- README репозитория ранее ссылался на отсутствующие файлы и неверно описывал Storage — проверить актуальность.
- «Push сломан / 2FA нет» в старых отчётах — **уже закрыто** в коде (notifee+FCM, TOTP MFA).

## Как использовать агентам
Стратегия и «зачем» — здесь. Тактика и «что чинить сейчас» — в `C:\Avtoschool_APP\docs\`.
При запуске агента: «прочитай `docs/PROJECT_AUDIT_2026.md` + соответствующий MasterPlan и работай по Sprint N».
