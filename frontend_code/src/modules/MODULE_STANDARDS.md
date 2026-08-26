# Module Standards & Patterns

This document defines the standardized architecture, patterns, and conventions for all modules (admin, sales, projects, workforce, payroll, etc.).

---

## 1. File Layout (Per Module)

```
modules/<module>/
  api/              # Pure async functions; branch on env.useMockApi
  schemas/          # Zod schemas + inferred types (single source of truth)
  hooks/            # useQuery / useMutation + local UI state
  pages/            # Presentation only (no direct API/mock imports)
  components/       # Module-specific UI components
  index.ts          # Public exports
  routes.tsx        # Route definitions (if module has routing)
```

**Shared Infrastructure** (do not duplicate per module):

```
config/env.ts                         # useMockApi, apiBaseUrl
shared/lib/axios.ts                   # apiClient + interceptors
shared/lib/query-client.ts            # QueryClient defaults
shared/lib/download-file.ts           # Blob → browser download
shared/api/export.ts                  # exportResource / exportAndDownload
shared/hooks/useExport.ts             # TanStack mutation for export
shared/components/export/ExportButton.tsx
shared/components/export/ExportDialog.tsx
shared/components/layout/BackButton.tsx
shared/hooks/useListSelection.ts      # bulk selection (export reuses selectedIds)
shared/hooks/useListControls.ts       # pagination, search, filters (client-side UI state only)
shared/lib/lazyPage.tsx               # lazy route component loader
shared/lib/query-keys.ts              # typed query key factories
shared/mock/db.ts                     # Shared mock database + seed data
shared/mock/seed.ts                   # Seed functions for all modules
```

---

## 2. Environment Configuration

```ts
// config/env.ts
export const env = {
  useMockApi: import.meta.env.VITE_USE_MOCK_API !== 'false', // default true
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
}
```

```env
# .env.example
VITE_USE_MOCK_API=true
VITE_API_BASE_URL=/api/v1
```

**Rule**: All API functions must branch on `env.useMockApi` internally. Pages/hooks never import mock data directly.

---

## 3. Schemas & Types (Zod-First)

### 3.1 Schema File per Entity

Each entity gets a dedicated schema file in `schemas/`:

```
modules/<module>/schemas/
  entity.ts         # Zod schemas for Entity, CreateEntityInput, UpdateEntityInput, ListResponse
  entity-form.ts    # Zod schemas for form state (string fields for inputs)
  list-response.ts  # Zod schema for paginated list response
```

### 3.2 Schema Pattern

```ts
// modules/<module>/schemas/entity.ts
import { z } from 'zod'

// --- Enums / Status types ---
export const entityStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
export type EntityStatus = z.infer<typeof entityStatusSchema>

// --- List Item (minimal for tables) ---
export const entityListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: entityStatusSchema,
  // ... other list fields
})
export type EntityListItem = z.infer<typeof entityListItemSchema>

// --- Detail (full object) ---
export const entityDetailSchema = entityListItemSchema.extend({
  description: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  // ... other detail fields
})
export type EntityDetail = z.infer<typeof entityDetailSchema>

// --- Create Input ---
export const createEntitySchema = z.object({
  name: z.string().min(2).max(120),
  // ... other create fields
})
export type CreateEntityInput = z.infer<typeof createEntitySchema>

// --- Update Input (partial) ---
export const updateEntitySchema = createEntitySchema.partial()
export type UpdateEntityInput = z.infer<typeof updateEntitySchema>

// --- Paginated List Response ---
export const entityListResponseSchema = z.object({
  items: z.array(entityListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})
export type EntityListResponse = z.infer<typeof entityListResponseSchema>
```

### 3.3 Form Schemas (Separate File)

