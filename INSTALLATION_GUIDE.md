# 📱 APK INSTALLATION GUIDE

**Status:** APK building via gradle (b5wiwohjr)  
**ETA:** ~10-15 minutes  

---

## Prerequisites

### Required
- [x] Android SDK installed
- [x] adb (Android Debug Bridge) in PATH
- [x] USB debugging enabled (if device)
- [x] Device/Emulator with Android 8.0+

### Optional
- [ ] USB cable (if installing on physical device)
- [ ] Emulator running (if installing on emulator)

---

## Check ADB Setup

```bash
# List connected devices
adb devices

# Expected output:
# List of attached devices
#   emulator-5554          device
#   or
#   <device-id>            device
```

---

## Installation Steps

### Step 1: Get APK Path
Build output will be at:
```
C:\Avtoschool_APP\apps\mobile\android\app\build\outputs\apk\release\app-release.apk
```

### Step 2: Install APK
```bash
adb install -r C:\Avtoschool_APP\apps\mobile\android\app\build\outputs\apk\release\app-release.apk
```

**Flags:**
- `-r` = Replace existing app

**Output:**
```
Success
```

### Step 3: Verify Installation
```bash
# Check if app is installed
adb shell pm list packages | findstr lider

# Should show:
# ua.lider.avtoschool
```

### Step 4: Launch App
```bash
adb shell am start -n ua.lider.avtoschool/.MainActivity

# Or: Tap app icon on device/emulator
```

---

## Uninstall (If Needed)

```bash
adb uninstall ua.lider.avtoschool
```

---

## Troubleshooting

### Problem: "device not found"
```bash
# Check devices
adb devices

# If emulator not running:
# - Open Android Studio
# - Launch virtual device

# If physical device not connecting:
# - Check USB cable
# - Enable USB debugging
# - Check driver on Windows
```

### Problem: "app already installed"
```bash
# Remove and reinstall
adb uninstall ua.lider.avtoschool
adb install path/to/apk
```

### Problem: "insufficient space"
```bash
# Clear cache
adb shell pm clear ua.lider.avtoschool

# Or: Remove other apps
```

### Problem: "gradle build failed"
See: LOCAL_BUILD_GUIDE.md troubleshooting section

---

## Quick Commands

```bash
# Install
adb install -r C:\Avtoschool_APP\apps\mobile\android\app\build\outputs\apk\release\app-release.apk

# Launch
adb shell am start -n ua.lider.avtoschool/.MainActivity

# Uninstall
adb uninstall ua.lider.avtoschool

# Monitor logs
adb logcat "*:E"

# Clear data
adb shell pm clear ua.lider.avtoschool
```

---

## Expected APK Properties

| Property | Value |
|----------|-------|
| Filename | app-release.apk |
| Size | ~30-50 MB |
| Package | ua.lider.avtoschool |
| Version | 0.1.0 |
| Min API | 21 (Android 5.0) |
| Target API | 33+ (Android 13+) |

---

## Success Criteria

✅ APK installed without errors  
✅ App launches on device/emulator  
✅ Doesn't crash immediately  
✅ Shows onboarding or home screen  

---

## Next Steps

Once installed, see: APK_TESTING_PLAN.md

---

**Status Update:** Check gradle build progress in 10 minutes

