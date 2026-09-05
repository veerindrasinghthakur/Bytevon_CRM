# Flatten nested 02_backend_code/backend_code/ into 02_backend_code/
# Run from repo root in PowerShell:
#   powershell -ExecutionPolicy Bypass -File .\02_backend_code\scripts\flatten_package.ps1

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Nested = Join-Path $Root "backend_code"

Write-Host "Package root: $Root"

$NestedApp = Join-Path $Nested "app"
if (-not (Test-Path $NestedApp)) {
    $Core = Join-Path $Root "app\core"
    $Mods = Join-Path $Root "app\modules"
    if ((Test-Path $Core) -and (Test-Path $Mods)) {
        Write-Host "Already flat (app/core + app/modules present). Done."
        exit 0
    }
    Write-Host "ERROR: No nested backend_code/app found and top-level app is incomplete."
    exit 1
}

Write-Host "Found nested complete tree at $Nested"

# Remove incomplete top-level app if it lacks core/
$TopApp = Join-Path $Root "app"
$TopCore = Join-Path $TopApp "core"
if ((Test-Path $TopApp) -and -not (Test-Path $TopCore)) {
    Write-Host "Removing incomplete top-level app/"
    Remove-Item -Recurse -Force $TopApp
}

# Move each child from nested to root (overwrite if exists)
Get-ChildItem -Force $Nested | ForEach-Object {
    $dest = Join-Path $Root $_.Name
    if (Test-Path $dest) {
        Write-Host "  replace: $($_.Name)"
        Remove-Item -Recurse -Force $dest
    } else {
        Write-Host "  move: $($_.Name)"
    }
    Move-Item -Force $_.FullName $dest
}

if (Test-Path $Nested) {
    Remove-Item -Recurse -Force $Nested
}

Write-Host ""
Write-Host "Flattened. Verify:"
Get-ChildItem (Join-Path $Root "app\modules") | Select-Object -First 15 Name
if (Test-Path (Join-Path $Root "app\main.py")) { Write-Host "OK app/main.py" }
if (Test-Path (Join-Path $Root "app\core")) { Write-Host "OK app/core" }
if (Test-Path (Join-Path $Root "app\modules\rbac")) { Write-Host "OK app/modules/rbac" }