```ts
// modules/<module>/schemas/entity-form.ts
import { z } from 'zod'
import { createEntitySchema } from './entity'

// Form state uses strings for all inputs (controlled components)
// Maps to CreateEntityInput on submit
export const entityFormSchema = createEntitySchema.extend({
  // Override fields that need string representation in form
  budget: z.string().optional(),        // number in API, string in form
  date: z.string().optional(),          // Date in API, string in form
  assignedEmploymentId: z.string().optional(), // number in API, string in form
}).transform((data) => ({
  ...data,
  budget: data.budget ? Number(data.budget) : undefined,
  assignedEmploymentId: data.assignedEmploymentId ? Number(data.assignedEmploymentId) : undefined,
}))
export type EntityForm = z.infer<typeof entityFormSchema>

// Empty form factory
export const emptyEntityForm = (): EntityForm => ({
  name: '',
  // ... all fields as empty strings
})
```

### 3.4 Types Re-Export

```ts
// modules/<module>/types.ts
/** Re-export all types from schemas — single source of truth */
export type {
  EntityStatus,
  EntityListItem,
  EntityDetail,
  CreateEntityInput,
  UpdateEntityInput,
  EntityListResponse,
} from './schemas/entity'

export type {
  EntityForm,
} from './schemas/entity-form'

// Module-specific enums/types not in schemas
export type { ModuleSpecificType } from './schemas/module-specific'
```

**Rules**:
- **All domain types defined in Zod schemas** — no manual TypeScript interfaces for API entities
- `types.ts` only re-exports from `schemas/`
- Form state types in separate `*-form.ts` schema file
- UI-only types (e.g., `TableColumn`) stay in component file

---

## 4. API Function Pattern (Server-Side Pagination & Filtering)

```ts
// modules/<module>/api/entity.ts
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb } from '@/shared/mock/db'
import type { EntityListItem, EntityListResponse, CreateEntityInput, UpdateEntityInput } from '../schemas/entity'

export interface EntityListParams {
  search?: string
  status?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  // Module-specific filters
  [key: string]: unknown
}

export async function listEntities(params: EntityListParams = {}): Promise<EntityListResponse> {
  const { page = 1, pageSize = 20, ...filters } = params

  if (!env.useMockApi) {
    const { data } = await apiClient.get<EntityListResponse>('/api/entities', {
      params: { page, pageSize, ...filters },
    })
    return data
  }

  await delay(200)
  const db = getDb()
  let items = [...db.entities] as EntityListItem[]

  // Apply filters (mock-side)
  if (filters.search) {
    const q = String(filters.search).toLowerCase()
    items = items.filter((e) => e.name.toLowerCase().includes(q))
  }
  if (filters.status) {
    items = items.filter((e) => e.status === filters.status)
  }

  // Apply pagination (mock-side)
  const total = items.length
  const start = (page - 1) * pageSize
  const paginatedItems = items.slice(start, start + pageSize)

  return { items: paginatedItems, total, page, pageSize }
}

export async function getEntity(id: number): Promise<EntityDetail | null> { /* ... */ }
export async function createEntity(input: CreateEntityInput): Promise<EntityDetail> { /* ... */ }
export async function updateEntity(id: number, patch: UpdateEntityInput): Promise<EntityDetail> { /* ... */ }
export async function deleteEntity(id: number): Promise<void> { /* ... */ }
```

**Rules**:
- **Server-side pagination & filtering** — API accepts `page`, `pageSize`, `sortBy`, `sortOrder`, and filter params
- Mock mode replicates server behavior (filter → paginate)
- Real mode passes params to backend
- List hooks call API with current page/filters — **no client-side filtering of full dataset**

---

## 5. Hook Pattern (Server-Side Pagination)

### 5.1 List Hook

