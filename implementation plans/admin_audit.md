# Implementation Plan: Audit Logs with MinIO Cloud Archival + Frontend "Move to Cloud" Button

---

## 🎯 Goal

- **Backend**: Archive logs older than `AUDIT_RETENTION_DAYS` (from env) to MinIO as JSONL; merge archived logs with live DB logs in `list_logs` endpoint; run archival automatically via daily scheduler + manual endpoint
- **Frontend**: Add "Move the logs to cloud" button left of Refresh button on Audit Logs page; call `/admin/audit/archive` endpoint; show success/error toast

---

## 📁 File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| **Backend** |
| `app/core/config.py` | **Modify** | Add MinIO settings + `AUDIT_RETENTION_DAYS` |
| `app/core/storage/minio_service.py` | **Create** | MinIO client wrapper (upload/download/list/delete) |
| `app/modules/admin/audit/service.py` | **Modify** | Add MinIO upload in `archive_old_logs`; add `fetch_archived_logs`; merge in `list_logs` |
| `app/modules/admin/audit/repository.py` | **Modify** | Add `list_archived_logs` delegation |
| `app/modules/admin/audit/routes.py` | **Modify** | Update `list_logs` to use merged fetch |
| `app/core/scheduler.py` | **Create** | Background job setup (apscheduler) |
| `app/core/lifespan.py` | **Modify** | Register scheduler on startup |
| `requirements.txt` | **Modify** | Add `minio>=7.2.0`, `apscheduler>=3.10.0` |
| `.env` | **Modify** | Add MinIO + retention config |
| **Frontend** |
| `src/modules/admin/api/audit.ts` | **Modify** | Add `archiveAuditLogs()` function calling `/admin/audit/archive` |
| `src/modules/admin/pages/audit/AuditLogsPage.tsx` | **Modify** | Add "Move the logs to cloud" button left of Refresh; handle click → call API → show toast |

---

## 🔧 Backend Implementation Details

### 1. `app/core/config.py` — Add Settings

```python
# Add to Settings class
MINIO_ENDPOINT: str = "localhost:9000"
MINIO_ACCESS_KEY: str = "minioadmin"
MINIO_SECRET_KEY: str = "minioadmin"
MINIO_BUCKET: str = "bytevon-audit"
MINIO_SECURE: bool = False
AUDIT_RETENTION_DAYS: int = 10  # from env
```

### 2. `app/core/storage/minio_service.py` — New File

```python
"""MinIO storage service for audit archives."""
from __future__ import annotations

import logging
from typing import Optional

from minio import Minio
from minio.error import S3Error

from app.core.config import settings

logger = logging.getLogger(__name__)


class MinIOService:
    def __init__(self) -> None:
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.bucket = settings.MINIO_BUCKET
        self._ensure_bucket()

    def _ensure_bucket(self) -> None:
        if not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)
            logger.info("Created MinIO bucket: %s", self.bucket)

    async def upload_audit_logs(self, object_name: str, content: str) -> str:
        """Upload JSONL content to MinIO. Returns object_name."""
        from io import BytesIO
        data = content.encode("utf-8")
        self.client.put_object(
            self.bucket,
            object_name,
            BytesIO(data),
            length=len(data),
            content_type="application/jsonl",
        )
        logger.info("Uploaded audit archive: %s (%d bytes)", object_name, len(data))
        return object_name

    async def download_audit_logs(self, object_name: str) -> str:
        """Download and return JSONL content as string."""
        response = self.client.get_object(self.bucket, object_name)
        try:
            return response.read().decode("utf-8")
        finally:
            response.close()
            response.release_conn()

    async def list_audit_archives(self, prefix: str) -> list[str]:
        """List archive object names under prefix."""
        objects = self.client.list_objects(self.bucket, prefix=prefix, recursive=True)
        return [obj.object_name for obj in objects if obj.object_name]

    async def delete_audit_logs(self, object_name: str) -> None:
        """Delete archive object."""
        self.client.remove_object(self.bucket, object_name)
        logger.info("Deleted audit archive: %s", object_name)


# Singleton instance
minio_service = MinIOService()
```

### 3. `app/modules/admin/audit/repository.py` — Add Archive Fetch

```python
# Add import
from app.core.storage.minio_service import minio_service

# Add method to AuditRepository
async def list_archived_logs(
    self,
    *,
    cutoff: datetime,
    reference_type: Optional[AuditReferenceType] = None,
    reference_id: Optional[int] = None,
    action: Optional[AuditAction] = None,
    employment_id: Optional[int] = None,
    limit: int = 100,
    offset: int = 0,
) -> Sequence[AuditLog]:
    """Fetch archived logs from MinIO, parse JSONL, apply filters in-memory."""
    date_key = cutoff.strftime("%Y-%m-%d")
    prefix = f"audit-archives/{date_key}/"
    
    object_names = await minio_service.list_audit_archives(prefix)
    if not object_names:
        return []
    
    # For simplicity, fetch the first matching archive (can be enhanced to merge multiple)
    content = await minio_service.download_audit_logs(object_names[0])
    
    # Parse JSONL
    import json
    rows = []
    for line in content.strip().split("\n"):
        if not line:
            continue
        item = json.loads(line)
        # Apply filters
        if reference_type and item.get("reference_type") != reference_type.value:
            continue
        if reference_id and item.get("reference_id") != reference_id:
            continue
        if action and item.get("action") != action.value:
            continue
        if employment_id and item.get("employment_id") != employment_id:
            continue
        # Convert to AuditLog model (or return dict and let service map)
        rows.append(item)
        if len(rows) >= limit + offset:
            break
    
    return rows[offset:offset + limit]
```

