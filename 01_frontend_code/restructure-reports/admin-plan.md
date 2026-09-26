# admin — inventory & plan (largest module, ~117 files)

Validation library: **zod** (11 schema files). Stay with zod.

## Inventory summary

- Root: `index.ts` (37), `routes.tsx` (375), `types.ts` (356, real types at root — misplaced).
- `api/` (17 files): stubs `attendance.ts`, `role.ts`, `user.ts` (2 lines each); real: `audit.ts` 262 (inline `AuditLogApi`), `holiday-calendar.ts` 200, `leave.ts` 336 (inline `LeaveTypeApi`, `LeavePolicyApi`), `location.ts` 184 (inline `LocationCreateInput`), `metrics.ts` 210, `offices.ts` 202 (inline `HeadOfficeOption`), `organization.ts` 93, `position.ts` 113, `roles.ts` 432 (inline `ScopeOption`), `security.ts` 131, `settings.ts` 302 (inline `OrgSettingsApi`, `AttendancePolicyApi`), `users.ts` 490 (inline `AdminUserDetailDisplay`, `AdminUserDetail`), `working-week.ts` 70, `_org-helpers.ts` 14 (underscore naming violation), `index.ts` 16.
- `components/`: 3 two-line stubs at top (`AdminSettingsNav`, `LeaveSettingsNav`, `SecurityProtocols`) shadowing real `components/settings/*` + `components/security/*`; real: `AdminErrorBoundary.tsx` 49 (inline `Props`, `State`), `security/SecurityProtocols.tsx` 71, `settings/*Nav` 45/43, `role/RoleFormPage.tsx` stub, `context/LeaveEditContext.tsx` 10 (context/ bucket not in target).
- `hooks/`: `index.ts` 18, `position.ts` 7 (root-level stray), `use-admin-mutation.ts` 49; LARGE-HOOKS (>100): `role/use-role-form.ts` 277, `role/use-roles.ts` 116, `settings/use-attendance-settings.ts` 117, `settings/use-head-office.ts` 114, `settings/use-settings.ts` 117, `user/use-user-create.ts` 159, `user/use-user-detail.ts` 312 (!), `user/use-users.ts` 102. Rest small.
- `pages/`: 5 two-line stubs at top shadowing `pages/settings/*`; LARGE-PAGES (>200): `audit/AuditLogsPage.tsx` 554 (!), `holiday_calendar/HolidaysListPage.tsx` 334, `location/*` 238/245, `role/RoleDetailPage` 360, `role/RoleFormPage` 312, `role/RolesListPage` 421, `security/SecurityCenterPage` 246, `settings/AttendanceSettingsPage` 484 (!), `settings/LeaveSettingsPage` 275, `settings/LeaveTypeFormPage` 302, `settings/OfficeFormPage` 254, `settings/OrganizationProfileSection` 242 (inline `ProfileFormValues`), `settings/OrganizationSettingsPage` 203, `user/UserCreatePage` 224, `user/UserDetailPage` 398, `user/UsersListPage` 388, `working_week/WorkingWeeksPage` 277. Small: HolidayCalendarsPage 173, settings layouts/sections.
- `schemas/` (plural, must become `schema/`): `audit.ts` 36, `entity-form.ts` 98, `enums.ts` 228 (large but enums — keep whole, rename), `leave-form.ts` 60, `leave.ts` 43, `offices.ts` 102, `role-form.ts` 17, `roles.ts` 38, `settings.ts` 70, `user-form.ts` 25, `users.ts` 39; plus 5 two-line stub files under `schemas/{leave,role,settings,user}/` shadowing the real ones.
- `types/`: **11 files, all 2-line stubs** (audit, holiday_calendar, leave, location, position, role, security, settings, shift, user, working_week) — real types live in root `types.ts` (356 lines). Classic missing-types failure. Also snake_case filenames violate kebab-case.
- `lib/role-matrix.ts` 51 (inline `RoleFormAction` line 51); `data/mock-seed.ts` 415, `data/mock.ts` + `data/rbac-catalog.ts` stubs; `routes.tsx` 375 at root.

## Type extraction plan → `types/*.types.ts` (kebab-case renames)