```ts
// modules/<module>/hooks/use-entity-list.ts
import { useQuery } from '@tanstack/react-query'
import { useListControls } from '@/shared/hooks/useListControls'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { queryKeys } from '@/shared/lib/query-keys'
import { listEntities } from '../api/entity'
import type { EntityListItem, EntityListParams } from '../schemas/entity'

const FILTER_DEFAULTS = { status: '' }

export function useEntityList() {
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
    pageSize: 20,
  })

  const params: EntityListParams = {
    search: controls.search || undefined,
    status: controls.filters.status || undefined,
    page: controls.page,
    pageSize: controls.pageSize,
    sortBy: controls.sortBy,
    sortOrder: controls.sortOrder,
  }

  const query = useQuery({
    queryKey: queryKeys.module.entities.list(params),
    queryFn: () => listEntities(params),
    placeholderData: (prev) => prev, // Smooth pagination transitions
  })

  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0

  const selection = useListSelection<EntityListItem>({
    items,
    getId: (e) => String(e.id),
  })

  return {
    items,
    total,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    search: controls.search,
    setSearch: controls.setSearch,
    statusFilter: controls.filters.status,
    setStatusFilter: (v: string) => controls.setFilter('status', v),
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    setPageSize: controls.setPageSize,
    sortBy: controls.sortBy,
    setSortBy: controls.setSortBy,
    sortOrder: controls.sortOrder,
    setSortOrder: controls.setSortOrder,
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    selectionMode: selection.selectionMode,
    selectedIds: selection.selectedIds,
    selectedCount: selection.selectedCount,
    allFilteredSelected: selection.allFilteredSelected,
    toggleOne: selection.toggleOne,
    toggleSelectAllFiltered: selection.toggleSelectAllFiltered,
    exitSelectionMode: selection.exitSelectionMode,
    onRowPressStart: selection.onRowPressStart,
    onRowPressEnd: selection.onRowPressEnd,
    onRowPressCancel: selection.onRowPressCancel,
  }
}
```

### 5.2 Detail Hook

```ts
// modules/<module>/hooks/use-entity-detail.ts
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { getEntity } from '../api/entity'
import type { EntityDetail } from '../schemas/entity'

export function useEntityDetail(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.module.entities.detail(id!),
    queryFn: () => getEntity(id!),
    enabled: id != null && !Number.isNaN(id),
  })
}
```

### 5.3 Create/Update Hooks (Optimistic Updates)

