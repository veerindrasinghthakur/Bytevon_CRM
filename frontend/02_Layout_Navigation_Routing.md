# 02_Layout_Navigation_Routing.md

# Bytevon Frontend — Layout, Navigation & Routing

**Project:** Bytevon ERP/CRM  
**Version:** 1.1  
**Status:** Locked (updated 2026-08-08)  
**Last Updated:** 2026-08-08

---

## 1. Purpose

Defines the application shell, primary & secondary navigation, responsive behaviour, search rules, back navigation, and nested routing structure.

**Maintainability rule:** Any architecture or UX rule change must be updated in this repo (frontend docs + code) in the same change set so other developers stay consistent.

---

## 2. Application Shell (Desktop)

```
┌────────────┬────────────────────┬──────────────────────────────────┐
│            │                    │  Header                          │
│  Icon Rail │  Secondary Sidebar │  (search, notif, profile)        │
│  (80px)    │  (240px / 64px)    ├──────────────────────────────────┤
│            │                    │                                  │
│  collapsed │  collapsed         │         Main Content             │
│  by default│  by default        │                                  │
│            │                    │                                  │
│  Logout    │                    │                                  │
│  (bottom)  │                    │                                  │
└────────────┴────────────────────┴──────────────────────────────────┘
```

- Both sidebars support expand / collapse; both start **collapsed by default**.
- Header `margin-left` / width track total sidebar width (rail + secondary).
- Secondary item vertical padding/gap should stay **parallel** to primary rail items (`py-3.5`, `gap-1`).
- Spacing below the secondary collapse control should align with primary rail toggle margin.

---

## 3. Primary Navigation — Icon Rail

| Order | Icon (Material Symbol)   | Label          | Route Prefix     | Notes                     |
|-------|--------------------------|----------------|------------------|---------------------------|
| 1     | `dashboard`              | Dashboard      | `/dashboard`     | Always visible            |
| 2     | `trending_up`            | Sales          | `/sales`         | Permission gated          |
| 3     | `folder_managed`         | Projects       | `/projects`      | Permission gated          |
| 4     | `groups`                 | Workforce      | `/workforce`     | Permission gated          |
| 5     | `person`                 | My Work        | `/my-work`       | Always (self-service)     |
| 6     | `fact_check`             | Approvals      | `/approvals`     | Can-approve permission    |
| 7     | `admin_panel_settings`   | Administration | `/admin`         | Admin only                |
| —     | `logout`                 | Logout         | —                | Bottom of rail            |

---

## 4. Secondary Sidebar Content

### Sales
- Leads, Clients, Analytics, Activity

### Projects
- All Projects, Teams, Tasks

### Workforce
- Employees, Departments, Attendance (org-wide)

### My Work
- My Attendance, My Leave, My Tasks, My Approvals

### Approvals
- Pending Approvals, My Requests

### Administration
- Users, Roles & Permissions, Settings, Audit Logs, Notifications Management

---

## 5. Header

Contents:
- Optional page title
- Search (see Search Rules)
- Notifications
- **User Profile** — avatar / label links to `/profile`

**Not** in Header:
- Logout (Icon Rail bottom)
- Primary Create/New button (on the page)

---

## 6. Search Rules

- **Only one visible search field at a time.**
- Default: Header search input.
- When a page has its own search (list pages: Projects, Teams, Tasks, Leads, Clients, Employees, Departments):
  - Header search **collapses to a search icon only**.
- List pages: put **page search on the left**, filter dropdowns on the **right** (Projects list is the reference).

---

## 7. Back navigation

- Every **create / detail / edit** (or otherwise navigated sub-page) must expose a **Back** control.
- Prefer explicit `backTo` list path (e.g. `/projects`) over blind history when possible.
- Shared component: `BackButton` / `PageHeader` with `showBack`.
- List pages do not need a back button.

---

## 8. Create / New Buttons & row actions

- Single primary “New …” button lives **on the page** (top-right).
- Table **Action** column uses a proper actions menu (`RowActions`: View details, Edit, Archive, etc.), not a single unstyled link only.
- Import / Export / Refresh must have working handlers (or explicit stubs until API exists).

---

## 9. Motion / hover effects

- Avoid decorative micro-animations on list rows (no scale, no heavy transition on entire row hover).
- Keep functional feedback only (focus rings, menu open/close, button hover background).

---

## 10. Mobile & Responsive Behaviour

- No bottom nav (for now).
- Both sidebars start collapsed / icon-only on small screens.
- Header remains top bar.

---

## 11. Nested Routing Structure

```
/dashboard
/profile

/sales
  /leads, /leads/new, /leads/:leadId, ...
  /clients, /clients/:clientId
  /analytics, /activity

/projects
  /, /new, /:projectId
  /teams, /teams/new, /teams/:teamId
  /tasks, /tasks/new, /tasks/:taskId

/workforce
  /employees, /employees/new, /employees/:id
  /departments, /departments/new, /departments/:id
  /attendance

/my-work
  /attendance, /leave, /tasks, /approvals

/approvals
  /pending, /my-requests, /:approvalId

/admin
  /users, /roles, /settings, /audit, /notifications, /security

/login, /forgot-password, /reset-password, /session-expired, /access-denied
```

---

## 12. Permission Visibility

- Icon Rail and secondary items respect permissions.
- Employee-typical: Dashboard, My Work, Notifications, Profile.

---

## 13. Related Documents

- `01_Screen_Inventory.md`
- `03_Frontend_Project_Structure.md`
- `04_AppShell_and_Layout_Components.md`
- Design System tokens (CSS variables)
