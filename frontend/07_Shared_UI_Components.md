# 07_Shared_UI_Components.md

# Bytevon Frontend — Shared UI Components

**Project:** Bytevon ERP/CRM  
**Version:** 1.0  
**Status:** Draft  
**Last Updated:** 2026-08-07

---

## 1. Purpose

Defines the shared, reusable UI components that live in `src/shared/components/`.

These components must be:
- Token-driven (no hardcoded colors/spacing)
- Accessible
- Free of business logic
- Consistent with the Design System

Business-specific components stay inside their feature modules.

---

## 2. Component Categories

### 2.1 Actions
- `Button` (primary, secondary, outline, ghost, danger)
- `IconButton`
- `LinkButton`

### 2.2 Inputs
- `Input`
- `Textarea`
- `Select` / `Combobox`
- `SearchInput`
- `DatePicker` / `DateRangePicker`
- `Checkbox`
- `RadioGroup`
- `Switch`
- `FormField` (label + error + description wrapper)

### 2.3 Navigation & Layout
- `IconRail`
- `SecondarySidebar`
- `Header`
- `PageHeader`
- `Breadcrumbs`
- `Tabs`
- `Pagination`

### 2.4 Data Display
- `Card`
- `StatCard` / `KPICard`
- `Badge` / `StatusBadge`
- `Avatar`
- `Table` (wrapper around TanStack Table)
- `EmptyState`
- `Skeleton`
- `Tooltip`

### 2.5 Feedback
- `Alert`
- `Toast` (via a toast provider)
- `Spinner` / `Loader`
- `Progress`

### 2.6 Overlays
- `Modal` / `Dialog`
- `Drawer` / `Sheet`
- `Popover`
- `ConfirmDialog`
- `DropdownMenu`

---

## 3. Design Rules for Shared Components

1. **Tokens only** — colors, spacing, radii, shadows, typography must come from CSS variables.
2. **Composable** — prefer composition over configuration explosion.
3. **Accessible** — proper labels, roles, keyboard support, focus management.
4. **No business logic** — a `StatusBadge` receives a status string and maps it to a visual style; it does not know what “WON” means in the Sales domain.
5. **Consistent API** — similar components should have similar prop names (`size`, `variant`, `isLoading`, `isDisabled`, etc.).

---

## 4. Recommended Location

```
src/shared/components/
├── ui/                    # primitives (Button, Input, Badge…)
├── layout/                # IconRail, SecondarySidebar, Header, PageHeader
└── feedback/              # EmptyState, Skeleton, Toast helpers
```

---

## 5. Integration with Design System

- All visual values reference the tokens defined in `src/styles/tokens.css` and the existing Design System documents.
- When a new visual need appears, first check whether a token already exists. Only add a new token if necessary.

---

## 6. Related Documents

- `01_Component_System.md` (existing high-level list)
- Design System files under `UI_designs&docs/design-system/`
- `04_AppShell_and_Layout_Components.md`
