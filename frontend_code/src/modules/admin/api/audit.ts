/**
 * Audit API — list + best-effort record.
 * Mock uses admin/data/mock auditLogs; real hits /admin/audit/logs.
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { auditLogs } from '../data/mock'
import type { AuditLog, RecordAuditInput,AuditListParams } from '../types'
import { delay} from '@/shared/mock/db'





export async function listAuditLogs(params?: AuditListParams): Promise<AuditLog[]> {
  if (env.useMockApi) {
    await delay()
    const limit = params?.limit ?? 500
    let items = auditLogs.map((r) => ({ ...r }))
    // Mirror the backend contract so mock and real behave identically.
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
      items = items.filter((l) => l.action.toLowerCase().includes(params.action!.toLowerCase()))
    }
    if (params?.module && params.module !== 'All Modules') {
      items = items.filter((l) => l.module === params.module)
    }
    return items.slice(0, limit)
  }
  const { data } = await apiClient.get<AuditLog[]>('/admin/audit/logs', {
    params: {
      limit: params?.limit ?? 500,
      search: params?.search || undefined,
      action: params?.action && params.action !== 'All Actions' ? params.action : undefined,
      module: params?.module && params.module !== 'All Modules' ? params.module : undefined,
      dateFrom: params?.dateFrom || undefined,
      dateTo: params?.dateTo || undefined,
      timeFrom: params?.timeFrom || undefined,
      timeTo: params?.timeTo || undefined,
    },
  })
  return Array.isArray(data) ? data : []
}

/** Append an audit row after a successful admin action. */
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
    await apiClient.post('/admin/audit/events', input)
  } catch {
    // best-effort — never block the primary UX
  }
}