### 4. `app/modules/admin/audit/service.py` — Update Archive & List

```python
# Add imports
from app.core.storage.minio_service import minio_service
from app.core.config import settings

# Remove: DEFAULT_RETENTION_DAYS = 10
# Use: settings.AUDIT_RETENTION_DAYS instead

# Update archive_old_logs to upload to MinIO
async def archive_old_logs(self, *, retention_days: int = None) -> ArchiveResult:
    if retention_days is None:
        retention_days = settings.AUDIT_RETENTION_DAYS
    
    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
    rows = list(await self._repo.list_older_than(cutoff))
    if not rows:
        return ArchiveResult(exported_count=0, deleted_count=0, message="Nothing to archive")

    # Serialize to JSONL
    payload = [
        {
            "id": r.id,
            "reference_type": r.reference_type.value,
            "reference_id": r.reference_id,
            "action": r.action.value,
            "description": r.description,
            "employment_id": r.employment_id,
            "ip_address": r.ip_address,
            "user_agent": r.user_agent,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]
    date_key = cutoff.strftime("%Y-%m-%d")
    storage_path = f"audit-archives/{date_key}/audit_{date_key}_{len(payload)}.jsonl"

    try:
        lines = "\n".join(json.dumps(item, default=str) for item in payload)
        # Upload to MinIO
        await minio_service.upload_audit_logs(storage_path, lines)
        logger.info("AUDIT ARCHIVE uploaded to MinIO: %s rows=%d", storage_path, len(payload))
    except Exception:
        logger.exception("Audit archive upload to MinIO failed; PG rows NOT deleted")
        return ArchiveResult(
            exported_count=0,
            deleted_count=0,
            storage_path=None,
            message="Upload failed; nothing deleted",
        )

    # Delete from PostgreSQL
    deleted = await self._repo.delete_older_than(cutoff)
    await self._commit()

    await self.log_simple(
        reference_type=AuditReferenceType.SYSTEM,
        reference_id=0,
        action=AuditAction.ARCHIVE,
        description=f"Archived {deleted} audit logs older than {cutoff.isoformat()} to {storage_path}",
        employment_id=None,
    )

    return ArchiveResult(
        exported_count=len(payload),
        deleted_count=deleted,
        storage_path=storage_path,
        message="Archive completed",
    )


# Add fetch_archived_logs method
async def fetch_archived_logs(
    self,
    *,
    cutoff: datetime,
    reference_type: Optional[AuditReferenceType] = None,
    reference_id: Optional[int] = None,
    action: Optional[AuditAction] = None,
    employment_id: Optional[int] = None,
    limit: int = 100,
    offset: int = 0,
) -> list[AuditLogResponse]:
    """Fetch archived logs from MinIO."""
    rows = await self._repo.list_archived_logs(
        cutoff=cutoff,
        reference_type=reference_type,
        reference_id=reference_id,
        action=action,
        employment_id=employment_id,
        limit=limit,
        offset=offset,
    )
    return [AuditLogResponse.model_validate(r) for r in rows]


# Update list_logs to merge DB + archived
async def list_logs(
    self,
    *,
    reference_type: Optional[AuditReferenceType] = None,
    reference_id: Optional[int] = None,
    action: Optional[AuditAction] = None,
    employment_id: Optional[int] = None,
    from_ts: Optional[datetime] = None,
    to_ts: Optional[datetime] = None,
    limit: int = 100,
    offset: int = 0,
) -> list[AuditLogResponse]:
    # Fetch from DB
    db_rows = await self._repo.list_logs(
        reference_type=reference_type,
        reference_id=reference_id,
        action=action,
        employment_id=employment_id,
        from_ts=from_ts,
        to_ts=to_ts,
        limit=limit * 2,  # fetch extra for merge
        offset=0,
    )
    db_logs = [AuditLogResponse.model_validate(r) for r in db_rows]

    # Fetch archived logs (older than retention cutoff)
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.AUDIT_RETENTION_DAYS)
    # Only fetch archived if filters don't restrict to recent dates
    archived_logs = []
    if from_ts is None or from_ts < cutoff:
        archived_logs = await self.fetch_archived_logs(
            cutoff=cutoff,
            reference_type=reference_type,
            reference_id=reference_id,
            action=action,
            employment_id=employment_id,
            limit=limit * 2,
            offset=0,
        )

    # Merge and sort by created_at desc
    all_logs = db_logs + archived_logs
    all_logs.sort(key=lambda x: x.created_at, reverse=True)
    
    # Apply pagination after merge
    return all_logs[offset:offset + limit]
```

### 5. `app/core/scheduler.py` — New File

```python
"""Background scheduler for periodic tasks."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings
from app.core.database import get_db_session
from app.modules.admin.audit.service import AuditService

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def run_audit_archive_job() -> None:
    """Daily job to archive old audit logs to MinIO."""
    logger.info("Starting scheduled audit archive job")
    async for session in get_db_session():
        service = AuditService(session)
        result = await service.archive_old_logs(retention_days=settings.AUDIT_RETENTION_DAYS)
        logger.info(
            "Scheduled audit archive completed: exported=%d deleted=%d path=%s",
            result.exported_count,
            result.deleted_count,
            result.storage_path,
        )
        break  # get_db_session is async generator, take first


def start_scheduler() -> None:
    """Start the background scheduler."""
    if settings.APP_ENV == "production" or settings.DEBUG:
        scheduler.add_job(
            run_audit_archive_job,
            CronTrigger(hour=0, minute=0, timezone="UTC"),  # Daily at midnight UTC
            id="audit_archive",
            replace_existing=True,
        )
        scheduler.start()
        logger.info("Background scheduler started (audit archive at 00:00 UTC)")


def stop_scheduler() -> None:
    """Stop the background scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Background scheduler stopped")
```

