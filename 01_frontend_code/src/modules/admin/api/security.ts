/**
 * Security Center — events + KPIs derived from /audit/logs.
 */

import { env } from '@/config/env'
import { adminKpis, securityEvents } from '../data/mock'
import type { AdminKpis, AuditLog, SecurityEvent } from '../types'
import { delay } from '@/shared/mock/db'
import { listAuditLogs } from './audit'
import { listAdminUsers } from './users'

const AUTH_ACTIONS = new Set([
  'LOGIN',
  'LOGOUT',
  'PASSWORD_CHANGE',
  'PASSWORD_RESET',
  'SESSION_REVOKE',
  'LOCK',
  'UNLOCK',
  'CREATE',
  'UPDATE',
  'ARCHIVE',
  'APPROVE',
  'REJECT',
])

function mapAuditToSecurityEvent(log: AuditLog): SecurityEvent {
  const action = (log.action || '').toUpperCase()
  let status: SecurityEvent['status'] = 'Success'
  if (action.includes('FAIL') || action.includes('DENIED') || action.includes('BLOCK')) {
    status = 'Blocked'
  } else if (action.includes('LOCK') || action.includes('WARN') || action === 'REJECT') {
    status = 'Warning'
  }

  return {
    id: log.id,
    eventType: log.action || 'Audit',
    identity: log.actor || '—',
    employmentId: log.employmentId,
    source: log.ipAddress || log.referenceType || 'system',
    ipAddress: log.ipAddress,
    referenceType: log.referenceType,
    description: log.description || log.target,
    timestamp: log.timestamp,
    status,
  }
}

function normalizeMockEvent(e: SecurityEvent): SecurityEvent {
  return {
    id: e.id,
    eventType: e.eventType,
    identity: e.identity,
    employmentId: e.employmentId ?? null,
    source: e.source,
    ipAddress: e.ipAddress ?? null,
    referenceType: e.referenceType ?? 'LOGIN',
    description: e.description ?? e.eventType,
    timestamp: e.timestamp,
    status: e.status,
  }
}

export async function listSecurityEvents(): Promise<SecurityEvent[]> {
  if (env.useMockApi) {
    await delay()
    return securityEvents.map((e) => normalizeMockEvent(e as SecurityEvent))
  }

  try {
    const logs = await listAuditLogs({ limit: 100 })
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
      return a.includes('FAIL') || a.includes('LOCK') || a.includes('DENIED') || a === 'REJECT'
    }).length
  } catch {
    /* zeros */
  }

  try {
    const users = await listAdminUsers({ page: 1, pageSize: 1 })
    activeSessions = users.active ?? users.total ?? 0
  } catch {
    /* zero */
  }

  const securityScore = Math.max(60, Math.min(100, 100 - openAlerts * 5))

  return {
    securityScore,
    activeSessions,
    openAlerts,
    mfaAdoption: 0,
    auditEventsToday,
  }
}
