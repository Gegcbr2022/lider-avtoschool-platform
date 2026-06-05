# 📱 APK TESTING PLAN — Comprehensive QA

**When:** After APK build completes  
**Status:** Waiting for EAS build (bodbfy47y)  
**Duration:** ~30 minutes for full audit  

---

## Phase 1: Installation & Launch (5 min)

### 1.1 Prepare Environment
- [ ] Device/emulator with Android 8+
- [ ] USB debugging enabled (if device)
- [ ] 500 MB+ free space
- [ ] Network connection available

### 1.2 Install APK
```bash
adb install -r <path-to-apk>
```

### 1.3 Launch App
- [ ] App opens without crash
- [ ] Splash screen shows
- [ ] Onboarding appears

---

## Phase 2: Onboarding Navigation (CRITICAL) (5 min)

**This is the blocker. If carousel doesn't work, app is unusable.**

### 2.1 Slide 1
- [ ] Screenshot: Shows "🚗 Навчайся онлайн"
- [ ] Subtitle visible: "Теорія, ПДР-тести..."
- [ ] Button visible: "Далі"
- [ ] Red dot shows position 1/4

### 2.2 Tap "Далі" Button
- [ ] Transition smooth (animated)
- [ ] **CRITICAL:** App moves to Slide 2 (not stays on 1)
- [ ] Screenshot: Now shows "📝 Проходь тести ПДР"
- [ ] Red dot now shows position 2/4

### 2.3 Slide 3
- [ ] Tap "Далі" → moves to Slide 3
- [ ] Screenshot: Shows "🏆 Нагороди та прогрес"
- [ ] Red dot shows position 3/4

### 2.4 Slide 4
- [ ] Tap "Далі" → moves to Slide 4
- [ ] Screenshot: Shows "🎓 Готуйся впевнено"
- [ ] Red dot shows position 4/4
- [ ] Buttons changed: "Почати навчання", "Увійти", "Продовжити як гість"

### 2.5 Test Each Final Button
- [ ] "Почати навчання" → Goes to registration screen
- [ ] Back to onboarding, tap "Увійти" → Goes to login screen
- [ ] Back to onboarding, tap "Продовжити як гість" → Goes to Home screen (GUEST)

**RESULT:** ✅ PASS or ❌ FAIL

---

## Phase 3: Authentication (5 min)

### 3.1 Guest Flow
- [ ] From onboarding, tap "Продовжити як гість"
- [ ] App goes to Home screen
- [ ] Top shows "Вітаємо 👋" (guest greeting)
- [ ] Shows "🚀 Почати демо-тест" button
- [ ] No user name shown

### 3.2 Registration Flow
- [ ] From onboarding, tap "Почати навчання"
- [ ] Registration form appears
- [ ] Fill form: name, email, password
- [ ] Tap "Зареєструватись"
- [ ] App navigates to Home (or asks for profile)

### 3.3 Google Sign-In (if configured)
- [ ] From login, tap Google button
- [ ] Google dialog appears
- [ ] Tap account or create
- [ ] Returns to app

**RESULT:** ✅ PASS or ❌ FAIL

---

## Phase 4: Navigation & Tab Structure (5 min)

### 4.1 Home Tab (🏠)
- [ ] Tap Home icon
- [ ] Shows home content
- [ ] Guest view: "Вітаємо 👋", demo test button
- [ ] Student view: Name greeting, progress card, next lesson, quick actions

### 4.2 Learning Tab (📚)
- [ ] Tap Learning icon
- [ ] Shows course card: "Категорія X"
- [ ] Shows progress bar
- [ ] Shows hub tiles:
  - [ ] 🎯 PDR Тренажер (200 питань)
  - [ ] 🎓 Екзамен (20 питань)
  - [ ] 📖 Уроки (coming soon)
  - [ ] 🚗 Запитати Лідика

