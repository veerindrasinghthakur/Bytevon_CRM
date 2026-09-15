#!/usr/bin/env bash
# Restructure admin module into domain folders (git mv preserves history).
# Run from repo root: bash 01_frontend_code/scripts/restructure-admin-module.sh
set -euo pipefail
ROOT="01_frontend_code/src/modules/admin"
cd "$(git rev-parse --show-toplevel)"

if [[ ! -d "$ROOT" ]]; then
  echo "Missing $ROOT" >&2
  exit 1
fi

mkdir -p \
  "$ROOT/api" \
  "$ROOT/hooks/user" "$ROOT/hooks/role" "$ROOT/hooks/settings" \
  "$ROOT/hooks/location" "$ROOT/hooks/shift" "$ROOT/hooks/working_week" \
  "$ROOT/hooks/holiday_calendar" "$ROOT/hooks/position" "$ROOT/hooks/department" \
  "$ROOT/hooks/audit" "$ROOT/hooks/leave" "$ROOT/hooks/security" \
  "$ROOT/pages/user" "$ROOT/pages/role" "$ROOT/pages/audit" "$ROOT/pages/security" \
  "$ROOT/pages/settings" "$ROOT/pages/location" "$ROOT/pages/shift" \
  "$ROOT/pages/working_week" "$ROOT/pages/holiday_calendar" "$ROOT/pages/position" \
  "$ROOT/pages/department" \
  "$ROOT/components/settings" "$ROOT/components/security" "$ROOT/components/role" \
  "$ROOT/schemas/user" "$ROOT/schemas/role" "$ROOT/schemas/audit" "$ROOT/schemas/leave" \
  "$ROOT/schemas/settings" \
  "$ROOT/types"

# --- API renames ---
[[ -f "$ROOT/api/users.ts" ]] && git mv "$ROOT/api/users.ts" "$ROOT/api/user.ts"
[[ -f "$ROOT/api/users.test.ts" ]] && git mv "$ROOT/api/users.test.ts" "$ROOT/api/user.test.ts"
[[ -f "$ROOT/api/roles.ts" ]] && git mv "$ROOT/api/roles.ts" "$ROOT/api/role.ts"
[[ -f "$ROOT/api/metrics.ts" ]] && git mv "$ROOT/api/metrics.ts" "$ROOT/api/attendance.ts"

# --- Hooks into domain folders ---
[[ -f "$ROOT/hooks/use-users-list.ts" ]] && git mv "$ROOT/hooks/use-users-list.ts" "$ROOT/hooks/user/use-users.ts"
[[ -f "$ROOT/hooks/use-users-list.test.tsx" ]] && git mv "$ROOT/hooks/use-users-list.test.tsx" "$ROOT/hooks/user/use-users.test.tsx"
[[ -f "$ROOT/hooks/use-user-detail.ts" ]] && git mv "$ROOT/hooks/use-user-detail.ts" "$ROOT/hooks/user/use-user-detail.ts"
[[ -f "$ROOT/hooks/use-user-create.ts" ]] && git mv "$ROOT/hooks/use-user-create.ts" "$ROOT/hooks/user/use-user-create.ts"
[[ -f "$ROOT/hooks/use-roles-list.ts" ]] && git mv "$ROOT/hooks/use-roles-list.ts" "$ROOT/hooks/role/use-roles.ts"
[[ -f "$ROOT/hooks/use-role-form.ts" ]] && git mv "$ROOT/hooks/use-role-form.ts" "$ROOT/hooks/role/use-role-form.ts"
[[ -f "$ROOT/hooks/use-security-score.ts" ]] && git mv "$ROOT/hooks/use-security-score.ts" "$ROOT/hooks/security/use-security-score.ts"
[[ -f "$ROOT/hooks/use-attendance-settings.ts" ]] && git mv "$ROOT/hooks/use-attendance-settings.ts" "$ROOT/hooks/settings/use-attendance-settings.ts"
[[ -f "$ROOT/hooks/use-head-office.ts" ]] && git mv "$ROOT/hooks/use-head-office.ts" "$ROOT/hooks/settings/use-head-office.ts"
[[ -f "$ROOT/hooks/use-organization.ts" ]] && git mv "$ROOT/hooks/use-organization.ts" "$ROOT/hooks/settings/use-settings.ts"
[[ -f "$ROOT/hooks/use-organization-locations.ts" ]] && git mv "$ROOT/hooks/use-organization-locations.ts" "$ROOT/hooks/location/use-locations.ts"
[[ -f "$ROOT/hooks/use-organization-shifts.ts" ]] && git mv "$ROOT/hooks/use-organization-shifts.ts" "$ROOT/hooks/shift/use-shifts.ts"
[[ -f "$ROOT/hooks/use-leave-settings-modal.ts" ]] && git mv "$ROOT/hooks/use-leave-settings-modal.ts" "$ROOT/hooks/leave/use-leave-settings.ts"

