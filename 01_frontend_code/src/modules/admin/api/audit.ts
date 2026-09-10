/**
 * Audit API — list + best-effort record.
 * Backend GET /audit/logs → AuditLogResponse shape mapped to UI AuditLog.
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { auditLogs } from '../data/mock'
import type { AuditLog, RecordAuditInput, AuditListParams } from '../types'
import { delay } from '@/shared/mock/db'

const AUDIT_LOGS_API = '/audit/logs'

const AUDIT_ACTIONS = new Set([
  'CREATE',
  'UPDATE',
  'ARCHIVE',
  'RESTORE',
  'LOGIN',
  'LOGOUT',
  'PASSWORD_CHANGE',
  'APPROVE',
  'REJECT',
  'ASSIGN',
  'UNASSIGN',
  'STATUS_CHANGE',
  'EXPORT',
])

const UI_ACTION_TO_API: Record<string, string | null> = {
  'All Actions': null,
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  ARCHIVE: 'ARCHIVE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  EXPORT: 'EXPORT',
  Create: 'CREATE',
  Update: 'UPDATE',
  Delete: null,
  Login: 'LOGIN',
  Lock: null,
}

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

function normalizeTime(t: string, fallback: string): string {
  const raw = (t || '').trim()
  if (!raw) return fallback
  const parts = raw.split(':')
  if (parts.length === 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`
  if (parts.length >= 3)
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0').slice(0, 2)}`
  return fallback
}

function toIsoLocal(date: string | undefined, time: string | undefined, endOfDay: boolean): string | undefined {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined
  const t = normalizeTime(time ?? '', endOfDay ? '23:59:59' : '00:00:00')
  return `${date}T${t}`
}

/** Map backend AuditLogResponse → UI AuditLog (full field set). */
export function mapApiAuditLog(row: AuditLogApi): AuditLog {
  const action = String(row.action ?? 'UNKNOWN')
  const referenceType = String(row.reference_type ?? 'SYSTEM')
  const referenceId = row.reference_id != null ? Number(row.reference_id) : null
  const description = String(row.description ?? '')
  const employmentId = row.employment_id != null ? Number(row.employment_id) : null
  const ipAddress = row.ip_address ?? null
  const userAgent = row.user_agent ?? null
  const createdAt = String(row.created_at ?? '')
  const actor = employmentId != null ? `Employment #${employmentId}` : 'System'
  const target =
    description ||
    (referenceId != null ? `${referenceType} #${referenceId}` : referenceType || '—')

  return {
    id: String(row.id),
    action,
    description,
    referenceType,
    referenceId,
    employmentId,
    ipAddress,
    userAgent,
    createdAt,
    timestamp: formatTs(createdAt),
    actor,
    actorInitials: initialsFrom(actor),
    target,
    module: referenceType,
    ip: ipAddress ?? '—',
  }
}

/** Ensure mock rows satisfy the full AuditLog shape. */
function normalizeMock(row: Partial<AuditLog> & { id: string; action: string }): AuditLog {
  return {
    id: row.id,
    action: row.action,
    description: row.description ?? row.target ?? '',
    referenceType: row.referenceType ?? row.module ?? 'SYSTEM',
    referenceId: row.referenceId ?? null,
    employmentId: row.employmentId ?? null,
    ipAddress: row.ipAddress ?? (row.ip && row.ip !== '—' ? row.ip : null),
    userAgent: row.userAgent ?? null,
    createdAt: row.createdAt ?? '',
    timestamp: row.timestamp ?? '—',
    actor: row.actor ?? 'System',
    actorInitials: row.actorInitials ?? 'SY',
    target: row.target ?? row.description ?? '—',
    module: row.module ?? row.referenceType ?? 'SYSTEM',
    ip: row.ip ?? row.ipAddress ?? '—',
  }
}

function applyClientFilters(items: AuditLog[], params?: AuditListParams): AuditLog[] {
  let out = items
  if (params?.search) {
    const q = params.search.toLowerCase()
    out = out.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.actor.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.target.toLowerCase().includes(q) ||
        l.referenceType.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q) ||
        String(l.referenceId ?? '').includes(q) ||
        String(l.employmentId ?? '').includes(q),
    )
  }
  if (params?.action && params.action !== 'All Actions') {
    const mapped = UI_ACTION_TO_API[params.action]
    const needle = (mapped ?? params.action).toLowerCase()
    out = out.filter((l) => l.action.toLowerCase().includes(needle))
  }
  if (params?.module && params.module !== 'All Modules') {
    const m = params.module.toLowerCase()
    const aliases: Record<string, string[]> = {
      roles: ['role', 'permission'],
      auth: ['login', 'session', 'password'],
      settings: ['organization', 'system'],
      users: ['employment', 'login'],
    }
    const keys = aliases[m] ?? [m]
    out = out.filter((l) => keys.some((k) => l.referenceType.toLowerCase().includes(k)))
  }
  return out
}

export async function listAuditLogs(params?: AuditListParams): Promise<AuditLog[]> {
  if (env.useMockApi) {
    await delay()
    const limit = params?.limit ?? 500
    return applyClientFilters(
      auditLogs.map((r) => normalizeMock(r as AuditLog)),
      params,
    ).slice(0, limit)
  }

  try {
    const query: Record<string, string | number> = {
      limit: params?.limit ?? 500,
      offset: 0,
    }

    if (params?.action && params.action !== 'All Actions') {
      const mapped = UI_ACTION_TO_API[params.action]
      const candidate = (mapped ?? params.action).toUpperCase()
      if (mapped && AUDIT_ACTIONS.has(candidate)) {
        query.action = candidate
      }
    }

    const fromTs = toIsoLocal(params?.dateFrom, params?.timeFrom, false)
    const toTs = toIsoLocal(params?.dateTo || params?.dateFrom, params?.timeTo, true)
    if (fromTs) query.from_ts = fromTs
    if (toTs) query.to_ts = toTs

    const { data } = await apiClient.get<AuditLogApi[] | { items?: AuditLogApi[] }>(
      AUDIT_LOGS_API,
      { params: query },
    )
    const items = (Array.isArray(data) ? data : data.items ?? []).map(mapApiAuditLog)
    return applyClientFilters(items, params)
  } catch {
    return []
  }
}

export async function recordAuditEvent(input: RecordAuditInput): Promise<void> {
  try {
    if (env.useMockApi) {
      await delay()
      const entry = normalizeMock({
        id: `AUD-${Date.now()}`,
        action: input.action,
        actor: input.actor ?? 'Current User',
        actorInitials: input.actorInitials ?? 'CU',
        target: input.target,
        module: input.module,
        description: input.target,
        referenceType: input.module,
        timestamp: new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        ip: input.ip ?? '—',
      })
      auditLogs.unshift(entry as never)
      return
    }
    const actionRaw = String(input.action || 'UPDATE').toUpperCase().replace(/\s+/g, '_')
    const action = AUDIT_ACTIONS.has(actionRaw) ? actionRaw : 'UPDATE'
    await apiClient.post(AUDIT_LOGS_API, {
      reference_type: 'SYSTEM',
      reference_id: 0,
      action,
      description: `${input.action}: ${input.target}`.slice(0, 500),
      ip_address: input.ip ?? null,
    })
  } catch {
    // best-effort
  }
}
