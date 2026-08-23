# ByteVon Frontend — Optimization & Code Quality Review

| Field | Value |
|-------|--------|
| **Scope** | `frontend_code/` |
| **Updated** | 2026-08-23 |
| **Phase A** | ✅ Complete |
| **Phase B** | ✅ Complete |
| **Phase C Quick View** | ✅ All primary lists |
| **queryKeys adoption** | ✅ Admin users/roles + tasks + expanded factory |
| **Selection** | ✅ Audit + Roles (Users/Tasks already) |
| **Status tokens + a11y** | ✅ Semantic badges + IconButton pattern |

---

## Quick View (shared drawer)

### Behavior (all wired lists)

- **Row short-press** → open shared Quick View only (not full detail)
- **Long-press 3s** → selection mode (unchanged)
- **Footer** → Open full record / Close
- **Enter** `animate-slide-in-right` · **Exit** `animate-slide-out-right`
- Backdrop blur below header; Escape closes

### Wired lists

| List | Status |
|------|--------|
| Clients | ✅ |
| Leads | ✅ |
| Projects | ✅ |
| Teams | ✅ |
| Departments | ✅ |
| Employees | ✅ |
| Users | ✅ |
| Tasks | ✅ (openPanel API) |
| Roles | ✅ |
| Audit Logs | ✅ (replaces local drawer) |

---

## queryKeys / invalidate

- Central factory: `shared/lib/query-keys.ts`
- Admin: users, roles (+ metrics), audit, leave
- Tasks / projects / teams / workforce / sales / payroll / notifications / approvals
- `invalidate.*` helpers for mutation `onSettled`

Hooks on `queryKeys.*`: `use-users-list`, `use-roles-list`, `use-tasks`

---

## Selection mode

| List | Status |
|------|--------|
| Projects / Leads / Clients / Employees / Departments / Teams / Users / Tasks | ✅ |
| Roles | ✅ |
| Audit Logs | ✅ |
| Leave admin policies | N/A (small static list; no bulk ops) |

---

## Dark-mode status tokens

Semantic badge classes in `globals.css`:

- `.status-badge` + `.status-success` | `.status-warning` | `.status-error` | `.status-info` | `.status-neutral`
- Colors from `--color-success-*`, `--color-warning-*`, `--color-error-*`, containers (light + `tokens-dark.css`)

Prefer these over hardcoded `bg-emerald-50` / `bg-red-100` in new UI.

---

## a11y

- `IconButton` requires `label` → `aria-label` + `title` + focus ring
- List action cells stop propagation; visibility controls use `aria-label`
- Quick Overview dialog: `role="dialog"` `aria-modal` Escape close

---

*Phase C closed. Further work is product polish only.*