### 6. `app/core/lifespan.py` — Register Scheduler

```python
# Add imports
from app.core.scheduler import start_scheduler, stop_scheduler

# In lifespan context manager:
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()
```

### 7. `requirements.txt` — Add Dependencies

```
minio>=7.2.0
apscheduler>=3.10.0
```

### 8. `.env` — Add Configuration

```env
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=bytevon-audit
MINIO_SECURE=false
AUDIT_RETENTION_DAYS=10
```

---

## 🌐 Frontend Implementation Details

### 1. `src/modules/admin/api/audit.ts` — Add Archive Function

```typescript
// Add after listAuditLogs function (around line 221)

// Archive audit logs to cloud storage
export async function archiveAuditLogs(retentionDays?: number): Promise<{
  exported_count: number
  deleted_count: number
  storage_path: string | null
  message: string
}> {
  if (env.useMockApi) {
    await delay()
    return {
      exported_count: 0,
      deleted_count: 0,
      storage_path: null,
      message: "Mock: Archive completed",
    }
  }

  const params: Record<string, string | number> = {}
  if (retentionDays) params.retention_days = retentionDays

  const { data } = await apiClient.post<{
    exported_count: number
    deleted_count: number
    storage_path: string | null
    message: string
  }>('/admin/audit/archive', null, { params })

  return data
}
```

### 2. `src/modules/admin/pages/audit/AuditLogsPage.tsx` — Add Button

```tsx
// Add import for toast
import { useToast } from '@/shared/hooks/use-toast'

// In the component, add toast hook
const { toast } = useToast()

// In PageHeader actions (around line 165-186), add the new button:
actions={
  <div className="flex gap-2">
    {/* New: Move to Cloud button */}
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          const result = await archiveAuditLogs()
          toast({
            title: "Logs moved to cloud",
            description: `${result.exported_count} logs exported, ${result.deleted_count} deleted from database`,
            variant: "success",
          })
          // Refresh the list to show updated data
          void logsQuery.refetch()
        } catch (error) {
          toast({
            title: "Failed to move logs",
            description: error instanceof Error ? error.message : "Unknown error",
            variant: "destructive",
          })
        }
      }}
      disabled={logsQuery.isLoading}
    >
      Move the logs to cloud
    </Button>
    
    {/* Existing Refresh button */}
    <Button variant="outline" size="sm" onClick={() => void logsQuery.refetch()}>
      Refresh
    </Button>
    
    {/* Existing Export button */}
    <ExportButton ... />
  </div>
}
```

---

## 📦 Archive Object Naming Convention

```
audit-archives/YYYY-MM-DD/audit_YYYY-MM-DD_N.jsonl
```

- Partitioned by cutoff date (retention boundary)
- One JSON object per line (JSONL format)
- `N` = number of logs in archive

---

## 🔄 Merged Listing Logic (Backend)

```python
async def list_logs(...):
    db_logs = await repo.list_logs(...)  # recent logs
    archived_logs = await fetch_archived_logs(...)  # older logs from MinIO
    merged = sorted(db_logs + archived_logs, key=lambda x: x.created_at, reverse=True)
    return paginate(merged, limit, offset)
```

---

## ⏰ Scheduler

- **Frequency**: Daily at 00:00 UTC
- **Trigger**: `CronTrigger(hour=0, minute=0, timezone="UTC")`
- **Function**: `run_audit_archive_job()` → calls `AuditService.archive_old_logs(retention_days=settings.AUDIT_RETENTION_DAYS)`
- **Lifecycle**: Started in `lifespan.py` startup, stopped on shutdown

---

## ✅ Acceptance Criteria

| Feature | Criteria |
|---------|----------|
| **Backend Archive** | `POST /admin/audit/archive` uploads JSONL to MinIO, deletes from PG, returns `{exported_count, deleted_count, storage_path, message}` |
| **Auto-Archive** | Daily at midnight UTC, uses `AUDIT_RETENTION_DAYS` from env |
| **Merged Listing** | `GET /admin/audit/logs` returns combined DB + MinIO logs, sorted by `created_at desc`, paginated |
| **Frontend Button** | "Move the logs to cloud" button left of Refresh; calls archive API; shows success/error toast; refreshes list on success |
| **Configuration** | All settings via `.env` (MinIO endpoint, credentials, bucket, retention days) |

---

## 🚀 Execution Order

1. **Backend Config & Storage**
   - Update `app/core/config.py`
   - Create `app/core/storage/minio_service.py`
   - Update `requirements.txt`

2. **Backend Audit Module**
   - Update `app/modules/admin/audit/repository.py`
   - Update `app/modules/admin/audit/service.py`
   - Update `app/modules/admin/audit/routes.py`

3. **Backend Scheduler**
   - Create `app/core/scheduler.py`
   - Update `app/core/lifespan.py`

4. **Frontend**
   - Update `src/modules/admin/api/audit.ts`
   - Update `src/modules/admin/pages/audit/AuditLogsPage.tsx`

5. **Configuration**
   - Update `.env` with MinIO settings

---

## ⚠️ Notes & Considerations

