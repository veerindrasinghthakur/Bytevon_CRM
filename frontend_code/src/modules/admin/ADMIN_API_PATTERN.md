# Admin module — API architecture pattern (base for other modules)

**Scope:** `frontend_code/src/modules/admin` + shared export/back  
**Purpose:** Single reference so the same pattern can be applied to sales, workforce, projects, payroll, etc. without rediscovering conventions.

---

## 1. Goals

1. **Mock ↔ real switch** via one env flag (`VITE_USE_MOCK_API`).
2. **No hardcoded domain data in pages** — pages call hooks → API functions → mock or Axios.
3. **TanStack Query** for server state (lists, detail, catalogs, company settings).
4. **Seeded catalogues** (RBAC resources/actions, leave types, etc.) come from API/mock seed, never constants in UI components.
5. **Shared Axios client** with auth interceptors (real mode only).
6. **Shared Export** — one export button/dialog/API used by all modules.
7. **Shared BackButton** — one back control for create/detail/edit pages.

---

## 2. File layout (per module)

```
modules/<module>/
  api/           # pure async functions; branch on env.useMockApi
  data/          # mock tables + catalogue seeds only
  hooks/         # useQuery / useMutation + local UI state
  pages/         # presentation only
  types.ts       # all domain types for this module
  index.ts       # public exports
```

Shared:

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
```

---

## 3. Env

```ts
// config/env.ts
useMockApi: VITE_USE_MOCK_API !== 'false'  // default true
apiBaseUrl: VITE_API_BASE_URL ?? '/api/v1'
```

```env
# .env.example
VITE_USE_MOCK_API=true
VITE_API_BASE_URL=/api/v1
```

**Install deps after pull:** `npm install` (requires `axios` in `package.json`).

---

## 4. API function pattern

```ts
// modules/<module>/api/<entity>.ts
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { someMockRows } from '../data/mock'

