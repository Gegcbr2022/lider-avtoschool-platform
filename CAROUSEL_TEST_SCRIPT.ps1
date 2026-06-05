# Carousel Testing Script
# Tests carousel navigation on emulator with debug output

param(
    [string]$Device = "emulator-5554",
    [string]$APKPath = "C:\Avtoschool_APP\apps\mobile\app-release.apk"
)

Write-Host "=== CAROUSEL TEST SCRIPT ===" -ForegroundColor Cyan
Write-Host ""

# Check device
Write-Host "Checking devices..." -ForegroundColor Yellow
adb devices

Write-Host ""
Write-Host "Installing APK..." -ForegroundColor Yellow
adb -s $Device uninstall ua.lider.avtoschool 2>&1 | Out-Null
adb -s $Device install $APKPath

Write-Host ""
Write-Host "Launching app..." -ForegroundColor Yellow
adb -s $Device shell am start -n ua.lider.avtoschool/.MainActivity

Write-Host ""
Write-Host "Waiting 3 seconds for app to load..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Starting logcat capture (ERROR level)..." -ForegroundColor Yellow
Write-Host "This will show React Native errors and our debug logs" -ForegroundColor Gray
Write-Host ""

# Capture logcat in background
$logFile = "C:\Avtoschool_APP\carousel_test_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
Write-Host "Logs will be saved to: $logFile" -ForegroundColor Gray

# Start logcat capture (background)
$logProcess = Start-Process -FilePath adb -ArgumentList "-s", $Device, "logcat", "-s", "ReactNativeJS" -RedirectStandardOutput $logFile -PassThru

Write-Host ""
Write-Host "Taking screenshot 01 (before tap)..." -ForegroundColor Yellow
adb -s $Device shell screencap -p /sdcard/test01.png
adb -s $Device pull /sdcard/test01.png "C:\Avtoschool_APP\screens\v10-testing\test01_before.png" 2>&1 | Out-Null

Write-Host ""
Write-Host "Tapping 'Далі' button at (540, 2090)..." -ForegroundColor Yellow
adb -s $Device shell input tap 540 2090

Write-Host "Waiting 2 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Taking screenshot 02 (after tap)..." -ForegroundColor Yellow
adb -s $Device shell screencap -p /sdcard/test02.png
adb -s $Device pull /sdcard/test02.png "C:\Avtoschool_APP\screens\v10-testing\test02_after.png" 2>&1 | Out-Null

Write-Host ""
Write-Host "Tapping again..." -ForegroundColor Yellow
adb -s $Device shell input tap 540 2090

Write-Host "Waiting 2 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Taking screenshot 03 (after 2nd tap)..." -ForegroundColor Yellow
adb -s $Device shell screencap -p /sdcard/test03.png
adb -s $Device pull /sdcard/test03.png "C:\Avtoschool_APP\screens\v10-testing\test03_after2nd.png" 2>&1 | Out-Null

Write-Host ""
Write-Host "Stopping logcat..." -ForegroundColor Yellow
Stop-Process -Id $logProcess.Id -Force

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Screenshots saved:" -ForegroundColor Yellow
Write-Host "  - test01_before.png"
Write-Host "  - test02_after.png"
Write-Host "  - test03_after2nd.png"
Write-Host ""
Write-Host "Logs saved to: $logFile" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next: Review logs for [Carousel] debug messages" -ForegroundColor Cyan
Write-Host ""

# Display carousel logs if any
Write-Host "Carousel logs from this test:" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Gray
Get-Content $logFile | Select-String "\[Carousel\]" | ForEach-Object { Write-Host $_ -ForegroundColor Green }
Write-Host "================================" -ForegroundColor Gray
