# ByteVon CRM — Backend (`02_backend_code`)

**Single package root.** Run from this folder.

```
02_backend_code/
  app/
    main.py
    api/
    core/
    modules/   # authentication, organization, employment, rbac, sales,
               # developer, leave, attendance, payroll, approvals,
               # notifications, audit, notes_documents
  alembic/
  scripts/
  requirements.txt
  .env.example
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

API base: `/api/v1`

Default seed: `admin@bytevon.local` / `ChangeMeAdmin!123`

If a nested `backend_code/` folder remains, run:
`bash scripts/flatten_package.sh`
