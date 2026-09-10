/**
 * Security Center data — events + posture KPIs.
 *
 * Backend has no /admin/security/events or /admin/metrics/hub.
 * Derive from GET /audit/logs + org user list where possible.
 */

import { env } from '@/config/env'
import { adminKpis, securityEvents } from '../data/mock'
import type { AdminKpis, SecurityEvent } from '../types'
import { delay } from '@/shared/mock/db'
import { listAuditLogs } from './audit'
import { listAdminUsers } from './users'

const AUTH_ACTIONS = new Set([
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'PASSWORD_CHANGE',
  'PASSWORD_RESET',
  'SESSION_REVOKE',
  'LOCK',
  'UNLOCK',
  'CREATE',
  'UPDATE',
  'DELETE',
])

function mapAuditToSecurityEvent(log: {
  id: string
  action: string
  actor: string
  target: string
  module: string
  timestamp: string
  ip: string
}): SecurityEvent {
  const action = (log.action || '').toUpperCase()
  let status: SecurityEvent['status'] = 'Success'
  if (action.includes('FAIL') || action.includes('DENIED') || action.includes('BLOCK')) {
    status = 'Blocked'
  } else if (action.includes('LOCK') || action.includes('WARN')) {
    status = 'Warning'
  }

  return {
    id: log.id,
    eventType: log.action || 'Audit',
    identity: log.actor || '—',
    source: log.ip && log.ip !== '—' ? log.ip : log.module || 'system',
    timestamp: log.timestamp,
    status,
  }
}

export async function listSecurityEvents(): Promise<SecurityEvent[]> {
  if (env.useMockApi) {
    await delay()
    return securityEvents.map((e) => ({ ...e }))
  }

  try {
    const logs = await listAuditLogs({ limit: 100 })
    // Prefer auth-ish rows; fall back to recent audit
    const authish = logs.filter((l) => AUTH_ACTIONS.has(String(l.action).toUpperCase()))
    const source = authish.length ? authish : logs
    return source.slice(0, 50).map(mapAuditToSecurityEvent)
  } catch {
    return []
  }
}

export async function getSecurityKpis(): Promise<
  Pick<
    AdminKpis,
    'securityScore' | 'activeSessions' | 'openAlerts' | 'mfaAdoption' | 'auditEventsToday'
  >
> {
  if (env.useMockApi) {
    await delay()
    return {
      securityScore: adminKpis.securityScore ?? 94,
      activeSessions: adminKpis.activeSessions,
      openAlerts: adminKpis.openAlerts ?? 0,
      mfaAdoption: adminKpis.mfaAdoption ?? 0,
      auditEventsToday: adminKpis.auditEventsToday,
    }
  }

  // No /admin/metrics/hub — compose from audit + users
  let auditEventsToday = 0
  let openAlerts = 0
  let activeSessions = 0

  try {
    const today = new Date().toISOString().slice(0, 10)
    const logs = await listAuditLogs({
      limit: 500,
      dateFrom: today,
      dateTo: today,
    })
    auditEventsToday = logs.length
    openAlerts = logs.filter((l) => {
      const a = String(l.action).toUpperCase()
      return a.includes('FAIL') || a.includes('LOCK') || a.includes('DENIED')
    }).length
  } catch {
    /* keep zeros */
  }

  try {
    const users = await listAdminUsers({ page: 1, pageSize: 1 })
    // Active logins as a proxy for "sessions" until session list API exists
    activeSessions = users.active ?? users.total ?? 0
  } catch {
    /* keep zero */
  }

  // Simple posture score: start 100, subtract for open alerts (capped)
  const securityScore = Math.max(60, Math.min(100, 100 - openAlerts * 5))

  return {
    securityScore,
    activeSessions,
    openAlerts,
    mfaAdoption: 0, // MFA not in V1
    auditEventsToday,
  }
}
