# Bytevon Frontend — Discussion Summary & Locked Decisions

**Project:** Bytevon ERP/CRM  
**Source:** Grok project conversation (2026-08-07 → 2026-08-08)  
**Repo:** [bytevon_documentation](https://github.com/veerindrasinghthakur/bytevon_documentation)

This document records every architecture decision locked during the frontend discussion. It is the single place to see *why* the rules in `frontend/01–15` exist.

---

## 1. Context

- Backend architecture was already designed (Sales, Developer/Projects, Attendance, Leave, Approvals, Auth, Audit, Notifications, Documents).
- UI screens were designed in Google Stitch and exported as HTML + PNG.
- Goal of this discussion: define **frontend architecture, navigation, routing, conventions, and code-generation rules** so pages can be converted to React consistently — not to redesign screens.

---

## 2. Tech Stack (Locked)

| Layer | Choice |
|-------|--------|
| Framework | React 18+ |
| Language | TypeScript |
| Bundler | Vite |
| Styling | Tailwind CSS |
| Design tokens | CSS variables only (no hardcoded colors/spacing) |
| Server state | TanStack Query |
| Tables | TanStack Table |
| Routing | Nested routes (TanStack Router or React Router) |
| Validation | Zod |
| Forms | React Hook Form + Zod resolver |
| Icons | Material Symbols Outlined |
| Font | Inter |

---

## 3. Navigation (Locked)

### Desktop shell

```
┌────────────┬────────────────────┬──────────────────────────────┐
│ Icon Rail  │ Secondary Sidebar  │ Header                       │
│ (80px)     │ (240px)            │ title, search, notif, profile│
│ collapsed  │ collapsed          ├──────────────────────────────┤
│ by default │ by default         │ Main content (Outlet)        │
│ Logout @   │                    │                              │
│ bottom     │                    │                              │
└────────────┴────────────────────┴──────────────────────────────┘
```

### Icon Rail (primary modules)

| Order | Icon | Label | Route |
|-------|------|-------|-------|
| 1 | `dashboard` | Dashboard | `/dashboard` |
| 2 | `trending_up` | Sales | `/sales` |
| 3 | `folder_managed` | Projects | `/projects` |
| 4 | `groups` | Workforce | `/workforce` |
| 5 | `person` | My Work | `/my-work` |
| 6 | `fact_check` | Approvals | `/approvals` |
| 7 | `admin_panel_settings` | Administration | `/admin` |
| — | `logout` | Logout | bottom of rail |

- Notifications + Profile live in the **Header** (not the rail).
- Both sidebars support collapse; both start **collapsed by default**.
- Names can be renamed later; structure is locked.

### Secondary sidebar content

- **Sales:** Leads, Clients, Analytics, Activity  
- **Projects:** All Projects, Teams, Tasks  
- **Workforce:** Employees, Departments, Attendance (org)  
- **My Work:** My Attendance, My Leave, My Tasks, My Approvals  
- **Approvals:** Pending, My Requests  
- **Admin:** Users, Roles, Settings, Audit, Notifications Mgmt  

### Teams location

**Teams live under Projects** (not Workforce). Backend treats teams as reusable delivery units assigned to projects.

### Create / New button

Lives **on the page** (usually top-right of list/detail). Not in the global Header.

### Search rule

- Prefer a single visible search bar.
- Default: search in Header.
- When a page has its own list search, Header search may become icon-only (product can keep Header search full until decided).
- List pattern reference: search left, filters right (Projects list).

### Mobile (partially locked)

- No bottom navigation for now (deferred).
- Both sidebars start collapsed / icon-only on mobile.
- Exact mobile drawer pattern TBD later.

---

## 4. Nested routing (Locked)

Examples:

```
/dashboard
/sales/leads, /sales/leads/:id, /sales/clients, ...
/projects, /projects/:id, /projects/teams, /projects/teams/:id,
  /projects/tasks, /projects/tasks/:id, /projects/new, ...
/workforce/employees, /workforce/departments, ...
/my-work/attendance, /my-work/leave, ...
/approvals/pending, /approvals/:id
/admin/users, /admin/roles, /admin/settings, /admin/audit, ...
/notifications, /profile, /profile/password
/login, /forgot-password, /reset-password, /session-expired, /access-denied
```

- Auth pages → `AuthLayout`  
- Authenticated pages → `AppShell` + AuthGuard (+ PermissionGuard as needed)

---

## 5. Project structure (Locked)

```
src/
├── app/          # providers, router, layouts (AppShell, AuthLayout)
├── modules/      # auth, dashboard, sales, developer/projects, workforce, ...
├── shared/       # ui, layout, feedback, hooks, lib, schemas, types
├── styles/       # tokens.css (main CSS variables), globals.css
└── main.tsx
```

Each module owns: `api/`, `schemas/`, `hooks/`, `components/`, `pages/`.

---

## 6. Implementation rules (Locked)

Documented in detail in:

| Doc | Purpose |
|------|--------|
| 11 State Management | Server → TanStack Query; URL → search params; forms → RHF+Zod; avoid global stores for server data |
| 12 Module Checklist | Exact steps to implement any feature module |
| 13 Naming | Files, components, hooks, query keys |
| 14 Code Generation | Hard rules when converting Stitch → React |
| 15 Page State Matrix | Loading / Empty / Error / Success / No-Permission for every page type |

**Hard rules for generation:**

1. Tokens only — no hardcoded colors/spacing  
2. No business logic in shared components  
3. Server state only via TanStack Query  
4. Forms via RHF + Zod  
5. Follow module checklist + naming  
6. Handle all required page states  
7. One search bar rule  
8. Create button on the page  
9. Permission-aware nav and actions  

---

## 7. Screen inventory by module

Screens were grouped as:

| Module | Examples |
|--------|----------|
| Auth | Login, Forgot/Reset/Update password, Session expired, 403, 404 |
| Dashboard | Employee / Executive / Sales dashboards + states |
| Sales | Leads, Clients, Analytics, Activity, Case studies |
| Projects | Projects, Teams, Tasks, Create/Detail flows |
| Workforce | Employees, Departments, org attendance |
| Attendance | Dashboard, Mark, Calendar, Details, Corrections |
| Leave | List, Apply, Balance, Calendar, History |
| Approvals | Center, Pending, My requests, Details |
| Admin | Users, Roles, Settings, Audit, Security, Notification admin |
| Notifications / Profile | Notification center, User profile |
| Shared reference | Nav rail, header, form/metric components |

Teams screens included in architecture even when Stitch UI was still pending.

---

## 8. What this repo contains

| Path | Content |
|------|--------|
| `frontend/` | Architecture docs 01–15 |
| `01_auth` … `11_shared_reference` | Organized Stitch HTML + PNG by module |
| `frontend_code/` | React + Vite starter aligned with the architecture |
| `DISCUSSION_SUMMARY.md` | This file |
| `README.md` | Index of docs and locked decisions |

---

## 9. Out of scope for this discussion

- Redesigning Stitch screens  
- Final mobile bottom-nav pattern  
- Pushing every HTML file again from chat (user may organize locally; screens already exist in repo by module)  

---

*Last updated from Grok project discussion — 2026-08-08*
