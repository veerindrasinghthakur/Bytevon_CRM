# 02_Layout_Navigation_Routing.md

# Bytevon Frontend — Layout, Navigation & Routing

**Project:** Bytevon ERP/CRM  
**Version:** 1.0  
**Status:** Locked (as of 2026-08-07)  
**Last Updated:** 2026-08-07

---

## 1. Purpose

Defines the application shell, primary & secondary navigation, responsive behaviour, search rules, and nested routing structure.

---

## 2. Application Shell (Desktop)

```
┌────────────┬────────────────────┬──────────────────────────────────┐
│            │                    │  Header                          │
│  Icon Rail │  Secondary Sidebar │  (title, search, notif, profile) │
│  (80px)    │  (240px)           ├──────────────────────────────────┤
│            │                    │                                  │
│  collapsed │  collapsed         │         Main Content             │
│  by default│  by default        │                                  │
│            │                    │                                  │
│  Logout    │                    │                                  │
│  (bottom)  │                    │                                  │
└────────────┴────────────────────┴──────────────────────────────────┘
```

- Both sidebars support expand / collapse.
- Both start **collapsed by default**.
- Icon Rail shows icons only when collapsed; expands to show labels.
- Secondary Sidebar shows contextual items for the active primary module.

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

- Collapsed by default.
- Tooltips on hover when collapsed.
- Active state clearly indicated.
- Names can be changed later; structure is locked.

---

## 4. Secondary Sidebar Content

### Sales
- Leads
- Clients
- Analytics
- Activity

### Projects
- All Projects
- Teams
- Tasks

### Workforce
- Employees
- Departments
- Attendance (org-wide)

### My Work
- My Attendance
- My Leave
- My Tasks
- My Approvals

### Approvals
- Pending Approvals
- My Requests

### Administration
- Users
- Roles & Permissions
- Settings
- Audit Logs
- Notifications Management

---

## 5. Header

Contents:
- Page title / breadcrumbs
- Search (see Search Rules below)
- Notifications (icon + badge)
- User Profile avatar / menu

**Not** in Header:
- Logout (lives in Icon Rail bottom)
- Primary Create/New button (lives on the page)

---

## 6. Search Rules

- There should be **only one visible search bar at a time**.
- Default location: Header.
- When a page has its own dedicated search bar (list pages such as Leads, Projects, Employees, etc.):
  - Header search collapses to a **search icon** only.
- This prevents two competing search inputs on the same screen.

---

## 7. Create / New Buttons

- Single primary “New …” button lives **on the page** (usually top-right of the list or detail view).
- Not forced into the global Header.

---

## 8. Mobile & Responsive Behaviour

**Current decision (locked for now):**
- No bottom navigation bar (to be decided later).
- On mobile both sidebars start collapsed / icon-only.
- Secondary sidebar becomes collapsed or icon-only on mobile.
- Exact mobile navigation pattern (drawer, etc.) will be refined later.
- Header remains the main top bar on mobile (title + icons).

**Tablet:** Follow desktop behaviour (both sidebars collapsed by default).

---

## 9. Nested Routing Structure

```
/dashboard

/sales
  /leads
  /leads/new
  /leads/:leadId
  /leads/:leadId/edit
  /clients
  /clients/:clientId
  /analytics
  /activity

/projects
  /
  /new
  /:projectId
  /teams
  /teams/new
  /teams/:teamId
  /tasks
  /tasks/new
  /tasks/:taskId

/workforce
  /employees
  /employees/new
  /employees/:id
  /departments
  /departments/new
  /departments/:id
  /attendance

/my-work
  /attendance
  /attendance/mark
  /leave
  /leave/apply
  /leave/balance
  /tasks
  /approvals

/approvals
  /pending
  /my-requests
  /:approvalId

/admin
  /users
  /roles
  /roles/new
  /settings
  /audit
  /notifications
  /security

/notifications
/profile
/profile/password
/profile/notifications

/login
/forgot-password
/reset-password
/session-expired
/access-denied
```

---

## 10. Permission Visibility

- Icon Rail items are shown/hidden according to the user’s permissions.
- Secondary sidebar items follow the same rule.
- A pure Employee role typically sees only: Dashboard, My Work, Notifications, Profile.

---

## 11. Related Documents

- `01_Screen_Inventory.md`
- `03_Frontend_Project_Structure.md`
- Design System tokens (CSS variables)
