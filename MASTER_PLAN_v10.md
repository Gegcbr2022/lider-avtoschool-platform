# 🎯 MASTER PLAN — Авто школа Лідер v10

**Статус:** Начало реальной разработки  
**Дата:** 2026-06-05  
**Автор:** Principal Architect (Claude)

---

## 📋 ИТОГИ ПРОБЛЕМ

### Найдено в v9
1. ❌ Onboarding carousel заблокирована (FlatList issue)
2. ❌ Lidyk API выбрасывает fallback на украинский (encoding v8)
3. ❌ Главная страница захламлена и непонятна
4. ❌ Тесты - отдельная вкладка (нужна интеграция в Learning)
5. ❌ Чата нет вообще
6. ❌ Клуб выглядит сыро
7. ❌ Профиль неполный
8. ❌ Админка не готова
9. ❌ Светлая тема выглядит как hack
10. ❌ Уведомления не готовы

### Локальная сборка Gradle
- ❌ React Native bundle не компилируется локально
- ✅ EAS cloud build работает

---

## 🏗️ АРХИТЕКТУРА v10

```
Tab Navigation:
├── 🏠 Головна (Home/Dashboard)
├── 📚 Навчання (Learning + Tests integrated)
├── 💬 Чат (New chat system)
├── 🏆 Клуб (Cleaned up community)
└── 👤 Профіль (Complete profile)

Backend:
├── Firebase Auth
├── Firestore (users, courses, messages, posts, etc)
├── Storage (avatars, stories, documents)
├── Cloud Functions (API, Lidyk, notifications)
└── Telegram Bridge (optional/future)

Admin:
├── Next.js + Firebase
├── Dashboard
├── User Management
├── Chat Inbox
├── Content Management
└── Analytics
```

---

## 📍 ФАЗЫ РЕАЛИЗАЦИИ

### PHASE 0: FOUNDATION (Days 1-2)
- [ ] Исправить Onboarding carousel
- [ ] Исправить Lidyk encoding (UTF-8)
- [ ] Очистить Firestore Rules
- [ ] Настроить proper logging

### PHASE 1: NAVIGATION (Days 2-3)
- [ ] Переделать Tab Navigation
- [ ] Убрать "Tests" вкладку
- [ ] Интегрировать тесты в "Навчання"
- [ ] Убрать мертвый код
- [ ] Структурировать по новой архитектуре

### PHASE 2: HOME DASHBOARD (Days 3-4)
Сделать понятным и чистым:

**Guest State:**
```
┌─────────────────────────────┐
│ Вітаємо!                    │
│ Почни навчання              │
│                             │
│ [Почати демо-тест]         │
│ [Записатися]               │
│ [Запитати Лідика]          │
│                             │
│ Совет дня (компактно)       │
└─────────────────────────────┘
```

**Student with Course:**
```
┌─────────────────────────────┐
│ Привіт, Імя!                │
│                             │
│ ┌─────────────────────────┐ │
│ │ Категорія B             │ │
│ │ 60% пройдено            │ │
│ │ [Продовжити →]          │ │
│ └─────────────────────────┘ │
│                             │
│ Ближайший урок: 03 черв.    │
│ [Детали] [Записать]         │
│                             │
│ Совет дня                   │
│ "Повтори знаки..."          │
└─────────────────────────────┘
```

### PHASE 3: LEARNING + TESTS (Days 4-6)
Интегрировать в одну страницу:
- [ ] Мій курс (выбор категории)
- [ ] Уроки (список с progress)
- [ ] Тести ПДР (категории + режимы)
- [ ] Тренажеры
- [ ] История ошибок
- [ ] "Запитати Лідика per question"

**Минимум контента:**
- 200+ вопросов
- ImageURL support (для знаков)
- 5 категорий тестов
- Exam mode + trainer mode

### PHASE 4: CHAT (Days 6-7)
Новая вкладка с реальным мессенджером:
- [ ] Conversation list
- [ ] Message composer
- [ ] Read/unread status
- [ ] Firestore integration
- [ ] Architecture для Telegram Bridge (будущее)

**Чаты:**
- Автошкола Лідер
- Підтримка
- Інструктор (если есть)
- Менеджер

### PHASE 5: CLUB (Days 7-8)
Переделать как нужно:
- [ ] Stories (top)
- [ ] 4 Quick action cards
- [ ] Лента (posts, real)
- [ ] Нагороды (achievements)
- [ ] Чистый, не захламленный интерфейс

### PHASE 6: PROFILE (Days 8-9)
Полная функциональность:
- [ ] Edit name
- [ ] Edit email
- [ ] Change password
- [ ] Phone management
- [ ] Theme toggle (dark/light)
- [ ] Notifications settings
- [ ] Logout
- [ ] Delete account (architecture)