### 4.3 Chat Tab (💬)
- [ ] Tap Chat icon
- [ ] Shows chat interface
- [ ] For guest: "Потрібна реєстрація" or similar
- [ ] For student: Shows conversation list or main chat

### 4.4 Club Tab (🏆)
- [ ] Tap Club icon
- [ ] Shows club interface
- [ ] Stories carousel
- [ ] Feed / main section
- [ ] Awards section

### 4.5 Profile Tab (👤)
- [ ] Tap Profile icon
- [ ] Shows user info
- [ ] Shows edit button or edit fields
- [ ] Shows theme selector
- [ ] Shows logout button

### 4.6 Hidden Tabs
- [ ] Verify "Tests" tab is NOT visible
- [ ] Verify "Assistant" tab is NOT visible
- [ ] (These should be hidden, accessible via links only)

**RESULT:** ✅ PASS or ❌ FAIL (list any missing tabs)

---

## Phase 5: Lidyk API Testing (5 min)

### 5.1 Test from Tests Screen
- [ ] Go to Learning → Tap "PDR Тренажер"
- [ ] Tap a question
- [ ] See wrong answer explanation button
- [ ] Tap "Лідик, поясни!"
- [ ] Loading spinner appears
- [ ] Explanation appears (in 3-5 seconds)
- [ ] Explanation is reasonable (not fallback)

### 5.2 Test from Assistant
- [ ] Tap Home → Tap "Запитати Лідика" (from quick actions)
- [ ] Or go to Learning → Tap "Запитати Лідика" tile
- [ ] Chat screen appears with Лідик greeting
- [ ] Type Ukrainian question: "Яка швидкість на дорозі 50 км/год?"
- [ ] Send message
- [ ] Mascot emoji changes to 🤔 (thinking)
- [ ] Response appears in 2-5 seconds
- [ ] Response is sensible (not "Не зовсім зрозумів")

### 5.3 Offline Test (Optional)
- [ ] Disable WiFi/cellular
- [ ] Try to send message to Lidyk
- [ ] Should show "Офлайн режим" or error
- [ ] Re-enable network
- [ ] Try again (should work)

**RESULT:** ✅ PASS or ❌ FAIL (note any fallback responses)

---

## Phase 6: Feature Screens (5 min)

### 6.1 Home Screen
- [ ] Guest: Shows demo test button ✅
- [ ] Guest: Shows quick actions (Learning, Lidyk, Chat) ✅
- [ ] Guest: Shows registration button ✅
- [ ] Student: Shows name greeting ✅
- [ ] Student: Shows course progress ✅
- [ ] Student: Shows next lesson ✅

### 6.2 Learning Screen
- [ ] Shows course title ✅
- [ ] Shows progress bar ✅
- [ ] Shows hub tiles ✅
- [ ] Tapping tiles navigates (or disables)

### 6.3 Tests Screen
- [ ] Shows categories/questions ✅
- [ ] Can select question
- [ ] Shows options A, B, C, D
- [ ] Can tap option
- [ ] Shows if correct/incorrect
- [ ] Lidyk modal button works

### 6.4 Chat Screen
- [ ] Shows chat UI ✅
- [ ] Has message list area
- [ ] Has input field
- [ ] Has send button
- [ ] For guest: Shows login prompt (expected)
- [ ] For student: Shows conversation (even if empty)

### 6.5 Club Screen
- [ ] Shows stories/posts ✅
- [ ] Shows feed UI
- [ ] Shows awards section
- [ ] Multiple views work

### 6.6 Profile Screen
- [ ] Shows user info ✅
- [ ] Shows theme selector ✅
- [ ] Tap theme option (dark/light/auto) → changes theme
- [ ] Shows edit fields/modal ✅
- [ ] Can tap name, phone, city to edit (if student)
- [ ] Shows avatar picker ✅
- [ ] Shows logout button ✅

**RESULT:** For each screen: ✅ PASS or ❌ FAIL

---

## Phase 7: Theme Testing (5 min)

