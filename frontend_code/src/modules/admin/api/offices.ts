import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { headOfficeList, offices } from '../data/mock'
import type { OfficeLocation,OfficeWriteInput } from '../types'
import { delay} from '@/shared/mock/db'



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
  const { data } = await apiClient.post<OfficeLocation>('/admin/offices', input)
  return data
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
  const { data } = await apiClient.patch<OfficeLocation>(`/admin/offices/${officeId}`, input)
  return data
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
