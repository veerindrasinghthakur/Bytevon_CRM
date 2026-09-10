/**
 * Audit API — list + best-effort record.
 * Backend: GET/POST /audit/logs (not /admin/audit/logs).
 *
 * Backend AuditLogResponse:
 *   { id, reference_type, reference_id, action, description,
 *     employment_id, ip_address, user_agent, created_at }
 *
 * UI AuditLog:
 *   { id, action, actor, actorInitials, target, module, timestamp, ip }
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { auditLogs } from '../data/mock'
import type { AuditLog, RecordAuditInput, AuditListParams } from '../types'
import { delay } from '@/shared/mock/db'

const AUDIT_LOGS_API = '/audit/logs'

type AuditLogApi = {
  id: number
  reference_type?: string
  reference_id?: number
  action?: string
  description?: string
  employment_id?: number | null
  ip_address?: string | null
  user_agent?: string | null
  created_at?: string
}

function formatTs(iso?: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(iso)
  }
}

function initialsFrom(text: string): string {
  const parts = text.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'SY'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/** Map backend row → UI AuditLog card/table shape. */
export function mapApiAuditLog(row: AuditLogApi): AuditLog {
  const action = String(row.action ?? 'UNKNOWN')
  const refType = String(row.reference_type ?? '')
  const refId = row.reference_id != null ? String(row.reference_id) : ''
  const description = String(row.description ?? '')
  const actor =
    row.employment_id != null ? `Employment #${row.employment_id}` : 'System'

  return {
    id: String(row.id),
    action,
    actor,
    actorInitials: initialsFrom(actor),
    target: description || (refId ? `${refType} #${refId}` : refType || '—'),
    module: refType || 'SYSTEM',
    timestamp: formatTs(row.created_at),
    ip: row.ip_address ?? '—',
  }
}

export async function listAuditLogs(params?: AuditListParams): Promise<AuditLog[]> {
  if (env.useMockApi) {
    await delay()
    const limit = params?.limit ?? 500
    let items = auditLogs.map((r) => ({ ...r }))
    if (params?.search) {
      const q = params.search.toLowerCase()
      items = items.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.actor.toLowerCase().includes(q) ||
          l.target.toLowerCase().includes(q) ||
          l.module.toLowerCase().includes(q),
      )
    }
    if (params?.action && params.action !== 'All Actions') {
      items = items.filter((l) =>
        l.action.toLowerCase().includes(params.action!.toLowerCase()),
      )
    }
    if (params?.module && params.module !== 'All Modules') {
      items = items.filter((l) => l.module === params.module)
    }
    return items.slice(0, limit)
  }

  try {
    const query: Record<string, string | number | undefined> = {
      limit: params?.limit ?? 500,
      offset: 0,
    }
    // Backend filters: action (enum), employment_id, from_ts, to_ts
    if (params?.action && params.action !== 'All Actions') {
      query.action = params.action
    }
    if (params?.dateFrom) {
      query.from_ts = params.timeFrom
        ? `${params.dateFrom}T${params.timeFrom}:00`
        : `${params.dateFrom}T00:00:00`
    }
    if (params?.dateTo) {
      query.to_ts = params.timeTo
        ? `${params.dateTo}T${params.timeTo}:59`
        : `${params.dateTo}T23:59:59`
    }

    const { data } = await apiClient.get<AuditLogApi[] | { items?: AuditLogApi[] }>(
      AUDIT_LOGS_API,
      { params: query },
    )
    let items = (Array.isArray(data) ? data : data.items ?? []).map(mapApiAuditLog)

    // Client-side search / module filter (backend has no free-text search)
    if (params?.search) {
      const q = params.search.toLowerCase()
      items = items.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.actor.toLowerCase().includes(q) ||
          l.target.toLowerCase().includes(q) ||
          l.module.toLowerCase().includes(q),
      )
    }
    if (params?.module && params.module !== 'All Modules') {
      items = items.filter((l) =>
        l.module.toLowerCase().includes(params.module!.toLowerCase()),
      )
    }
    return items
  } catch {
    return []
  }
}

/** Append an audit row after a successful admin action (best-effort). */
export async function recordAuditEvent(input: RecordAuditInput): Promise<void> {
  try {
    if (env.useMockApi) {
      await delay()
      const entry: AuditLog = {
        id: `AUD-${Date.now()}`,
        action: input.action,
        actor: input.actor ?? 'Current User',
        actorInitials: input.actorInitials ?? 'CU',
        target: input.target,
        module: input.module,
        timestamp: new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        ip: input.ip ?? '—',
      }
      auditLogs.unshift(entry)
      return
    }
    // Backend expects AuditLogCreate — best-effort map
    await apiClient.post(AUDIT_LOGS_API, {
      reference_type: input.module || 'SYSTEM',
      reference_id: 0,
      action: input.action || 'UPDATE',
      description: `${input.action}: ${input.target}`,
      ip_address: input.ip ?? null,
    })
  } catch {
    // best-effort — never block the primary UX
  }
}
