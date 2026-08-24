# ByteVon Mock Backend (temporary)

Throwaway FastAPI service that serves **JSON-backed** read/write APIs for frontend flow testing.
No validation, no real auth, no DB. Delete this folder when real backend is wired.

## Run

```bash
cd mock_backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Open http://127.0.0.1:8001/docs

## Auth bypass

Every request is accepted. Optional header `X-Mock-User-Id` sets the "current user" (default `1`).
`Authorization: Bearer anything` is ignored (always OK).

## Data

- Seed JSON under `data/seed/` (loaded once if store empty)
- Runtime store under `data/store/` (mutated by POST/PATCH/DELETE)
- Reset store: `POST /mock/reset`

## Modules (v1)

- Auth: login, logout, me, refresh
- Admin users / roles / audit / settings / security / metrics
- RBAC permission catalogue

Grow module-by-module; keep routes thin and services = JSON read/write only.
