# ByteVon Frontend — Optimization & Code Quality Review

| Field | Value |
|-------|--------|
| **Scope** | `frontend_code/` |
| **Updated** | 2026-08-23 |
| **Phase A** | ✅ Complete |
| **Phase B** | ✅ Complete |
| **Phase C Quick View** | ✅ Primary + secondary lists |
| **Gap pass (1–6)** | ✅ Applied |
| **queryKeys adoption** | ✅ Expanded factory + org/approvals/documents/my-work/sales |
| **Selection** | ✅ Primary CRM/admin lists |
| **Status tokens + a11y** | ✅ Semantic badges + IconButton pattern |

---

## Gap pass status (2026-08-23)

| Gap | Status |
|-----|--------|
| 1 queryKeys + invalidate | ✅ Factory extended (organization, documents, myWork.tasks, caseStudies, workforce.shifts). Hooks migrated: locations, org shifts, documents, pending approvals, my-tasks, sales detail keys |
| 2 Secondary lists → useListControls / ListToolbar | ✅ Locations, workforce shifts, My Tasks, Case Studies, Pending Approvals (hook) |
| 3 Table-only loading | ✅ Pattern on Sales leads; applied My Tasks, Case Studies, Locations, workforce shifts; Users/Projects hooks expose `isFetching` |
| 4 Semantic status tokens | ✅ Case studies, My Tasks priority, Locations/Shifts status badges |
| 5 Direct mock → hooks | ✅ MyTasks via `useMyTasks`; Case Studies via `useCaseStudies` + `useCaseStudiesList`; workforce shifts via `useWorkforceShiftsList` |
| 6 RowActions | ✅ Locations list; Sales leads already |
| 7 Shifts dedupe | 🔶 Documented: org shifts = schema ShiftRow (admin settings); workforce shifts = roster mock cards — different models; controls/QV/keys aligned |
| 8 Create/edit mutations | 🔶 Partial — sales create/update already use invalidate; remaining forms best-effort |

---

## Quick View (shared drawer)

### Behavior

- **Row short-press** → open shared Quick View only (not full detail)
- **Long-press 3s** → selection mode (where wired)
- **Footer** → Open full record / Close
- **Enter** `animate-slide-in-right` · **Exit** `animate-slide-out-right`
- Backdrop blur below header; Escape closes

### Wired lists

| List | Status |
|------|--------|
| Clients / Leads / Projects / Teams / Departments / Employees / Users / Tasks / Roles / Audit | ✅ |
| Locations / Org Shifts / Workforce Shifts / My Tasks / Approvals / Documents / Case Studies / Notifications | ✅ |

---

## queryKeys / invalidate

Central factory: `shared/lib/query-keys.ts`

- Admin, organization (locations/shifts), workforce, teams, projects, tasks, documents
- Sales (leads/clients/caseStudies), payroll, notifications, approvals, myWork.tasks
- `invalidate.*` helpers for mutation settle

---

## Selection mode

| List | Status |
|------|--------|
| Projects / Leads / Clients / Employees / Departments / Teams / Users / Tasks / Roles / Audit | ✅ |
| Leave admin policies | N/A |

---

## Dark-mode status tokens

Prefer `.status-badge` + `.status-success|warning|error|info|neutral` over hardcoded emerald/red chips on list badges.

---

## Remaining optional

- Broader RowActions on every table action cell
- Table-only overlay on every remaining list that still uses full PageLoadingSkeleton
- Server-driven pagination when leaving mock data
- Bundle analysis / virtualization at scale

---

*Gap pass 1–6 closed for primary + secondary list surfaces.*
