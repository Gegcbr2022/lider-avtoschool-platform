# Simple wait and test script
# Waits for EAS build and tests carousel when ready

Write-Host "Waiting for EAS build to complete..."

$maxAttempts = 30
$count = 0

do {
    $count++
    Write-Host "Checking build ($count/30)..."

    $buildList = & cd "C:\Avtoschool_APP\apps\mobile"; eas build:list --limit 1 --platform android 2>&1

    if ($buildList -match "https://expo.dev/artifacts") {
        Write-Host "BUILD COMPLETE!" -ForegroundColor Green

        # Extract URL
        $urlMatch = $buildList | Select-String "https://expo.dev/artifacts/eas/[^`"]*\.apk"
        if ($urlMatch) {
            $apkUrl = $urlMatch.Matches[0].Value
            Write-Host "APK URL: $apkUrl" -ForegroundColor Cyan

            # Download
            Write-Host "Downloading APK..."
            $apkPath = "C:\Avtoschool_APP\apps\mobile\app-release.apk"
            Invoke-WebRequest -Uri $apkUrl -OutFile $apkPath

            # Install
            Write-Host "Installing APK..."
            adb -s emulator-5554 uninstall ua.lider.avtoschool 2>&1 | Out-Null
            adb -s emulator-5554 install $apkPath

            # Test
            Write-Host "Running test..."
            & C:\Avtoschool_APP\CAROUSEL_TEST_SCRIPT.ps1

            exit 0
        }
    }

    if ($count -lt 30) {
        Write-Host "Waiting 60 seconds..."
        Start-Sleep -Seconds 60
    }
} while ($count -lt 30)

Write-Host "Timeout: Build did not complete in 30 minutes" -ForegroundColor Red
exit 1
