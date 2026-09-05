# ByteVon CRM — Backend (`02_backend_code`)

**One package root.** All of `app/`, `alembic/`, `scripts/` live directly under `02_backend_code/`.

## Correct layout

```
02_backend_code/
  app/
    main.py
    api/
    core/           # enums, config, security, base services
    modules/        # authentication, organization, employment, rbac,
                    # sales, developer, leave, attendance, payroll,
                    # approvals, notifications, audit, notes_documents
  alembic/
  scripts/
  requirements.txt
  .env.example
```

## If you still see two trees (`app/` + `backend_code/`)

That is a **duplicate extract**. Nested `backend_code/` is the full tree; top-level `app/` may be incomplete.

From **repo root**:

```bash
bash 02_backend_code/scripts/flatten_package.sh
```

Or manually:

```bash
cd 02_backend_code
rm -rf app    # only if incomplete (no app/core)
shopt -s dotglob
mv backend_code/* .
rm -rf backend_code
```

## Run

```bash
cd 02_backend_code
cp .env.example .env
pip install -r requirements.txt
alembic upgrade head
python -m scripts.seed_bootstrap
uvicorn app.main:app --reload --port 8000
```

API: `/api/v1` — seed admin `admin@bytevon.local` / `ChangeMeAdmin!123`
