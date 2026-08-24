/**
 * Audit API — list + best-effort record.
 * Mock uses admin/data/mock auditLogs; real hits /admin/audit/logs.
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { auditLogs } from '../data/mock'
import type { AuditLog, RecordAuditInput } from '../types'

function delay(ms = 80) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function listAuditLogs(params?: { limit?: number }): Promise<AuditLog[]> {
  if (env.useMockApi) {
    await delay()
    const limit = params?.limit ?? 500
    return auditLogs.slice(0, limit).map((r) => ({ ...r }))
  }
  const { data } = await apiClient.get<AuditLog[]>('/admin/audit/logs', {
    params: { limit: params?.limit ?? 500 },
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
