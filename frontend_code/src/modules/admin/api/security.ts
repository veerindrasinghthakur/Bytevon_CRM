/**
 * Security Center data — events + posture KPIs.
 * Mock: admin/data/mock. Real: /admin/security/events + /admin/metrics/hub.
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { adminKpis, securityEvents } from '../data/mock'
import type { AdminKpis, SecurityEvent } from '../types'

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function listSecurityEvents(): Promise<SecurityEvent[]> {
  if (env.useMockApi) {
    await delay()
    return securityEvents.map((e) => ({ ...e }))
  }
  const { data } = await apiClient.get<SecurityEvent[]>('/admin/security/events')
  return Array.isArray(data) ? data : []
}

export async function getSecurityKpis(): Promise<
  Pick<AdminKpis, 'securityScore' | 'activeSessions' | 'openAlerts' | 'mfaAdoption' | 'auditEventsToday'>
> {
  if (env.useMockApi) {
    await delay()
    return {
      securityScore: adminKpis.securityScore,
      activeSessions: adminKpis.activeSessions,
      openAlerts: adminKpis.openAlerts,
      mfaAdoption: adminKpis.mfaAdoption,
      auditEventsToday: adminKpis.auditEventsToday,
    }
  }
  const { data } = await apiClient.get<Record<string, unknown>>('/admin/metrics/hub')
  return {
    securityScore: Number(data.securityScore ?? 94),
    activeSessions: Number(data.activeSessions ?? 0),
    openAlerts: Number(data.openAlerts ?? 0),
    mfaAdoption: Number(data.mfaAdoption ?? 0),
    auditEventsToday: Number(data.auditEventsToday ?? 0),
  }
}
