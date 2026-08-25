# Module Standards & Patterns

This document defines the standardized architecture, patterns, and conventions derived from the `admin` module (`frontend_code/src/modules/admin`). Apply these when creating or refactoring other modules (sales, workforce, projects, payroll, etc.).

---

## 1. File Layout (Per Module)

```
modules/<module>/
  api/           # Pure async functions; branch on env.useMockApi
  data/          # Mock tables + catalogue seeds only
  hooks/         # useQuery / useMutation + local UI state
  pages/         # Presentation only (no direct API/mock imports)
  types.ts       # All domain types for this module
  index.ts       # Public exports
  routes.tsx     # Route definitions (if module has routing)
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
shared/hooks/useListControls.ts       # pagination, search, filters
shared/lib/lazyPage.tsx               # lazy route component loader
shared/lib/query-keys.ts              # typed query key factories
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

## 3. API Function Pattern

```ts
// modules/<module>/api/<entity>.ts
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb } from '@/shared/mock/db'
import type { Entity } from '../types'

export async function listEntities(params?: ListParams): Promise<ListResponse<Entity>> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<ListResponse<Entity>>('/api/path', { params })
    return data
  }

  await delay(200)
  const db = getDb()
  // Transform mock data to match Entity shape
  return { items: db.entities.map(e => ({ ...e })), total: db.entities.length }
}