```ts
// modules/<module>/hooks/use-entity-mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import { createEntity, updateEntity, deleteEntity } from '../api/entity'
import type { CreateEntityInput, UpdateEntityInput, EntityDetail } from '../schemas/entity'

type EntityListCache = { items: EntityListItem[]; total: number; page: number; pageSize: number }

function upsertInLists(qc: ReturnType<typeof useQueryClient>, row: EntityDetail) {
  qc.setQueriesData<EntityListCache>({ queryKey: queryKeys.module.entities.all }, (old) => {
    if (!old?.items) return old
    const exists = old.items.some((e) => e.id === row.id)
    const items = exists
      ? old.items.map((e) => (e.id === row.id ? { ...e, ...row } : e))
      : [row, ...old.items]
    return { ...old, items, total: exists ? old.total : old.total + 1 }
  })
  qc.setQueryData(queryKeys.module.entities.detail(row.id), row)
}

export function useCreateEntity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createEntity,
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.module.entities.all })
      const previous = qc.getQueriesData<EntityListCache>({ queryKey: queryKeys.module.entities.all })

      const optimistic: EntityDetail = {
        id: -Date.now(),
        ...input,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as EntityDetail

      qc.setQueriesData<EntityListCache>({ queryKey: queryKeys.module.entities.all }, (old) => {
        if (!old) return { items: [optimistic], total: 1, page: 1, pageSize: 20 }
        return { ...old, items: [optimistic, ...old.items], total: old.total + 1 }
      })

      return { previous, optimisticId: optimistic.id }
    },
    onError: (_err, _input, ctx) => {
      ctx?.previous.forEach(([key, data]) => qc.setQueryData(key, data))
    },
    onSuccess: (created, _input, ctx) => {
      qc.setQueriesData<EntityListCache>({ queryKey: queryKeys.module.entities.all }, (old) => {
        if (!old) return { items: [created], total: 1, page: 1, pageSize: 20 }
        return {
          ...old,
          items: old.items.map((e) => (e.id === ctx?.optimisticId ? created : e)),
          total: old.total,
        }
      })
      qc.setQueryData(queryKeys.module.entities.detail(created.id), created)
    },
  })
}

export function useUpdateEntity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: UpdateEntityInput }) => updateEntity(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: queryKeys.module.entities.all })
      const previousLists = qc.getQueriesData<EntityListCache>({ queryKey: queryKeys.module.entities.all })
      const previousDetail = qc.getQueryData<EntityDetail>(queryKeys.module.entities.detail(id))

      qc.setQueriesData<EntityListCache>({ queryKey: queryKeys.module.entities.all }, (old) => {
        if (!old) return old
        return { ...old, items: old.items.map((e) => (e.id === id ? { ...e, ...patch } : e)) }
      })

      if (previousDetail) {
        qc.setQueryData(queryKeys.module.entities.detail(id), { ...previousDetail, ...patch, updatedAt: new Date().toISOString() })
      }

      return { previousLists, previousDetail, id }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previousLists.forEach(([key, data]) => qc.setQueryData(key, data))
      if (ctx?.previousDetail) qc.setQueryData(queryKeys.module.entities.detail(ctx.id), ctx.previousDetail)
    },
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.module.entities.detail(updated.id), updated)
      upsertInLists(qc, updated)
    },
  })
}

export function useDeleteEntity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteEntity,
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: queryKeys.module.entities.all })
      const previousLists = qc.getQueriesData<EntityListCache>({ queryKey: queryKeys.module.entities.all })
      const previousDetail = qc.getQueryData<EntityDetail>(queryKeys.module.entities.detail(id))

      qc.setQueriesData<EntityListCache>({ queryKey: queryKeys.module.entities.all }, (old) => {
        if (!old) return old
        return { ...old, items: old.items.filter((e) => e.id !== id), total: old.total - 1 }
      })
      qc.removeQueries({ queryKey: queryKeys.module.entities.detail(id) })

      return { previousLists, previousDetail, id }
    },
    onError: (_err, _id, ctx) => {
      ctx?.previousLists.forEach(([key, data]) => qc.setQueryData(key, data))
      if (ctx?.previousDetail) qc.setQueryData(queryKeys.module.entities.detail(ctx.id), ctx.previousDetail)
    },
    onSettled: () => {
      void invalidate.moduleEntities(qc)
    },
  })
}
```

---

## 6. Query Key Factory (Per Module)

```ts
// shared/lib/query-keys.ts (add per module)
export const queryKeys = {
  // ... existing modules
  moduleName: {
    entities: {
      all: ['moduleName', 'entities'] as const,
      list: (params?: Record<string, unknown>) => [...queryKeys.moduleName.entities.all, 'list', params ?? {}] as const,
      detail: (id: number) => [...queryKeys.moduleName.entities.all, 'detail', id] as const,
    },
    // ... other entities
  },
  // Invalidation helpers
  invalidate: {
    moduleEntities: (qc: { invalidateQueries: (opts: { queryKey: readonly unknown[] }) => unknown }) =>
      void qc.invalidateQueries({ queryKey: queryKeys.moduleName.entities.all }),
  },
} as const
```

---

## 7. Mock Data (Shared Location)

```
shared/mock/
  db.ts             # getDb(), delay(), nextId(), seedDb()
  seed.ts           # seedAll() — calls all module seed functions
  data/
    admin.ts        # Admin mock data (users, roles, settings, etc.)
    sales.ts        # Sales mock data (leads, clients, etc.)
    projects.ts     # Projects mock data (projects, tasks, teams, etc.)
```

**API Import Path**:
```ts
import { delay, getDb } from '@/shared/mock/db'
import { adminSeed } from '@/shared/mock/data/admin'
import { salesSeed } from '@/shared/mock/data/sales'
import { projectsSeed } from '@/shared/mock/data/projects'
```

