# 🚀 EXECUTION PLAN v10 — Full Rebuild

**Status:** APK building (task bp0v3c27v - ETA 5-10 min)  
**Goal:** Working product, not pretty code  
**Deadline:** 72 hours to v10-alpha

---

## PHASE A: IMMEDIATE ACTIONS (Next 2 hours)

### A1: APK Testing (After build completes)
```bash
# When notified:
1. Find new APK in build output
2. Install on emulator
3. Test onboarding carousel:
   - Slide 1 → tap "Далі"
   - Should go to Slide 2
   - Repeat 3 more times
   - Final screen should have auth buttons
4. If works: ✅ PASS
5. If not: Debug FlatList scrolling
```

### A2: Full Screenshot Audit
**For each screen take screenshot + describe:**

1. **Onboarding**
   - [ ] All 4 slides work?
   - [ ] Auth buttons visible?
   - [ ] Guest button works?

2. **Auth Choice**
   - [ ] Register visible?
   - [ ] Google Sign-In visible?
   - [ ] Guest link visible?

3. **Home Screen**
   - [ ] Load completes?
   - [ ] What's visible?
   - [ ] Any errors in logcat?

4. **Learning Tab**
   - [ ] Exists or separate Tests tab?
   - [ ] How many categories?
   - [ ] Can start test?

5. **Tests Tab (if separate)**
   - [ ] Exists?
   - [ ] Should be removed

6. **Chat Tab**
   - [ ] Exists?
   - [ ] Message list?
   - [ ] Composer?

7. **Club Tab**
   - [ ] What's visible?
   - [ ] Stories work?
   - [ ] Can create post?

8. **Profile Tab**
   - [ ] User info shown?
   - [ ] Can edit?
   - [ ] Logout button?

### A3: API Testing
```bash
curl -X POST "https://api-jd6b6vy57a-ew.a.run.app/ai/lidyk" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"question":"Яка швидкість на дорозі 50?"}'
  
# Should NOT return "Не зовсім зрозумів"
# Should return real answer about speed limits
```

### A4: Logcat Monitoring
```bash
adb logcat "*:E" | grep -i "error\|exception\|firebase"
# Watch for real errors
```

---

## PHASE B: MAJOR REFACTORING (Days 1-2)

### B1: Navigation Restructure
**File:** `apps/mobile/app/(tabs)/_layout.tsx`

**Changes:**
```
BEFORE:
- 🏠 Головна (index)
- 📚 Навчання (learning)
- ✓ Тести (tests) ← REMOVE
- 🏆 Клуб (club)
- 👤 Профіль (profile)

AFTER:
- 🏠 Головна (index)
- 📚 Навчання (learning) ← INCLUDES TESTS
- 💬 Чат (chat) ← NEW
- 🏆 Клуб (club)
- 👤 Профіль (profile)
```

**Steps:**
- [ ] Remove tests tab screen entry
- [ ] Mark tests tab as hidden (href: null)
- [ ] Create new chat.tsx with basic structure
- [ ] Move learning to position 2
- [ ] Move chat to position 3
- [ ] Update colors/icons
- [ ] Test tab navigation

### B2: Home Page Redesign
**File:** `apps/mobile/app/(tabs)/index.tsx`

**For Guest:**
```
┌─────────────────────────────────┐
│ Вітаємо! 👋                     │
│                                 │
│ Почни навчання ПДР              │
│ [Почати демо-тест] (primary)   │
│ [Записатися] (secondary)        │
│ [Запитати Лідика] (tertiary)   │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ Совет дня (compact):            │
│ "Повтори знаки..."              │
└─────────────────────────────────┘
```

**For Student:**
```
┌─────────────────────────────────┐
│ Привіт, Іван! 👋               │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Категорія B — 60%           │ │
│ │ [Продовжити →]              │ │
│ └─────────────────────────────┘ │
│                                 │
│ Ближайший урок: 03 черв.        │
│ Київ · Hyundai i30              │
│ [Записать] [Детали]             │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ Совет дня:                      │
│ "Знаки пріоритету..."           │
└─────────────────────────────────┘
```

**Steps:**
- [ ] Remove clutter
- [ ] Move daily tip to prominent position
- [ ] Simplify course card
- [ ] Keep next lesson, remove heavy styling
- [ ] Clean typography
- [ ] Test both guest and student views

### B3: Learning Integration
**File:** `apps/mobile/app/(tabs)/learning.tsx`

**Structure:**
```
Tabs within Learning:
- [Мій курс]
- [Уроки]
- [Тести ПДР]
- [Тренажери]
- [Екзамен]
```

**Steps:**
- [ ] Convert to tab or accordion structure
- [ ] Move test categories here
- [ ] Add exam mode support
- [ ] Link to Lidyk per question
- [ ] Add progress tracking
- [ ] Test tab switching

