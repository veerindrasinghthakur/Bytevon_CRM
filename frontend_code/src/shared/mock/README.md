# Mock data (UI seed)

## Files

| File | Role |
|------|------|
| `mock-data.json` | **Single source of truth** for seed rows (projects, teams, tasks, leads, clients, employees, departments, notifications, users). |
| `db.ts` | Deep-clones the JSON into an **in-memory store**. Create/update APIs mutate this store only. |

## Module APIs

Each feature’s `api/*` file reads/writes via `getDb()` — **no inline arrays** in those files.

When backend is ready:

1. Point `api/*` methods at real HTTP endpoints.
2. Delete or stop importing `shared/mock/*`.

## Editing seed data

Edit `mock-data.json` only. Restart the dev server if the store was already mutated in the browser session (in-memory changes are lost on full reload; reload re-seeds from JSON).
