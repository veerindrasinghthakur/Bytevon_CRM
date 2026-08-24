# ByteVon Mock Backend (TEMPORARY)

JSON-file FastAPI server for **frontend flow testing only**. No schema validation, no real security.

**Delete this folder** when the real `backend_code` is wired to the UI.

## What it does

- Serves large seeded mock data (users, roles, audit, departments, settings, …)
- **Auth bypass**: any `Authorization: Bearer …` (or none) is accepted
- Login always succeeds for demo credentials; empty body also returns admin session
- Full **read/write** on admin entities: users, roles, permissions assign, audit append, settings, offices
- Persists mutations to `data/store.json`

## Quick start

```bash
cd mock_backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python seed.py              # writes data/store.json
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

- Docs: http://localhost:8001/docs  
- Health: http://localhost:8001/health  

### Demo logins

| Email | Password |
|-------|----------|
| `admin@bytevon.local` | `ChangeMeAdmin!123` |
| `hr@bytevon.local` | `HrDemo!123` |

## Frontend wiring

Point env to this server and turn **off** client-side mocks:

```env
VITE_API_BASE_URL=http://localhost:8001/api/v1
VITE_USE_MOCK_API=false
```

(Exact env keys depend on `frontend_code/src/config/env`.)

## Main routes

| Area | Paths |
|------|--------|
| Auth | `POST /api/v1/auth/login`, `/refresh`, `/logout`, `/me`, sessions |
| Users | `GET/POST /api/v1/admin/users`, `PATCH/DELETE …/{id}`, lock/unlock |
| Roles | `GET/POST /api/v1/rbac/roles`, `PATCH/DELETE …/{id}`, permissions |
| RBAC | `/rbac/resources`, `/permissions`, employment role assign |
| Audit | `GET/POST /api/v1/audit/logs`, `POST /admin/audit/events` |
| Settings | `/organization/settings`, `/admin/settings/attendance`, leave-accrual |
| Offices | `/admin/offices`, `/organization/departments` |
| Debug | `POST /api/v1/admin/_reset` re-seeds store |

Routes are also mounted **without** `/api/v1` prefix.

## Grow later

Add modules under `routes/` (sales, leave, …) and extend `seed.py` collections the same way. Keep it dumb JSON.

## Reset data

```bash
python seed.py
# or POST /api/v1/admin/_reset
```
