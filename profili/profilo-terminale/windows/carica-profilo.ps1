$source = Join-Path $PSScriptRoot "profile-windows.ps1"

New-Item -Path $PROFILE -ItemType File -Force
Get-Content $source | Add-Content $PROFILE

Write-Host "Profilo caricato correttamente." -ForegroundColor Green