1. **MinIO Bucket**: Ensure bucket exists or service creates it on first run
2. **Large Archives**: Current implementation downloads entire archive file to memory; for very large archives, consider streaming parse or MinIO Select (S3 Select equivalent)
3. **Filter Push-down**: Archived log filtering happens in-memory after download; acceptable for typical audit volumes
4. **Idempotency**: Archive job is idempotent - re-running won't duplicate since logs are deleted from PG after successful upload
5. **Error Handling**: If MinIO upload fails, PG rows are NOT deleted (safe)
6. **Mock API**: Frontend `archiveAuditLogs` respects `env.useMockApi` for development

---

**Plan saved to**: `Z:\bytevon extra\Bytevon_frontend\bytevon_documentation\implementation plans\admin_audit.md`

This plan is now complete and saved. Ready for implementation execution when you give the go-ahead.---

# Implementation Plan: Sales Module (Lead, Client, Source)

---

## ?? Goal

Verify and fix all CRUD endpoints and UI components for:
1. **Lead** - Create, list, detail, edit, status change
2. **Client** - Create, list, detail, edit, archive, contacts
3. **Source** - Create, list, edit, archive

Add date filters where missing, remove back button from Client page.

---

## ?? File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| **Backend - Lead** |
| \pp/modules/sales/lead/routes.py\ | **Modify** | Add date filter params to list endpoint |
| \pp/modules/sales/lead/service.py\ | **Modify** | Add date filtering to list method |
| \pp/modules/sales/lead/schemas.py\ | **Modify** | Add date filter to list response if needed |
| **Backend - Client** |
| \pp/modules/sales/client/routes.py\ | **Modify** | Add date filter params to list endpoint |
| \pp/modules/sales/client/service.py\ | **Modify** | Add date filtering to list method |
| **Backend - Source** |
| \pp/modules/sales/source/routes.py\ | **Verify** | Already has include_archived, verify completeness |
| **Frontend - Lead** |
| \src/modules/sales/pages/lead/LeadsListPage.tsx\ | **Modify** | Add DateRangeFilter to ListToolbar |
| \src/modules/sales/hooks/lead/use-leads.ts\ | **Modify** | Pass date filters to API |
| \src/modules/sales/api/lead.ts\ | **Modify** | Add date params to list API call |
| **Frontend - Client** |
| \src/modules/sales/pages/client/ClientsListPage.tsx\ | **Modify** | Add DateRangeFilter; remove back button from PageHeader |
| \src/modules/sales/hooks/client/use-clients.ts\ | **Modify** | Pass date filters to API |
| \src/modules/sales/api/client.ts\ | **Modify** | Add date params to list API call |
| **Frontend - Source** |
| \src/modules/sales/pages/source/SourcesListPage.tsx\ | **Verify** | Already has includeArchived, verify completeness |

---

## ?? Detailed Implementation

### 1. Lead: Add Date Filters

#### Backend: \pp/modules/sales/lead/routes.py\
\\\python
# Add to list_leads endpoint
from datetime import date
# ...
date_from: Optional[date] = Query(None),
date_to: Optional[date] = Query(None),
\\\

Pass to service:
\\\python
return await service.list(
    status=status_filter,
    assigned_employment_id=assigned_employment_id,
    date_from=date_from,
    date_to=date_to,
    limit=limit,
    offset=offset,
)
\\\

#### Backend: \pp/modules/sales/lead/service.py\
\\\python
async def list(
    self,
    *,
    status: Optional[LeadStatus] = None,
    assigned_employment_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = 100,
    offset: int = 0,
) -> list[LeadResponse]:
    # Add date filters to query
    if date_from:
        stmt = stmt.where(Lead.created_at >= date_from)
    if date_to:
        stmt = stmt.where(Lead.created_at <= date_to)
\\\

#### Frontend: \src/modules/sales/hooks/lead/use-leads.ts\
Add dateFrom, dateTo to filters state and pass to API.

#### Frontend: \src/modules/sales/pages/lead/LeadsListPage.tsx\
\\\	sx
import { DateRangeFilter } from '@/shared/components/forms/DateRangeFilter'

// In ListToolbar, add:
<DateRangeFilter
  value={{ from: dateFrom, to: dateTo }}
  onChange={({ from, to }) => {
    setDateFrom(from)
    setDateTo(to)
  }}
  label="Date"
  placeholder="Created date"
/>
\\\

### 2. Client: Add Date Filters + Remove Back Button

#### Backend: \pp/modules/sales/client/routes.py\
\\\python
# Add to list_clients endpoint
date_from: Optional[date] = Query(None),
date_to: Optional[date] = Query(None),
\\\

Pass to service and add date filtering in service.

#### Frontend: \src/modules/sales/pages/client/ClientsListPage.tsx\
**Changes:**
1. Add DateRangeFilter to ListToolbar (same pattern as Leads)
2. **Remove** \showBack\, \ackTo\, \ackLabel\ from PageHeader (lines 133-135)

\\\	sx
// Remove these lines from PageHeader:
// showBack
// backTo={salesRoutes.clients}
// backLabel="Back to clients"
\\\

#### Frontend: \src/modules/sales/hooks/client/use-clients.ts\
Add dateFrom, dateTo to filters and pass to API.

### 3. Source: Verify Completeness

**Current State Analysis:**
- ? Create source (\POST /sources\)
- ? List sources (\GET /sources\ with include_archived)
- ? Get source (\GET /sources/{id}\)
- ? Update source (\PATCH /sources/{id}\)
- ? Archive source (\POST /sources/{id}/archive\)
- ? Frontend: SourcesListPage has modal for create/edit, archive dialog, metrics cards, table
- ? Frontend: Uses includeArchived filter

