# TODO #2: Server-Side Pagination & Filtering

**Priority:** HIGH | **Effort:** Medium (2-3 weeks) | **Impact:** Removes client-side pagination from 40% of list pages

---

## 🎯 Objective
Move all pagination, filtering, and sorting to the server (API + TanStack Query) to handle large datasets efficiently.

---

## 📍 Current State (What Needs to Change)

### Pages Using Client-Side Pagination

| Module | Page | Current Approach | Rows Affected |
|--------|------|------------------|---------------|
| **projects** | TasksListPage | `useState` + `paginate()` | All tasks |
| **projects** | TeamsListPage | `useState` + `paginate()` | All teams |
| **projects** | DocumentsPage | `useState` + client filter | All docs |
| **workforce** | DepartmentsListPage | `useState` + `paginate()` | All depts |
| **sales** | LeadsListPage | `useState` + client filter | All leads |
| **my-work** | MyTasksPage | Client filter | All tasks |

**Total: 6 pages doing client-side pagination/filtering**

---

## 📂 Where to Change

### 1. API Layer - Add Pagination/Filter Parameters

```
src/modules/*/api/
├── projects/
│   ├── tasks.ts          # Add pagination/filter params
│   ├── teams.ts          # Add pagination/filter params
│   └── documents.ts      # Add pagination/filter params
├── workforce/
│   ├── departments.ts    # Add pagination/filter params
│   └── employment.ts     # Add pagination/filter params
├── sales/
│   └── leads.ts          # Add pagination/filter params
└── my-work/
    └── tasks.ts          # Add pagination/filter params
```

### 2. Hook Layer - Use `useListControls` Properly

```
src/modules/*/hooks/
├── projects/
│   ├── use-tasks.ts          # Already uses useListControls - fix API
│   ├── use-teams.ts          # Already uses useListControls - fix API
│   └── use-documents.ts      # Already uses useListControls - fix API
├── workforce/
│   ├── use-departments-list.ts  # Already uses useListControls - fix API
│   └── use-employees-list.ts    # Already uses useListControls - fix API
├── sales/
│   ├── use-leads-list.ts     # Needs migration to useListControls
│   └── use-clients-list.ts   # Already uses useListControls - fix API
└── my-work/
    └── use-my-tasks.ts       # Needs migration to useListControls
```

### 3. Pages - Remove Local State

```
src/modules/*/pages/
├── projects/
│   ├── TasksListPage.tsx     # Remove local useState + paginate()
│   ├── TeamsListPage.tsx     # Remove local useState + paginate()
│   └── DocumentsPage.tsx     # Remove local useState + client filter
├── workforce/
│   ├── DepartmentsListPage.tsx   # Remove local useState + paginate()
│   └── EmployeesListPage.tsx     # Already uses hook - verify
├── sales/
│   └── LeadsListPage.tsx     # Remove local useState + client filter
└── my-work/
    └── MyTasksPage.tsx       # Remove local useState + client filter
```

---

## 🔧 What Should Be Done (Implementation)

### 1. Standard API Pagination Interface

