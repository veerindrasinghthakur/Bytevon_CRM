#!/usr/bin/env bash
# reorganize-admin.sh — Admin module domain consolidation (no thin re-exports).
# Run from repo root: bash 01_frontend_code/scripts/reorganize-admin.sh
# Matches sales/projects: full bodies live under pages/{domain}/, hooks/{domain}/.
set -euo pipefail

ROOT="01_frontend_code/src/modules/admin"
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

if [[ ! -d "$ROOT" ]]; then
  echo "Missing $ROOT — run from bytevon_documentation repo root" >&2
  exit 1
fi

echo "==> Creating domain folders"
mkdir -p \
  "$ROOT/pages/user" "$ROOT/pages/role" "$ROOT/pages/audit" "$ROOT/pages/security" \
  "$ROOT/pages/settings" "$ROOT/pages/location" "$ROOT/pages/shift" \
  "$ROOT/pages/working_week" "$ROOT/pages/holiday_calendar" "$ROOT/pages/position" \
  "$ROOT/pages/department" "$ROOT/pages/office" \
  "$ROOT/components/user" "$ROOT/components/role" "$ROOT/components/settings" \
  "$ROOT/components/security" "$ROOT/components/location" "$ROOT/components/shift" \
  "$ROOT/components/working_week" "$ROOT/components/holiday_calendar" \
  "$ROOT/components/position" "$ROOT/components/audit" "$ROOT/components/office" \
  "$ROOT/hooks/user" "$ROOT/hooks/role" "$ROOT/hooks/settings" "$ROOT/hooks/location" \
  "$ROOT/hooks/shift" "$ROOT/hooks/working_week" "$ROOT/hooks/holiday_calendar" \
  "$ROOT/hooks/position" "$ROOT/hooks/department" "$ROOT/hooks/audit" \
  "$ROOT/hooks/leave" "$ROOT/hooks/security" "$ROOT/hooks/office"

mv_if() {
  local src="$1" dest="$2"
  if [[ -f "$src" ]]; then
    if [[ -f "$dest" ]]; then
      local sz
      sz=$(wc -c < "$dest" | tr -d ' ')
      if [[ "$sz" -lt 500 ]]; then
        echo "  remove stub $dest ($sz bytes)"
        git rm -f "$dest" 2>/dev/null || rm -f "$dest"
      elif [[ "$src" != "$dest" ]]; then
        echo "  skip $src — full dest already exists ($sz bytes)"
        return 0
      fi
    fi
    mkdir -p "$(dirname "$dest")"
    if git ls-files --error-unmatch "$src" >/dev/null 2>&1; then
      git mv "$src" "$dest"
    else
      mv "$src" "$dest"
    fi
    echo "  moved $src -> $dest"
  fi
}

echo "==> Pages: user / role / audit / security"
mv_if "$ROOT/pages/UsersListPage.tsx"        "$ROOT/pages/user/UsersListPage.tsx"
mv_if "$ROOT/pages/UserCreatePage.tsx"       "$ROOT/pages/user/UserCreatePage.tsx"
mv_if "$ROOT/pages/UserDetailPage.tsx"       "$ROOT/pages/user/UserDetailPage.tsx"
mv_if "$ROOT/pages/RolesListPage.tsx"        "$ROOT/pages/role/RolesListPage.tsx"
mv_if "$ROOT/pages/RoleDetailPage.tsx"       "$ROOT/pages/role/RoleDetailPage.tsx"
mv_if "$ROOT/pages/RoleFormPage.tsx"         "$ROOT/pages/role/RoleFormPage.tsx"
mv_if "$ROOT/pages/RoleCreatePage.tsx"       "$ROOT/pages/role/RoleCreatePage.tsx"
mv_if "$ROOT/pages/RoleEditPage.tsx"         "$ROOT/pages/role/RoleEditPage.tsx"
mv_if "$ROOT/pages/AuditLogsPage.tsx"        "$ROOT/pages/audit/AuditLogsPage.tsx"
mv_if "$ROOT/pages/SecurityCenterPage.tsx"   "$ROOT/pages/security/SecurityCenterPage.tsx"

echo "==> Pages: settings cluster"
mv_if "$ROOT/pages/AdminSettingsLayout.tsx"      "$ROOT/pages/settings/AdminSettingsLayout.tsx"
mv_if "$ROOT/pages/AttendanceSettingsLayout.tsx" "$ROOT/pages/settings/AttendanceSettingsLayout.tsx"
mv_if "$ROOT/pages/AttendanceSettingsPage.tsx"   "$ROOT/pages/settings/AttendanceSettingsPage.tsx"
mv_if "$ROOT/pages/LeaveSettingsLayout.tsx"      "$ROOT/pages/settings/LeaveSettingsLayout.tsx"
mv_if "$ROOT/pages/LeaveSettingsPage.tsx"        "$ROOT/pages/settings/LeaveSettingsPage.tsx"
mv_if "$ROOT/pages/LeavePoliciesPage.tsx"        "$ROOT/pages/settings/LeavePoliciesPage.tsx"
mv_if "$ROOT/pages/LeaveLedgerPage.tsx"          "$ROOT/pages/settings/LeaveLedgerPage.tsx"
mv_if "$ROOT/pages/OfficeFormPage.tsx"           "$ROOT/pages/settings/OfficeFormPage.tsx"
if [[ -f "$ROOT/pages/organization/OrganizationSettingsPage.tsx" ]]; then
  mv_if "$ROOT/pages/organization/OrganizationSettingsPage.tsx" "$ROOT/pages/settings/OrganizationSettingsPage.tsx"
