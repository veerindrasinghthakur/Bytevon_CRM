# ByteVon Frontend — Optimization & Code Quality Review

| Field | Value |
|-------|--------|
| **Scope** | `frontend_code/` |
| **Updated** | 2026-08-23 |
| **Phase A** | ✅ Complete |
| **Phase B** | ✅ Complete |
| **Phase C** | 🟡 In progress (Quick View) |

---

## Phase A — Consistency ✅

- Users → Query + `useListControls` + Pagination
- Departments / tasks / workforce teams list → `useListControls`
- Pagination on Users / Employees

---

## Phase B — Domain + readability ✅

### Teams single source

| Surface | Source |
|---------|--------|
| List | `getTeams` / shared key |
| Detail / members / projects | `useTeamDetail` |

`teamExtraMock` deprecated.

### Query keys

`shared/lib/query-keys.ts` — `queryKeys` + `invalidate`.

### Page splits

| Page | Components |
|------|------------|
| MyLeave | `LeaveBalanceTab`, `LeaveHistoryTab`, `LeaveCalendarTab` |
| MarkAttendance | `WorkingHoursLog`, `ManualAttendanceForm` |

---

## Phase C — Quick View (shared drawer)

### Done

- Shared `QuickOverview` provider + panel in AppShell
- **Enter** animation: `animate-slide-in-right`
- **Exit** animation: `animate-slide-out-right` (content stays mounted ~280ms)
- Backdrop blur below header only; Escape closes
- Footer: Open full record + Close
- **Clients** list: row short-press → quick view only (full record via footer / action icon)
- **Leads** list: same

### Still to sync (row click → quick view only)

| List page | Current behavior | Needed |
|-----------|------------------|--------|
| Projects | May still use old `open({ fields })` shape | `openPanel({ content })` on row short-press |
| Teams (workforce) | Local drawer still in page | Use shared `openPanel`; remove local drawer |
| Departments | Row short-press → full detail | Open quick view first |
| Employees | Check row handler | Quick view content + openPanel |
| Users | Check row handler | Optional quick view |
| Tasks | Check row handler | Optional quick view |
| Roles | No quick view | Optional |

Rule: **row click / short-press opens Quick View only**. Navigate to full record only via footer CTA or explicit action icon.

---

## Remaining optimization (beyond Quick View)

1. **Projects / Teams / Departments / Employees** — finish Quick View wiring (above)
2. **Older hooks** — migrate remaining list hooks fully onto `queryKeys.*` + shared invalidate helpers
3. **Selection mode** — still pending on Audit Logs, Roles, Leave admin lists (if product wants)
4. **Semantic status tokens** — dark-mode friendly status colors
5. **a11y** — icon-only controls need consistent `aria-label` pass
6. **Lazy routes** — confirm all module routes use `lazyPage` (most already do)
7. **Mock delay** — keep as-is; no change needed

---

*End of status.*
