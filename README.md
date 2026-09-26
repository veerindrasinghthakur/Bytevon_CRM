# ByteVon — ERP/CRM Application (`bytevon_documentation`)

> ⚠️ **Development snapshot — not final production code.** This repository is a
> working development copy and **contains known bugs**. Those bugs are fixed in
> the production version. Do not deploy this copy to production or treat it as
> a release candidate — use it for local development, review, and testing only.

ByteVon is an **all-in-one enterprise ERP/CRM platform** for managing the full
employee-and-customer lifecycle in one place: people, attendance, leave,
approvals, sales pipeline, projects, payroll, notifications, and organization
masters — with role-based access control on every operation.

This directory (`bytevon_documentation`) is the **application monorepo root**:

- `01_frontend_code/` — React + Vite + Tailwind single-page application
- `02_backend_code/` — FastAPI + SQLAlchemy (async) + Alembic API backend
- `Docs/` — product, architecture, database, testing and UI documentation

## What the application does

### Workforce & attendance
- Employee records, departments, positions, shifts, assignments and employment
  lifecycle states
- Daily attendance with check-in/out punches, break tracking, working-hours log,
  manual attendance entries and correction requests with approval flow
- Attendance dashboard, roster, monthly summaries, holiday calendars, working weeks

### Leave management
- Leave balances, apply/cancel leave, approval workflow, leave history and
  team calendars

### Approval engine
- Central approval center: attendance corrections, leave requests, payroll and
  other request types with pending/approved/rejected states and audit trail

### Sales / CRM
- Leads pipeline (stages, priorities, assignment), client management, sources,
  activities, case studies and sales analytics

### Projects & teams
- Projects, teams and membership, tasks with time entries, notes, documents
  and links

### Payroll
- Salary structures, monthly payroll calculation and runs, review/approve/reject,
  payslips and payroll history

### Administration & governance
- Users and credentials, roles & permissions (RBAC), organization settings,
  locations, audit logs, security center

### Self-service (My Work)
- Personal dashboard: my attendance, leave, tasks, requests, approvals,
  notifications, profile, bank details

### Notifications
- In-app notification center, templates, compose/broadcast, email delivery,
  attachments (object storage), preferences and settings

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, TanStack Router/Query/Table, Redux Toolkit, React Hook Form + Zod, Axios, Vitest + Playwright |
| Backend  | Python 3.12, FastAPI, SQLAlchemy 2 (async) + asyncpg, Alembic, Pydantic v2, python-jose (JWT), Passlib/bcrypt, MinIO SDK, pytest |
| Data     | PostgreSQL 17 |
| Storage  | MinIO (S3-compatible object storage) |
| Runtime  | Docker + Docker Compose; Nginx (frontend web server / API reverse proxy) |

## Architecture & request flow

```
Browser (React SPA)
  → Nginx (:3000) — static files; /api/* → backend
  → FastAPI (:8000, /api/v1) — route → RBAC scope check → service → repository → PostgreSQL
  → cross-cutting: JWT auth, approval decision bus (leave/attendance handlers),
    audit trail, notifications (in-app + SMTP), MinIO attachments
```

- Backend layers per module: `routes.py` (HTTP + permission scope) →
  `service.py` (business rules, owns the transaction) → `repository.py`
  (queries only, never commits) → SQLAlchemy models → PostgreSQL.
- Auth: JWT access + refresh tokens; every request carries `Authorization:
  Bearer`, `X-Login-Id`, `X-Employment-Id`; scopes
  `SELF < TEAM < DEPARTMENT < LOCATION < ORGANIZATION`, Super Admin bypass.
- Frontend calls the API through one shared Axios client with single-flight
  token refresh; `VITE_USE_MOCK_API=true` runs fully offline on seed data.
- Interactive system map: `Docs/architecture/bytevon-architecture.html`;
  workflow call-graphs: `Docs/workflow-visualizations/`.

## Repository structure

```
bytevon_documentation/
├── docker-compose.yml          # local production-style stack
├── .env.example                # copy to .env (never commit .env)
├── README.md                   # this file
├── 01_frontend_code/
│   ├── Dockerfile              # Node build → Nginx runtime (SPA try_files)
│   ├── nginx.conf              # static + /api/*, /health, /docs proxy
│   └── src/
│       ├── app/                # router, layouts (AppShell), providers
│       ├── modules/            # admin, approvals, auth, dashboard, my-work,
│       │                       # notifications, payroll, projects, sales, workforce
│       ├── shared/             # design system, components, hooks, lib (incl. cn())
│       ├── config/env.ts       # VITE_USE_MOCK_API / VITE_API_BASE_URL
│       └── styles/tokens.css   # design tokens (single source of truth)
├── 02_backend_code/
│   ├── Dockerfile              # Python 3.12-slim + curl healthcheck
│   ├── docker-entrypoint.sh    # wait PG → migrate → seeds → buckets → uvicorn
│   ├── app/
│   │   ├── main.py             # app.main:app, CORS, middleware, /health
│   │   ├── api/router.py       # /api/v1 mount, 14 module routers
│   │   ├── core/               # config, authZ, JWT, DB session, BaseService/Repo,
│   │   │                       # storage (MinIO), email, middleware
│   │   └── modules/            # admin, approvals, attendance, audit, auth,
│   │                           # dashboard, leave, my_work, notifications,
│   │                           # payroll, project, rbac, sales, workforce
│   ├── alembic/                # migrations (22 to head at time of writing)
│   └── scripts/                # seed_bootstrap, seed_test_data, payroll dev seed
└── Docs/
    ├── architecture/           # Archify source + interactive system diagram
    ├── workflow-visualizations/# per-workflow call-graphs + explorer
    ├── db_docs/                # database documentation
    ├── frontend/               # frontend architecture docs (15 files)
    ├── testing/                # test documentation
    └── UI_Screens/             # design screens
```

