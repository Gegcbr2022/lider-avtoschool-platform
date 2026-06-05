# Quick carousel navigation test
# Takes screenshots and compares them to verify carousel advances

param(
    [string]$APKPath = "C:\Avtoschool_APP\screens\v10-testing\carousel_test.apk",
    [string]$Device = "emulator-5554",
    [int]$NumTaps = 3
)

Write-Host "=== CAROUSEL TEST ===" -ForegroundColor Cyan

# Install APK
Write-Host "Installing APK..."
adb -s $Device uninstall ua.lider.avtoschool 2>&1 | Out-Null
$result = adb -s $Device install $APKPath 2>&1
if ($result -notmatch "Success") {
    Write-Host "Installation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "APK installed" -ForegroundColor Green

# Launch app
Write-Host "Launching app..."
adb -s $Device shell am start -n ua.lider.avtoschool/.MainActivity 2>&1 | Out-Null
Start-Sleep -Seconds 3

# Screenshot 1 - Initial state
Write-Host "Screenshot 1 (initial state)..."
adb -s $Device shell screencap -p /sdcard/carousel_test_01.png
adb -s $Device pull /sdcard/carousel_test_01.png "C:\Avtoschool_APP\screens\v10-testing\carousel_test_01.png" 2>&1 | Out-Null
$hash1 = (Get-FileHash "C:\Avtoschool_APP\screens\v10-testing\carousel_test_01.png").Hash

# Tap button multiple times and capture screenshots
for ($i = 1; $i -le $NumTaps; $i++) {
    Write-Host "Tap $i..."
    adb -s $Device shell input tap 540 2090
    Start-Sleep -Milliseconds 500

    $num = $i + 1
    adb -s $Device shell screencap -p /sdcard/carousel_test_$num.png
    adb -s $Device pull /sdcard/carousel_test_$num.png "C:\Avtoschool_APP\screens\v10-testing\carousel_test_$num.png" 2>&1 | Out-Null

    $newHash = (Get-FileHash "C:\Avtoschool_APP\screens\v10-testing\carousel_test_$num.png").Hash

    if ($newHash -ne $hash1) {
        Write-Host "  ✓ Screen changed!" -ForegroundColor Green
        $hash1 = $newHash
    } else {
        Write-Host "  ✗ Screen unchanged" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Test complete. Screenshots saved in C:\Avtoschool_APP\screens\v10-testing" -ForegroundColor Green
Write-Host "Check the debug UI (top-right corner) to see slide number, taps, and offset values"
