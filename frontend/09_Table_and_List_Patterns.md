# 09_Table_and_List_Patterns.md

# Bytevon Frontend — Table & List Patterns

**Project:** Bytevon ERP/CRM  
**Version:** 1.2  
**Status:** Locked (selection strategy)  
**Last Updated:** 2026-08-14

---

## 1. Purpose

Defines standard patterns for data tables and list pages used throughout the application (Leads, Projects, Employees, Approvals, etc.).

---

## 2. Recommended Stack

- Shared `useListSelection` for bulk selection (required on all multi-select lists)
- Shared `StatusDot` for Active / Inactive (no dedicated Status text column)
- Shared `BulkSelectionBar` when selection mode is on
- TanStack Table (optional) for headless table logic
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

BulkSelectionBar (only when selectionMode === true)

DataTable or Card List
  - Leftmost column: StatusDot (default) OR checkbox (selection mode)
  - Loading skeleton / Empty / Error
  - Pagination or infinite scroll
```

---

## 4. Status indicator (not a Status column)

- **Do not** show a separate “Status” text column for Active / Inactive.
- **Do** show a simple dot at the **leftmost** data cell of each row:
  - **Green** (`bg-emerald-500`) = Active
  - **Grey** (`bg-slate-400`) = Inactive
- Use shared component: `StatusDot` from `@/shared/components/ui/StatusDot`.
- Pipeline / workflow stages (e.g. New, Qualified, Won) remain **separate** badges — they are not Active/Inactive.

---

## 5. Bulk selection strategy (required)

Every list that supports multi-select **must** use `useListSelection` from `@/shared/hooks/useListSelection`.

### Rules

| # | Behaviour |
|---|-----------|
| 1 | **Long-press ≥ 3 seconds** on a row → enter selection mode and select that row. |
| 2 | While selection mode is on, a short click **toggles** that row’s checkbox. |
| 3 | Unchecking the **last** selected item → **exit** selection mode (checkboxes hide; dots return). |
| 4 | Header **Select all** applies only to **currently filtered / rendered** rows (not the full unfiltered dataset). |
| 5 | When filters change, selection is **pruned** to ids still visible. If none remain, selection mode turns off. |
| 6 | Short click **outside** selection mode → open detail / quick view (page-specific). |

Constant: `LIST_LONG_PRESS_MS = 3000`.

### Implementation sketch

```tsx
const filtered = useMemo(() => /* apply filters */, [deps])
const selection = useListSelection({
  items: filtered,
  getId: (row) => row.id,
})

// Row:
<tr
  onMouseDown={() => selection.onRowPressStart(row.id)}
  onMouseUp={() => selection.onRowPressEnd(row.id, () => openQuickView(row))}
  onMouseLeave={selection.onRowPressCancel}
  onTouchStart={() => selection.onRowPressStart(row.id)}
  onTouchEnd={() => selection.onRowPressEnd(row.id, () => openQuickView(row))}
  onTouchCancel={selection.onRowPressCancel}
  onContextMenu={(e) => e.preventDefault()}
>
  <td>
    {selection.selectionMode ? (
      <input type="checkbox" checked={selection.isSelected(row.id)} onChange={() => selection.toggleOne(row.id)} />
    ) : (
      <StatusDot status={row.status} />
    )}
  </td>
  ...
</tr>

{selection.selectionMode && (
  <BulkSelectionBar
    selectedCount={selection.selectedCount}
    filteredCount={filtered.length}
    onCancel={selection.exitSelectionMode}
  >
    {/* Export / Assign / Archive buttons */}
  </BulkSelectionBar>
)}
```

### Header checkbox

Only render when `selection.selectionMode` is true. Bind to `toggleSelectAllFiltered` and `allFilteredSelected`.

### UX hint

Footer may show: `· Hold a row 3s to multi-select` when not in selection mode.

---

## 6. DataTable Features

- Column definitions co-located with the page or module
- Sorting (client or server)
- Row selection via **§5 only** (do not invent alternate multi-select UX)
- Bulk actions (archive, assign, export…)
- Row short-click → detail or quick overview
- Responsive: card view or horizontal scroll on small screens

---

## 7. States

Every list must handle:

| State     | UI                                      |
|-----------|-----------------------------------------|
| Loading   | Skeleton rows or spinner                |
| Empty     | EmptyState component with helpful CTA   |
| Error     | Error message + retry                   |
| Success   | Table / list with data                  |

---

## 8. Search & Filters

- Page-level search bar (when present, Header search becomes icon-only).
- Filters should update the query key and trigger a new fetch.
- Prefer URL search params for shareable filter state.
- Selection always respects the **filtered** set (§5).

---

## 9. Pagination

- Prefer server-side pagination for large collections.
- Show page size selector and current range.
- **Select all** = all rows on the **current filtered view** the user is interacting with (if paginated client-side, use the same array passed to `useListSelection`; document if product later requires “select all pages”).

---

## 10. Related Documents

- `07_Shared_UI_Components.md`
- `06_API_Integration_Patterns.md`
- `01_Screen_Inventory.md`
- `12_Module_Implementation_Checklist.md`
- `14_Code_Generation_Rules.md`