export async function getEntity(id: string): Promise<Entity | null> { /* ... */ }
export async function createEntity(input: CreateInput): Promise<Entity> { /* ... */ }
export async function updateEntity(id: string, patch: Partial<Entity>): Promise<Entity> { /* ... */ }
export async function deleteEntity(id: string): Promise<void> { /* ... */ }
```

**Rules**:
- Branch **inside** the API function, never in the page.
- Mock path returns **copies** (`{ ...e }`) for reads; mutable mocks OK for settings patches in mock mode.
- Real path uses `apiClient` only (no raw `fetch` / second axios instance).
- Align paths with backend routers.

---

## 4. Server State vs Local Form State

| Kind | Source | UI Pattern |
|------|--------|------------|
| **Server state** (DB / company policy) | Module API + TanStack Query | `useQuery` loads; `useMutation` saves; invalidate on success |
| **Local form/UI state** | `useState` / form hook | Edit drafts, modal open, search string, selection mode |

**Do not** keep organisation profile, attendance policy numbers, leave accrual limits, or similar company-policy values as page-only hardcoded constants. Move them to `data/mock` + `api/*`.

**Do not** move static UI labels, validation constants, or purely presentational options into the API layer.

---

## 5. Hook Pattern

```ts
// modules/<module>/hooks/use-entity-list.ts
import { useQuery } from '@tanstack/react-query'
import { useListControls } from '@/shared/hooks/useListControls'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { queryKeys } from '@/shared/lib/query-keys'
import { listEntities } from '../api/entity'
import type { Entity } from '../types'

export function useEntityList() {
  const controls = useListControls({ filterDefaults: { status: 'All', ... } })

  const query = useQuery({
    queryKey: queryKeys.module.entities.list(),
    queryFn: () => listEntities(),
  })

  const items = query.data?.items ?? []
  const filtered = useMemo(() => applyFilters(items, controls), [items, controls])
  const pageItems = controls.pageItems(filtered)

  const selection = useListSelection<Entity>({
    items: pageItems,
    getId: (e) => String(e.id),
  })

  return {
    items,
    filtered,
    pageItems,
    totalCount: items.length,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    search: controls.search,
    setSearch: controls.setSearch,
    // ... filters, pagination, selection
  }
}
```

```ts
// modules/<module>/hooks/use-entity-form.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createEntity, updateEntity, getEntity } from '../api/entity'
import { listCatalog } from '../api/catalog' // for seeded catalogues

export function useEntityForm(mode: 'create' | 'edit', id?: string) {
  const queryClient = useQueryClient()

  const catalogQuery = useQuery({
    queryKey: ['module', 'catalog'],
    queryFn: listCatalog,
  })

  const detailQuery = useQuery({
    queryKey: ['module', 'entities', id],
    queryFn: () => getEntity(id as string),
    enabled: mode === 'edit' && Boolean(id),
  })

  const saveMutation = useMutation({
    mutationFn: async (input) => {
      return mode === 'create' ? createEntity(input) : updateEntity(id as string, input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module', 'entities'] })
    },
  })

  // Local form state (useState)
  return {
    catalog: catalogQuery.data,
    detail: detailQuery.data,
    isLoading: detailQuery.isLoading,
    submit: saveMutation.mutate,
    isSubmitting: saveMutation.isPending,
    // ... form fields
  }
}
```

**Rules**:
- Pages call hooks; render loading / empty / data. No direct mock imports for server data.
- Invalidate related query keys on mutations.
- Use `queryKeys` factory for consistent, typed query keys.

---

## 6. Seeded Catalogues (RBAC Example)

Backend seeds `resources` + `permissions` (Action enum: VIEW, CREATE, UPDATE, DELETE, APPROVE, **EXPORT**, UNLOCK).

Frontend:
| Concern | Location |
|---------|----------|
| Types | `<module>/types.ts` → `PermissionCatalog`, `RolePermissionAction` |
| Mock seed | `<module>/data/rbac-catalog.ts` → `permissionCatalogSeed` |
| Fetch | `<module>/api/roles.ts` → `listPermissionCatalog()` |
| Hook | `useRoleForm` → `useQuery(['module','rbac','permission-catalog'], …)` |
| UI | Form uses `form.modules` / `form.actions` only |

**Do not** keep `ROLE_MODULES` / `ROLE_ACTIONS` constants in pages or hooks for the matrix.

---

## 7. Settings / Company-Policy APIs

| Concern | API | Query Key |
|---------|-----|-----------|
| Organisation profile | `getOrganizationProfile` / `updateOrganizationProfile` | `['admin','settings','organization-profile']` |
| Attendance policy | `getAttendanceSettings` / `updateAttendanceSettings` | `['admin','settings','attendance']` |
| Leave accrual | `getLeaveAccrualPolicy` / `updateLeaveAccrualPolicy` | `['admin','settings','leave-accrual']` |

File: `<module>/api/settings.ts` + seeds in `<module>/data/mock.ts`.

---

## 8. Shared Export

### Flow
```
Page (filters + query + selectedIds from useListSelection)
  → ExportButton (Can EXPORT + resource)
  → ExportDialog (CSV | Excel | PDF)
  → useExport → exportAndDownload
  → shared/api/export.ts (mock file OR POST /export/:resource blob)
  → downloadFile(blob)
```

### Usage
```tsx
import { ExportButton } from '@/shared/components/export/ExportButton'
import { ResourceName } from '@/shared/schema'

<ExportButton
  resource={ResourceName.USER}
  selectedIds={selectionMode ? [...selectedIds] : undefined}
  query={search}
  filters={{ status: statusFilter }}
  filenameStem="users"
/>
```

### Rules
- Permission: `Action.EXPORT` on the same RBAC `resource` (via `<Can>` / `can()`).
- Prefer sending **params** (ids, filters, query, format) so backend regenerates from latest DB — do not POST the full rendered table unless contract requires it.
- Mock mode still downloads a file (CSV text; xlsx/pdf are placeholder MIME for UI testing).
- Real mode: `POST /export/{resource}` with `responseType: 'blob'`.
- Backend must enforce export authorization; UI gating is not enough.

---

## 9. Shared Back Button

Location: `shared/components/layout/BackButton.tsx`

```tsx
<BackButton to="/admin/users" label="Back" />
```

- Prefers `window.history.back()` when history exists.
- Falls back to `to`, then `/dashboard`.
- Do **not** invent per-page back helpers.
- Use on create / detail / edit shells only; list pages usually have no Back.

---

## 10. Routing Pattern

```tsx
// modules/<module>/routes.tsx
import { createRoute, redirect } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'

const ListPage = lazyPage(() => import('./pages/ListPage'), 'ListPage')
const DetailPage = lazyPage(() => import('./pages/DetailPage'), 'DetailPage')
const CreatePage = lazyPage(() => import('./pages/CreatePage'), 'CreatePage')
const EditPage = lazyPage(() => import('./pages/EditPage'), 'EditPage')

export function createModuleRoutes<TParent extends AnyRoute>(parentRoute: TParent) {
  return [
    createRoute({
      getParentRoute: () => parentRoute,
      path: '/module',
      beforeLoad: () => throw redirect({ to: '/module/list' }),
    }),
    createRoute({ getParentRoute: () => parentRoute, path: '/module/list', component: ListPage }),
    createRoute({ getParentRoute: () => parentRoute, path: '/module/new', component: CreatePage }),
    createRoute({ getParentRoute: () => parentRoute, path: '/module/$id', component: DetailPage }),
    createRoute({ getParentRoute: () => parentRoute, path: '/module/$id/edit', component: EditPage }),
  ]
}
```

**Rules**:
- Heavy pages lazy-loaded via `lazyPage` helper.
- Redirect root to list.
- Use `$param` for dynamic segments.

---

## 11. Types File

```ts
// modules/<module>/types.ts
export type EntityStatus = 'Active' | 'Inactive' | 'Archived'

export interface Entity {
  id: string | number
  name: string
  status: EntityStatus
  createdAt: string
  updatedAt: string
}

export interface CreateEntityInput {
  name: string
  // ...
}

export interface UpdateEntityInput extends Partial<CreateEntityInput> {}

export interface ListParams {
  search?: string
  status?: EntityStatus
  page?: number
  pageSize?: number
}

export interface ListResponse<T> {
  items: T[]
  total: number
}
```

**Rules**:
- All domain types in one `types.ts`.
- Export types used by API, hooks, and pages.
- Keep UI-only types (e.g., `TableColumn`) in the component file, not here.

---

## 12. Index File (Public Exports)

```ts
// modules/<module>/index.ts
export { ListPage } from './pages/ListPage'
export { DetailPage } from './pages/DetailPage'
export { CreatePage } from './pages/CreatePage'
export { EditPage } from './pages/EditPage'

export { createModuleRoutes } from './routes'

export * from './api/entity'
export { useEntityList } from './hooks/use-entity-list'
export { useEntityForm } from './hooks/use-entity-form'
```

**Rules**:
- Only export public API: pages, routes, hooks, API functions.
- Do not export internal utilities, mock data, or types (types are imported directly from `types.ts`).

---

## 13. Mock Data Structure

```ts
// modules/<module>/data/mock.ts
import type { Entity, EntitySettings } from '../types'

export const entities: Entity[] = [
  { id: '1', name: 'Item 1', status: 'Active', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  // ...
]

// Mutable mocks for settings (company policy)
export let entitySettingsMock: EntitySettings = {
  setting1: 'value',
  setting2: 10,
}
```

**Rules**:
- Read-only arrays for list data.
- Mutable `let` for settings/policy data that can be patched in mock mode.
- Import from `types.ts`, not from pages or hooks.

---

## 14. Checklist to Port a Module

1. [ ] Add `types.ts` for every entity the module surfaces.
2. [ ] Move hardcoded arrays / company-policy values from pages into `data/mock.ts`.
3. [ ] Create `api/*.ts` with `env.useMockApi` branch + real paths matching backend.
4. [ ] Create/update hooks with `useQuery` / `useMutation`.
5. [ ] Slim pages to UI + hooks only (no direct API/mock imports).
6. [ ] For any **seeded** matrix/catalogue: add catalog API + seed file; never hardcode in components.
7. [ ] Add `<ExportButton resource={…} selectedIds={…} query={…} filters={…} />` where export is needed; reuse bulk selection.
8. [ ] Use shared `BackButton` on nested routes.
9. [ ] Invalidate related query keys on mutations.
10. [ ] Document module-specific endpoints if paths differ.

---

## 15. Template Prompt for New Module

> Apply the Admin API pattern from `frontend_code/src/modules/admin/ADMIN_API_PATTERN.md` to the `<module>` module:
> - Extract hardcoded page data into `data/mock`
> - Add `api/*` with `env.useMockApi` branch
> - Create hooks with TanStack Query
> - Slim pages to UI + hooks only
> - For any seeded catalogues, fetch via API
> - Wire shared `ExportButton` where lists need export
> - Use shared `BackButton` on nested routes
> - Distinguish server state (Query) from local form state (useState)
> - Keep UI identical

---

## 16. Key Files Reference (from admin module)

| File | Role |
|------|------|
| `config/env.ts` | Mock flag |
| `shared/lib/axios.ts` | HTTP client |
| `shared/lib/download-file.ts` | Blob download |
| `shared/api/export.ts` | Export mock/real |
| `shared/hooks/useExport.ts` | Export mutation |
| `shared/components/export/*` | Export UI |
| `shared/components/layout/BackButton.tsx` | Shared back |
| `admin/types.ts` | Domain + settings + catalog types |
| `admin/data/mock.ts` | Users, roles, leave, offices, **settings seeds** |
| `admin/data/rbac-catalog.ts` | Permission matrix seed |
| `admin/api/leave.ts` | Leave settings / policies / ledger |
| `admin/api/settings.ts` | Org profile, attendance, leave accrual |
| `admin/api/roles.ts` | Roles + `listPermissionCatalog` |
| `admin/api/offices.ts` | Offices / head-office options |
| `admin/api/users.ts` | Users / create login |
| `admin/hooks/use-role-form.ts` | Role form + catalog query |
| `admin/hooks/use-user-create.ts` | User create flow |
| `admin/hooks/use-users-list.ts` | Users list with filters/pagination/selection |
| `admin/pages/*` | Wired to hooks/API |
| `admin/routes.tsx` | Route definitions |
| `admin/index.ts` | Public exports |

---

*Last updated: 2026-08-25 — Based on admin module analysis*

---

## 17. Typed Query Key Factory

The admin module defines `shared/lib/query-keys.ts` for strongly-typed keys. Using raw arrays (`['organization', 'holiday-calendars', id]`) works but loses autocomplete and type safety.

**Pattern**: Replace raw arrays with typed factory functions.

```ts
// shared/lib/query-keys.ts
export const queryKeys = {
  admin: {
    holidays: {
      all: () => ['admin', 'holidays'] as const,
      list: () => [...queryKeys.admin.holidays.all(), 'list'] as const,
      detail: (id: string) => [...queryKeys.admin.holidays.all(), 'detail', id] as const,
      calendars: {
        all: () => ['admin', 'holidays', 'calendars'] as const,
        list: () => [...queryKeys.admin.holidays.calendars.all(), 'list'] as const,
        detail: (id: string) => [...queryKeys.admin.holidays.calendars.all(), 'detail', id] as const,
      },
    },
  },
} as const
```

**Usage in hooks**:
```ts
const query = useQuery({
  queryKey: queryKeys.admin.holidays.detail(calendarId),
  queryFn: () => getHolidayCalendar(calendarId),
  enabled: Boolean(calendarId),
})
```

**Usage in invalidation**:
```ts
queryClient.invalidateQueries({ queryKey: queryKeys.admin.holidays.calendars.list() })
queryClient.invalidateQueries({ queryKey: queryKeys.admin.holidays.all() })
```

**Benefits**:
- Full TypeScript autocomplete
- Compile-time safety for key structure
- Single source of truth for key patterns
- Easy bulk invalidation via prefix matching

---

## 18. useParams Generic

Cast `useParams` with the route's param type for proper typing.

```tsx
// Instead of:
const { calendarId } = useParams<{ calendarId: string }>()

// Or better: use generated route types from TanStack Router
import type { Route } from '@/routes'
const { calendarId } = useParams({ strict: true }) // Infers from route definition
```

**Rule**: Always type route params. Avoid `as { calendarId: string }` casts.

---

## 19. safeNavigate vs BackButton

The codebase provides `BackButton` (prefers history.back, falls back to `to` prop) and `safeNavigate` (programmatic navigation with fallback).

**Standard**: Use `BackButton` for all user-facing back actions. Reserve `safeNavigate` for programmatic redirects (e.g., after mutation success, error fallbacks).

```tsx
// Good: User-facing back in ErrorState
<ErrorState
  onBack={<BackButton to="/admin/settings/holidays" label="Back to Calendars" />}
/>

// Good: Programmatic redirect after save
onSuccess: (saved) => {
  safeNavigate(navigate, { to: `/admin/settings/holidays/${saved.id}` })
}

// Avoid: safeNavigate for user back buttons
<Button onClick={() => safeNavigate(navigate, { to: '/admin/settings/holidays' })}>Back</Button>
```

**ErrorState Pattern**: Accept a `back` prop (ReactNode) instead of `onBack` callback for maximum flexibility.

```tsx
interface ErrorStateProps {
  back?: React.ReactNode // e.g., <BackButton to="..." />
}
```

---

## 20. Query Key Invalidation Consolidation

Avoid duplicate invalidation calls for related keys. Use the query key factory's `all()` or `list()` methods to invalidate entire hierarchies.

```tsx
// Instead of multiple calls:
queryClient.invalidateQueries({ queryKey: ['organization', 'holidays'] })
queryClient.invalidateQueries({ queryKey: ['organization', 'holidays', { calendarId: id }] })

// Do this:
queryClient.invalidateQueries({ queryKey: queryKeys.admin.holidays.calendars.list() })
// Or broader:
queryClient.invalidateQueries({ queryKey: queryKeys.admin.holidays.all() })
```

**Rule**: Each module's `queryKeys` should expose an `all()` method for broad invalidation and `list()`/`detail(id)` for specific invalidation.

---

## 21. Route Constants Export

Export route patterns from `routes.tsx` to avoid hard-coded strings in components.

```tsx
// modules/admin/routes.tsx
export const adminRoutes = {
  users: '/admin/users',
  userDetail: (id: string) => `/admin/users/${id}`,
  userCreate: '/admin/users/new',
  roles: '/admin/roles',
  roleDetail: (id: string) => `/admin/roles/${id}`,
  roleCreate: '/admin/roles/new',
  settings: '/admin/settings',
  holidays: '/admin/settings/holidays',
  holidayCalendar: (id: string) => `/admin/settings/holidays/${id}`,
  // ...
} as const
```

```tsx
// In components/pages
import { adminRoutes } from '../routes'

<BackButton to={adminRoutes.holidays} label="Back" />
navigate({ to: adminRoutes.holidayCalendar(saved.id) })
```

**Benefits**:
- Single source of truth for URL patterns
- Type-safe route generation
- Easy refactoring when routes change
- No string hunting across files

---

## 22. Form State Shape Types

Define form state types in `types.ts` for larger forms. Keeps component code clean and enables reuse.

```ts
// modules/<module>/types.ts
export interface HolidayForm {
  name: string
  date: string
  holiday_type: HolidayRow['holiday_type']
  recurring_flag: boolean
}

export interface HolidayRow {
  id: string
  name: string
  date: string
  holiday_type: 'FIXED' | 'RELATIVE' | 'LUNAR'
  recurring_flag: boolean
  calendar_id: string
}
```

```tsx
// In component
import type { HolidayForm } from '../types'

const [form, setForm] = useState<HolidayForm>({
  name: '',
  date: '',
  holiday_type: 'FIXED',
  recurring_flag: false,
})
```

**Rule**: For forms with >3 fields or reused across create/edit, extract to `types.ts`.

---

## 23. Accessibility — Label htmlFor Association

Always associate `<label>` with inputs via `htmlFor` + matching `id` for screen-reader support.

```tsx
// Good
<label htmlFor="holiday-name">Name</label>
<input id="holiday-name" name="name" value={form.name} onChange={handleChange} />

// Avoid: implicit association (wrapping) — less reliable for complex layouts
<label>Name <input name="name" ... /></label>
```

**Pattern for dynamic forms**:
```tsx
const fieldIds = useMemo(() => ({
  name: 'holiday-name',
  date: 'holiday-date',
  type: 'holiday-type',
  recurring: 'holiday-recurring',
}), [])

<label htmlFor={fieldIds.name}>Name</label>
<input id={fieldIds.name} ... />
```

---

## 24. Error Message Handling

Display save errors inline with consistent styling. Use a standard `ErrorState` component.

```tsx
// Pattern
const [saveError, setSaveError] = useState<string | null>(null)

const saveMutation = useMutation({
  mutationFn: saveHoliday,
  onError: (error: Error) => {
    setSaveError(error.message)
  },
  onSuccess: () => {
    setSaveError(null)
    // redirect
  },
})

// In JSX
{saveError && (
  <Alert variant="destructive" className="mb-4">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{saveError}</AlertDescription>
  </Alert>
)}
```

**Rules**:
- Clear error on new submit attempt (`onMutate` or form change)
- Use accessible alert role (`role="alert"` or `<Alert>` component)
- Keep error messages user-friendly (not raw API errors)

---

## 25. Testing Hooks Pattern

When copying pages to new modules, verify the corresponding hook follows the same pattern.

**Expected hook return shape**:
```ts
export function useEntity(id: string) {
  return useQuery({
    queryKey: queryKeys.module.entity.detail(id),
    queryFn: () => getEntity(id),
    enabled: Boolean(id),
  })
}

// Returns: { data, isLoading, isError, error, refetch, isFetching, isSuccess, ... }
```

**Checklist for new module hooks**:
- [ ] Uses `queryKeys` factory (not raw arrays)
- [ ] Has `enabled` flag for conditional fetches (e.g., `enabled: Boolean(id)`)
- [ ] Returns standard `useQuery`/`useMutation` object
- [ ] Error type is `Error` (not `unknown`)
- [ ] No side effects in queryFn (pure fetch)

**Unit test example**:
```ts
// hooks/__tests__/use-entity.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEntity } from '../use-entity'

test('fetches entity by id', async () => {
  const queryClient = new QueryClient()
  const { result } = renderHook(() => useEntity('123'), {
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  })

  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toEqual(expect.objectContaining({ id: '123' }))
})
```

---

*Last updated: 2026-08-25 — Extended with query keys, routing, forms, accessibility, errors, testing patterns*