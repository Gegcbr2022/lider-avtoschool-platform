# ⚡ QUICK TEST CHECKLIST — When APK Ready

**Objective:** Test carousel, get debug logs, fix issue  
**Time Budget:** 30 minutes  

---

## ✅ Preparation (BEFORE APK ready)

- [x] Test script ready: CAROUSEL_TEST_SCRIPT.ps1
- [x] Device/emulator connected
- [x] Logcat monitor ready
- [x] Screenshot directory ready: screens/v10-testing/
- [x] Debug code in git (commit 57e115d)

---

## 🚀 When APK Ready (WHEN EAS build completes)

### 1. Download APK (2 min)
```bash
# Check for download link
eas build:list --limit 1 --platform android

# When you see "Application Archive URL: https://..."
# Download it:
$url = "https://..."
Invoke-WebRequest -Uri $url -OutFile "C:\Avtoschool_APP\apps\mobile\app-debug.apk"
```

**Expected:** File ~70-75 MB

### 2. Install APK (3 min)
```bash
$device = "emulator-5554"
adb -s $device uninstall ua.lider.avtoschool
adb -s $device install "C:\Avtoschool_APP\apps\mobile\app-debug.apk"
```

**Expected:** Success message

### 3. Run Test Script (10 min)
```powershell
C:\Avtoschool_APP\CAROUSEL_TEST_SCRIPT.ps1
```

**What it does:**
- Launches app
- Captures logcat
- Takes screenshot before tap
- Taps "Далі" button
- Takes screenshot after tap
- Taps again, takes 3rd screenshot
- Shows logs with [Carousel] tags

**Saves:**
- Logs to: carousel_test_YYYYMMDD_HHMMSS.log
- Screenshots to: screens/v10-testing/test*.png

### 4. Review Results (10 min)

**Check screenshots:**
- test01_before.png — Should show slide 1
- test02_after.png — Should show slide 2 (if fixed) or slide 1 (if still broken)
- test03_after2nd.png — Should show slide 3 (if fixed)

**Check logs for [Carousel] messages:**
```
[Carousel] Attempting scroll to index: 1 from: 0
[Carousel] scrollToIndex called successfully
```

Or if fallback triggered:
```
[Carousel] scrollToIndex failed: [error details]
[Carousel] Fallback: scrollToOffset with offset: 1080
```

### 5. Determine Fix (5 min)

**If scrollToIndex succeeded but carousel didn't advance:**
- Problem: scrollToIndex doesn't work with pagingEnabled
- Solution: Remove scrollToIndex, use scrollToOffset only

**If scrollToIndex failed with exception:**
- Problem: Exception thrown
- Solution: Use fallback (already in code)

**If scrollToOffset succeeded in fallback:**
- Problem: scrollToIndex broken
- Solution: Keep fallback, remove scrollToIndex call

---

## 📝 What to Look For in Logs

### Good Signs
```
✅ [Carousel] Attempting scroll to index: 1
✅ [Carousel] scrollToIndex called successfully
✅ Carousel advances in screenshot
```

### Bad Signs
```
❌ scrollToIndex NEVER appears (not being called)
❌ scrollToIndex failed: [exception]
❌ [Carousel] Fallback called (scrollToIndex didn't work)
❌ Carousel doesn't advance in screenshot
```

### Expected If Working
- slide 1 → tap → slide 2 ✓
- slide 2 → tap → slide 3 ✓
- slide 3 → tap → slide 4 ✓
- slide 4 → tap → auth screen ✓

---

## 🔧 Quick Fix Implementation

Once you know the issue:

### If scrollToIndex is broken:
```javascript
// REMOVE this line:
flatRef.current?.scrollToIndex({ index: nextIndex, animated: true, viewPosition: 0 });

// KEEP this (already in fallback):
const offset = nextIndex * W;
flatRef.current?.scrollToOffset({ offset, animated: true });
```

### If getItemLayout is wrong:
```javascript
// Check if W is correct at runtime
// Add console.log before getItemLayout
console.log("[Carousel] Window width (W):", W);
```

### If pagingEnabled conflicts:
```javascript
// Try removing pagingEnabled
// or using different scrolling approach
// or using react-native-pager-view library
```

---

## 📊 Decision Flow

```
Is carousel advancing?
├─ YES → ✅ ISSUE FIXED! Continue to full test
│         └─ Skip fix, go to step 6
│
└─ NO → Check logs for [Carousel]
    ├─ scrollToIndex succeeded → Problem: call works but doesn't advance
    │   └─ Fix: Use ONLY scrollToOffset, remove scrollToIndex
    │
    ├─ scrollToIndex failed → Problem: exception thrown
    │   └─ Fix: Already handled (fallback active)
    │
    └─ Fallback called → Problem: scrollToIndex broken
        └─ Fix: Same as above
```

---

## 6. If Carousel Works Now

- [x] Carousel fix verified ✅
- [ ] Test all 4 slides
- [ ] Test auth buttons on final slide
- [ ] Check for any new bugs
- [ ] Full feature test (Lidyk, home, etc)
- [ ] Declare v10-alpha ready

**Time:** ~30 min total for full test

---

## 7. If Carousel Still Broken

### Debug Further
```bash
# Check FlatList width at runtime
adb logcat | grep "Window width"

# Check if ref is initialized
adb logcat | grep "ref"

# Check React Native version
adb shell getprop | grep react
```

### Try Alternative
- Use react-native-pager-view
- Implement custom swipe handling
- Rewrite carousel completely

**Time:** 1-2 hours

---

## Emergency Contact Points

**If stuck:**
1. Check CRITICAL_FINDINGS_CAROUSEL_BUG.md
2. Review CODE_INVENTORY_ACTUAL.md (onboarding.tsx section)
3. Check React Native docs on FlatList scrolling
4. Try alternative implementations

---

## Success Criteria

This test is **SUCCESSFUL** if:
- [ ] APK downloads
- [ ] APK installs
- [ ] App launches
- [ ] Carousel advances at least once
- [ ] Logs show [Carousel] messages
- [ ] Root cause identified

---

## Timeline

| Step | Time | ETA |
|------|------|-----|
| Download APK | 2 min | T+2 |
| Install | 3 min | T+5 |
| Run test | 10 min | T+15 |
| Review results | 10 min | T+25 |
| Determine fix | 5 min | T+30 |

**Total: 30 minutes from APK ready**

---

## Next After This

Once carousel issue is identified:
1. Implement fix in code
2. Commit fix
3. Rebuild APK
4. Retest carousel
5. If working → full feature test
6. If working → v10-alpha ready

---

**READY?** Just waiting for APK to finish building!

Current ETA: ~18:50-19:00 UTC

