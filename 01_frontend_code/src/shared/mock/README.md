# Mock data (UI seed)

## Files

| File | Role |
|------|------|
| `mock-data.json` | Legacy UI seed (projects, teams, tasks, leads, clients, employees, departments, notifications, users). |
| `schema-seed.ts` | **Schema-aligned** tables: organization, locations, shifts, persons, employments, RBAC, salary, bank. |
| `db.ts` | Deep-clones JSON + schema seed into an **in-memory store**. |
| `data/admin.ts` | Admin UI seed re-export (roles, audit, leave, offices, settings). |
| `data/admin-rbac.ts` | RBAC permission catalogue seed. |
| `data/sales.ts` | Sales UI seed re-export (leads, clients, case studies, activities). |
| `data/projects.ts` | Project documents + notes seed re-export. |

## Module APIs

Each feature’s `api/*` file reads/writes via `getDb()` or module seed stores — **no inline arrays** in page components.

Data flow:

```
Page → hooks/query → api/* → getDb() / shared/mock/data/* (mock) → later HTTP
```

List endpoints accept `page` / `pageSize` (see `shared/lib/list-params.ts`) for server-side pagination in mock and real modes.

When backend is ready:

1. Point `api/*` methods at real HTTP endpoints.
2. Delete or stop importing `shared/mock/*`.

## Editing seed data

- UI list fixtures (admin/sales): edit `modules/*/data/mock-seed.ts` (re-exported via `shared/mock/data/*`).
- Schema-shaped rows (enums, FKs, versioning): edit `schema-seed.ts`.
- Projects/teams/tasks primary lists: edit `mock-data.json`.
- Restart the dev server after structural seed changes if the in-memory store was mutated.
