# Dead Drop — deploy script
# Double-click this (or run in PowerShell) to push updates.
# It auto-bumps the cache version so players always get the latest files.

$v = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

# Bump ?v= in index.html
$html = Get-Content "index.html" -Raw -Encoding utf8
$html = $html -replace 'styles\.css\?v=\d+', "styles.css?v=$v"
$html = $html -replace 'app\.js\?v=\d+',    "app.js?v=$v"
Set-Content "index.html" $html -Encoding utf8 -NoNewline

# Bump cache name in sw.js so the service worker refreshes too
$sw = Get-Content "sw.js" -Raw -Encoding utf8
$sw = $sw -replace 'dead-drop-v\d+', "dead-drop-v$v"
Set-Content "sw.js" $sw -Encoding utf8 -NoNewline

Write-Host "Cache version: $v" -ForegroundColor Cyan

git add .
git commit -m "Deploy v$v"
git push

Write-Host ""
Write-Host "Deployed! Live at:" -ForegroundColor Green
Write-Host "https://alialsaadi19050-rgb.github.io/Spyfall/" -ForegroundColor Yellow
Write-Host ""
pause
