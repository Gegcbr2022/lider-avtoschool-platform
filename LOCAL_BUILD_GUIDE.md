# 🔨 LOCAL APK BUILD GUIDE

**Status:** EAS build taking too long, using local build alternative  
**Method:** Expo prebuild + gradle assembleRelease  
**Expected Time:** 15-20 minutes  

---

## Why Local Build?

- EAS cloud build: 1.5+ hours (unusual)
- Local build: 15-20 minutes
- Can test immediately without cloud queue
- Better for development

---

## Steps

### Step 1: Prebuild Native Project ✅ IN PROGRESS
```bash
cd apps/mobile
npx expo prebuild --platform android --clean
```

**What it does:**
- Generates native Android files from app.json
- Creates android/ directory with Gradle config
- Downloads necessary dependencies

**Status:** `bn76x94ua` running

### Step 2: Build APK with Gradle
```bash
cd apps/mobile/android
./gradlew.bat assembleRelease
```

**What it does:**
- Compiles TypeScript/JavaScript to native code
- Builds APK binary
- Signs with keystore
- Outputs to: `app/build/outputs/apk/release/app-release.apk`

**Expected time:** ~10 minutes

### Step 3: Install APK
```bash
adb install -r C:\Avtoschool_APP\apps\mobile\android\app\build\outputs\apk\release\app-release.apk
```

**What it does:**
- Uninstalls previous version (if exists)
- Installs new APK
- App ready to test

### Step 4: Test
See: APK_TESTING_PLAN.md

---

## Expected Output

After prebuild completes:
```
✓ Android project generated in: apps/mobile/android
✓ Ready for Gradle build
```

After gradle build completes:
```
✓ Built app-release.apk (file size ~30-50 MB)
✓ Signed and ready to install
```

---

## Troubleshooting

### If Prebuild Fails
```bash
# Clear cache and retry
rm -rf node_modules
npm install
npx expo prebuild --platform android --clean
```

### If Gradle Build Fails
Check error message. Common issues:
1. **Metro bundler error** → Clear cache: `npx expo prebuild --clean`
2. **Keystore error** → First build doesn't have keystore, will create
3. **Version mismatch** → Check app.config.ts versionCode

### If Install Fails
```bash
# Check if device connected
adb devices

# Uninstall old version first
adb uninstall ua.lider.avtoschool

# Then install
adb install path/to/apk
```

---

## Timeline (Expected)

```
Now: Prebuild running (bn76x94ua)
+5 min: Prebuild completes
+5 min: Start gradle build
+15 min: Gradle build completes
+3 min: APK installed
+30 min total: Ready for testing
```

---

## Files Involved

| File | Purpose |
|------|---------|
| apps/mobile/app.config.ts | App config (version, permissions) |
| apps/mobile/eas.json | EAS config |
| apps/mobile/package.json | Dependencies |
| apps/mobile/android/app/build.gradle | Gradle config (generated) |
| apps/mobile/android/gradlew.bat | Gradle wrapper (Windows) |

---

## Alternative: Use EAS Build Link

If local build fails, get APK from EAS cloud:
```bash
# List builds
eas build:list --limit 1 --platform android

# When Application Archive URL appears:
# Copy the HTTPS URL
# Download: curl -o app.apk "https://..."
# Install: adb install -r app.apk
```

---

## Success Criteria

✅ APK file created: `app/build/outputs/apk/release/app-release.apk`
✅ APK installed on device
✅ App launches without crash
✅ Can navigate to carousel
✅ Can send message to Lidyk

---

## Notes

- Debug vs Release: This builds Release (optimized, smaller, faster)
- Signing: First build will prompt for keystore creation
- Size: APK will be 30-50 MB (normal)
- Dependencies: Downloaded once, cached afterward

---

**Next Update:** When prebuild completes

