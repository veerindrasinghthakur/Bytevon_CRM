# 06_API_Integration_Patterns.md

# Bytevon Frontend — API Integration Patterns

**Project:** Bytevon ERP/CRM  
**Version:** 1.0  
**Status:** Draft  
**Last Updated:** 2026-08-07

---

## 1. Purpose

Defines how the frontend communicates with the backend services using TanStack Query + Zod.

---

## 2. Core Principles

- All server state is managed by **TanStack Query**.
- All request/response shapes are validated with **Zod**.
- No direct `fetch` calls inside components.
- API functions live inside each feature module (`modules/<module>/api/`).
- Shared API client and interceptors live in `shared/lib/`.

---

## 3. API Client

Location: `src/shared/lib/api-client.ts`

Responsibilities:
- Base URL configuration
- Attaching Authorization header (access token)
- Handling token refresh (on 401)
- Standard error normalization
- Request/response logging in development

Recommended: Axios instance or a thin fetch wrapper.

---

## 4. Module API Layer Structure

```
modules/sales/
├── api/
│   ├── leads.ts
│   ├── clients.ts
│   └── index.ts
├── schemas/
│   ├── lead.ts          # Zod schemas
│   └── client.ts
├── hooks/
│   ├── use-leads.ts     # TanStack Query hooks
│   └── use-clients.ts
└── ...
```

---

## 5. Recommended Patterns

### 5.1 Query (Read)

```ts
// hooks/use-leads.ts
export function useLeads(filters: LeadFilters) {
  return useQuery({
    queryKey: ['sales', 'leads', filters],
    queryFn: () => leadsApi.getList(filters),
    // optional: placeholderData, staleTime, etc.
  });
}
```

### 5.2 Mutation (Create / Update / Delete)

```ts
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leadsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'leads'] });
    },
  });
}
```

### 5.3 Zod Validation

- Validate **outgoing** payloads before sending.
- Validate **incoming** responses (especially list endpoints) to protect the UI from unexpected shapes.

```ts
const LeadResponseSchema = z.object({ ... });
const data = LeadResponseSchema.parse(await response.json());
```

---

## 6. Error Handling

- Centralized error normalizer in the API client.
- Map backend error codes / messages to user-friendly messages.
- Use TanStack Query’s `error` state + global error boundary / toast for feedback.
- 401 → trigger refresh or redirect to login/session-expired.
- 403 → redirect to access-denied or show restricted UI.

---

## 7. Query Key Conventions

Use hierarchical keys:

```ts
['sales', 'leads']
['sales', 'leads', leadId]
['sales', 'leads', { status: 'OPEN', page: 1 }]
['projects', 'teams', teamId, 'members']
```

This makes invalidation precise and predictable.

---

## 8. Authentication Flow (Frontend Side)

1. Login → receive access + refresh tokens.
2. Store tokens securely (httpOnly cookie preferred for refresh, memory + short-lived for access).
3. API client attaches access token.
4. On 401 → attempt silent refresh → retry original request.
5. If refresh fails → clear session and redirect to `/login` or `/session-expired`.

---

## 9. Related Documents

- `03_Frontend_Project_Structure.md`
- Backend Public API contracts (when available)
- Auth module decisions (already locked on backend side)
