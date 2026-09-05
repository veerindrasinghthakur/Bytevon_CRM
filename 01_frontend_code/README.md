# Bytevon Frontend

React + TypeScript + Vite frontend for Bytevon ERP/CRM.

## Tech stack (locked)

- React 18 + TypeScript
- Vite
- Tailwind CSS (tokens via CSS variables)
- TanStack Query + TanStack Router + TanStack Table
- Zod + React Hook Form
- Material Symbols Outlined + Inter

## Getting started (Codespaces / local)

```bash
cd frontend_code
npm install
npm run dev
```

App runs at http://localhost:5173

## Structure

Follows `frontend/03_Frontend_Project_Structure.md`:

```
src/
├── app/           # providers, router, layouts (AppShell)
├── modules/       # feature modules (projects first)
├── shared/        # ui, layout, feedback, lib
└── styles/        # tokens.css + globals.css
```

## Current progress

- [x] Project scaffold + tokens + Tailwind
- [x] AppShell (IconRail + SecondarySidebar + Header) — both sidebars collapsed by default
- [x] Projects module (list, detail, create) with mock API, loading/empty/error states
- [x] Teams & Tasks list placeholders
- [ ] Full Teams / Tasks CRUD
- [ ] Sales, Workforce, Auth, etc.

All coding work lives in this folder. Test via Codespaces with `npm run dev`.
