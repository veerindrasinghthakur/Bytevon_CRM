import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { headOfficeList, offices } from '../data/mock'
import type { OfficeLocation, OfficeWriteInput } from '../types'
import { delay } from '@/shared/mock/db'
import { getLocations } from './organization'

/** UI row for head-office picker / display (aligned to location + settings). */
export type HeadOfficeOption = {
  id: string
  name: string
  country: string
  city: string
  state: string
  timezone: string
  currency: string
  fiscal: string
  address: string
  postal: string
}

function fiscalLabel(month?: number | null): string {
  if (month == null || !Number.isFinite(Number(month))) return '—'
  const names = [
    '',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const m = Number(month)
  return names[m] ? `Starts ${names[m]}` : `Month ${m}`
}

/** Map backend LocationResponse → HeadOfficeOption. */
export function mapLocationToHeadOption(loc: Record<string, unknown>): HeadOfficeOption {
  return {
    id: String(loc.id),
    name: String(loc.name ?? '—'),
    country: String(loc.country ?? '—'),
    city: String(loc.city ?? '—'),
    state: String(loc.state ?? '—'),
    timezone: String(loc.timezone ?? '—'),
    currency: String(loc.currency ?? '—'),
    fiscal: fiscalLabel(loc.fiscal_year_start_month as number | undefined),
    address: String(loc.address ?? '—'),
    postal: '—',
  }
}

export async function listOffices(): Promise<OfficeLocation[]> {
  if (env.useMockApi) {
    await delay()
    return offices.map((o) => ({ ...o }))
  }
  // Prefer real locations API (no /admin/offices)
  const { items } = await getLocations()
  return items.map((loc) => {
    const o = mapLocationToHeadOption(loc as unknown as Record<string, unknown>)
    return {
      id: o.id,
      name: o.name,
      country: o.country,
      city: o.city,
      timezone: o.timezone,
      currency: o.currency,
      fiscal: o.fiscal,
      address: o.address,
      postal: o.postal,
    }
  })
}

export async function getOffice(officeId: string): Promise<OfficeLocation | null> {
  if (env.useMockApi) {
    await delay()
    return offices.find((o) => o.id === officeId) ?? null
  }
  try {
    const { data } = await apiClient.get<Record<string, unknown>>(`/organization/locations/${officeId}`)
    const o = mapLocationToHeadOption(data)
    return {
      id: o.id,
      name: o.name,
      country: o.country,
      city: o.city,
      timezone: o.timezone,
      currency: o.currency,
      fiscal: o.fiscal,
      address: o.address,
      postal: o.postal,
    }
  } catch {
    return null
  }
}

export async function createOffice(input: OfficeWriteInput): Promise<OfficeLocation> {
  if (env.useMockApi) {
    await delay(400)
    const id =
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 24) || `office-${Date.now()}`
    const row: OfficeLocation = {
      id,
      name: input.name,
      country: input.country,
      city: input.city,
      timezone: input.timezone,
      currency: input.currency,
      fiscal: input.fiscal,
      address: input.address,
      postal: input.postal,
    }
    offices.push(row)
    return { ...row }
  }
  const { data } = await apiClient.post<Record<string, unknown>>('/organization/locations', {
    name: input.name,
    country: input.country,
    city: input.city,
    state: input.country,
    timezone: input.timezone,
    currency: input.currency,
    address: input.address,
    latitude: 0,
    longitude: 0,
  })
  const o = mapLocationToHeadOption(data)
  return {
    id: o.id,
    name: o.name,
    country: o.country,
    city: o.city,
    timezone: o.timezone,
    currency: o.currency,
    fiscal: o.fiscal,
    address: o.address,
    postal: o.postal,
  }
}

export async function updateOffice(
  officeId: string,
  input: Partial<OfficeWriteInput>,
): Promise<OfficeLocation> {
  if (env.useMockApi) {
    await delay(400)
    const row = offices.find((o) => o.id === officeId)
    if (!row) throw new Error('Office not found')
    Object.assign(row, input)
    return { ...row }
  }
  const { data } = await apiClient.patch<Record<string, unknown>>(
    `/organization/locations/${officeId}`,
    input,
  )
  const o = mapLocationToHeadOption(data)
  return {
    id: o.id,
    name: o.name,
    country: o.country,
    city: o.city,
    timezone: o.timezone,
    currency: o.currency,
    fiscal: o.fiscal,
    address: o.address,
    postal: o.postal,
  }
}

/**
 * All non-archived locations for the head-office picker.
 * Backend: GET /organization/locations (not /admin/offices/*).
 */
export async function listHeadOfficeOptions(): Promise<HeadOfficeOption[]> {
  if (env.useMockApi) {
    await delay()
    const source = Array.isArray(headOfficeList) && headOfficeList.length ? headOfficeList : offices
    return source.map((o) => ({
      id: String(o.id),
      name: o.name,
      country: o.country,
      city: o.city,
      state: '',
      timezone: o.timezone,
      currency: o.currency,
      fiscal: o.fiscal,
      address: o.address,
      postal: o.postal ?? '—',
    }))
  }

  const { items } = await getLocations({ includeArchived: false })
  return items.map((loc) => mapLocationToHeadOption(loc as unknown as Record<string, unknown>))
}
