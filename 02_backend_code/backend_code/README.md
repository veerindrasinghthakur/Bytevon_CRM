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

## Frontend alignment (RBAC)

| Item | Status |
|------|--------|
| `Action.UNLOCK` | Supported |
| Resource seed names | Match FE `ResourceName` (snake_case) via `seed_rbac_catalog` |
| `GET /rbac/employments/{id}/effective-permissions` | Returns nested `permissions`, `scope`, `scopeByResource`, `isSuperAdmin`, `employmentId` (aliases) + flat `grants` |
| Super Admin | Full tree @ ORGANIZATION when role name is Super Admin |
| Domain `require_permission` on every route | Still progressive — use effective endpoint + FE gates first |

Default seed admin: `admin@bytevon.local` / `ChangeMeAdmin!123`