**Missing/To Verify:**
- Date filters (not currently in backend list endpoint) - Add if needed
- Search is client-side only (already implemented)

---

## ? Acceptance Criteria - Sales

| Module | Criteria |
|--------|----------|
| **Lead** | List has date range filter; backend filters by created_at; UI shows DateRangeFilter in toolbar |
| **Client** | List has date range filter; backend filters by created_at; **NO back button** above "Client Management" heading; UI shows DateRangeFilter |
| **Source** | All CRUDs work; create/edit/archive via modals; metrics cards display; table with actions |

---

## ?? Execution Order - Sales

1. **Lead Backend**: Add date params to routes.py ? service.py
2. **Client Backend**: Add date params to routes.py ? service.py  
3. **Lead Frontend**: Add DateRangeFilter to LeadsListPage; update hook + API
4. **Client Frontend**: Add DateRangeFilter to ClientsListPage; **remove back button**; update hook + API
5. **Source**: Verify all endpoints work; test create/edit/archive flows

---

# Implementation Plan: Project Module (Project, Team, Task)

---

## ?? Goal

Verify and fix all CRUD endpoints and UI components for:
1. **Project List** - Add date filters; replace "All statuses" with actual enum values
2. **Teams** - Hide "All Departments" filter; add date filters
3. **Tasks** - Verify all CRUDs and UI components

---

## ?? File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| **Backend - Project** |
| \pp/modules/project/project/routes.py\ | **Modify** | Add date filter params to list_projects |
| \pp/modules/project/project/service.py\ | **Modify** | Add date filtering to list_projects |
| **Backend - Team** |
| \pp/modules/project/team/routes.py\ | **Modify** | Add date filter params to list_teams |
| \pp/modules/project/team/service.py\ | **Modify** | Add date filtering to list_teams |
| **Backend - Task** |
| \pp/modules/project/task/routes.py\ | **Verify** | Already has project_id, project_name filters |
| **Frontend - Project** |
| \src/modules/projects/pages/project/ProjectsListPage.tsx\ | **Modify** | Add DateRangeFilter; replace status options with ProjectStatus enum |
| \src/modules/projects/hooks/project/use-projects.ts\ | **Modify** | Pass date filters to API |
| \src/modules/projects/api/project.ts\ | **Modify** | Add date params to list API call |
| **Frontend - Team** |
| \src/modules/projects/pages/team/TeamsListPage.tsx\ | **Modify** | Remove Department filter; add DateRangeFilter |
| \src/modules/projects/hooks/team/use-teams.ts\ | **Modify** | Pass date filters to API; remove department filter |
| \src/modules/projects/api/team.ts\ | **Modify** | Add date params to list API call |
| **Frontend - Task** |
| \src/modules/projects/pages/task/TasksListPage.tsx\ | **Verify** | Already has status, priority filters; verify create/edit/detail |

---

## ?? Detailed Implementation

### 1. Project List: Date Filters + Status Enum

#### Backend: \pp/modules/project/project/routes.py\
\\\python
# Add to list_projects
from datetime import date
# ...
date_from: Optional[date] = Query(None),
date_to: Optional[date] = Query(None),
\\\

Pass to service.

#### Backend: \pp/modules/project/project/service.py\
\\\python
async def list_projects(
    self,
    *,
    client_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = 100,
    offset: int = 0,
) -> list[ProjectResponse]:
    # Add date filters
    if date_from:
        stmt = stmt.where(Project.created_at >= date_from)
    if date_to:
        stmt = stmt.where(Project.created_at <= date_to)
\\\

#### Frontend: \src/modules/projects/pages/project/ProjectsListPage.tsx\
**Replace status filter options (line 132-138):**
\\\	sx
// Current: options={[{ value: '', label: 'All statuses' }, ...ProjectStatusOptions]}
// Change to use actual enum values from backend:
import { ProjectStatus } from '@/modules/projects/schemas/project/project'

const statusOptions = Object.values(ProjectStatus).map(s => ({ value: s, label: s.replace('_', ' ') }))
// Or import from enums file
\\\

**Add DateRangeFilter to ListToolbar:**
\\\	sx
<DateRangeFilter
  value={{ from: dateFrom, to: dateTo }}
  onChange={({ from, to }) => { setDateFrom(from); setDateTo(to) }}
  label="Created Date"
  placeholder="Date range"
/>
\\\

### 2. Teams: Hide Department Filter + Add Date Filters

#### Backend: \pp/modules/project/team/routes.py\
\\\python
# Add to list_teams
date_from: Optional[date] = Query(None),
date_to: Optional[date] = Query(None),
\\\

#### Frontend: \src/modules/projects/pages/team/TeamsListPage.tsx\
**Changes:**
1. **Remove** Department filter (lines 166-172):
\\\	sx
// REMOVE THIS BLOCK:
// <Select
//   value={department}
//   onChange={setDepartment}
//   placeholder="Department"
//   options={[{ value: '', label: 'All Departments' }]}
 // minWidthClass="min-w-[160px]"
// />
\\\

2. **Add DateRangeFilter** to filter bar:
\\\	sx
<DateRangeFilter
  value={{ from: dateFrom, to: dateTo }}
  onChange={({ from, to }) => { setDateFrom(from); setDateTo(to) }}
  label="Created Date"
  placeholder="Date range"
/>
\\\