- `types/audit.types.ts`: AuditLogApi (api/audit) + audit slice of root types.ts.
- `types/leave.types.ts`: LeaveTypeApi, LeavePolicyApi + leave slice.
- `types/location.types.ts`: LocationCreateInput + slice.
- `types/office.types.ts` (new): HeadOfficeOption.
- `types/role.types.ts`: ScopeOption + AdminErrorBoundary Props/State stay? No — component Props stay local ONLY if anonymous inline object; named `Props`/`State` interfaces move to types (or inline anonymous). Plan: convert to anonymous inline or move; log.
- `types/settings.types.ts`: OrgSettingsApi, AttendancePolicyApi + slice.
- `types/user.types.ts`: AdminUserDetailDisplay, AdminUserDetail + slice.
- `types/role-matrix.types.ts` or into role: RoleFormAction (lib).
- `types/audit-page.types.ts` (or audit): ArchiveResult (AuditLogsPage:169); `types/organization.types.ts`: ProfileFormValues (OrganizationProfileSection:15).
- Snake_case stubs renamed to kebab (`holiday-calendar.types.ts`, `working-week.types.ts`).
- `types/index.ts` barrel; root `types.ts` becomes re-export shim then removed in same move (git mv + fix imports).

## Split plan (largest first)

- `AuditLogsPage` 554 → page + `components/audit/audit-filters.tsx`, `audit-table.tsx`, `audit-archive-dialog.tsx` + `hooks/audit/use-audit-logs.ts` (extract fetch/filter state).
- `AttendanceSettingsPage` 484 → page + `components/settings/attendance-policy-form.tsx`, `attendance-schedule-table.tsx`.
- `RolesListPage` 421 → page + `components/role/roles-table.tsx`, `roles-filter.tsx`.
- `UserDetailPage` 398 + `UsersListPage` 388 + `RoleDetailPage` 360 + `HolidaysListPage` 334 + others >300 → same pattern: page thin, table/filter/form components, fetch hooks.
- `hooks/user/use-user-detail.ts` 312 → split into `use-user-detail.ts` (query) + `use-user-detail-form.ts` (edit state).
- `hooks/role/use-role-form.ts` 277 → `use-role-form.ts` + `use-role-permissions.ts`.
- `api/users.ts` 490, `api/roles.ts` 432, `api/leave.ts` 336, `api/settings.ts` 302 → split per resource (`users-api.ts`, `user-detail-api.ts`, …) or per action group; decide during execution, log.
- `schemas/enums.ts` 228 keep whole (rename only).
- `data/mock-seed.ts` 415 keep (seed data; optionally split per domain — log).

## Rename / move plan (via `git mv`)

- `schemas/` → `schema/`, `*.ts` → `*.schema.ts`; delete 5 stub subfolders (fold into real files).
- `types/*.ts` → kebab `*.types.ts`.
- `api/*.ts` → `*-api.ts` (`_org-helpers.ts` → `lib/org-helpers.ts`).
- `hooks/position.ts` → fold into `hooks/position/use-positions.ts` or delete if stub.
- Flatten or disambiguate stub shadows: delete top-level 2-line stubs in `components/`, `pages/` after confirming real counterparts carry all imports (verify with grep before delete; log each).
- `holiday_calendar/` → `holiday-calendar/` (kebab folders); `working_week/` → `working-week/`; `approval_action`-style snake folders if any.
- `context/LeaveEditContext.tsx` → `hooks/leave/leave-edit-context.tsx` (logged).
- `lib/role-matrix.ts` stays (naming OK); new barrels everywhere.

## Import fixes (whole repo)

- `modules/admin/types` root imports (many pages/api) → `modules/admin/types`.
- `schemas/*` → `schema/*` across admin + tests (admin-role-matrix, admin-users-*).
- `holiday_calendar`/`working_week` path renames across routes + tests + shared mocks.

## Verification

`npx tsc -b`, `npx eslint src/modules/admin` (baseline has ~20 warnings here — no new ones), `npx vite build`, `vitest run tests/admin-* src/modules/admin`. Execute sub-slices (role, user, settings, audit…) with a verify per slice; stop on first failure.