**Rules**:
- Single shared mock DB (`shared/mock/db.ts`)
- Module seed data in `shared/mock/data/<module>.ts`
- No `data/mock.ts` inside module folders

---

## 8. Server State vs Local Form State

| Kind | Source | UI Pattern |
|------|--------|------------|
| **Server state** (DB) | Module API + TanStack Query | `useQuery` loads; `useMutation` saves; optimistic updates + invalidation |
| **Local form/UI state** | `useState` / `react-hook-form` | Edit drafts, modal open, search string, selection mode |

**Do not** keep company-policy values as page-only constants. Move to mock seed + API.

---

## 9. Shared Export

Same as before — `ExportButton` with `ResourceName`, `selectedIds`, `query`, `filters`, `filenameStem`.

---

## 10. Shared Back Button

Same as before — `<BackButton to={routes.list} label="Back" />` on create/detail/edit pages.

---

## 11. Routing Pattern

Same as before — lazy-loaded pages, `routeConstants` export, `$param` for dynamic segments.

---

## 12. Index File (Public Exports)

```ts
// modules/<module>/index.ts
export { ListPage } from './pages/ListPage'
export { DetailPage } from './pages/DetailPage'
export { CreatePage } from './pages/CreatePage'
export { EditPage } from './pages/EditPage'

export { createModuleRoutes, moduleRoutes } from './routes'

export * from './api/entity'
export { useEntityList } from './hooks/use-entity-list'
export { useEntityDetail } from './hooks/use-entity-detail'
export { useCreateEntity, useUpdateEntity, useDeleteEntity } from './hooks/use-entity-mutations'
```

---

## 13. Checklist to Port/Align a Module

1. [ ] Create `schemas/` folder with Zod schemas per entity (`entity.ts`, `entity-form.ts`, `list-response.ts`)
2. [ ] Move all mock data to `shared/mock/data/<module>.ts`
3. [ ] Update API imports to `@/shared/mock/db` and `@/shared/mock/data/<module>`
4. [ ] Update API functions for server-side pagination/filtering (`page`, `pageSize`, filters as params)
5. [ ] Update list hooks to pass pagination/filter params to API (no client-side filtering)
6. [ ] Update query keys to include params in list key
7. [ ] Add `invalidate.moduleEntities` helper to `query-keys.ts`
8. [ ] Create form schemas (`*-form.ts`) with string fields + transform
9. [ ] Update `types.ts` to re-export only from `schemas/`
10. [ ] Use `react-hook-form` + `zodResolver` in create/edit pages
11. [ ] Add `ErrorState` with `onBack` handler in list pages
12. [ ] Wire `ExportButton` with `selectedIds` for bulk export
13. [ ] Use `BackButton` on nested routes
14. [ ] Document endpoints in `<MODULE>_API_CATALOG.md`
15. [ ] All the pages should use safeNavigate for the navigation 
      ```safeNavigate(navigate,{})```

---

## 14. Template Prompt for New Module

> Create module `<module>` following `MODULE_STANDARDS.md`:
> - `schemas/` with Zod schemas (entity, form, list-response)
> - Mock data in `shared/mock/data/<module>.ts`
> - API functions with server-side pagination/filtering
> - Hooks with TanStack Query (optimistic updates, no client-side filtering)
> - Query keys with params in list key
> - `react-hook-form` + `zodResolver` in create/edit pages
> - Shared `ExportButton`, `BackButton`, `ErrorState` with back handler
> - Re-export types from `schemas/` in `types.ts`

---

## 15. Migration Plan for Existing Modules

