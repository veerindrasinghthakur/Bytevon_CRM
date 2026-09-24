#!/usr/bin/env bash
# Live-backend smoke (bash twin of test-live-api.ps1). Read-only GETs + login.
# API_BASE_URL default http://localhost:8000/api/v1
set -u
BASE="${API_BASE_URL:-http://localhost:8000/api/v1}"
EMAIL="${TEST_EMAIL:-admin@bytevon.local}"
PASS="${TEST_PASSWORD:-ChangeMeAdmin!123}"
FAIL=0
check() { if [ "$2" = 0 ]; then echo "PASS $1"; else echo "FAIL $1 $3"; FAIL=$((FAIL+1)); fi; }

ROOT="${BASE%/api/v1}"
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$ROOT/health"); [ "$code" = 200 ] && R=0 || R=1; check "health" $R "got $code"

LOGIN=$(curl -s --max-time 15 -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
TOKEN=$(printf '%s' "$LOGIN" | python3 -c "import sys,json;print(json.load(sys.stdin).get('tokens',{}).get('access_token',''))" 2>/dev/null)
[ -n "$TOKEN" ] && R=0 || R=1; check "login" $R ""
[ -z "$TOKEN" ] && { echo "SKIP module GETs (no token)"; exit 1; }

for r in /rbac/roles /workforce/employments /workforce/departments /leave/requests /approvals/pending /my-work/overview /notifications/inbox /sales/leads /projects /dashboard/executive /admin/users; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 -H "Authorization: Bearer $TOKEN" "$BASE$r")
  case "$code" in 200|201|404|422) R=0;; *) R=1;; esac; check "GET $r" $R "got $code"
done

code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d '{}'); [ "$code" = 422 ] && R=0 || R=1; check "login-422-shape" $R "got $code"
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$BASE/rbac/roles"); [ "$code" = 401 ] && R=0 || R=1; check "unauth-401" $R "got $code"

[ "$FAIL" -gt 0 ] && { echo "$FAIL check(s) FAILED"; exit 1; }
echo "ALL LIVE CHECKS PASSED"
