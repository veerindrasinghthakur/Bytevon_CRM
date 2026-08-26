# ByteVon Mock Backend (TEMPORARY)

JSON-file FastAPI server for **frontend flow testing only**. No schema validation, no real security.

**Delete this folder** when the real `backend_code` is wired to the UI.

## Layout (module-aligned)

```
mock_backend/
  data/modules/     # seed builders per frontend module
    admin.py
    organization.py
    my_work.py
  routes/           # HTTP handlers per module
    auth.py
    admin.py
    organization.py
    dashboard.py
    my_work.py
    health.py
  seed.py           # merges module seeds → data/store.json
  store.py
  main.py
```

Do **not** mix another module’s collections into a different seed/route file.

## Quick start

```bash
cd mock_backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python seed.py
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

```env
VITE_API_BASE_URL=http://localhost:8001/api/v1
VITE_USE_MOCK_API=false
```

## Main routes

| Module | Paths |
|--------|--------|
| Auth | `POST /api/v1/auth/login`, `/refresh`, `/logout`, `/me` |
| Admin | users, roles, RBAC, audit, leave-accrual, attendance settings, offices |
| Organization | locations, shifts, holidays, departments, org profile |
| Dashboard | `/dashboard/executive`, `/admin/metrics/*` |
| My Work | `/my-work/overview`, leave, attendance, tasks, approvals, bank |
| Debug | `POST /api/v1/admin/_reset` re-seeds store |

Routes are also mounted **without** `/api/v1` prefix.

## Reset data

```bash
python seed.py
# or POST /api/v1/admin/_reset
```