### Admin Module
| Change | Files |
|--------|-------|
| Move mock data | `admin/data/mock.ts` → `shared/mock/data/admin.ts`, `admin/data/rbac-catalog.ts` → `shared/mock/data/admin-rbac.ts` |
| Create schemas | `admin/schemas/users.ts`, `admin/schemas/roles.ts`, `admin/schemas/leave.ts`, `admin/schemas/settings.ts`, `admin/schemas/offices.ts`, `admin/schemas/audit.ts` |
| Create form schemas | `admin/schemas/users-form.ts`, `admin/schemas/roles-form.ts`, etc. |
| Update API | `admin/api/*.ts` — server-side pagination, import from `@/shared/mock/data/admin` |
| Update hooks | `admin/hooks/use-users-list.ts` — pass params to API, remove client-side filter |
| Update query keys | Add params to `queryKeys.admin.users.list(params)` |
| Update types | `admin/types.ts` → re-export from `schemas/` |
| Update pages | Use `react-hook-form` + `zodResolver` |

### Sales Module
| Change | Files |
|--------|-------|
| Move mock data | `sales/data/mock.ts` → `shared/mock/data/sales.ts` |
| Create schemas | `sales/schemas/lead.ts`, `sales/schemas/client.ts`, `sales/schemas/case-study.ts`, `sales/schemas/activity.ts` |
| Create form schemas | `sales/schemas/lead-form.ts`, `sales/schemas/client-form.ts`, `sales/schemas/case-study-form.ts` |
| Update API | `sales/api/sales.ts` — server-side pagination, import from `@/shared/mock/data/sales` |
| Update hooks | `sales/hooks/use-leads-list.ts`, `use-clients-list.ts` — pass params to API |
| Update query keys | Add params to `queryKeys.sales.leads.list(params)` |
| Update types | `sales/types.ts` → re-export from `schemas/` |
| Update pages | `LeadCreatePage` already uses `LeadForm` — verify Zod schema matches |

### Projects Module
| Change | Files |
|--------|-------|
| Move mock data | Projects uses `shared/mock/db` — extract to `shared/mock/data/projects.ts` |
| Create schemas | `projects/schemas/project.ts` (exists), `projects/schemas/task.ts`, `projects/schemas/team.ts`, `projects/schemas/document.ts`, `projects/schemas/note.ts` |
| Create form schemas | `projects/schemas/project-form.ts`, `projects/schemas/task-form.ts`, `projects/schemas/team-form.ts` |
| Update API | `projects/api/projects.ts`, `tasks.ts`, `teams.ts`, `documents.ts` — server-side pagination |
| Update hooks | `projects/hooks/use-projects-list.ts`, `use-tasks-list.ts`, `use-teams.ts` — pass params |
| Update query keys | Add params to `queryKeys.projects.list(params)`, `queryKeys.tasks.list(params)` |
| Update types | `projects/types.ts` → re-export from `schemas/` |
| Update pages | `ProjectCreatePage` uses `react-hook-form` + Zod — verify form schema exists |

---

## 16. Key Files Reference

| File | Role |
|------|------|
| `config/env.ts` | Mock flag, API base URL |
| `shared/lib/axios.ts` | HTTP client with auth interceptors |
| `shared/mock/db.ts` | Shared mock DB (`getDb`, `delay`, `nextId`, `seedDb`) |
| `shared/mock/seed.ts` | `seedAll()` — orchestrates all module seeds |
| `shared/mock/data/admin.ts` | Admin seed data |
| `shared/mock/data/sales.ts` | Sales seed data |
| `shared/mock/data/projects.ts` | Projects seed data |
| `shared/lib/query-keys.ts` | Typed query key factories + invalidation helpers |
| `shared/hooks/useListControls.ts` | Pagination, search, sort, filter UI state |
| `shared/hooks/useListSelection.ts` | Bulk selection |
| `modules/<module>/schemas/` | Zod schemas (types source of truth) |
| `modules/<module>/api/` | API functions (server-side pagination) |
| `modules/<module>/hooks/` | TanStack Query hooks |
| `modules/<module>/pages/` | UI components |
| `modules/<module>/routes.tsx` | Route definitions + path helpers |
| `modules/<module>/index.ts` | Public exports |

---

*Last updated: 2026-08-25 — Server-side pagination, Zod schemas, shared mock, form schemas*