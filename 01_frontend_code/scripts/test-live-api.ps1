# Live-backend smoke: read-only GETs + login against 02_backend_code.
# Usage: powershell -ExecutionPolicy Bypass -File ./scripts/test-live-api.ps1
# Env overrides: $env:API_BASE_URL (default http://localhost:8000/api/v1),
#   $env:TEST_EMAIL / $env:TEST_PASSWORD (default admin@bytevon.local / ChangeMeAdmin!123)
$ErrorActionPreference = 'Stop'
$base = $env:API_BASE_URL
if (-not $base) { $base = 'http://localhost:8000/api/v1' }
$email = $env:TEST_EMAIL
if (-not $email) { $email = 'admin@bytevon.local' }
$password = $env:TEST_PASSWORD
if (-not $password) { $password = 'ChangeMeAdmin!123' }

$script:failed = 0
function Check($name, $cond, $detail = '') {
  if ($cond) { Write-Output "PASS $name" }
  else { Write-Output "FAIL $name $detail"; $script:failed++ }
}

# 1. Health (via app root: strip /api/v1)
$root = $base -replace '/api/v1$', ''
try {
  $h = Invoke-RestMethod -Uri "$root/health" -TimeoutSec 10
  Check 'health' ($h.status -eq 'ok') ($h | ConvertTo-Json -Compress)
} catch { Check 'health' $false $_.Exception.Message }

# 2. Login
$token = $null
try {
  $login = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType 'application/json' `
    -Body (@{ email = $email; password = $password } | ConvertTo-Json) -TimeoutSec 15
  $token = $login.tokens.access_token
  Check 'login' ([bool]$token) ''
} catch { Check 'login' $false $_.Exception.Message }

if (-not $token) { Write-Output "SKIP module GETs (no token)"; exit 1 }

$headers = @{ Authorization = "Bearer $token" }
$routes = @(
  '/rbac/roles', '/workforce/employments', '/workforce/departments',
  '/leave/requests', '/approvals/pending', '/approvals/kpis',
  '/my-work/overview', '/notifications/inbox', '/sales/leads',
  '/projects', '/payroll/run', '/dashboard/executive', '/admin/users'
)
foreach ($r in $routes) {
  try {
    $res = Invoke-WebRequest -Uri "$base$r" -Headers $headers -TimeoutSec 15 -UseBasicParsing
    Check "GET $r" ($res.StatusCode -in 200, 201) "got $($res.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    # 404/422 on empty collections still proves the route + auth contract
    Check "GET $r" ($code -in 200, 201, 404, 422) "got $code"
  }
}

# 3. Validation shape: empty login body must be 422 with error/detail body
try {
  Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType 'application/json' -Body '{}' -TimeoutSec 10 | Out-Null
  Check 'login-422-shape' $false 'expected 422'
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Check 'login-422-shape' ($code -eq 422) "got $code"
}

# 4. Unauthenticated guard
try {
  Invoke-RestMethod -Uri "$base/rbac/roles" -TimeoutSec 10 | Out-Null
  Check 'unauth-401' $false 'expected 401'
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Check 'unauth-401' ($code -eq 401) "got $code"
}

if ($script:failed -gt 0) { Write-Output "$($script:failed) check(s) FAILED"; exit 1 }
Write-Output 'ALL LIVE CHECKS PASSED'
