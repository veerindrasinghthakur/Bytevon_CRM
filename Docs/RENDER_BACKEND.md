# Manual Deployment Guide: ByteVon CRM Backend on Render

This guide provides the complete, production-ready procedure for manually deploying the **ByteVon CRM** backend to a **Render Web Service** connected to a **Neon PostgreSQL** database, with the frontend hosted on **Cloudflare Pages**.

---

## 1. Architecture & Design Decisions

- **Backend**: Render Web Service running the Docker image built from `02_backend_code`.
- **Database**: Serverless PostgreSQL on [Neon](https://neon.tech), accessed via `asyncpg` with SSL required (`sslmode=require`).
- **Frontend**: Single-Page Application deployed on Cloudflare Pages, interacting with the backend API via HTTPS.
- **Repository**: Single monorepo retained (`01_frontend_code/`, `02_backend_code/`, `Docs/`).
- **Object Storage**: Deferred for this prototype (`STORAGE_ENABLED=false`). MinIO is optional and disabled on Render.
- **Render Free Tier Compatibility**: Does not rely on paid Render features such as dashboard SSH shells, pre-deploy commands, or one-off background worker jobs.

---

## 2. Render Web Service Configuration

When creating the Web Service in the [Render Dashboard](https://dashboard.render.com):

| Setting | Value | Notes |
|---|---|---|
| **Service Type** | **Web Service** | Free or standard instance |
| **Language / Environment** | **Docker** | Uses repository Dockerfile |
| **Repository** | `https://github.com/veerindrasinghthakur/Bytevon_CRM` | Connect your GitHub repository |
| **Branch** | `main` | Or your designated release branch |
| **Root Directory** | `02_backend_code` | **Required**: Points Render to backend folder |
| **Dockerfile Path** | `Dockerfile` | Relative to Root Directory (`02_backend_code/Dockerfile`) |
| **Docker Build Context** | `.` | Relative to Root Directory |
| **Docker Command** | *(Leave Blank)* | Image default `ENTRYPOINT ["/app/docker-entrypoint.sh"]` is used |
| **Health Check Path** | `/health` | Verified 200 OK without DB dependency |
| **Auto-Deploy** | `Yes` (or Manual) | Recommended `Yes` for continuous deployment |

---

## 3. Environment Variables Reference

Configure these environment variables in the Render Dashboard (**Environment** tab of your Web Service).

> [!IMPORTANT]
> Never commit actual credentials or secrets into Git. Use Render's environment variable UI to store them securely.

| Variable Name | Required | Example / Recommended Value | Description |
|---|---|---|---|
| `APP_ENV` | **Yes** | `production` | Sets application mode. Hides `/docs` and `/redoc` in production. |
| `APP_NAME` | No | `ByteVon CRM` | Application display name returned in health check. |
| `DEBUG` | No | `false` | Disable debug mode in production. |
| `DATABASE_URL` | **Yes** | `postgresql+asyncpg://<user>:<password>@<endpoint>.neon.tech/<dbname>?sslmode=require` | Async connection string for Neon PostgreSQL. |
| `DB_POOL_SIZE` | No | `3` | Connection pool size. Keep $\le 5$ for Neon Free Tier (25 max connections). |
| `DB_MAX_OVERFLOW` | No | `5` | Maximum overflow connections allowed above `DB_POOL_SIZE`. |
| `DATABASE_ECHO` | No | `false` | Set `false` in production to prevent logging SQL statements. |
| `JWT_SECRET_KEY` | **Yes** | *(Generate 32+ random characters)* | Secret used to sign authentication JWT tokens. |
| `JWT_ALGORITHM` | No | `HS256` | JWT signing algorithm. |
| `JWT_ACCESS_TTL_MINUTES` | No | `30` | Access token lifespan in minutes. |
| `JWT_REFRESH_TTL_DAYS` | No | `30` | Refresh token lifespan in days. |
| `STARTUP_MODE` | **Yes** | `app` *(steady state)* or `init_and_app` *(first start)* | Governs container entrypoint execution. See Section 5. |
| `PORT` | Auto | *(Injected by Render, e.g., `10000`)* | Render automatically sets this. Application binds to `0.0.0.0:${PORT}`. |
| `CORS_ORIGINS` | **Yes** | `https://<your-project>.pages.dev,https://bytevon.example.com` | Comma-separated list of allowed frontend origins (Cloudflare Pages). |
| `STORAGE_ENABLED` | **Yes** | `false` | Disables MinIO/S3 calls for this prototype. |
| `EMAIL_ENABLED` | No | `false` | Disables SMTP sending when set to `false`. |
| `FRONTEND_URL` | No | `https://<your-project>.pages.dev` | Frontend base URL used for password-reset emails. |
| `ADMIN_EMAIL` | No | `admin@yourdomain.com` | Custom super-admin email during initialization (defaults to `admin@example.com`). |
| `ADMIN_PASSWORD` | No | *(Strong password)* | Custom super-admin password during initialization (defaults to `ChangeMeAdmin!123`). |

### Generating a Secure `JWT_SECRET_KEY`
Run the following in your terminal to generate a cryptographically strong secret:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 4. Neon PostgreSQL Connection Requirements

### Connection String Format
SQLAlchemy async engines require the `postgresql+asyncpg://` dialect:
```text
postgresql+asyncpg://<username>:<password>@<ep-xyz>.neon.tech/<dbname>?sslmode=require
```

### Key Connection Requirements
1. **SSL Required**: Neon requires SSL encrypted connections. Always append `?sslmode=require` to the connection string.
2. **Dialect Prefix**: Neon's dashboard displays connection strings starting with `postgresql://` or `postgres://`. You **must** replace that prefix with `postgresql+asyncpg://`.
3. **Connection Pooling**:
   - Neon Free Tier limits simultaneous connections to 25.
   - Configure `DB_POOL_SIZE=3` and `DB_MAX_OVERFLOW=5`.
   - `pool_pre_ping=True` is enabled in `app/core/database.py`, preventing errors when Neon wakes up from idle scale-to-zero.
4. **Alembic Compatibility**:
   - `alembic/env.py` reads `settings.DATABASE_URL` directly and creates an `async_engine_from_config` using `NullPool`.
   - You do **not** need a separate database URL for migrations; the same connection string works for both the API and Alembic.

---

## 5. Database Initialization & Seeding Procedure

Render Free Web Services **do not support SSH access, dashboard shells, pre-deploy scripts, or one-off cron jobs**. 

To initialize a new Neon database (running Alembic migrations, bootstrap seed, and demo data), choose one of the two supported free-tier-compatible procedures below:

> [!NOTE]
> Previously suggested fragmented commands (`STARTUP_MODE=init python -m scripts.seed_bootstrap` and `STARTUP_MODE=init python -m scripts.seed_test_data`) bypassed Alembic migrations and container initialization. Do not use those. Instead, use either **Approach A** (local one-shot image or Python runner) or **Approach B** (`STARTUP_MODE=init_and_app`), which execute the complete migration + bootstrap + test seed sequence and report errors clearly.

### Approach A (Recommended): Local One-Shot Execution

Execute the initialization from your local machine connected securely to the remote Neon database.

#### Option 1: Using the Backend Docker Image
1. **Build the container image locally**:
   ```bash
   cd 02_backend_code
   docker build -t bytevon-backend .
   ```

2. **Run the one-shot initialization command**:
   ```bash
   docker run --rm \
     -e DATABASE_URL="postgresql+asyncpg://<username>:<password>@<endpoint>.neon.tech/<dbname>?sslmode=require" \
     -e STARTUP_MODE=init \
     -e ADMIN_EMAIL="admin@yourdomain.com" \
     -e ADMIN_PASSWORD="<YourSecurePassword123!>" \
     bytevon-backend
   ```

3. **What happens during `STARTUP_MODE=init`**:
   - **`wait_for_postgres`**: Verifies connectivity to the remote Neon PostgreSQL instance.
   - **`run_migrations`**: Executes `alembic upgrade head`, creating all schema tables and indexes.
   - **`run_seeds`**:
     - `python -m scripts.seed_bootstrap`: Seeds the super administrator account, system employment, permissions, and core organization masters.
     - `python -m scripts.seed_test_data`: Seeds demo departments, positions, shifts, holidays, leave policies, employees, clients, sales leads, projects, and tasks.
   - **Exits cleanly with status code `0`** without starting the HTTP server.

#### Option 2: Using Local Python (Without Docker)
If you have Python 3.12+ and dependencies installed locally:
```bash
cd 02_backend_code
# Ensure DATABASE_URL is set in your shell or .env
export DATABASE_URL="postgresql+asyncpg://<username>:<password>@<endpoint>.neon.tech/<dbname>?sslmode=require"
python -m scripts.init_db
```
The unified runner `scripts.init_db`:
1. Executes `alembic upgrade head` programmatically.
2. Runs `scripts.seed_bootstrap.seed()`.
3. Runs `scripts.seed_test_data.seed()`.
4. Exits with code `0` on success or code `1` with a trace if any step fails.

4. **Deploy the Web Service on Render**:
   - Once initialized, create/deploy your Render Web Service with `STARTUP_MODE=app`.
   - In `app` mode, the container verifies database connectivity and immediately launches the Uvicorn web server.

---

### Approach B: Controlled First-Start Deployment Mode on Render

If local Docker or Python is not available, you can initialize the database directly through the Render Web Service during its initial deployment:

1. **Configure Environment Variables in Render**:
   - Set all variables as documented in Section 3.
   - Set `STARTUP_MODE=init_and_app`.
   - (Optional) Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` to configure your custom administrator.

2. **Deploy the Service**:
   - Render triggers a build and starts the container.
   - The container recognizes `init_and_app` and performs:
     1. Database connectivity check.
     2. `alembic upgrade head` (applies all migrations).
     3. Bootstrap seeding (`scripts.seed_bootstrap`).
     4. Demo data seeding (`scripts.seed_test_data`).
     5. Starts Uvicorn server on `0.0.0.0:${PORT}`.
   - Monitor the deploy logs in Render to verify that all seeds report completion and the Uvicorn server starts.

3. **Switch to Steady-State Mode**:
   - Once the service is live and healthy, go to the Render Dashboard **Environment** tab.
   - Change `STARTUP_MODE` to `app`.
   - Save changes.
   - **Why this step is essential**: Changing `STARTUP_MODE=app` ensures that future automatic redeployments or routine container restarts start up instantly without re-running seed checks.

---

## 6. Production Administrator & Seed Idempotency

### How to Configure a Production Administrator
You can configure a production super-administrator without touching source files:

1. **Set Environment Variables**:
   - `ADMIN_EMAIL`: Set to your desired admin email (e.g. `admin@company.com`). Defaults to `admin@example.com` if unset.
   - `ADMIN_PASSWORD`: Set to your secure password. Defaults to `ChangeMeAdmin!123` if unset.
2. **Safe Credential Handling**:
   - When `ADMIN_PASSWORD` is provided via environment variables, the seed script masks it in logs: `Admin login: <email> / [SET FROM ENVIRONMENT]`. Passwords are never written to logs or output.
3. **Password Preservation**:
   - `scripts/seed_bootstrap.py` checks whether the admin user already exists. If the account is present, it **skips password generation**.
   - An operator who changes their password in production (or who seeded it previously) will **never** have their password overwritten by subsequent seed runs, deployments, or container restarts.

### Default Demo Credentials (When env vars are omitted)
- **Super Admin**: `admin@example.com` / `ChangeMeAdmin!123`
- **Demo Staff**:
  - `asha.patel@example.com` / `Password123!`
  - `rohan.singh@example.com` / `Password123!`
  - `alice.chen@bytevon.com` / `Password123!`
  - `frank.okafor@bytevon.com` (Tech Lead / PM) / `Password123!`

### Security & Data Safety Guarantees
- **Repeatable & Safe**: All entities in `scripts/seed_bootstrap.py` and `scripts/seed_test_data.py` use unique lookups (`get_or_create`). Running the seeder multiple times will not create duplicate records.
- **No Data Deletion**: Seed scripts never execute `DELETE`, `DROP`, or `TRUNCATE`. Existing recruiter-created, sales-created, or employee-created records are completely untouched.
- **Pure Synthetic Data**: All seeded demo records (names, email addresses, phone numbers) use synthetic dummy data (`@example.com` and `@bytevon.com`).
- **Authorization Agreement**: Role and permission mappings created by the seeders align strictly with the RBAC schema (`Employee`, `HR Manager`, `Project Manager`, `Sales Executive`, `Finance Manager`, `Super Admin`).

---

## 7. Storage-Disabled (`STORAGE_ENABLED=false`) Operating Mode

Because object storage is deferred for this prototype, `STORAGE_ENABLED` is set to `false`:

| Capability | Behavior When `STORAGE_ENABLED=false` |
|---|---|
| **Startup & Health** | Backend starts cleanly. MinIO initialization is skipped. `/health` responds with `200 OK`. |
| **Profile Avatars** | `POST /api/v1/profile/avatar` returns `400 Bad Request` with message: `"Object storage is disabled on this server. Avatar uploads are unavailable."` |
| **Notification Attachments** | `POST /api/v1/notifications/attachments` returns `400 Bad Request` with message: `"Object storage is disabled on this server. File attachments are unavailable."` |
| **Audit Log Archiving** | `POST /api/v1/admin/audit/archive` skips upload and returns message: `"Object storage is disabled or unavailable; no records deleted"`. **Database records are preserved** (no data loss). |
| **Presigned URLs** | Avatar URL helper returns `null` instead of raising an uncaught exception. |

---

## 8. Frontend Deployment on Cloudflare Pages

The frontend is a Vite + React Single-Page Application deployed directly to **Cloudflare Pages**.

### Cloudflare Pages Project Configuration

In the [Cloudflare Dashboard](https://dash.cloudflare.com) $\rightarrow$ **Workers & Pages** $\rightarrow$ **Create Application** $\rightarrow$ **Pages** $\rightarrow$ **Connect to Git**:

| Setting | Value | Notes |
|---|---|---|
| **Project Name** | `bytevon-crm` *(or your choice)* | Determines your `*.pages.dev` URL |
| **Production Branch** | `main` | Continuous deployment branch |
| **Framework Preset** | `Vite` | Or `None` |
| **Root Directory** | `01_frontend_code` | **Required**: Points Cloudflare to frontend folder |
| **Build Command** | `npm run build` | Runs `tsc -b && vite build` |
| **Build Output Directory** | `dist` | Generated static bundle directory |

### Required Environment Variables (Cloudflare Pages)

Set these under **Settings** $\rightarrow$ **Environment Variables** (Production):

| Variable Name | Required | Value | Description |
|---|---|---|---|
| `VITE_USE_MOCK_API` | **Yes** | `false` | Disables mock DB; routes all calls through `apiClient`. |
| `VITE_API_BASE_URL` | **Yes** | `https://<your-render-url>/api/v1` | Points to your deployed Render Web Service. |

> [!IMPORTANT]
> All `VITE_*` variables are embedded into client-side JS bundles at build time. Never place secrets, database credentials, or private JWT keys in Cloudflare Pages environment variables.

### Client-Side SPA Routing (`_redirects`)
To support direct URL navigation and browser refreshes on routes like `/dashboard`, `/employees`, and `/settings`, a `_redirects` file is located at `01_frontend_code/public/_redirects`:
```text
/*    /index.html   200
```
Vite automatically places this file in `dist/` upon build, instructing Cloudflare Pages to serve `index.html` for all client-side routes with HTTP 200.

---

## 9. Step-by-Step Manual Deployment Walkthrough

### Step 1: Provision Neon PostgreSQL & Test Connectivity
1. Sign in to [Neon Console](https://console.neon.tech).
2. Create a new project (e.g. `bytevon-db`).
3. Under **Connection Details**, copy your connection string. Convert prefix to `postgresql+asyncpg://` and ensure `?sslmode=require` is present:
   ```text
   postgresql+asyncpg://<user>:<password>@<ep-xyz>.neon.tech/<dbname>?sslmode=require
   ```
4. (Optional) Run the non-destructive connectivity diagnostic locally:
   ```bash
   cd 02_backend_code
   export DATABASE_URL="postgresql+asyncpg://<user>:<password>@<ep-xyz>.neon.tech/<dbname>?sslmode=require"
   python -m scripts.test_db_connection
   ```
   This confirms DNS, TLS handshake, credentials, and asyncpg/SQLAlchemy compatibility without printing passwords.

### Step 2: Initialize Database Schema and Seeds
Choose **Approach A** (local one-shot image or Python runner) or **Approach B** (`STARTUP_MODE=init_and_app` on Render) as described in Section 5.

- If using local Docker:
  ```bash
  cd 02_backend_code
  docker build -t bytevon-backend .
  docker run --rm \
    -e DATABASE_URL="postgresql+asyncpg://<user>:<password>@<ep-xyz>.neon.tech/<dbname>?sslmode=require" \
    -e STARTUP_MODE=init \
    -e ADMIN_EMAIL="admin@yourdomain.com" \
    -e ADMIN_PASSWORD="<YourSecurePassword123!>" \
    bytevon-backend
  ```

### Step 3: Deploy Backend on Render
1. Log in to [Render Dashboard](https://dashboard.render.com) $\rightarrow$ **New +** $\rightarrow$ **Web Service**.
2. Connect `https://github.com/veerindrasinghthakur/Bytevon_CRM`.
3. Configure:
   - **Root Directory**: `02_backend_code`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `Dockerfile`
4. Set Environment Variables as listed in Section 3 (including `STARTUP_MODE=app`, `DATABASE_URL`, `JWT_SECRET_KEY`, and temporary placeholder for `CORS_ORIGINS`).
5. Click **Create Web Service**.
6. Note the assigned URL: `https://<render-service-name>.onrender.com`.

### Step 4: Verify Backend Health
1. In your browser or terminal:
   ```bash
   curl -i https://<render-service-name>.onrender.com/health
   ```
   Expected response: `HTTP/1.1 200 OK` with `{"status":"ok","app":"ByteVon CRM API"}`.
2. Verify authentication endpoint:
   ```bash
   curl -X POST https://<render-service-name>.onrender.com/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"ChangeMeAdmin!123"}'
   ```
   Expected response: JWT tokens object with `access_token` and `refresh_token`.

### Step 5: Deploy Frontend on Cloudflare Pages
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) $\rightarrow$ **Workers & Pages** $\rightarrow$ **Create Application** $\rightarrow$ **Pages** $\rightarrow$ **Connect to Git**.
2. Select `Bytevon_CRM` repository.
3. Configure:
   - **Root Directory**: `01_frontend_code`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
4. Add Environment Variables:
   - `VITE_USE_MOCK_API`: `false`
   - `VITE_API_BASE_URL`: `https://<render-service-name>.onrender.com/api/v1`
5. Click **Save and Deploy**.
6. Copy your deployed Pages domain, e.g. `https://bytevon-crm.pages.dev`.

### Step 6: Connect CORS & Final Integration
1. Return to the Render Web Service dashboard $\rightarrow$ **Environment**.
2. Update `CORS_ORIGINS` to include your exact Cloudflare Pages origin:
   ```text
   https://bytevon-crm.pages.dev
   ```
3. Save changes. Render redeploys the service with updated CORS rules in under a minute.
4. Open `https://bytevon-crm.pages.dev` in a browser, log in with demo or admin credentials, and explore the CRM dashboard, workforce, sales, and project modules.

---

## 10. Troubleshooting & Operational Guide

### Inspecting Logs
- **Render Backend Logs**: In Render Dashboard $\rightarrow$ Web Service $\rightarrow$ **Logs**. Shows Uvicorn startup, entrypoint output, and request logs.
- **Cloudflare Pages Logs**: In Cloudflare Dashboard $\rightarrow$ Workers & Pages $\rightarrow$ Project $\rightarrow$ **Deployments** $\rightarrow$ Click latest deployment to view build output.

### Free-Tier Cold-Starts
- Render Free Web Services sleep after 15 minutes of inactivity. Neon Free compute also scales to zero when idle.
- First request after idle will experience a 30–50 second cold-start latency while the container wakes up and PostgreSQL resumes.
- Subsequent requests respond in milliseconds.
- `pool_pre_ping=True` in `app/core/database.py` prevents broken connection errors during wake-up.

### Common Errors & Remedies
1. **`asyncpg.exceptions.InvalidPasswordError` or SSL Connection Error**:
   - Neon requires `?sslmode=require`. Ensure the password is URL-encoded if it contains symbols like `@`, `!`, or `#`.
2. **CORS Error in Browser Developer Tools**:
   - Verify `CORS_ORIGINS` on Render matches your exact Cloudflare Pages URL including `https://` and without a trailing slash (e.g. `https://bytevon-crm.pages.dev`).
3. **Frontend Shows 404 on Browser Refresh**:
   - Verify `public/_redirects` was included in the build output (`dist/_redirects`).
4. **Seed Failure on Pre-Populated Database**:
   - Seed scripts are idempotent and use `get_or_create`. If a conflict occurs on non-standard custom records, inspect `docker logs` for the offending table constraint.

---

## 11. Local Docker Compose Development

To run locally alongside the production configuration without interfering with Neon:
```bash
docker compose up --build
```
- `docker-compose.yml` runs local PostgreSQL, MinIO, Backend (`STARTUP_MODE=compose`, `STORAGE_ENABLED=true`), and Frontend (Nginx).
- Local storage, avatars, and file attachments are fully enabled in Docker Compose.