## Quick start (Docker — recommended)

Prerequisites: Docker Engine + Docker Compose v2.

```bash
git clone <repository>
cd <repository>/bytevon_documentation
copy .env.example .env
docker compose up --build
```

(`copy` on Windows PowerShell; `cp .env.example .env` on macOS/Linux.)

First boot automatically: waits for PostgreSQL → `alembic upgrade head` →
`seed_bootstrap` (system employment, super-admin, org masters) →
`seed_test_data` (demo data; needs bootstrap first) → ensures MinIO buckets
(`audit-archives`, `notification-attachments`, `avatars`) → starts FastAPI
with its lifespan handlers (lead-column patch, leave + attendance approval
handlers).

Default seed credentials are **development/demo credentials only**:

- Email `admin@example.com` · Password `ChangeMeAdmin!123`
- Sample staff password (all): `Password123!`
- Change/replace them before any shared or production use.

## Services

| Service  | Role                              | Container          |
|----------|-----------------------------------|--------------------|
| frontend | React SPA via Nginx               | `bytevon-frontend` |
| backend  | FastAPI (`app.main:app`)          | `bytevon-backend`  |
| postgres | PostgreSQL 17 (separate service)  | `bytevon-postgres` |
| minio    | Object storage (S3 API + console) | `bytevon-minio`    |

All services share one dedicated bridge network (`bytevon`) and talk to each
other by service name (`postgres`, `minio`, `backend`) — never `localhost`.

## URLs

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MinIO Console: http://localhost:9001

Host ports are configurable in `.env` (`FRONTEND_PORT`, `BACKEND_PORT`,
`POSTGRES_PORT`, `MINIO_API_PORT`, `MINIO_CONSOLE_PORT`).

## Configuration

Copy `.env.example` to `.env` and edit values there. Never commit `.env`.
`.env.example` contains development placeholders only — in particular, replace
`JWT_SECRET_KEY` (≥ 32 chars) and the database/MinIO passwords. Key settings:

- `DATABASE_URL` — must use the `postgres` service hostname inside Docker:
  `postgresql+asyncpg://bytevon:…@postgres:5432/bytevon`
- `CORS_ORIGINS` — comma-separated; must include the Docker frontend origin
  (`http://localhost:3000`)
- `VITE_USE_MOCK_API=false`, `VITE_API_BASE_URL=/api/v1` — browser calls
  `/api/v1`, Nginx routes it to `backend:8000/api/v1`
- `MINIO_ENDPOINT=minio:9000` — backend → MinIO over the Docker network

## Useful commands

```bash
docker compose up --build
docker compose up -d
docker compose down
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
docker compose ps
```

## Reset database / object storage

```bash
docker compose down -v
```

> ⚠️ **Warning:** `down -v` **deletes** the named volumes
> (`bytevon_postgres_data`, `bytevon_minio_data`) — all persistent
> PostgreSQL and MinIO data is lost.

## Local (non-Docker) development

Backend (Python 3.12, from `02_backend_code/`):

```bash
cp .env.example .env
pip install -r requirements.txt
alembic upgrade head
python -m scripts.seed_bootstrap
python -m scripts.seed_test_data
uvicorn app.main:app --reload --port 8000
```

Frontend (Node 22, from `01_frontend_code/`):

```bash
npm ci
npm run dev        # mock API by default (VITE_USE_MOCK_API)
npm run build      # typecheck + production bundle
npm test           # vitest unit/integration
npx playwright test  # e2e (needs browsers: npx playwright install)
```

## Testing

- Backend: `pytest` in `02_backend_code` (requires `DATABASE_URL` pointing at
  a `bytevon_test` database; per-test truncate isolation).
- Frontend: `npm test` (Vitest), `npx playwright test` (Chromium e2e).
- Live API script: `scripts/test-live-api.ps1` in the frontend folder.

## Troubleshooting

| Symptom | Likely cause / fix |
|---------|-------------------|
| Backend container restart-loops | Inspect `docker logs bytevon-backend`; usually DB not healthy yet or a seed import error — entrypoint retries PG for ~2 min |
| `alembic upgrade head` fails on fresh DB | Ensure `DATABASE_URL` uses the `postgres` hostname, not `localhost` |
| Login `422` from curl/PowerShell | PowerShell mangles `-d` quoting — write the JSON body to a file and use `--data @file` |
| `/docs` 404 | `APP_ENV=production` disables docs; use `development` for local work |
| Frontend shows mock data | `VITE_USE_MOCK_API` baked at build time — rebuild with `false` |
| Port already in use | Change `*_PORT` values in `.env` |

## Documentation index

- System architecture diagram: `Docs/architecture/bytevon-architecture.html`
- Workflow call-graphs: `Docs/workflow-visualizations/workflow-explorer.html`
- Database docs: `Docs/db_docs/`
- Frontend architecture docs: `Docs/frontend/`
- UI screens: `Docs/UI_Screens/`
- Backend API reference: `02_backend_code/API_REFERENCE.md`
