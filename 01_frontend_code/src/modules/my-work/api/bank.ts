import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { bankDetailsSeed } from '@/shared/mock/data/my-work'
import type { BankDetails } from '../types'

let mockStore: BankDetails | null = { ...bankDetailsSeed }

export async function getBankDetails(): Promise<BankDetails | null> {
  if (env.useMockApi) {
    await delay()
    return mockStore ? { ...mockStore } : null
  }
  const { data } = await apiClient.get<BankDetails | null>('/my-work/bank-details')
  return data
}

export async function saveBankDetails(body: BankDetails): Promise<BankDetails> {
  if (env.useMockApi) {
    await delay()
    mockStore = { ...body, id: body.id ?? 'bank-1', confirmAccountNumber: body.accountNumber }
    return { ...mockStore }
  }
  const { data } = await apiClient.put<BankDetails>('/my-work/bank-details', body)
  return data
}