#### Frontend: \src/modules/projects/hooks/team/use-teams.ts\
- Remove \department\ from state
- Add \dateFrom\, \dateTo\ to filters
- Pass to API call

### 3. Tasks: Verify CRUDs

**Current State Analysis:**
- ? List tasks (\GET /tasks\ with project_id, project_name filters)
- ? Get task (\GET /tasks/{id}\)
- ? Create task (\POST /tasks\)
- ? Update task (\PATCH /tasks/{id}\)
- ? Time entries (create, list)
- ? Project tasks (\GET /projects/{project_id}/tasks\)
- ? Frontend: TasksListPage has status, priority filters, create modal, quick overview
- ? Frontend: TaskCreatePage, TaskDetailPage exist

**Missing/To Verify:**
- Date filters (not in backend) - Add if needed
- Archive/Delete endpoint (not in backend) - Check if needed

---

## ? Acceptance Criteria - Project

| Module | Criteria |
|--------|----------|
| **Project List** | DateRangeFilter in toolbar; status filter shows actual enum values (PLANNED, ACTIVE, ON_HOLD, COMPLETED, CANCELLED, ARCHIVED); backend filters by created_at |
| **Teams** | **NO Department filter**; DateRangeFilter in toolbar; backend filters by created_at |
| **Tasks** | All CRUDs work; create via modal; list with status/priority filters; detail page with quick overview |

---

## ?? Execution Order - Project

1. **Project Backend**: Add date params to project routes.py ? service.py
2. **Team Backend**: Add date params to team routes.py ? service.py
3. **Project Frontend**: Add DateRangeFilter; replace status options with enum; update hook + API
4. **Team Frontend**: Remove Department filter; add DateRangeFilter; update hook + API
5. **Task**: Verify all CRUDs work end-to-end

---

## ?? Notes & Considerations

1. **Date Filter Pattern**: Use the shared \DateRangeFilter\ component from \@/shared/components/forms/DateRangeFilter\ - already used in Admin Audit and User pages.

2. **Status Enum**: ProjectStatus enum in backend (\pp/core/db/enums.py\) has: PLANNED, ACTIVE, ON_HOLD, COMPLETED, CANCELLED, ARCHIVED. Frontend should use these exact values.

3. **Back Button Removal**: ClientCreatePage already has breadcrumbs. The back button in PageHeader on ClientsListPage is redundant with the breadcrumb navigation.

4. **Team Department Filter**: Currently shows empty options \[{ value: '', label: 'All Departments' }]\ - should be removed entirely.

5. **Backend Pagination**: All list endpoints use limit/offset pagination - date filters should work with existing pagination.

---

**Combined Plan saved to**: \Z:\bytevon extra\Bytevon_frontend\bytevon_documentation\implementation plans\admin_audit.md\

This comprehensive plan now covers Audit Logs, Workforce Module Enhancements, Sales Module, and Project Module. Ready for implementation execution when you give the go-ahead.
---

# Implementation Plan: My Work Module (Self-Service)

---

## ?? Goal

Replace stub implementations with real backend services for:
1. **Overview** - /my-work/overview - aggregate dashboard data
2. **Leave** - /my-work/leave - list, balances, types, apply context, calculate
3. **Tasks** - /my-work/tasks - list my assigned tasks
4. **Requests** - /my-work/requests - my submitted approval requests
5. **Approvals** - /my-work/approvals - items I need to approve

Add date filters where missing, verify all CRUDs, ensure route consistency.

---

## ?? File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| **Backend - New Services** |
| pp/modules/my_work/leave/ | **Create** | New leave service (list, balances, types, apply-context, calculate, submit) |
| pp/modules/my_work/tasks/ | **Create** | New tasks service (list my tasks) |
| pp/modules/my_work/requests/ | **Create** | New requests service (my submitted requests) |
| pp/modules/my_work/approvals/ | **Create** | New approvals service (my pending approvals) |
| pp/modules/my_work/overview/ | **Create** | New overview service (aggregate) |
| pp/modules/my_work/routes.py | **Modify** | Include new routers |
| **Backend - Attendance** |
| pp/modules/my_work/attendance/routes.py | **Verify** | Already complete - punch, breaks, days, corrections |
| **Frontend - API** |
| src/modules/my-work/api/my-work.ts | **Modify** | Remove mock fallbacks, use real endpoints |
| **Frontend - Hooks** |
| src/modules/my-work/hooks/use-my-work-overview.ts | **Verify** | Uses overview endpoint |
| src/modules/my-work/hooks/use-my-leave.ts | **Verify** | Uses leave endpoints |
| src/modules/my-work/hooks/use-my-tasks.ts | **Verify** | Uses tasks endpoint |
| src/modules/my-work/hooks/use-my-approvals.ts | **Verify** | Uses approvals endpoint |
| src/modules/my-work/hooks/use-requests-page-filter.ts | **Verify** | Uses requests endpoint |
| **Frontend - Pages** |
| src/modules/my-work/pages/overview/MyWorkOverviewPage.tsx | **Verify** | Already complete |
| src/modules/my-work/pages/leave/MyLeavePage.tsx | **Verify** | Already complete with tabs |
| src/modules/my-work/pages/tasks/MyTasksPage.tsx | **Verify** | Already complete with filters |
| src/modules/my-work/pages/requests/MyRequestsPage.tsx | **Verify** | Already complete |
| src/modules/my-work/pages/approvals/MyApprovalsPage.tsx | **Verify** | Already complete |

---

## ?? Detailed Implementation

### 1. Backend: Create Leave Service

