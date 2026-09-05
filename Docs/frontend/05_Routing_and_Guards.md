# 05_Routing_and_Guards.md

# Bytevon Frontend — Routing & Guards

**Project:** Bytevon ERP/CRM  
**Version:** 1.0  
**Status:** Locked  
**Last Updated:** 2026-08-07

---

## 1. Purpose

Defines the complete nested route structure, layout assignment, authentication guards, and permission guards.

---

## 2. Routing Library

- Preferred: **TanStack Router** (type-safe, excellent nested routes support)
- Acceptable alternative: React Router v6+ with nested routes

All routes must be declared in a central router configuration under `src/app/router/`.

---

## 3. Layout Assignment

| Layout        | Used For                                      |
|---------------|-----------------------------------------------|
| `AuthLayout`  | Login, Forgot Password, Reset Password, Session Expired, Access Denied, 404 |
| `AppShell`    | All authenticated application pages           |

`AppShell` contains Icon Rail + Secondary Sidebar + Header + `<Outlet />`.

---

## 4. Complete Nested Route Tree

```
/
├── login                          → AuthLayout
├── forgot-password                → AuthLayout
├── reset-password                 → AuthLayout
├── session-expired                → AuthLayout
├── access-denied                  → AuthLayout
│
├── (authenticated)                → AppShell + AuthGuard
│   ├── dashboard
│   │
│   ├── sales
│   │   ├── leads
│   │   │   ├── index
│   │   │   ├── new
│   │   │   ├── :leadId
│   │   │   └── :leadId/edit
│   │   ├── clients
│   │   │   ├── index
│   │   │   └── :clientId
│   │   ├── analytics
│   │   └── activity
│   │
│   ├── projects
│   │   ├── index
│   │   ├── new
│   │   ├── :projectId
│   │   ├── teams
│   │   │   ├── index
│   │   │   ├── new
│   │   │   └── :teamId
│   │   └── tasks
│   │       ├── index
│   │       ├── new
│   │       └── :taskId
│   │
│   ├── workforce
│   │   ├── employees
│   │   │   ├── index
│   │   │   ├── new
│   │   │   └── :id
│   │   ├── departments
│   │   │   ├── index
│   │   │   ├── new
│   │   │   └── :id
│   │   └── attendance
│   │
│   ├── my-work
│   │   ├── attendance
│   │   │   ├── index
│   │   │   └── mark
│   │   ├── leave
│   │   │   ├── index
│   │   │   ├── apply
│   │   │   └── balance
│   │   ├── tasks
│   │   └── approvals
│   │
│   ├── approvals
│   │   ├── index
│   │   ├── pending
│   │   ├── my-requests
│   │   └── :approvalId
│   │
│   ├── admin
│   │   ├── users
│   │   ├── roles
│   │   │   ├── index
│   │   │   └── new
│   │   ├── settings
│   │   ├── audit
│   │   ├── notifications
│   │   └── security
│   │
│   ├── notifications
│   │
│   └── profile
│       ├── index
│       ├── password
│       └── notifications
│
└── *                              → 404 (AuthLayout or AppShell depending on auth state)
```

---

## 5. Guards

### 5.1 AuthGuard

- Checks if the user has a valid session (access token / refresh token).
- If not authenticated → redirect to `/login` (preserve intended destination if needed).
- If session is expired → redirect to `/session-expired`.

### 5.2 PermissionGuard (or RoleGuard)

- Applied at route or layout level.
- Checks whether the current user has the required permission(s) for the route / module.
- If permission is missing → redirect to `/access-denied` or show a restricted view.

**Examples of permission checks:**
- `/sales/*` → requires Sales related permission
- `/admin/*` → requires Admin permission
- `/approvals/*` → requires ability to approve
- `/projects/*` → requires Developer / Project access

### 5.3 GuestGuard (optional)

- Used on Auth pages.
- If user is already authenticated → redirect to `/dashboard`.

---

## 6. Implementation Notes

- Prefer route-level code splitting (lazy loading of page components).
- Keep route definitions close to the modules they belong to when using file-based or modular routing, but maintain a single source of truth for the full tree.
- Breadcrumbs can be derived from the route hierarchy.
- Search params should be used for filters, pagination, and tab state where appropriate.

---

## 7. Related Documents

- `02_Layout_Navigation_Routing.md`
- `04_AppShell_and_Layout_Components.md`
- `01_Screen_Inventory.md`