export async function listX(): Promise<X[]> {
  if (env.useMockApi) {
    await delay(200)
    return someMockRows.map((r) => ({ ...r }))
  }
  const { data } = await apiClient.get<X[]>('/path')
  return data
}
```

Rules:

- Always branch **inside** the API function, never in the page.
- Mock path returns copies (no shared mutable refs) for reads; mutable mocks OK for settings patches in mock mode.
- Real path uses `apiClient` only (no raw `fetch` / second axios instance).
- Align paths with backend routers.

---

## 5. Server state vs local form state

| Kind | Source | UI pattern |
|------|--------|------------|
| **Server state** (DB / company policy) | Module API + TanStack Query | `useQuery` loads; `useMutation` saves; invalidate on success |
| **Local form/UI state** | `useState` / form hook | Edit drafts, modal open, search string, selection mode |

Do **not** keep organisation profile, attendance policy numbers, leave accrual limits, or similar company-policy values as page-only hardcoded constants. Move them to `data/mock` + `api/*`.

Do **not** move static UI labels, validation constants, or purely presentational options into the API layer.

---

## 6. Shared Export

### Flow

```text
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

Inside bulk bar:

```tsx
<BulkSelectionBar ...>
  <ExportButton
    resource={ResourceName.EMPLOYMENT}
    selectedIds={[...selectedIds]}
    query={search}
  />
</BulkSelectionBar>
```

### Rules

- Permission: `Action.EXPORT` on the same RBAC `resource` (via `<Can>` / `can()`).
- Prefer sending **params** (ids, filters, query, format) so the backend regenerates from latest DB — do not POST the full rendered table unless the contract requires it.
- Mock mode still downloads a file (CSV text; xlsx/pdf are placeholder MIME for UI testing).
- Real mode: `POST /export/{resource}` with `responseType: 'blob'`.
- Backend must enforce export authorization; UI gating is not enough.

### Formats

`csv` | `xlsx` | `pdf` — extend `ExportFormat` only when backend supports more.

---

## 7. Shared Back button

Location: `shared/components/layout/BackButton.tsx`

```tsx
<BackButton to="/admin/users" label="Back" />
```

- Prefers `window.history.back()` when history exists.
- Falls back to `to`, then `/dashboard`.
- Do **not** invent per-page back helpers.
- Use on create / detail / edit shells only; list pages usually have no Back.

---

## 8. Seeded catalogues (RBAC example)

Backend seeds `resources` + `permissions` (Action enum: VIEW, CREATE, UPDATE, DELETE, APPROVE, **EXPORT**).

Frontend:

| Concern | Location |
|--------|----------|
| Types | `admin/types.ts` → `PermissionCatalog`, `RolePermissionAction` |
| Mock seed | `admin/data/rbac-catalog.ts` → `permissionCatalogSeed` |
| Fetch | `admin/api/roles.ts` → `listPermissionCatalog()` |
| Hook | `useRoleForm` → `useQuery(['admin','rbac','permission-catalog'], …)` |
| UI | `RoleFormPage` uses `form.modules` / `form.actions` only |

**Do not** keep `ROLE_MODULES` / `ROLE_ACTIONS` constants in pages or hooks for the matrix.

---

## 9. Settings / company-policy APIs (admin)

| Concern | API | Query key |
|---------|-----|-----------|
| Organisation profile | `getOrganizationProfile` / `updateOrganizationProfile` | `['admin','settings','organization-profile']` |
| Attendance policy | `getAttendanceSettings` / `updateAttendanceSettings` | `['admin','settings','attendance']` |
| Leave accrual | `getLeaveAccrualPolicy` / `updateLeaveAccrualPolicy` | `['admin','settings','leave-accrual']` |
| Leave types (list) | `listLeaveTypeSettings` | `['admin','leave','types']` |
| Head office options | `listHeadOfficeOptions` | `['admin','offices','head-options']` |

File: `admin/api/settings.ts` + seeds in `admin/data/mock.ts`.

Real endpoints (backend still to implement):

```http
GET/PATCH /admin/settings/organization-profile
GET/PATCH /admin/settings/attendance
GET/PATCH /admin/settings/leave-accrual
POST      /export/{resource}   # body: selectedIds, filters, query, sort, format
```

---

## 10. Hook pattern

```ts
export function useXList() {
  return useQuery({
    queryKey: ['<module>', 'x', filters],
    queryFn: () => listX(filters),
  })
}

export function useXForm(mode, id?) {
  const detail = useQuery({ … enabled: mode === 'edit' })
  const catalog = useQuery({ queryKey: ['…','catalog'], queryFn: listCatalog })
  const save = useMutation({ mutationFn: …, onSuccess: invalidate })
  // local useState for form fields
  return { …fields, submit, isLoading }
}
```

Pages: call the hook; render loading / empty / data. No direct mock imports for server data.

---

## 11. Axios client rules

- One `apiClient` in `shared/lib/axios.ts`.
- Request interceptor: attach `Authorization: Bearer <accessToken>` from stored session.
- Response interceptor: `401` → clear session → `/session-expired`.
- Type interceptors: `(response: AxiosResponse) => response`, `(error: AxiosError) => …`.
- Export real path uses `responseType: 'blob'` on the same client.

---

## 12. Checklist to port a module

1. Add `types.ts` (or extend) for every entity the module surfaces.
2. Move hardcoded arrays / company-policy values from pages into `data/mock.ts`.
3. Create `api/*.ts` with `env.useMockApi` branch + real paths matching backend.
4. Create/update hooks with `useQuery` / `useMutation`.
5. Slim pages to UI + hooks only.
6. For any **seeded** matrix/catalogue: add catalog API + seed file; never hardcode in components.
7. Add `<ExportButton resource={…} selectedIds={…} query={…} filters={…} />` where export is needed; reuse bulk selection.
8. Use shared `BackButton` on nested routes.
9. Invalidate related query keys on mutations.
10. Document module-specific endpoints if paths differ.

---

## 13. Admin files touched by this pattern

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
| `admin/pages/*` | Wired to hooks/API |

---

## 14. Apply to next module (template prompt)

> Apply the Admin API pattern from `frontend_code/src/modules/admin/ADMIN_API_PATTERN.md` to the `<module>` module: extract hardcoded page data into `data/mock`, add `api/*` with `env.useMockApi`, hooks with TanStack Query, slim pages. Keep UI identical. For any seeded catalogues, fetch via API. Wire shared `ExportButton` where lists need export; use shared `BackButton` on nested routes. Distinguish server state (Query) from local form state (useState).

---

*Last updated: 2026-08-21 — export architecture, BackButton, organisation/attendance/leave settings APIs.*
