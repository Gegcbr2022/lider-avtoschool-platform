# Automated APK Test Script
# Waits for EAS build to complete, downloads, installs, and tests

param(
    [int]$MaxWaitMinutes = 30,
    [string]$Device = "emulator-5554"
)

Write-Host "=== AUTO-TEST LAUNCHER ===" -ForegroundColor Cyan
Write-Host "Waiting for EAS build to complete..."
Write-Host "Max wait time: $MaxWaitMinutes minutes"
Write-Host ""

$startTime = Get-Date
$buildComplete = $false
$apkUrl = $null

# Poll for build completion
for ($i = 0; $i -lt $MaxWaitMinutes; $i++) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Checking build status... (attempt $($i+1))" -ForegroundColor Yellow

    $buildList = cd "C:\Avtoschool_APP\apps\mobile"; eas build:list --limit 1 --platform android 2>&1

    # Check for URL
    $urlLine = $buildList | Select-String "Application Archive URL"
    if ($urlLine -match "https://") {
        $apkUrl = ($urlLine -split "https://")[1]
        $apkUrl = "https://" + ($apkUrl -split " ")[0]
        $buildComplete = $true
        Write-Host "✓ Build complete! URL found" -ForegroundColor Green
        break
    }

    # Check status
    $statusLine = $buildList | Select-String "Status"
    Write-Host "  Status: $statusLine"

    if ($i -lt $MaxWaitMinutes - 1) {
        Write-Host "  Waiting 60 seconds..." -ForegroundColor Gray
        Start-Sleep -Seconds 60
    }
}

if (-not $buildComplete) {
    Write-Host ""
    Write-Host "❌ Build did not complete within $MaxWaitMinutes minutes" -ForegroundColor Red
    Write-Host "Check: eas build:list --limit 1 --platform android"
    exit 1
}

Write-Host ""
Write-Host "Downloading APK..." -ForegroundColor Yellow
$apkPath = "C:\Avtoschool_APP\apps\mobile\app-debug-$(Get-Date -Format 'yyyyMMdd_HHmmss').apk"

try {
    Invoke-WebRequest -Uri $apkUrl -OutFile $apkPath -TimeoutSec 300
    Write-Host "✓ Downloaded to: $apkPath" -ForegroundColor Green
} catch {
    Write-Host "❌ Download failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Installing APK..." -ForegroundColor Yellow
adb -s $Device uninstall ua.lider.avtoschool 2>&1 | Out-Null
$installResult = adb -s $Device install $apkPath 2>&1
if ($installResult -match "Success") {
    Write-Host "✓ Installation successful" -ForegroundColor Green
} else {
    Write-Host "❌ Installation failed: $installResult" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Running carousel test..." -ForegroundColor Yellow
Write-Host "Note: Ensure CAROUSEL_TEST_SCRIPT.ps1 exists"
Write-Host ""

if (Test-Path "C:\Avtoschool_APP\CAROUSEL_TEST_SCRIPT.ps1") {
    & "C:\Avtoschool_APP\CAROUSEL_TEST_SCRIPT.ps1" -Device $Device -APKPath $apkPath
} else {
    Write-Host "! CAROUSEL_TEST_SCRIPT.ps1 not found, skipping automated test" -ForegroundColor Yellow
    Write-Host "Run manually: C:\Avtoschool_APP\CAROUSEL_TEST_SCRIPT.ps1" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== COMPLETE ===" -ForegroundColor Green
Write-Host "APK: $apkPath"
Write-Host 'Check screenshots in: C:\Avtoschool_APP\screens\v10-testing\'
Write-Host "Check logs for [Carousel] messages"
