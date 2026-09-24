import { env } from '@/config/env'
import axios from 'axios'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
import type { BankDetails } from '@/modules/my-work/types'

// In-memory store keyed by employee ID
const mockStore = new Map<number, BankDetails>()

export async function getEmployeeBankDetails(employeeId: number): Promise<BankDetails | null> {
  if (env.useMockApi) {
    await delay()
    return mockStore.get(employeeId) ? { ...mockStore.get(employeeId)! } : null
  }
  try {
    const { data } = await apiClient.get<BankDetails | null>(`/payroll/bank-accounts/${employeeId}/primary`)
    return data
  } catch (err) {
    // No primary bank set yet is an empty state, not an error.
    if (axios.isAxiosError(err) && err.response?.status === 404) return null
    throw err
  }
}

export async function saveEmployeeBankDetails(employeeId: number, body: BankDetails): Promise<BankDetails> {
  if (env.useMockApi) {
    await delay()
    const record = { ...body, id: body.id ?? `bank-${employeeId}`, confirmAccountNumber: body.accountNumber }
    mockStore.set(employeeId, record)
    return { ...record }
  }
  const { data } = await apiClient.post<BankDetails>(`/payroll/bank-accounts`, body)
  return data
}