**File: pp/modules/my_work/leave/schemas.py**
`python
"""My Work Leave schemas."""
from __future__ import annotations
from datetime import date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

class LeaveBalance(BaseModel):
    type: str
    total: float
    used: float
    remaining: float

class LeaveRequest(BaseModel):
    id: str
    type: str
    from_date: date
    to_date: date
    days: float
    reason: str
    status: str
    applied_on: date
    approver: Optional[str] = None
    half_day: Optional[str] = None

class LeaveListResponse(BaseModel):
    items: List[LeaveRequest]
    total: int
    page: int = 1
    pageSize: int = 20

class LeaveTypeOption(BaseModel):
    value: str
    label: str
    requires_approval: bool = True

class ApplyLeaveContext(BaseModel):
    holidays: List[dict]
    leaveTypes: List[LeaveTypeOption]
    balances: List[LeaveBalance]

class CreateLeaveRequestInput(BaseModel):
    type: str
    from_date: date
    to_date: date
    reason: str
    half_day: Optional[str] = None

class LeaveCalculateInput(BaseModel):
    type: str
    from: str
    to: str
    half_day: bool = False

class LeaveCalculateResult(BaseModel):
    day_cost: float
    balance_remaining: Optional[float] = None
    estimated_balance_after: Optional[float] = None
    holidays_in_range: List[dict]
`

**File: pp/modules/my_work/leave/repository.py**
`python
"""My Work Leave repository."""
from __future__ import annotations
from datetime import date
from typing import List, Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repositories.base_repository import BaseRepository
from app.modules.leave.models import LeaveRequest, LeaveType, LeaveBalance as LeaveBalanceModel

class MyWorkLeaveRepository(BaseRepository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def list_my_requests(
        self, employment_id: int, *, status: Optional[str] = None,
        search: Optional[str] = None, limit: int = 20, offset: int = 0
    ) -> Sequence[LeaveRequest]:
        stmt = select(LeaveRequest).where(LeaveRequest.employment_id == employment_id)
        if status:
            stmt = stmt.where(LeaveRequest.status == status)
        if search:
            stmt = stmt.where(LeaveRequest.reason.ilike(f"%{search}%"))
        stmt = stmt.order_by(LeaveRequest.applied_on.desc()).limit(limit).offset(offset)
        return await self.scalars(stmt)

    async def count_my_requests(self, employment_id: int, status: Optional[str] = None, search: Optional[str] = None) -> int:
        # Similar count query
        pass

    async def get_balances(self, employment_id: int) -> Sequence[LeaveBalanceModel]:
        stmt = select(LeaveBalanceModel).where(LeaveBalanceModel.employment_id == employment_id)
        return await self.scalars(stmt)

    async def get_types(self) -> Sequence[LeaveType]:
        stmt = select(LeaveType).where(LeaveType.is_active.is_(True))
        return await self.scalars(stmt)
`

**File: pp/modules/my_work/leave/service.py**
`python
"""My Work Leave Service."""
from __future__ import annotations
from datetime import date
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db.enums import HolidayType
from app.core.services.base_public_service import BasePublicService
from app.modules.my_work.leave.repository import MyWorkLeaveRepository
from app.modules.my_work.leave.schemas import *

class MyWorkLeaveService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._repo = MyWorkLeaveRepository(session)

    async def list_requests(self, employment_id: int, *, status: Optional[str] = None,
                           search: Optional[str] = None, limit: int = 20, offset: int = 0) -> LeaveListResponse:
        items = await self._repo.list_my_requests(employment_id, status=status, search=search, limit=limit, offset=offset)
        total = await self._repo.count_my_requests(employment_id, status=status, search=search)
        return LeaveListResponse(items=[LeaveRequest.model_validate(i) for i in items], total=total, page=offset//limit + 1, pageSize=limit)

    async def get_balances(self, employment_id: int) -> List[LeaveBalance]:
        balances = await self._repo.get_balances(employment_id)
        return [LeaveBalance.model_validate(b) for b in balances]

    async def get_types(self) -> List[LeaveTypeOption]:
        types = await self._repo.get_types()
        return [LeaveTypeOption(value=t.code, label=t.name, requires_approval=t.requires_approval) for t in types]

    async def get_apply_context(self, employment_id: int) -> ApplyLeaveContext:
        balances = await self.get_balances(employment_id)
        types = await self.get_types()
        holidays = []  # Fetch from holiday calendar
        return ApplyLeaveContext(holidays=holidays, leaveTypes=types, balances=balances)

    async def calculate_days(self, employment_id: int, input: LeaveCalculateInput) -> LeaveCalculateResult:
        # Implement working day calculation with holidays
        pass

    async def submit_request(self, employment_id: int, input: CreateLeaveRequestInput) -> LeaveRequest:
        # Create leave request
        pass
`

### 2. Backend: Create Tasks Service

**File: pp/modules/my_work/tasks/schemas.py**
`python
from __future__ import annotations
from datetime import date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class MyTask(BaseModel):
    id: str
    name: str
    project: Optional[str] = None
    priority: str
    status: str
    due_date: Optional[date] = None
    estimated_hours: Optional[float] = None

class MyTaskListResponse(BaseModel):
    items: List[MyTask]
    total: int
    page: int = 1
    pageSize: int = 20
`

