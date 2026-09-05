# 12_Module_Implementation_Checklist.md

# Bytevon Frontend — Module Implementation Checklist

**Project:** Bytevon ERP/CRM  
**Version:** 1.1  
**Status:** Locked  
**Last Updated:** 2026-08-14

---

## 1. Purpose

Every feature module must follow the same structure and steps. This checklist is the single source of truth for implementing or generating a new module.

---

## 2. Standard Module Folder Structure

```
modules/<module-name>/
├── api/                    # Pure API functions (no React)
│   ├── <entity>.ts
│   └── index.ts
├── schemas/                # Zod schemas
│   ├── <entity>.ts
│   └── index.ts
├── hooks/                  # TanStack Query hooks
│   ├── use-<entity>.ts
│   └── index.ts
├── components/             # Module-specific components only
│   └── ...
├── pages/                  # Route-level pages
│   ├── <Entity>ListPage.tsx
│   ├── <Entity>DetailPage.tsx
│   ├── <Entity>CreatePage.tsx
│   └── <Entity>EditPage.tsx
├── types/                  # Optional local types
└── index.ts                # Public exports of the module
```

---

## 3. Implementation Checklist (in order)

### Step 1 — Schemas
- [ ] Define Zod schemas for list item, detail, create payload, update payload
- [ ] Export inferred types

### Step 2 — API layer
- [ ] Create pure async functions (getList, getById, create, update, …)
- [ ] Validate responses with Zod where valuable
- [ ] No React imports in this layer

### Step 3 — Hooks
- [ ] `use<Entity>List(filters)`
- [ ] `use<Entity>(id)`
- [ ] `useCreate<Entity>()`
- [ ] `useUpdate<Entity>()`
- [ ] Proper query keys + invalidation

### Step 4 — Pages
- [ ] List page (with filters, table/cards, empty/loading/error)
- [ ] **List selection:** `useListSelection` + leftmost `StatusDot` (or checkbox in selection mode) — see `09_Table_and_List_Patterns.md` §4–5
- [ ] Detail page
- [ ] Create page / form
- [ ] Edit page / form
- [ ] All pages handle the standard states (see Page State Matrix)

### Step 5 — Module-specific components
- [ ] Only components that are not reusable across modules
- [ ] Prefer composing shared UI components

### Step 6 — Routing
- [ ] Add nested routes under the correct parent
- [ ] Apply AuthGuard + PermissionGuard as needed

### Step 7 — Permissions
- [ ] Hide navigation items the user cannot access
- [ ] Guard routes
- [ ] Disable or hide actions the user cannot perform

---

## 4. Definition of Done for a Module

A module is considered complete when:

- All required screens from the Screen Inventory exist
- All states (loading, empty, error, success, no-permission) are handled
- **List pages use the shared selection strategy** (3s long-press, filtered select-all, exit on last uncheck)
- Active/Inactive shown as leftmost dots only (no Status text column)
- Query keys follow the convention
- Forms use React Hook Form + Zod
- No hardcoded visual values (tokens only)
- No business logic inside shared UI components
- Navigation and guards are correctly wired

---

## 5. Related Documents

- `03_Frontend_Project_Structure.md`
- `06_API_Integration_Patterns.md`
- `09_Table_and_List_Patterns.md` ← selection strategy
- `11_State_Management_Conventions.md`
- `14_Code_Generation_Rules.md`
- `15_Page_State_Matrix.md`
