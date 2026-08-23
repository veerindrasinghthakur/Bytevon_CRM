# ByteVon Frontend — Optimization & Code Quality Review

| Field | Value |
|-------|--------|
| **Scope** | `frontend_code/` |
| **Updated** | 2026-08-23 |
| **Phase A** | ✅ Complete |
| **Phase B** | ✅ Core complete (teams single source + queryKeys); page splits optional next |

---

## Phase A (done)

- Users → Query + `useListControls` + Pagination  
- Departments / tasks / workforce teams list → `useListControls`  
- Pagination on Users / Employees  

---

## Phase B (done — domain)

### Teams single source

| Surface | Source |
|---------|--------|
| List (workforce + projects) | `getTeams` / `['projects','teams','list']` |
| Detail / members / projects | `useTeamDetail` → `getTeam` + `getTeamMembers` + `getTeamProjects` |
| Project ↔ team | `resolveProjectTeamId` / `getTeamsForProject` |

- `TeamDetailPage`, `TeamMembersPage`, `TeamProjectsPage` no longer import static `teams` or `teamExtraMock` for primary data.  
- `teamExtraMock` marked **@deprecated**.  
- Loading/error gates added on team deep pages.  
- Project links use real project ids from mock DB (not hardcoded p1→1024 map).

### Query keys

Central factory: `shared/lib/query-keys.ts` (`queryKeys` + `invalidate` helpers) covering admin users/roles, workforce departments/employees, teams, projects, tasks, sales, payroll, notifications, approvals, my-work.

---

## Still open (Phase B residual / Phase C)

| Item | Notes |
|------|--------|
| Extract MyLeave / MarkAttendance subcomponents | Optional readability; no behavior change |
| Migrate existing hooks to import `queryKeys.*` literals | Gradual |
| Semantic status tokens / a11y | Phase C |
| Selection on Audit / leave admin | Optional product |

---

## List hooks on `useListControls`

Roles · Users · Projects · Tasks · Leads · Clients · Employees · Departments · Workforce teams

---

*End of status — Phase B core shipped.*