### 7.1 Dark Theme
- [ ] Default is dark ✅
- [ ] All text visible
- [ ] All buttons visible
- [ ] No #000000 (fully black text)
- [ ] Colors are accent red + grays

### 7.2 Light Theme
- [ ] Go to Profile → Theme selector
- [ ] Select "Світла"
- [ ] All screens change to light theme
- [ ] Text is dark (visible on light bg)
- [ ] Buttons are visible
- [ ] Red accent still prominent
- [ ] No white text on light background

### 7.3 Auto Theme
- [ ] Select "Авто"
- [ ] Theme follows system preference
- [ ] Changes when system theme changes (if available)

**RESULT:** Dark ✅, Light ✅, Auto ✅ or specify issues

---

## Phase 8: Error Scenarios (5 min)

### 8.1 Offline Handling
- [ ] Disable WiFi/cellular
- [ ] Try Lidyk question → shows offline message
- [ ] Try Chat → shows offline message or pending
- [ ] Re-enable network → works again

### 8.2 Invalid Input
- [ ] Empty name registration → should reject
- [ ] Invalid email → should reject
- [ ] Empty question to Lidyk → should ignore or reject

### 8.3 Slow Network (Optional)
- [ ] Use network throttling
- [ ] Load home → should see skeleton or loader
- [ ] Ask Lidyk → should show loading

**RESULT:** Handles errors gracefully ✅ or ❌

---

## Phase 9: Logcat Monitoring

Run while testing:
```bash
adb logcat "*:E" | grep -i "error\|exception\|firebase"
```

### 9.1 Crash Check
- [ ] No red errors about onboarding
- [ ] No Firebase auth errors
- [ ] No API errors from Lidyk
- [ ] No unhandled promise rejections

### 9.2 Firebase Connection
- [ ] See "Initializing Firebase" or similar
- [ ] No "Unable to connect" errors
- [ ] No "Invalid project" errors

**RESULT:** ✅ Clean logcat or 🔴 note specific errors

---

## Phase 10: Final Screenshots

Take screenshots for documentation:

- [ ] 01_onboarding_slide1.png
- [ ] 02_onboarding_slide4.png
- [ ] 03_home_guest.png
- [ ] 04_home_student.png
- [ ] 05_learning.png
- [ ] 06_tests.png
- [ ] 07_chat.png
- [ ] 08_club.png
- [ ] 09_profile_dark.png
- [ ] 10_profile_light.png

---

## Summary Form

```
APK Version: [fill in]
Build Date: [fill in]
Tested On: [device/emulator type]
Date Tested: [date]

CRITICAL TESTS:
- Carousel Navigation: ✅ PASS / ❌ FAIL
- Lidyk Ukrainian: ✅ PASS / ❌ FAIL / ⚠️ FALLBACK

TAB STRUCTURE:
- Home: ✅ / ❌
- Learning: ✅ / ❌
- Chat: ✅ / ❌
- Club: ✅ / ❌
- Profile: ✅ / ❌

SCREENS:
- Onboarding: ✅ / ❌
- Home: ✅ / ❌
- Learning: ✅ / ❌
- Tests: ✅ / ❌
- Chat: ✅ / ❌
- Club: ✅ / ❌
- Profile: ✅ / ❌

OVERALL: ✅ READY FOR BETA / ❌ NEEDS FIXES / ⚠️ PARTIAL

Issues Found:
[list any problems]

Next Steps:
[recommendations]
```

---

## Notes

- **Carousel is CRITICAL:** If it doesn't advance slides, entire app is blocked
- **Lidyk Ukrainian is CRITICAL:** App targets Ukrainian users, must handle language
- **Theme IMPORTANT:** Users expect theme support
- **Chat can be basic:** First version doesn't need full messaging
- **Club can have mock data:** Awards and stories can be mocked

---

**Estimated Total Time:** 30-45 minutes  
**Start:** When APK is ready  
**Report:** Update TESTING_RESULTS.md with findings  

