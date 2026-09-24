import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { salaryStructures, updateSalaryStructure } from '@/shared/mock/data/payroll'
import type { SalaryItem, SalaryStructure, SaveSalaryStructureInput } from '../types'

/** employment_id path param. */
export async function getSalaryStructure(employeeId: string): Promise<SalaryStructure | null> {
  if (env.useMockApi) {
    await delay(200)
    const s = salaryStructures[employeeId]
    if (!s) return null
    return { ...s, items: s.items.map((i) => ({ ...i })) }
  }
  try {
    const { data } = await apiClient.get<SalaryStructure>(
      `/payroll/salaries/current/${encodeURIComponent(employeeId)}`,
    )
    return data
  } catch {
    return null
  }
}

/** Versioned close+insert via POST /payroll/salaries (not PUT). */
export async function saveSalaryStructure(
  employeeId: string,
  input: SaveSalaryStructureInput | { effectiveFrom: string; items: SalaryItem[] },
): Promise<SalaryStructure> {
  if (env.useMockApi) {
    await delay(400)
    return updateSalaryStructure(employeeId, input)
  }
  const body = {
    employment_id: Number(employeeId),
    ...input,
    effective_from: (input as { effectiveFrom?: string }).effectiveFrom,
  }
  const { data } = await apiClient.post<SalaryStructure>('/payroll/salaries', body)
  return data
}