else
  mv_if "$ROOT/pages/OrganizationSettingsPage.tsx" "$ROOT/pages/settings/OrganizationSettingsPage.tsx"
fi

echo "==> Pages: organization → domain folders"
ORG="$ROOT/pages/organization"
if [[ -d "$ORG" ]]; then
  mv_if "$ORG/LocationsListPage.tsx"      "$ROOT/pages/location/LocationsListPage.tsx"
  mv_if "$ORG/LocationDetailPage.tsx"     "$ROOT/pages/location/LocationDetailPage.tsx"
  mv_if "$ORG/ShiftsListPage.tsx"         "$ROOT/pages/shift/ShiftsListPage.tsx"
  mv_if "$ORG/ShiftDetailPage.tsx"        "$ROOT/pages/shift/ShiftDetailPage.tsx"
  mv_if "$ORG/WorkingWeeksPage.tsx"       "$ROOT/pages/working_week/WorkingWeeksPage.tsx"
  mv_if "$ORG/HolidayCalendarsPage.tsx"   "$ROOT/pages/holiday_calendar/HolidayCalendarsPage.tsx"
  mv_if "$ORG/HolidaysListPage.tsx"       "$ROOT/pages/holiday_calendar/HolidaysListPage.tsx"
  mv_if "$ORG/PositionsListPage.tsx"      "$ROOT/pages/position/PositionsListPage.tsx"
  mv_if "$ORG/PositionDetailPage.tsx"     "$ROOT/pages/position/PositionDetailPage.tsx"
  if [[ -f "$ORG/index.ts" ]]; then
    git rm -f "$ORG/index.ts" 2>/dev/null || rm -f "$ORG/index.ts"
  fi
  rmdir "$ORG" 2>/dev/null || true
fi

echo "==> Hooks: consolidate thin root stubs"
for pair in \
  "use-users-list.ts:user/use-users.ts" \
  "use-user-detail.ts:user/use-user-detail.ts" \
  "use-user-create.ts:user/use-user-create.ts" \
  "use-roles-list.ts:role/use-roles.ts" \
  "use-role-form.ts:role/use-role-form.ts" \
  "use-security-score.ts:security/use-security-score.ts" \
  "use-attendance-settings.ts:settings/use-attendance-settings.ts" \
  "use-head-office.ts:settings/use-head-office.ts" \
  "use-organization.ts:settings/use-settings.ts" \
  "use-organization-locations.ts:location/use-locations.ts" \
  "use-organization-shifts.ts:shift/use-shifts.ts" \
  "use-leave-settings-modal.ts:leave/use-leave-settings.ts"
do
  src_name="${pair%%:*}"
  dest_rel="${pair##*:}"
  src="$ROOT/hooks/$src_name"
  dest="$ROOT/hooks/$dest_rel"
  if [[ ! -f "$src" ]]; then continue; fi
  src_sz=$(wc -c < "$src" | tr -d ' ')
  if [[ -f "$dest" ]]; then
    dest_sz=$(wc -c < "$dest" | tr -d ' ')
    if [[ "$src_sz" -lt 500 && "$dest_sz" -ge 500 ]]; then
      echo "  delete thin root stub $src"
      git rm -f "$src" 2>/dev/null || rm -f "$src"
      continue
    fi
    if [[ "$dest_sz" -lt 500 && "$src_sz" -ge 500 ]]; then
      git rm -f "$dest" 2>/dev/null || rm -f "$dest"
      git mv "$src" "$dest" 2>/dev/null || mv "$src" "$dest"
      echo "  replaced stub $dest with body from $src"
      continue
    fi
    if [[ "$src_sz" -lt 500 ]]; then
      git rm -f "$src" 2>/dev/null || rm -f "$src"
      echo "  delete thin $src"
    else
      echo "  keep both (review): $src ($src_sz) and $dest ($dest_sz)"
    fi
  else
    mkdir -p "$(dirname "$dest")"
    git mv "$src" "$dest" 2>/dev/null || mv "$src" "$dest"
    echo "  moved $src -> $dest"
  fi
done

if [[ -f "$ROOT/hooks/use-users-list.test.tsx" ]]; then
  mv_if "$ROOT/hooks/use-users-list.test.tsx" "$ROOT/hooks/user/use-users.test.tsx"
fi

echo "==> Components"
mv_if "$ROOT/components/AdminSettingsNav.tsx"    "$ROOT/components/settings/AdminSettingsNav.tsx"
mv_if "$ROOT/components/LeaveSettingsNav.tsx"    "$ROOT/components/settings/LeaveSettingsNav.tsx"
mv_if "$ROOT/components/SecurityProtocols.tsx"   "$ROOT/components/security/SecurityProtocols.tsx"

echo ""
echo "Restructure moves complete."
echo "NEXT: update routes.tsx + index.ts imports; npm run lint && npm run typecheck"
