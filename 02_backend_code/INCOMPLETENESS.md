# ByteVon CRM Backend — Implementation Status

Tracks what is **already implemented** in `backend_code/` vs deferred work.

**Deferred / future requirements:** see [`BACKEND_REQUIREMENTS.md`](./BACKEND_REQUIREMENTS.md).

---

## 1. Schema vs locked architecture

| Item | Status | Notes |
|------|--------|-------|
| `logins.failed_attempt_count` + `locked_until` | **Implemented in models** | Update schema markdown when convenient (listed in BACKEND_REQUIREMENTS). |
| `logins.is_active` | **Implemented** | Account disable. |
| `password_reset_tokens` | **Implemented** | Auth V1. |
| Actor / system employment id | Documented | `SYSTEM_EMPLOYMENT_ID`; no `actor_type`. |
| Super-admin protection (≥1 always) | **Partial** | Seed only; full enforcement → BACKEND_REQUIREMENTS. |
| AuditPublicService wiring | **Wired** | `BasePublicService._audit()` / `_notify()` post-commit. |
| JWT current-user dependency | **Implemented** | `get_current_login`, `get_current_employment_id`. |

---

## 2. Modules status

All planned modules under `app/modules/`:

1. Core / Foundation ✅  
2. Organization ✅  
3. Authentication ✅  
4. Employment ✅  
5. RBAC ✅  
6. Approvals ✅  
7. Leave ✅  
8. Attendance ✅  
9. Notifications ✅  
10. Sales ✅  
11. Developer / Projects ✅  
12. Notes & Documents ✅  
13. Audit ✅  
14. Payroll ✅  

---

## 3. Leftovers pass (done)

- [x] Alembic layout (`alembic.ini`, `env.py`, `script.py.mako`, `versions/`)
- [x] `app.core.models_registry`
- [x] JWT dependencies
- [x] `BasePublicService._audit_event`
- [x] `scripts/seed_bootstrap.py`
- [x] Shared `_audit` / `_notify` (module stubs removed)
- [x] `API_REFERENCE.md` + `API_ENDPOINTS.json`

Open items (export, settings routes, email, MinIO, tests, etc.) live only in **BACKEND_REQUIREMENTS.md**.

---

## 4. Local run checklist

```bash
cd backend_code
cp .env.example .env   # DATABASE_URL + JWT_SECRET_KEY
pip install -r requirements.txt
alembic revision --autogenerate -m "initial_schema"
alembic upgrade head
python -m scripts.seed_bootstrap
uvicorn app.main:app --reload --port 8000
```

Default seed (change immediately):

- Email: `admin@bytevon.local`
- Password: `ChangeMeAdmin!123`
