# Admin module domain restructure

Matches backend admin domains (user, role, audit, leave, security, settings, location, shift, working_week, holiday_calendar, position, department).

## Run (from repo root, clean tree)

```bash
bash 01_frontend_code/scripts/restructure-admin-module.sh
# Place full apply script as apply_admin_import_fixes_full.py if stub is present
python3 01_frontend_code/scripts/apply_admin_import_fixes.py
cd 01_frontend_code && npm run lint && npm run typecheck
git add -A && git commit -m 'refactor(admin): domain subfolders via git mv + import fixes'
```

## What the scripts do

1. **restructure-admin-module.sh** — `git mv` into domain folders under api/, hooks/, pages/, components/, schemas/, types/.
2. **apply_admin_import_fixes.py** — rewrites relative imports; splits `api/organization.ts` into `location.ts`, `shift.ts`, `working-week.ts`, `holiday-calendar.ts`, `position.ts`, `department.ts` + settings/org helpers; writes `api/index.ts` + `hooks/index.ts` barrels; updates `routes.tsx` and `index.ts`; adds `types/{domain}.ts` re-exports.

## Rules

- Single barrel only at `api/index.ts` and `hooks/index.ts` (no thin re-exports in domain subfolders).
- Team domain stays under projects (already moved).
