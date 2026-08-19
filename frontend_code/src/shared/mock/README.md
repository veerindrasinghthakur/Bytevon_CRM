# Mock data (UI seed)

## Files

| File | Role |
|------|------|
| `mock-data.json` | Legacy UI seed (projects, teams, tasks, leads, clients, employees, departments, notifications, users). |
| `schema-seed.ts` | **Schema-aligned** tables: organization, locations, shifts, persons, employments, RBAC, salary, bank. |
| `db.ts` | Deep-clones JSON + schema seed into an **in-memory store**. |

## Module APIs

Each feature’s `api/*` file reads/writes via `getDb()` — **no inline arrays** in page components.

Data flow:

```
Page → hooks/query → api/* → getDb() (mock) → later HTTP
```

Pages receive data via **props** from container/page loaders; never import seed arrays directly.

When backend is ready:

1. Point `api/*` methods at real HTTP endpoints.
2. Delete or stop importing `shared/mock/*`.

## Editing seed data

- UI list fixtures: edit `mock-data.json`.
- Schema-shaped rows (enums, FKs, versioning): edit `schema-seed.ts`.
- Restart the dev server after structural seed changes if the in-memory store was mutated.