### PHASE 7: LIDYK FIX (Days 2-3 parallel)
- [ ] Найти точную причину encoding issue
- [ ] Тестировать curl запросы
- [ ] Добавить логирование
- [ ] Проверить Firebase Function
- [ ] Валидировать UTF-8

### PHASE 8: THEMES (Days 6-9 parallel)
- [ ] Провести полный light theme audit
- [ ] Убрать hardcoded dark colors
- [ ] Проверить каждый экран
- [ ] Тестировать на реальных девайсах

### PHASE 9: ADMIN PANEL (Days 9-12)
Next.js + Firebase:
- [ ] Dashboard
- [ ] User management
- [ ] Students list with progress
- [ ] Chat inbox
- [ ] Content (courses, questions)
- [ ] Analytics & Logs

### PHASE 10: NOTIFICATIONS (Days 10-12 parallel)
- [ ] FCM setup
- [ ] Local notifications architecture
- [ ] Types: message, test reminder, achievement, etc
- [ ] Testing

### PHASE 11: FIREBASE RULES (Days 11-12 parallel)
- [ ] Security audit новых rules
- [ ] Тестировать с curl
- [ ] Deploy в production

### PHASE 12: OBSIDIAN & DOCS (Days 11-13)
- [ ] Update MobileApp.md
- [ ] Create PDR_Content_Strategy.md
- [ ] Create TelegramBridge.md (if relevant)
- [ ] Create AdminPanel.md
- [ ] Create ProductionReadiness.md

### PHASE 13: REAL QA (Days 13-14)
- [ ] APK build & install
- [ ] Full user journey test
- [ ] Logcat monitoring
- [ ] API response validation
- [ ] Bug fixes & regression testing

---

## 🔧 IMMEDIATE TASKS (NEXT 48 HOURS)

### Task 1: Fix Onboarding
**File:** `apps/mobile/app/onboarding.tsx:83-89`  
**Current:** scrollToIndex (broken)  
**Fix:** scrollToOffset (done in v9.1)  
**Status:** In APK, waiting rebuild

### Task 2: Fix Lidyk Encoding
**File:** `apps/api/src/ai-providers.ts:95-99`  
**Current:** "Content-Type": "application/json"  
**Fix:** "Content-Type": "application/json; charset=utf-8" (done in v9.1)  
**Test command:**
```bash
curl -X POST "https://api-jd6b6vy57a-ew.a.run.app/ai/lidyk" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"question":"Яка швидкість на дорозі 50?"}'
```

### Task 3: Refactor Navigation
**File:** `apps/mobile/app/(tabs)/_layout.tsx`  
**Changes:**
- Remove "tests" tab
- Order: index, learning, chat, club, profile
- Update learning to include tests

### Task 4: Clean Home Page
**File:** `apps/mobile/app/(tabs)/index.tsx`  
**Changes:**
- Remove clutter
- Simplify for guest view
- Move "совет дня" to prominent but compact position
- Clean for student view with active course

---

## 📊 SUCCESS CRITERIA

### v10 Launch Criteria (70% ready)
- [ ] Onboarding works smoothly
- [ ] Lidyk responds correctly to Ukrainian
- [ ] Home page clean and understandable
- [ ] Learning page with integrated tests
- [ ] Chat functional (basic)
- [ ] Club cleaned up
- [ ] Profile editable
- [ ] Light + Dark themes work everywhere
- [ ] Firebase Rules secure
- [ ] Admin panel ready

### v11 Polish Criteria (85% ready)
- [ ] All screens polished
- [ ] Animations smooth
- [ ] Notifications working
- [ ] Telegram bridge ready
- [ ] Full security audit passed
- [ ] Performance optimized

### v12 Production Criteria (95% ready)
- [ ] Google Play ready
- [ ] Real QA passed
- [ ] All docs updated
- [ ] No known bugs
- [ ] Analytics integrated
- [ ] Monitoring in place

---

## 🚀 DEPLOYMENT STRATEGY

1. **v10-alpha:** Internal testing (1 week)
2. **v10-beta:** Limited external testing (1 week)
3. **v10-production:** Full release (after QA)
4. **v11:** Polish & features (ongoing)

---

## 📝 NOTES FOR NEXT SESSION

- APK Build Status: EAS in progress (Task: bc270bkxc)
- Critical: Verify new APK fixes both Onboarding AND Lidyk encoding
- Must do full screenshot audit after new APK installs
- Do NOT write reports about code - only about what's visible in APK
- Keep honest about what works vs what's broken

---

**This is not a roadmap. This is a construction plan.**
**Start with Foundation, don't skip to Polish.**