# --- Pages: users / roles / audit / security ---
[[ -f "$ROOT/pages/UsersListPage.tsx" ]] && git mv "$ROOT/pages/UsersListPage.tsx" "$ROOT/pages/user/UsersListPage.tsx"
[[ -f "$ROOT/pages/UserCreatePage.tsx" ]] && git mv "$ROOT/pages/UserCreatePage.tsx" "$ROOT/pages/user/UserCreatePage.tsx"
[[ -f "$ROOT/pages/UserDetailPage.tsx" ]] && git mv "$ROOT/pages/UserDetailPage.tsx" "$ROOT/pages/user/UserDetailPage.tsx"
[[ -f "$ROOT/pages/RolesListPage.tsx" ]] && git mv "$ROOT/pages/RolesListPage.tsx" "$ROOT/pages/role/RolesListPage.tsx"
[[ -f "$ROOT/pages/RoleCreatePage.tsx" ]] && git mv "$ROOT/pages/RoleCreatePage.tsx" "$ROOT/pages/role/RoleCreatePage.tsx"
[[ -f "$ROOT/pages/RoleDetailPage.tsx" ]] && git mv "$ROOT/pages/RoleDetailPage.tsx" "$ROOT/pages/role/RoleDetailPage.tsx"
[[ -f "$ROOT/pages/RoleEditPage.tsx" ]] && git mv "$ROOT/pages/RoleEditPage.tsx" "$ROOT/pages/role/RoleEditPage.tsx"
[[ -f "$ROOT/pages/RoleFormPage.tsx" ]] && git mv "$ROOT/pages/RoleFormPage.tsx" "$ROOT/components/role/RoleFormPage.tsx"
[[ -f "$ROOT/pages/AuditLogsPage.tsx" ]] && git mv "$ROOT/pages/AuditLogsPage.tsx" "$ROOT/pages/audit/AuditLogsPage.tsx"
[[ -f "$ROOT/pages/SecurityCenterPage.tsx" ]] && git mv "$ROOT/pages/SecurityCenterPage.tsx" "$ROOT/pages/security/SecurityCenterPage.tsx"

# --- Pages: settings cluster ---
[[ -f "$ROOT/pages/AdminSettingsLayout.tsx" ]] && git mv "$ROOT/pages/AdminSettingsLayout.tsx" "$ROOT/pages/settings/AdminSettingsLayout.tsx"
[[ -f "$ROOT/pages/AttendanceSettingsLayout.tsx" ]] && git mv "$ROOT/pages/AttendanceSettingsLayout.tsx" "$ROOT/pages/settings/AttendanceSettingsLayout.tsx"
[[ -f "$ROOT/pages/AttendanceSettingsPage.tsx" ]] && git mv "$ROOT/pages/AttendanceSettingsPage.tsx" "$ROOT/pages/settings/AttendanceSettingsPage.tsx"
[[ -f "$ROOT/pages/LeaveSettingsLayout.tsx" ]] && git mv "$ROOT/pages/LeaveSettingsLayout.tsx" "$ROOT/pages/settings/LeaveSettingsLayout.tsx"
[[ -f "$ROOT/pages/LeaveSettingsPage.tsx" ]] && git mv "$ROOT/pages/LeaveSettingsPage.tsx" "$ROOT/pages/settings/LeaveSettingsPage.tsx"
[[ -f "$ROOT/pages/LeavePoliciesPage.tsx" ]] && git mv "$ROOT/pages/LeavePoliciesPage.tsx" "$ROOT/pages/settings/LeavePoliciesPage.tsx"
[[ -f "$ROOT/pages/LeaveLedgerPage.tsx" ]] && git mv "$ROOT/pages/LeaveLedgerPage.tsx" "$ROOT/pages/settings/LeaveLedgerPage.tsx"
[[ -f "$ROOT/pages/OfficeFormPage.tsx" ]] && git mv "$ROOT/pages/OfficeFormPage.tsx" "$ROOT/pages/settings/OfficeFormPage.tsx"