```typescript
// src/shared/lib/list-params.ts
export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, string | number | boolean>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### 2. API Function Signature Standard

```typescript
// src/modules/projects/api/tasks.ts
export async function getTasks(params: {
  search?: string;
  status?: string;
  priority?: string;
  projectId?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<PaginatedResponse<Task>> {
  // Implementation with proper pagination
}

// Same pattern for all list APIs
```

### 3. Hook Migration Pattern

```typescript
// src/modules/projects/hooks/use-tasks.ts
export function useTasks(filters?: TaskFilters) {
  const controls = useListControls({
    filterDefaults: { status: '', priority: '' },
    pageSize: 20,
  });

  const query = useQuery({
    queryKey: queryKeys.tasks.list({
      search: controls.debouncedSearch,
      status: controls.filters.status,
      priority: controls.filters.priority,
      page: controls.page,
      pageSize: controls.pageSize,
    }),
    queryFn: () => getTasks({
      search: controls.debouncedSearch,
      status: controls.filters.status,
      priority: controls.filters.priority,
      page: controls.page,
      pageSize: controls.pageSize,
    }),
  });

  return {
    // ... existing return
    pageItems: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    // ... rest
  };
}
```

### 4. Page Cleanup Pattern

```tsx
// Before (TasksListPage.tsx) - REMOVE ALL THIS:
const [search, setSearch] = useState('');
const [status, setStatus] = useState('');
const [priority, setPriority] = useState('');
const [page, setPage] = useState(1);
const [filtered, setFiltered] = useState([]);

const filtered = useMemo(() => {
  let list = data?.items ?? [];
  if (priority) list = list.filter((t) => t.priority === priority);
  return list;
}, [data, priority]);

const pageItems = paginate(filtered, page, DEFAULT_PAGE_SIZE);

// After - USE HOOK ONLY:
const {
  pageItems,
  total,
  page,
  setPage,
  pageSize,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  filtersActive,
  resetFilters,
  isLoading,
  isFetching,
  refetch,
} = useTasks();
```

---

## 📋 Files to Modify

### API Layer (8 files)
| File | Changes |
|------|---------|
| `src/modules/projects/api/tasks.ts` | Add pagination/filter params to `getTasks` |
| `src/modules/projects/api/teams.ts` | Add pagination/filter params to `getTeams` |
| `src/modules/projects/api/documents.ts` | Add pagination/filter params to `listDocuments` |
| `src/modules/workforce/api/departments.ts` | Add pagination/filter params to `listDepartments` |
| `src/modules/workforce/api/employment.ts` | Add pagination/filter params to `listEmployees` |
| `src/modules/sales/api/leads.ts` | Add pagination/filter params to `listLeads` |
| `src/modules/my-work/api/tasks.ts` | Add pagination/filter params to `listMyTasks` |
| `src/modules/sales/api/clients.ts` | Verify pagination params |

### Hooks (6 files)
| File | Changes |
|------|---------|
| `src/modules/projects/hooks/use-tasks.ts` | Verify `useListControls` integration |
| `src/modules/projects/hooks/use-teams.ts` | Verify `useListControls` integration |
| `src/modules/projects/hooks/use-documents.ts` | Verify `useListControls` integration |
| `src/modules/workforce/hooks/use-departments-list.ts` | Verify `useListControls` integration |
| `src/modules/sales/hooks/use-leads-list.ts` | **Migrate** to `useListControls` |
| `src/modules/my-work/hooks/use-my-tasks.ts` | **Migrate** to `useListControls` |

### Pages (6 files)
| File | Changes |
|------|---------|
| `src/modules/projects/pages/TasksListPage.tsx` | Remove local state, use hook |
| `src/modules/projects/pages/TeamsListPage.tsx` | Remove local state, use hook |
| `src/modules/projects/pages/DocumentsPage.tsx` | Remove local state, use hook |
| `src/modules/workforce/pages/DepartmentsListPage.tsx` | Remove local state, use hook |
| `src/modules/sales/pages/LeadsListPage.tsx` | Remove local state, use hook |
| `src/modules/my-work/pages/MyTasksPage.tsx` | Remove local state, use hook |

---

## 🔧 API Contract Changes

### Request Parameters
```typescript
// Standard query parameters for all list endpoints
interface ListRequestParams {
  page?: number;           // 1-based, default 1
  pageSize?: number;       // default 20, max 100
  search?: string;         // global search
  sortBy?: string;         // field name
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, string | number | boolean>; // field-specific filters
}
```

### Response Format
```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
```

---

## 📋 Migration Checklist

### API Layer
- [ ] `getTasks` accepts pagination/filter params
- [ ] `getTeams` accepts pagination/filter params
- [ ] `listDocuments` accepts pagination/filter params
- [ ] `listDepartments` accepts pagination/filter params
- [ ] `listEmployees` accepts pagination/filter params
- [ ] `listLeads` accepts pagination/filter params
- [ ] `listMyTasks` accepts pagination/filter params
- [ ] All return `PaginatedResponse<T>`

### Hooks
- [ ] `useTasks` uses `useListControls` + server pagination
- [ ] `useTeams` uses `useListControls` + server pagination
- [ ] `useDocuments` uses `useListControls` + server pagination
- [ ] `useDepartmentsList` uses `useListControls` + server pagination
- [ ] `useLeadsList` migrated to `useListControls`
- [ ] `useMyTasks` migrated to `useListControls`

### Pages
- [ ] `TasksListPage` - no local `useState` for filters/pagination
- [ ] `TeamsListPage` - no local `useState` for filters/pagination
- [ ] `DocumentsPage` - no local `useState` for filters/pagination
- [ ] `DepartmentsListPage` - no local `useState` for filters/pagination
- [ ] `LeadsListPage` - no local `useState` for filters/pagination
- [ ] `MyTasksPage` - no local `useState` for filters/pagination

### Testing
- [ ] Pagination works correctly (page 1, 2, 3...)
- [ ] Search debounces correctly (300ms)
- [ ] Filters combine correctly (search + status + priority)
- [ ] Sorting works (click column headers)
- [ ] Page size selector works (10, 20, 50, 100)
- [ ] Loading states during page/filter changes
- [ ] Empty states when no results
- [ ] Error states handled gracefully

---

## 📦 Files to Delete

```
src/modules/projects/pages/TasksListPage.tsx  // local paginate() calls
src/modules/projects/pages/TeamsListPage.tsx  // local paginate() calls
src/modules/projects/pages/DocumentsPage.tsx  // client filter logic
src/modules/workforce/pages/DepartmentsListPage.tsx  // local paginate()
src/modules/sales/pages/LeadsListPage.tsx  // local useState + filter
src/modules/my-work/pages/MyTasksPage.tsx  // local useState + filter
```

---

## 📝 Notes

- **Mock API** (`env.useMockApi`) must also implement pagination/filtering
- **Query keys** must include all filter/pagination params for proper caching
- **Debounced search** (300ms) already handled by `useListControls`
- **Optimistic updates** for mutations must invalidate correct query keys
- **URL synchronization** - consider syncing filters to URL for shareable links