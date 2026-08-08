# Bytevon Documentation

Frontend architecture documentation for the **Bytevon ERP/CRM** project.

**Discussion summary (all locked decisions):** [DISCUSSION_SUMMARY.md](./DISCUSSION_SUMMARY.md)

---

## Frontend Architecture Documents

Located in [`frontend/`](./frontend/):

### Core Architecture

| # | File | Description |
|---|------|-------------|
| 01 | [Screen Inventory](./frontend/01_Screen_Inventory.md) | Screens grouped by module (including Teams) |
| 02 | [Layout, Navigation & Routing](./frontend/02_Layout_Navigation_Routing.md) | Shell, sidebars, search, nested routing |
| 03 | [Frontend Project Structure](./frontend/03_Frontend_Project_Structure.md) | Tech stack, folders, CSS variables rule |
| 04 | [AppShell & Layout Components](./frontend/04_AppShell_and_Layout_Components.md) | Icon Rail, Secondary Sidebar, Header |
| 05 | [Routing & Guards](./frontend/05_Routing_and_Guards.md) | Route tree, AuthGuard, PermissionGuard |
| 06 | [API Integration Patterns](./frontend/06_API_Integration_Patterns.md) | TanStack Query + Zod, query keys |
| 07 | [Shared UI Components](./frontend/07_Shared_UI_Components.md) | Shared component categories |
| 08 | [Form Patterns](./frontend/08_Form_Patterns.md) | React Hook Form + Zod |
| 09 | [Table & List Patterns](./frontend/09_Table_and_List_Patterns.md) | DataTable, filters, states |
| 10 | [Mobile Responsive Rules](./frontend/10_Mobile_Responsive_Rules.md) | Mobile decisions + open points |

### Implementation & Consistency

| # | File | Description |
|---|------|-------------|
| 11 | [State Management Conventions](./frontend/11_State_Management_Conventions.md) | Server / URL / Form / Local state |
| 12 | [Module Implementation Checklist](./frontend/12_Module_Implementation_Checklist.md) | Steps every module must follow |
| 13 | [Naming & Code Conventions](./frontend/13_Naming_and_Code_Conventions.md) | Files, hooks, query keys |
| 14 | [Code Generation Rules](./frontend/14_Code_Generation_Rules.md) | Rules for Stitch → React |
| 15 | [Page State Matrix](./frontend/15_Page_State_Matrix.md) | Required states per page type |

---

## Stitch Screens (by module)

Organized under numbered folders at repo root:

| Folder | Module |
|--------|--------|
| `01_auth` | Login, password, session, 403, 404 |
| `02_dashboard` | Employee / Executive / Sales dashboards |
| `03_sales` | Leads, Clients, Analytics, Activity |
| `04_projects` | Projects, Teams, Tasks |
| `05_workforce` | Employees, Departments, Teams UI |
| `06_attendance` | Attendance, shifts, calendar |
| `07_leave` | Leave management, apply, balance |
| `08_approvals` | Approval center, pending, details |
| `09_admin` | Users, Roles, Settings, Audit |
| `10_notifications_profile` | Notifications, profile |
| `11_shared_reference` | Nav, header, form/metric components |

Each screen typically includes `.html` (full Stitch output with CSS/JS) and `.png`.

---

## Frontend code starter

[`frontend_code/`](./frontend_code/) — React + TypeScript + Vite + Tailwind project aligned with the architecture (AppShell, modules, shared UI, tokens).

---

## Locked Decisions (short list)

- **Stack:** React + TS + Vite + Tailwind + TanStack (Query/Table/Router) + Zod  
- **Nav:** Icon Rail + Secondary Sidebar (both collapsed by default)  
- **Nested routing**  
- **Teams under Projects**  
- **Create/New on the page** (not global header)  
- **CSS variables only** (no hardcoded design values)  
- **Mobile:** no bottom nav yet; sidebars collapsed/icon-only  

See [DISCUSSION_SUMMARY.md](./DISCUSSION_SUMMARY.md) for full context.

---

Generated from Grok project discussion (2026-08-07 / 2026-08-08).
