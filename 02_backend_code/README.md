# ByteVon CRM — Backend (`02_backend_code`)

**Single package root.** Run and import from this folder — not from a nested `backend_code/` subfolder.

## Layout (correct)

```
02_backend_code/
  app/
    main.py
    api/router.py
    core/          # config, db, security, base services
    modules/       # auth, org, employment, rbac, sales, ...
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

## If you still see `02_backend_code/backend_code/`

That nested folder is a **duplicate** from an earlier extract. Flatten locally:

```bash
cd 02_backend_code
# keep one full tree at this level
rm -rf app   # only if incomplete shell; or merge carefully
shopt -s dotglob   # bash
mv backend_code/* .
rm -rf backend_code
```

Target end state: **one** `app/` with all modules under `app/modules/`.

Default seed: `admin@bytevon.local` / `ChangeMeAdmin!123`
