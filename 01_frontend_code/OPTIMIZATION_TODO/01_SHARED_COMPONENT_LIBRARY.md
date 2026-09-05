# TODO #1: Shared Component Library

**Priority:** HIGH | **Effort:** Medium (2-3 weeks) | **Impact:** Eliminates ~30% code duplication

---

## 🎯 Objective
Create a centralized shared component library to eliminate duplication across 11 modules.

---

## 📍 Current State (What Needs to Change)

### Duplicated Patterns Across Modules

| Component | Modules Duplicating | Lines Each | Total Lines |
|-----------|---------------------|------------|-------------|
| **KPI/Metric Cards** | admin, approvals, payroll, projects, sales, workforce, my-work | ~40-60 | ~350 |
| **Status Badges** | admin, approvals, sales, workforce, my-work, projects | ~15-25 | ~150 |
| **Form Fields** | All 11 modules | ~30-50 | ~400 |
| **Filter Toolbars** | admin, projects, workforce, sales, approvals | ~40-60 | ~300 |
| **Table Actions** | admin, projects, workforce, approvals | ~20-30 | ~120 |
| **Empty/Error/Skeleton States** | All modules | ~20-30 | ~200 |

**Total Duplicated Code: ~1,700+ lines**

---

## 📂 Where to Create New Components

```
src/shared/components/
├── data-display/
│   ├── MetricCard.tsx          # Unified KPI/Metric card
│   ├── StatusBadge.tsx         # Semantic status badge
│   ├── DataTable.tsx           # Virtualized table with selection
│   └── StatCard.tsx            # Simple stat display
├── forms/
│   ├── FormField.tsx           # Label + Input + Error + Hint
│   ├── FilterToolbar.tsx       # Search + Filters + Actions
│   ├── SelectField.tsx         # Select with label/error
│   ├── DateRangeField.tsx      # Date range picker
│   └── EntitySearchField.tsx   # Entity search with label
├── feedback/
│   ├── EmptyState.tsx          # Already exists - enhance
│   ├── ErrorState.tsx          # Already exists - enhance
│   ├── LoadingState.tsx        # Unified loading
│   └── InlineError.tsx         # Inline form error
├── layout/
│   ├── PageHeader.tsx          # Already exists - enhance
│   ├── ListToolbar.tsx         # Already exists - enhance
│   ├── BulkActionBar.tsx       # Already exists - enhance
│   └── PageShell.tsx           # Page wrapper with breadcrumbs
└── data-entry/
    ├── PermissionMatrix.tsx    # Role permission grid
    ├── EditableField.tsx       # Inline editable field
    └── FormArrayField.tsx      # Dynamic field arrays
```

---

## 🔧 What Should Be Done (Implementation Details)

### 1. MetricCard.tsx - Unified KPI Card
```tsx
// src/shared/components/data-display/MetricCard.tsx
interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: string;
  iconClass?: string;
  trend?: string;
  trendUp?: boolean;
  trendClass?: string;
  hint?: React.ReactNode;
  valueClassName?: string;
  className?: string;
  onClick?: () => void;
  highlight?: boolean;
}

// Replaces: local Metric, Stat, KpiCard, SummaryCard, MetricCard variants
```

**Migration:** Replace all local `Metric`, `Stat`, `KpiCard`, `SummaryCard` implementations across 7 modules.

---

### 2. StatusBadge.tsx - Semantic Status Badge
```tsx
// src/shared/components/data-display/StatusBadge.tsx
type StatusVariant = 
  | 'success' | 'error' | 'warning' | 'info' | 'neutral'
  | 'primary' | 'secondary';

interface StatusBadgeProps {
  children: React.ReactNode;
  variant: StatusVariant;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

// Usage: <StatusBadge variant="success">Active</StatusBadge>
// Replaces: inline status-badge classes, priorityStyles, statusStyles maps
```

**Migration:** Replace all inline `status-badge status-*` classes and local `statusStyles`/`priorityMaps` across 6 modules.

---

### 3. FormField.tsx - Unified Form Field Wrapper
```tsx
// src/shared/components/forms/FormField.tsx
interface FormFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: FieldError;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  children?: React.ReactElement; // Input, Select, Textarea, etc.
  className?: string;
  labelClassName?: string;
}

// Usage:
// <FormField label="Email" name="email" register={register} error={errors.email}>
//   <input {...register('email')} className="..." />
// </FormField>
```

**Migration:** Replace all manual label+input+error patterns across 11 modules (~400 lines).

---

### 4. FilterToolbar.tsx - Unified List Filters
```tsx
// src/shared/components/forms/FilterToolbar.tsx
interface FilterToolbarProps {
  search?: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  filtersActive?: boolean;
  onResetFilters: () => void;
  onRefresh?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'daterange' | 'timerange' | 'multiselect';
  options?: SelectOption[];
  placeholder?: string;
  minWidthClass?: string;
}
```