### B4: Chat Creation
**File:** `apps/mobile/app/(tabs)/chat.tsx` (NEW)

**Basic structure:**
```
- Conversation list
- Each shows: Avatar, Name, Last message, Time, Badge
- Conversations:
  - Автошкола Лідер
  - Підтримка
  - Інструктор (if applicable)

Tap → Message thread
- List of messages
- Composer at bottom
- Send button
```

**Steps:**
- [ ] Create basic chat.tsx
- [ ] Hook to Firestore conversations
- [ ] Mock data for testing
- [ ] Message list basic layout
- [ ] Composer UI
- [ ] Test message sending

---

## PHASE C: CRITICAL FIXES (Parallel with B)

### C1: Lidyk Encoding
**Status:** Code fixed (charset=utf-8), need API deployment and test

**Test:**
```bash
# After API deploys
curl -X POST "$API" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"question":"Як перехідти на червоний сигнал світлофора?"}'
  
# Should return real answer, not "Не зовсім"
```

### C2: Firebase Rules
**File:** `infrastructure/firebase/firestore.rules`

**Audit:**
- [ ] Users can't read others' private data
- [ ] Can't write as other user
- [ ] Posts are public but editable only by owner
- [ ] Messages are private per conversation
- [ ] Admin can read everything
- [ ] Deploy to production

### C3: Light Theme
**Files:** All screen components

**Audit:**
- [ ] Home works in light mode
- [ ] Learning works
- [ ] Chat works
- [ ] Club works
- [ ] Profile works
- [ ] No hardcoded #000000 or #111111
- [ ] All colors use theme colors object

---

## PHASE D: TESTING & POLISH (Days 2-3)

### D1: Full User Journey
```
1. Launch app
2. Onboarding through all 4 slides
3. Tap "Почати" (Register)
4. Fill form (or just guest)
5. Reach home
6. Browse learning
7. Start test
8. Ask Lidyk question
9. Go to club
10. Create post (if possible)
11. View profile
12. Change name/phone
13. Logout
```

### D2: Error Testing
```
- Offline (disable network)
- Network error mid-request
- Invalid input
- Timeout scenarios
- Empty responses
- Malformed JSON
```

### D3: Performance
```
- Monitor memory usage
- Check for memory leaks
- Test with 100+ posts
- Slow network (throttle)
- Slow device (old Android)
```

---

## PHASE E: DOCUMENTATION (Day 3)

### E1: Update Obsidian
- [ ] MobileApp.md — current architecture
- [ ] Firebase.md — rules, structure
- [ ] Bugs.md — known issues
- [ ] Roadmap.md — next steps
- [ ] ProductionReadiness.md — % ready

### E2: Create New Docs
- [ ] ChatArchitecture.md
- [ ] TelegramBridge.md (if applicable)
- [ ] AdminPanel.md
- [ ] PDR_Content_Strategy.md

---

## SUCCESS METRICS (v10-alpha)

### Must Have
- [ ] Onboarding carousel works
- [ ] Can reach home as guest
- [ ] All 5 tabs navigate smoothly
- [ ] Chat tab exists with basic UI
- [ ] Learning shows course content
- [ ] Profile editable (name, phone)
- [ ] Lidyk responds (English & Ukrainian)
- [ ] No crashes in happy path
- [ ] Firebase Rules secure

### Should Have
- [ ] Club shows posts
- [ ] Tests integrated in learning
- [ ] Notifications skeleton
- [ ] Admin panel skeleton
- [ ] Light theme works

### Nice to Have
- [ ] Smooth animations
- [ ] Polished design
- [ ] Full feature completeness

---

## TIMELINE

```
Friday (TODAY):
- Build APK
- Test onboarding
- Honest audit
- Start navigation refactor

Saturday:
- Continue refactors
- Chat basic
- Learning integration
- API testing

Sunday:
- Polish & fix bugs
- Documentation
- Final testing
- v10-alpha release

Next week:
- Feature additions
- Admin panel
- Advanced testing
```

---

## WHAT NOT TO DO

- ❌ Write fake reports
- ❌ Say "fixed" without testing in APK
- ❌ Add features before fixing core
- ❌ Assume code changes are deployed
- ❌ Trust old builds
- ❌ Ignore errors
- ❌ Refactor without testing
- ❌ Polish before functionality

---

## HOW TO PROCEED

**When APK is ready (task bp0v3c27v complete):**

1. Find the APK
2. Install immediately
3. Test carousel first
4. Screenshot each screen
5. Come back with REAL data
6. Update this plan based on what you see
7. Start implementation

**No more theories. Only APK truth.**

---

**Last updated:** 2026-06-05 14:30 UTC  
**Next update:** When APK ready  
**Author:** Principal Architect  
**Status:** READY TO EXECUTE
