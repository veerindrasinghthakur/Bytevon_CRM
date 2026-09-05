# ByteVon CRM — Backend (`backend_code`)

FastAPI application under `app/`.

## Run

```bash
cd backend_code
cp .env.example .env
pip install -r requirements.txt
alembic upgrade head
python -m scripts.seed_bootstrap
uvicorn app.main:app --reload --port 8000
```

API base: `/api/v1` — see `API_REFERENCE.md` and `API_ENDPOINTS.json`.

## Frontend alignment (status)

| Area | Status |
|------|--------|
| Module coverage (auth, org, employment, rbac, sales, projects, leave, attendance, payroll, approvals, notifications, audit, notes) | Aligned in structure |
| Action enum | Backend lacks `UNLOCK` (frontend has it) |
| Effective permissions JSON | Backend returns **flat list**; frontend expects **nested tree** + `scope` / `scopeByResource` |
| Domain route `require_permission` | Not systematically applied on BE yet |
| Resource naming | Seed/catalog should match FE `ResourceName` snake_case |

Use mock FE (`env.useMockApi`) until effective-permissions response is mapped or BE returns the FE shape.
