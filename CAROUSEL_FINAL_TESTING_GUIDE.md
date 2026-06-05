# Carousel Fix - Final Testing Guide

## Quick Reference
**Problem**: Carousel doesn't advance on onboarding
**Root Cause**: React state closure bug + FlatList scrolling issues
**Solution**: ScrollView + functional setState

## Builds to Test

### Priority 1: Build 663ca03d (f8f379f) - ScrollView
- Status: In progress
- ETA: ~16:35 UTC
- Approach: ScrollView instead of FlatList
- Command: Test as soon as available

### Priority 2: Build b6547bd8 (6ca9b28) - Functional setState
- Status: In queue
- ETA: ~16:42 UTC
- Approach: ScrollView + functional setState
- Command: Test if Priority 1 fails

## Testing Procedure

### Step 1: Download APK
```powershell
$apkUrl = "https://expo.dev/artifacts/eas/<APK_ID>.apk"
$apkPath = "C:\Avtoschool_APP\screens\v10-testing\carousel_fix.apk"
Invoke-WebRequest -Uri $apkUrl -OutFile $apkPath
```

### Step 2: Install on Emulator
```powershell
adb -s emulator-5554 uninstall ua.lider.avtoschool
adb -s emulator-5554 install $apkPath
adb -s emulator-5554 shell am start -n ua.lider.avtoschool/.MainActivity
Start-Sleep -Seconds 3
```

### Step 3: Capture Initial Screenshot
```powershell
adb -s emulator-5554 shell screencap -p /sdcard/carousel_fix_01.png
adb -s emulator-5554 pull /sdcard/carousel_fix_01.png "C:\Avtoschool_APP\screens\v10-testing\"
```
Expected: Shows slide 1 with emoji 🚗, title "Навчайся онлайн"

### Step 4: Tap Button 4 Times
```powershell
for ($i = 1; $i -le 4; $i++) {
    adb -s emulator-5554 shell input tap 540 2090
    Start-Sleep -Milliseconds 700
    adb -s emulator-5554 shell screencap -p /sdcard/carousel_fix_0$($i+1).png
    adb -s emulator-5554 pull /sdcard/carousel_fix_0$($i+1).png "C:\Avtoschool_APP\screens\v10-testing\"
}
```

### Step 5: Verify Results
Check if screenshots change:
- Screenshot 1: Slide 1/4 (car 🚗)
- Screenshot 2: Slide 2/4 (clipboard 📝) ← Different?
- Screenshot 3: Slide 3/4 (trophy 🏆) ← Different?
- Screenshot 4: Slide 4/4 (graduation 🎓) ← Different?
- Screenshot 5: Auth screen (buttons visible) ← Different?

Compare file hashes:
```powershell
$hashes = @()
for ($i = 1; $i -le 5; $i++) {
    $hash = (Get-FileHash "C:\Avtoschool_APP\screens\v10-testing\carousel_fix_0$i.png").Hash
    $hashes += $hash
    Write-Host "Screenshot $i: $hash"
}

for ($i = 0; $i -lt 4; $i++) {
    $same = if ($hashes[$i] -eq $hashes[$i+1]) { "SAME ❌" } else { "DIFFERENT ✓" }
    Write-Host "Screenshot $($i+1) vs $($i+2): $same"
}
```

## Success Criteria
✅ **PASS** = Screenshots are all different (carousel advanced through all 4 slides)
❌ **FAIL** = Screenshots are same (carousel frozen)

## If PASS (Carousel Works)
1. ✅ Carousel fix verified
2. Full app test needed:
   - Test auth screen buttons (register/login/guest)
   - Test home screen after login
   - Test all tabs (Learning, Tests, Chat, Club, Profile)
   - Test theme switching
   - Test database connectivity
3. Prepare v10 release

## If FAIL (Carousel Still Broken)
1. Test Priority 2 build
2. If that also fails, investigate:
   - React Native version incompatibility
   - Emulator issues
   - Fundamental architectural problem

## Debug UI Indicators (if present)
Look in top-right corner for:
- Slide: "1/4", "2/4", "3/4", "4/4"
- Taps: "taps:0", "taps:1", etc.
- Offset: scroll position in pixels

If these don't change, state updates are broken.
If they do change but carousel doesn't advance, scrolling is broken.

## Common Issues

### Issue: App crashes on launch
- Solution: Clear app data and reinstall
- Command: `adb -s emulator-5554 shell pm clear ua.lider.avtoschool`

### Issue: Button appears unresponsive
- Solution: Tap the center of the red button (coordinates: x=540, y=2090)
- Alternative: Swipe manually from right to left

### Issue: Screenshots all black/blank
- Solution: App may not be visible yet, wait 5 seconds
- Alternative: Tap screen once to wake up emulator

### Issue: adb not found
- Solution: Set PATH to Android SDK tools
- Command: `$env:PATH += ";C:\Android\sdk\platform-tools"`

## Important Notes
- Keep emulator running throughout tests
- Wait 600ms between taps (allows animation to complete)
- Capture at least 5 screenshots (4 taps + initial)
- Compare file hashes, not visual inspection (more reliable)
- Document results with screenshots for reference

## Files to Check After Fix
Once carousel is working, verify:
- `apps/mobile/app/onboarding.tsx` - Main component
- `apps/mobile/package.json` - Dependencies
- `apps/mobile/app.config.ts` - App config
- Git log - All commits applied

## Rollback Plan
If fix doesn't work, revert to working version:
```powershell
git log --oneline | grep "WORKING"  # Find last working commit
git reset --hard <commit-hash>
eas build --platform android --profile preview
```

## Contact & References
- Main issue: Carousel navigation blocked on onboarding
- Root cause doc: CAROUSEL_DEBUGGING_SESSION.md
- Test results: CAROUSEL_TEST_RESULTS_SUMMARY.md
- Fix details: ONBOARDING_CAROUSEL_FIX_SUMMARY.md
