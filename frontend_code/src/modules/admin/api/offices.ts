import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { headOfficeList, offices } from '../data/mock'
import type { OfficeLocation } from '../types'

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function listOffices(): Promise<OfficeLocation[]> {
  if (env.useMockApi) {
    await delay()
    return offices.map((o) => ({ ...o }))
  }
  const { data } = await apiClient.get<OfficeLocation[]>('/admin/offices')
  return data
}

export async function getOffice(officeId: string): Promise<OfficeLocation | null> {
  if (env.useMockApi) {
    await delay()
    return offices.find((o) => o.id === officeId) ?? null
  }
  try {
    const { data } = await apiClient.get<OfficeLocation>(`/admin/offices/${officeId}`)
    return data
  } catch {
    return null
  }
}

/** Compact head-office picker rows (same source as listOffices). */
export async function listHeadOfficeOptions() {
  if (env.useMockApi) {
    await delay()
    return headOfficeList.map((o) => ({ ...o }))
  }
  const { data } = await apiClient.get<typeof headOfficeList>('/admin/offices/head-options')
  return data
}
