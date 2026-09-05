# ByteVon CRM — Backend (`02_backend_code`)

**Single package root.** Run from this folder.

```
02_backend_code/
  app/
    main.py
    api/
    core/
    modules/
  alembic/
  scripts/
  requirements.txt
  .env.example
```

## Flatten (if you still see nested `backend_code/`)

**PowerShell (Windows):**

```powershell
cd <repo-root>\bytevon_documentation
powershell -ExecutionPolicy Bypass -File .\02_backend_code\scripts\flatten_package.ps1
git add -A 02_backend_code
git status
git commit -m "chore: flatten 02_backend_code into single package root"
git push
```

**Or paste this in PowerShell (no script file):**

```powershell
cd 02_backend_code
if (Test-Path backend_code\app) {
  if ((Test-Path app) -and -not (Test-Path app\core)) { Remove-Item -Recurse -Force app }
  Get-ChildItem -Force backend_code | ForEach-Object {
    $d = Join-Path (Get-Location) $_.Name
    if (Test-Path $d) { Remove-Item -Recurse -Force $d }
    Move-Item -Force $_.FullName $d
  }
  Remove-Item -Recurse -Force backend_code
}
Get-ChildItem app\modules | Select-Object -First 10 Name
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
