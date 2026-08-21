# Admin module — API architecture pattern (base for other modules)

**Scope:** `frontend_code/src/modules/admin`  
**Purpose:** Single reference so the same pattern can be applied to sales, workforce, projects, payroll, etc. without rediscovering conventions.

---

## 1. Goals

1. **Mock ↔ real switch** via one env flag (`VITE_USE_MOCK_API`).
2. **No hardcoded domain data in pages** — pages call hooks → API functions → mock or Axios.
3. **TanStack Query** for server state (lists, detail, catalogs).
4. **Seeded catalogues** (RBAC resources/actions, leave types, etc.) come from API/mock seed, never constants in UI components.
5. **Shared Axios client** with auth interceptors (real mode only).

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
config/env.ts              # useMockApi, apiBaseUrl
shared/lib/axios.ts        # apiClient + interceptors
shared/lib/query-client.ts # QueryClient defaults
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
- Mock path returns copies (no shared mutable refs).
- Real path uses `apiClient` only (no raw `fetch` / second axios instance).
- Align paths with backend routers (`/rbac/resources`, `/admin/leave/...`, etc.).

---

## 5. Seeded catalogues (RBAC example)

Backend seeds `resources` + `permissions` (Action enum: VIEW, CREATE, UPDATE, DELETE, APPROVE, EXPORT).

Frontend:

| Concern | Location |
|--------|----------|
| Types | `admin/types.ts` → `PermissionCatalog`, `RolePermissionAction` |
| Mock seed | `admin/data/rbac-catalog.ts` → `permissionCatalogSeed` |
| Fetch | `admin/api/roles.ts` → `listPermissionCatalog()` |
| Hook | `useRoleForm` → `useQuery(['admin','rbac','permission-catalog'], …)` |
| UI | `RoleFormPage` uses `form.modules` / `form.actions` only |

**Do not** keep `ROLE_MODULES` / `ROLE_ACTIONS` constants in pages or hooks for the matrix.

Real mode:

```http
GET /rbac/resources
GET /rbac/permissions
```

Compose into `{ modules, actions, resources, permissions }`.

---

## 6. Hook pattern

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

Pages: call the hook; render loading / empty / data. No direct mock imports.

---

## 7. Axios client rules

- One `apiClient` in `shared/lib/axios.ts`.
- Request interceptor: attach `Authorization: Bearer <accessToken>` from stored session.
- Response interceptor: `401` → clear session → `/session-expired`.
- Type interceptors: `(response: AxiosResponse) => response`, `(error: AxiosError) => …` (avoids implicit `any`).

---

## 8. Checklist to port a module

1. Add `types.ts` (or extend) for every entity the module surfaces.
2. Move hardcoded arrays from pages into `data/mock.ts` (or `data/<entity>Mock.ts`).
3. Create `api/*.ts` with `env.useMockApi` branch + real paths matching backend.
4. Create/update hooks with `useQuery` / `useMutation`.
5. Slim pages to UI + hooks only.
6. For any **seeded** matrix/catalogue (RBAC, leave types, scopes): add catalog API + seed file; never hardcode in components.
7. Invalidate related query keys on mutations.
8. Document module-specific endpoints in this file or a sibling `API_NOTES.md` if paths differ.

---

## 9. Admin files touched by this pattern

| File | Role |
|------|------|
| `config/env.ts` | Mock flag |
| `shared/lib/axios.ts` | HTTP client |
| `admin/types.ts` | Domain + catalog types |
| `admin/data/mock.ts` | Users, roles, leave, offices, … |
| `admin/data/rbac-catalog.ts` | Permission matrix seed |
| `admin/api/leave.ts` | Leave settings / policies / ledger |
| `admin/api/roles.ts` | Roles + `listPermissionCatalog` |
| `admin/api/offices.ts` | Offices / head-office options |
| `admin/api/users.ts` | Users / create login |
| `admin/hooks/use-role-form.ts` | Role form + catalog query |
| `admin/hooks/use-user-create.ts` | User create flow |
| `admin/pages/*` | Wired to hooks/API |

---

## 10. Apply to next module (template prompt)

> Apply the Admin API pattern from `frontend_code/src/modules/admin/ADMIN_API_PATTERN.md` to the `<module>` module: extract hardcoded page data into `data/mock`, add `api/*` with `env.useMockApi`, hooks with TanStack Query, slim pages. Keep UI identical. For any seeded catalogues, fetch via API (mock seed in real mode = same shape as backend).

---

*Last updated: 2026-08-21 — admin leave/roles/offices/users + RBAC catalog from seed.*
