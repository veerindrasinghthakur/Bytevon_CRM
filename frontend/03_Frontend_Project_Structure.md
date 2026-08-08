# 03_Frontend_Project_Structure.md

# Bytevon Frontend — Project Structure & Technical Decisions

**Project:** Bytevon ERP/CRM  
**Version:** 1.0  
**Status:** Locked  
**Last Updated:** 2026-08-07

---

## 1. Tech Stack (Confirmed)

| Layer              | Choice                          |
|--------------------|---------------------------------|
| Framework          | React 18+                       |
| Language           | TypeScript                      |
| Bundler            | Vite                            |
| Styling            | Tailwind CSS                    |
| Design Tokens      | CSS Variables (central file)    |
| Server State       | TanStack Query                  |
| Tables             | TanStack Table                  |
| Routing            | TanStack Router (or React Router with nested routes) |
| Validation         | Zod                             |
| Forms              | React Hook Form + Zod resolver (recommended) |
| Icons              | Material Symbols Outlined       |
| Font               | Inter                           |

**Rule:** Never hardcode colors, spacing, radii, shadows, or typography values.  
All visual properties must come from CSS variables defined in the central tokens file.

---

## 2. Folder Structure

```
src/
├── app/
│   ├── providers/                 # QueryClient, Theme, Auth, etc.
│   ├── router/                    # Route definitions (nested)
│   └── layouts/
│       ├── AuthLayout.tsx         # Login, Forgot, Reset…
│       ├── AppShell.tsx           # Icon Rail + Secondary Sidebar + Header
│       └── ...
│
├── modules/                       # Feature modules (mirror backend domains)
│   ├── auth/
│   ├── dashboard/
│   ├── sales/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── schemas/               # Zod schemas for this module
│   ├── developer/                 # Projects, Teams, Tasks
│   ├── workforce/
│   ├── attendance/
│   ├── leave/
│   ├── approvals/
│   ├── admin/
│   ├── notifications/
│   └── profile/
│
├── shared/
│   ├── components/
│   │   ├── ui/                    # Button, Input, Badge, Card, Table primitives…
│   │   ├── layout/                # Sidebar, Header, PageHeader, AppShell pieces
│   │   └── feedback/              # EmptyState, Skeleton, Toast, ErrorBoundary
│   ├── hooks/                     # useDebounce, useMediaQuery, etc.
│   ├── lib/                       # api client, queryClient, utils
│   ├── schemas/                   # truly shared Zod schemas
│   └── types/
│
├── styles/
│   ├── tokens.css                 # ← MAIN CSS VARIABLES FILE
│   ├── globals.css
│   └── tailwind.css
│
├── assets/
└── main.tsx
```

---

## 3. Design Tokens (Critical Rule)

- Source of truth: `src/styles/tokens.css` (and Tailwind theme extension that maps to these variables).
- Existing design-system documentation under `Frontend Documentation/UI_designs&docs/design-system/` is the reference.
- Components must use Tailwind classes that resolve to CSS variables or direct `var(--token-name)`.
- No raw hex values or magic numbers in component code.

Example pattern:

```css
/* tokens.css */
:root {
  --color-primary: #00418f;
  --color-primary-container: #0058bc;
  --sidebar-width-collapsed: 80px;
  --sidebar-width-expanded: 240px;
  /* … */
}
```

---

## 4. Module Conventions

Each feature module should own:

- Its pages (list, detail, create, edit)
- Module-specific components
- API hooks (TanStack Query)
- Zod schemas for forms and API payloads
- Local types

Shared UI stays in `shared/components`.

---

## 5. Routing

- Nested routes as defined in `02_Layout_Navigation_Routing.md`.
- Route-level code splitting recommended.
- Auth guard + permission guards at the layout / route level.

---

## 6. State Management Guidelines

- Server state → TanStack Query only.
- URL state → router search params.
- Local UI state → React state / context where needed.
- No global Redux-style store unless a clear cross-cutting need appears later.

---

## 7. Related Documents

- `01_Screen_Inventory.md`
- `02_Layout_Navigation_Routing.md`
- Design System files in `UI_designs&docs/design-system/`
