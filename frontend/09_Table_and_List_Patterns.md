# 09_Table_and_List_Patterns.md

# Bytevon Frontend — Table & List Patterns

**Project:** Bytevon ERP/CRM  
**Version:** 1.0  
**Status:** Draft  
**Last Updated:** 2026-08-07

---

## 1. Purpose

Defines standard patterns for data tables and list pages used throughout the application (Leads, Projects, Employees, Approvals, etc.).

---

## 2. Recommended Stack

- **TanStack Table** for headless table logic
- Shared `DataTable` UI wrapper in `shared/components`
- TanStack Query for data fetching

---

## 3. Standard List Page Layout

```
PageHeader
  - Title
  - Primary “New” button
  - Optional secondary actions

Toolbar / Filters
  - Search (page-level)
  - Filter dropdowns / chips
  - View switcher (table / cards) if needed

DataTable or Card List
  - Loading skeleton
  - Empty state
  - Error state
  - Pagination or infinite scroll

Bulk Actions bar (when rows selected)
```

---

## 4. DataTable Features

- Column definitions co-located with the page or module
- Sorting (client or server)
- Row selection (single / multi)
- Bulk actions (archive, assign, export…)
- Row click → navigate to detail
- Responsive: on small screens consider card view or horizontal scroll

---

## 5. States

Every list must handle:

| State     | UI                                      |
|-----------|-----------------------------------------|
| Loading   | Skeleton rows or spinner                |
| Empty     | EmptyState component with helpful CTA   |
| Error     | Error message + retry                   |
| Success   | Table / list with data                  |

---

## 6. Search & Filters

- Page-level search bar (when present, Header search becomes icon-only).
- Filters should update the query key and trigger a new fetch.
- Prefer URL search params for shareable filter state.

---

## 7. Pagination

- Prefer server-side pagination for large collections.
- Show page size selector and current range.
- Alternative: infinite scroll for certain feeds (activity, notifications).

---

## 8. Related Documents

- `07_Shared_UI_Components.md`
- `06_API_Integration_Patterns.md`
- `01_Screen_Inventory.md`
