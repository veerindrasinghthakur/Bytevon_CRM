# Bytevon Documentation

Frontend architecture documentation for the **Bytevon ERP/CRM** project.

## Frontend Architecture Documents

Located in the [`frontend/`](./frontend/) folder:

| File | Description |
|------|-------------|
| [01_Screen_Inventory.md](./frontend/01_Screen_Inventory.md) | Complete list of screens grouped by module (including Teams) |
| [02_Layout_Navigation_Routing.md](./frontend/02_Layout_Navigation_Routing.md) | App shell, Icon Rail + Secondary Sidebar, search rules, nested routing, mobile notes |
| [03_Frontend_Project_Structure.md](./frontend/03_Frontend_Project_Structure.md) | Tech stack, folder structure, CSS variables rule, module conventions |

## Locked Decisions (Summary)

- **Tech stack**: React + TypeScript + Vite + Tailwind + TanStack (Query/Table/Router) + Zod
- **Navigation**: Icon Rail (collapsed by default) + Secondary Sidebar (collapsed by default)
- **Nested routing**
- **Teams** live under Projects
- **Create/New** buttons live on the page
- **Search**: only one visible search bar at a time
- **Design tokens**: CSS variables only — no hardcoded values

---

Generated from Grok project discussion on 2026-08-07.