**Migration:** Replace local filter state + toolbar JSX in 5 modules (~300 lines).

---

### 5. DataTable.tsx - Virtualized Table with Selection
```tsx
// src/shared/components/data-display/DataTable.tsx
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  getRowId: (row: T) => string;
  selection?: UseListSelectionResult<T>;
  virtualized?: boolean;
  rowHeight?: number;
  onRowClick?: (row: T) => void;
  rowActions?: RowAction[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

// Features: virtualization, selection, row actions, sorting, pagination
```

**Migration:** Replace table implementations in admin, projects, workforce, sales (~500 lines).

---

### 6. PermissionMatrix.tsx - Role Permission Grid
```tsx
// src/shared/components/data-entry/PermissionMatrix.tsx
interface PermissionMatrixProps {
  modules: string[];
  actions: string[];
  matrix: Record<string, Record<string, boolean>>;
  onToggleCell: (module: string, action: string) => void;
  onToggleRow: (module: string) => void;
  onToggleCol: (action: string) => void;
  onExpandAll: () => void;
  onReset: () => void;
  readOnly?: boolean;
  className?: string;
}
```

**Migration:** Extract from `RoleFormPage.tsx` (200+ lines) for reuse.

---

### 7. EditableField.tsx - Inline Editable Field
```tsx
// src/shared/components/data-entry/EditableField.tsx
interface EditableFieldProps {
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'select';
  options?: SelectOption[];
  className?: string;
}
```

**Migration:** Replace inline edit patterns in `OrganizationProfileSection`, `ProjectDetailPage`, `TaskDetailPage`.

---

## 📦 Migration Strategy

### Phase 1: Core Components (Week 1)
1. `MetricCard.tsx` - highest reuse
2. `StatusBadge.tsx` - highest reuse  
3. `FormField.tsx` - foundation for forms

### Phase 2: Form & List Components (Week 2)
4. `FilterToolbar.tsx`
5. `FilterField.tsx` components
5. `DataTable.tsx` with virtualization

### Phase 3: Specialized Components (Week 3)
6. `PermissionMatrix.tsx`
7. `EditableField.tsx`
8. `DataTable` enhancements (sorting, column resize)

---

## ✅ Acceptance Criteria

- [ ] All 7 new components created in `src/shared/components/`
- [ ] Each component has TypeScript types, JSDoc, and usage examples
- [ ] All 11 modules migrate to new components (zero local duplicates)
- [ ] Storybook stories for each component
- [ ] Visual regression tests (Chromatic)
- [ ] Bundle size impact < 5KB gzipped total
- [ ] Zero TypeScript errors after migration
- [ ] Zero visual regressions (Chromatic)

---

## 📝 Migration Checklist per Module

| Module | MetricCard | StatusBadge | FormField | FilterToolbar | DataTable | PermissionMatrix | EditableField |
|--------|------------|-------------|-----------|---------------|-----------|------------------|---------------|
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| approvals | ✅ | ✅ | ✅ | ✅ | ✅ | - | ✅ |
| auth | - | - | ✅ | - | - | - | - |
| dashboard | ✅ | - | - | - | - | - | - |
| my-work | ✅ | ✅ | ✅ | ✅ | ✅ | - | ✅ |
| notifications | - | - | ✅ | - | ✅ | - | - |
| payroll | ✅ | ✅ | ✅ | - | ✅ | - | ✅ |
| profile | - | - | ✅ | - | - | - | ✅ |
| projects | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| sales | ✅ | ✅ | ✅ | ✅ | ✅ | - | - |
| workforce | ✅ | ✅ | ✅ | ✅ | ✅ | - | ✅ |

---

## 📁 Files to Delete After Migration

```
src/modules/admin/components/*Metric*.tsx
src/modules/admin/components/*Status*.tsx
src/modules/projects/components/*Metric*.tsx
src/modules/projects/components/*Stat*.tsx
src/modules/sales/components/*Metric*.tsx
src/modules/workforce/components/*Metric*.tsx
src/modules/payroll/components/*Kpi*.tsx
src/modules/my-work/components/*Metric*.tsx
src/modules/projects/pages/*/local *Metric*.tsx
src/modules/sales/pages/*/local *Stat*.tsx
... (all local duplicate components)
```

---

## 📚 Documentation Updates

- [ ] Update `CONTRIBUTING.md` with component usage guidelines
- [ ] Add component API docs to Storybook
- [ ] Update `ARCHITECTURE.md` with shared component architecture
- [ ] Create migration guide for future modules