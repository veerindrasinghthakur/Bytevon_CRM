# Bytevon Documentation

Frontend architecture documentation for the **Bytevon ERP/CRM** project.

## Frontend Architecture Documents

Located in the [`frontend/`](./frontend/) folder:

### Core Architecture
| # | File | Description |
|---|------|-------------|
| 01 | [Screen Inventory](./frontend/01_Screen_Inventory.md) | Complete list of screens grouped by module (including Teams) |
| 02 | [Layout, Navigation & Routing](./frontend/02_Layout_Navigation_Routing.md) | App shell overview, sidebars, search rules, nested routing |
| 03 | [Frontend Project Structure](./frontend/03_Frontend_Project_Structure.md) | Tech stack, folder structure, CSS variables rule |
| 04 | [AppShell & Layout Components](./frontend/04_AppShell_and_Layout_Components.md) | Detailed Icon Rail, Secondary Sidebar, Header, collapse behaviour |
| 05 | [Routing & Guards](./frontend/05_Routing_and_Guards.md) | Full route tree, AuthGuard, PermissionGuard |
| 06 | [API Integration Patterns](./frontend/06_API_Integration_Patterns.md) | TanStack Query + Zod patterns, query keys, error handling |
| 07 | [Shared UI Components](./frontend/07_Shared_UI_Components.md) | Shared component categories and rules |
| 08 | [Form Patterns](./frontend/08_Form_Patterns.md) | React Hook Form + Zod standard form structure |
| 09 | [Table & List Patterns](./frontend/09_Table_and_List_Patterns.md) | DataTable, filters, empty/loading states, bulk actions |
| 10 | [Mobile Responsive Rules](./frontend/10_Mobile_Responsive_Rules.md) | Current locked decisions + open points for mobile |

### Implementation & Consistency (for code generation & maintenance)
| # | File | Description |
|---|------|-------------|
| 11 | [State Management Conventions](./frontend/11_State_Management_Conventions.md) | Server / URL / Form / Local / Global state rules |
| 12 | [Module Implementation Checklist](./frontend/12_Module_Implementation_Checklist.md) | Exact steps every feature module must follow |
| 13 | [Naming & Code Conventions](./frontend/13_Naming_and_Code_Conventions.md) | File, component, hook, query-key naming rules |
| 14 | [Code Generation Rules](./frontend/14_Code_Generation_Rules.md) | Hard rules for converting designs into consistent React code |
| 15 | [Page State Matrix](./frontend/15_Page_State_Matrix.md) | Required states for List / Detail / Create / Edit pages |

## Locked Decisions (Summary)

- **Tech stack**: React + TypeScript + Vite + Tailwind + TanStack (Query/Table/Router) + Zod
- **Navigation**: Icon Rail (collapsed by default) + Secondary Sidebar (collapsed by default)
- **Nested routing**
- **Teams** live under Projects
- **Create/New** buttons live on the page
- **Search**: only one visible search bar at a time
- **Design tokens**: CSS variables only — no hardcoded values
- **Mobile**: No bottom nav for now; both sidebars collapsed/icon-only

---

Generated from Grok project discussion on 2026-08-07.
