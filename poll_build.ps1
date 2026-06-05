Set-Location 'C:\Avtoschool_APP\apps\mobile'
for ($i = 1; $i -le 45; $i++) {
    $out = eas build:view 'fbc1f9c2-60a3-409b-96ae-d28561b4507d' 2>&1 | Out-String
    $status = if ($out -match 'Status\s+(\S+)') { $matches[1] } else { 'unknown' }
    $time = Get-Date -Format 'HH:mm:ss'
    Add-Content 'C:\Avtoschool_APP\build_poll.log' "Check $i at $time : $status"
    if ($status -match 'finished|errored') {
        Add-Content 'C:\Avtoschool_APP\build_poll.log' 'BUILD DONE'
        break
    }
    Start-Sleep -Seconds 60
}