# --- Pages: organization → domain folders ---
ORG="$ROOT/pages/organization"
if [[ -d "$ORG" ]]; then
  [[ -f "$ORG/LocationsListPage.tsx" ]] && git mv "$ORG/LocationsListPage.tsx" "$ROOT/pages/location/LocationsListPage.tsx"
  [[ -f "$ORG/LocationDetailPage.tsx" ]] && git mv "$ORG/LocationDetailPage.tsx" "$ROOT/pages/location/LocationDetailPage.tsx"
  [[ -f "$ORG/ShiftsListPage.tsx" ]] && git mv "$ORG/ShiftsListPage.tsx" "$ROOT/pages/shift/ShiftsListPage.tsx"
  [[ -f "$ORG/ShiftDetailPage.tsx" ]] && git mv "$ORG/ShiftDetailPage.tsx" "$ROOT/pages/shift/ShiftDetailPage.tsx"
  [[ -f "$ORG/WorkingWeeksPage.tsx" ]] && git mv "$ORG/WorkingWeeksPage.tsx" "$ROOT/pages/working_week/WorkingWeeksPage.tsx"
  [[ -f "$ORG/HolidayCalendarsPage.tsx" ]] && git mv "$ORG/HolidayCalendarsPage.tsx" "$ROOT/pages/holiday_calendar/HolidayCalendarsPage.tsx"
  [[ -f "$ORG/HolidaysListPage.tsx" ]] && git mv "$ORG/HolidaysListPage.tsx" "$ROOT/pages/holiday_calendar/HolidaysListPage.tsx"
  [[ -f "$ORG/PositionsListPage.tsx" ]] && git mv "$ORG/PositionsListPage.tsx" "$ROOT/pages/position/PositionsListPage.tsx"
  [[ -f "$ORG/PositionDetailPage.tsx" ]] && git mv "$ORG/PositionDetailPage.tsx" "$ROOT/pages/position/PositionDetailPage.tsx"
  [[ -f "$ORG/OrganizationSettingsPage.tsx" ]] && git mv "$ORG/OrganizationSettingsPage.tsx" "$ROOT/pages/settings/OrganizationSettingsPage.tsx"
  if [[ -f "$ORG/index.ts" ]]; then git rm -f "$ORG/index.ts" || rm -f "$ORG/index.ts"; fi
  rmdir "$ORG" 2>/dev/null || true
fi

# --- Components ---
[[ -f "$ROOT/components/AdminSettingsNav.tsx" ]] && git mv "$ROOT/components/AdminSettingsNav.tsx" "$ROOT/components/settings/AdminSettingsNav.tsx"
[[ -f "$ROOT/components/LeaveSettingsNav.tsx" ]] && git mv "$ROOT/components/LeaveSettingsNav.tsx" "$ROOT/components/settings/LeaveSettingsNav.tsx"
[[ -f "$ROOT/components/SecurityProtocols.tsx" ]] && git mv "$ROOT/components/SecurityProtocols.tsx" "$ROOT/components/security/SecurityProtocols.tsx"

# --- Schemas into domain folders ---
[[ -f "$ROOT/schemas/users.ts" ]] && git mv "$ROOT/schemas/users.ts" "$ROOT/schemas/user/users.ts"
[[ -f "$ROOT/schemas/user-form.ts" ]] && git mv "$ROOT/schemas/user-form.ts" "$ROOT/schemas/user/user-form.ts"
[[ -f "$ROOT/schemas/roles.ts" ]] && git mv "$ROOT/schemas/roles.ts" "$ROOT/schemas/role/roles.ts"
[[ -f "$ROOT/schemas/role-form.ts" ]] && git mv "$ROOT/schemas/role-form.ts" "$ROOT/schemas/role/role-form.ts"
[[ -f "$ROOT/schemas/audit.ts" ]] && git mv "$ROOT/schemas/audit.ts" "$ROOT/schemas/audit/audit.ts"
[[ -f "$ROOT/schemas/leave.ts" ]] && git mv "$ROOT/schemas/leave.ts" "$ROOT/schemas/leave/leave.ts"
[[ -f "$ROOT/schemas/leave-form.ts" ]] && git mv "$ROOT/schemas/leave-form.ts" "$ROOT/schemas/leave/leave-form.ts"
[[ -f "$ROOT/schemas/settings.ts" ]] && git mv "$ROOT/schemas/settings.ts" "$ROOT/schemas/settings/settings.ts"
[[ -f "$ROOT/schemas/offices.ts" ]] && git mv "$ROOT/schemas/offices.ts" "$ROOT/schemas/settings/offices.ts"

echo "git mv complete. Next: python3 01_frontend_code/scripts/apply_admin_import_fixes.py"
echo "Then: git add -A && git commit -m 'refactor(admin): domain subfolders via git mv + import fixes'"
echo "Then: cd 01_frontend_code && npm run lint && npm run typecheck"