**File: pp/modules/my_work/tasks/service.py**
`python
from __future__ import annotations
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.services.base_public_service import BasePublicService
from app.modules.project.task.models import Task
from app.modules.my_work.tasks.schemas import MyTask, MyTaskListResponse

class MyWorkTasksService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def list_my_tasks(self, employment_id: int, *, status: Optional[str] = None,
                           search: Optional[str] = None, limit: int = 20, offset: int = 0) -> MyTaskListResponse:
        # Query tasks assigned to this employment
        stmt = select(Task).join(Task.assignees).where(TaskAssignee.employment_id == employment_id)
        if status:
            stmt = stmt.where(Task.status == status)
        if search:
            stmt = stmt.where(Task.name.ilike(f"%{search}%"))
        stmt = stmt.order_by(Task.due_date.asc().nulls_last()).limit(limit).offset(offset)
        tasks = await self.scalars(stmt)
        return MyTaskListResponse(items=[MyTask.model_validate(t) for t in tasks], total=len(tasks), page=offset//limit + 1, pageSize=limit)
`

### 3. Backend: Create Requests & Approvals Services

**Requests**: My submitted approval requests (leave, attendance corrections, etc.)
**Approvals**: Items where I am the approver

These can reuse the existing approvals module infrastructure.

### 4. Backend: Create Overview Service

**File: pp/modules/my_work/overview/service.py**
`python
"""My Work Overview Service - aggregates data for dashboard."""
from __future__ import annotations
from typing import Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.services.base_public_service import BasePublicService
from app.modules.my_work.leave.service import MyWorkLeaveService
from app.modules.my_work.tasks.service import MyWorkTasksService
from app.modules.my_work.attendance.service import MyWorkAttendanceService

class MyWorkOverviewService(BasePublicService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._leave = MyWorkLeaveService(session)
        self._tasks = MyWorkTasksService(session)
        self._attendance = MyWorkAttendanceService(session)

    async def get_overview(self, employment_id: int) -> dict[str, Any]:
        # Aggregate all data
        leave_balances = await self._leave.get_balances(employment_id)
        my_tasks = await self._tasks.list_my_tasks(employment_id)
        today_info = await self._attendance.today_info(employment_id)
        week_hours = await self._attendance.week_hours(employment_id)
        
        return {
            "user": {...},
            "metrics": [...],
            "todayAttendance": today_info,
            "weekHours": week_hours.days,
            "leaveBalances": leave_balances,
            "tasks": my_tasks.items[:5],
            "notifications": [],
            "events": [],
            "quickActions": [...],
        }
`

### 5. Frontend: Update API to Remove Mock Fallbacks

**File: src/modules/my-work/api/my-work.ts**
- Remove mock implementations for listMyLeaveRequests, listMyLeaveBalances, listLeaveTypeOptions, getApplyLeaveContext, calculateLeaveDays, listMyTasks, listMyApprovals, listMySubmittedRequests
- Keep only real API calls
- Add date filter params where missing

### 6. Add Date Filters to List Endpoints

All list endpoints should accept date_from and date_to params:
- /my-work/leave - filter by applied_on date
- /my-work/tasks - filter by created_at or due_date
- /my-work/requests - filter by submitted date
- /my-work/approvals - filter by submitted date

---

## ? Acceptance Criteria

| Feature | Criteria |
|---------|----------|
| **Overview** | /my-work/overview returns real aggregated data (user, metrics, attendance, leave balances, tasks) |
| **Leave List** | /my-work/leave returns paginated leave requests with status, type, date filters + date range filter |
| **Leave Balances** | /my-work/leave/balances returns leave type balances (total, used, remaining) |
| **Leave Types** | /my-work/leave/types returns active leave types with approval requirements |
| **Apply Context** | /my-work/leave/apply-context returns holidays, leave types, balances for apply form |
| **Calculate Days** | /my-work/leave/calculate returns working days count with holiday exclusion |
| **Tasks List** | /my-work/tasks returns my assigned tasks with status, priority, search, date filters |
| **Requests** | /my-work/requests returns my submitted approval requests with status filter |
| **Approvals** | /my-work/approvals returns items where I am approver with status filter |
| **Date Filters** | All list endpoints accept date_from/date_to query params |
| **Route Consistency** | Frontend routes match backend endpoints (verified in routes.tsx) |

---

## ?? Execution Order

1. **Backend - Leave Service**: Create schemas, repository, service, routes for leave
2. **Backend - Tasks Service**: Create schemas, service, routes for my tasks
3. **Backend - Requests Service**: Create service, routes for my submitted requests
4. **Backend - Approvals Service**: Create service, routes for my approvals
5. **Backend - Overview Service**: Create aggregate service, route
6. **Backend - Wire Routes**: Update my_work/routes.py to include new routers
6. **Frontend - API**: Remove mock fallbacks, add date filter params
7. **Frontend - Verify**: Test all pages with real backend

---

## ?? Notes & Considerations

1. **Leave Module**: Reuses existing leave module models (LeaveRequest, LeaveType, LeaveBalance) - don't duplicate
2. **Tasks Module**: Uses project.task models - join via TaskAssignee
3. **Approvals/Requests**: Use existing pprovals module infrastructure
4. **Stubs Removal**: Once real services are created, remove pp/modules/my_work/stubs/ entirely
5. **Date Filter Pattern**: Use shared DateRangeFilter component in ListToolbar
6. **Profile Routes**: Already at /profile/* - separate from /my-work/*, working correctly

---

**Combined Plan saved to**: Z:\bytevon extra\Bytevon_frontend\bytevon_documentation\implementation plans\admin_audit.md

This comprehensive plan now covers Audit Logs, Workforce Module Enhancements, Sales Module, Project Module, and My Work Module. Ready for implementation execution when you give the go-ahead.
