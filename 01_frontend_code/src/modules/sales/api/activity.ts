/**
 * Sales activity timeline API.
 *
 * Live backend returns audit-backed items:
 * {id, kind, lead_id, lead_title, action, text, actor, time, type}.
 * Normalized here to the UI SalesActivity shape.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { salesActivities as seedActivities } from '../data/mock'
import type { SalesActivity } from '../types'

const KIND_TO_TYPE: Record<string, SalesActivity['type']> = {
  lead_created: 'Lead Created',
  lead_won: 'Lead Won',
  lead_deleted: 'System Alert',
  status_changed: 'Proposal Sent',
  lead_updated: 'Lead Created',
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function dateGroup(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Recent'
  const now = new Date()
  const day = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`
  if (day(d) === day(now)) return 'Today'
  const y = new Date(now)
  y.setDate(y.getDate() - 1)
  if (day(d) === day(y)) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function mapApiActivity(r: Record<string, unknown>): SalesActivity {
  // Already UI-shaped (mock passthrough)?
  if (typeof r.title === 'string' && typeof r.body === 'string') {
    return r as unknown as SalesActivity
  }
  const kind = String(r.kind ?? 'lead_updated')
  const text = String(r.text ?? '')
  const actor = String(r.actor ?? 'System')
  const time = String(r.time ?? '')
  return {
    id: String(r.id ?? `${kind}-${time}`),
    type: KIND_TO_TYPE[kind] ?? 'Lead Created',
    title: text || 'Lead activity',
    body: actor && actor !== 'System' ? `${actor} · ${text}` : text,
    actor,
    time: formatTime(time),
    dateGroup: dateGroup(time),
    tag: kind,
  } as SalesActivity
}

export async function listSalesActivities(opts?: {
  leadId?: number
  limit?: number
}): Promise<SalesActivity[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<Array<Record<string, unknown>>>('/sales/activity', {
      params: {
        lead_id: opts?.leadId,
        limit: opts?.limit ?? 10,
      },
    })
    return (Array.isArray(data) ? data : []).map(mapApiActivity)
  }
  await delay()
  return seedActivities
}
