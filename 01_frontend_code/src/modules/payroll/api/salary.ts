import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { getDb } from '@/shared/mock/db'
import { salaryStructures, updateSalaryStructure, payrollEmployees } from '@/shared/mock/data/payroll'
import type { PayrollEmployeeRow, SalaryItem, SalaryStructure, SaveSalaryStructureInput } from '../types'
import { normalizeEmployee } from './_helpers'

/** employment_id path param. */
export async function getSalaryStructure(employeeId: string): Promise<SalaryStructure | null> {
  if (env.useMockApi) {
    await delay(200)
    const s = salaryStructures[employeeId]
    if (!s) return null
    return { ...s, items: s.items.map((i) => ({ ...i })) }
  }
  try {
    const { data } = await apiClient.get<unknown>(
      `/payroll/salaries/current/${encodeURIComponent(employeeId)}`,
    )
    return normalizeSalaryStructure(
      (data ?? {}) as Record<string, unknown>,
      employeeId,
    )
  } catch {
    return null
  }
}

/** Map backend EmployeeSalary rows (snake_case) or mock structures to SalaryStructure. */
export function normalizeSalaryStructure(
  raw: Record<string, unknown>,
  employeeId: string,
): SalaryStructure | null {
  if (!raw || typeof raw !== 'object') return null
  if (Array.isArray(raw)) return null
  const itemsRaw = Array.isArray(raw.items) ? raw.items : []
  const items: SalaryItem[] = itemsRaw.map((row, idx) => {
    const r = (row ?? {}) as Record<string, unknown>
    const type = String(r.type ?? 'EARNING').toUpperCase() === 'DEDUCTION' ? 'DEDUCTION' : 'EARNING'
    return {
      id: String(r.id ?? `${employeeId}-item-${idx}`),
      name: String(r.name ?? `Item ${idx + 1}`),
      type,
      amount: Number(r.amount ?? 0),
    }
  })
  const effectiveTo =
    raw.effectiveTo !== undefined
      ? (raw.effectiveTo as string | null)
      : raw.effective_to !== undefined && raw.effective_to !== null
        ? String(raw.effective_to)
        : null
  return {
    employeeId: String(raw.employeeId ?? raw.employment_id ?? raw.employmentId ?? employeeId),
    effectiveFrom: String(raw.effectiveFrom ?? raw.effective_from ?? ''),
    effectiveTo,
    currency: String(raw.currency ?? 'USD'),
    payFrequency: (raw.payFrequency ?? 'Monthly') as SalaryStructure['payFrequency'],
    items,
    status: (raw.status as SalaryStructure['status']) ?? (effectiveTo ? 'ARCHIVED' : 'ACTIVE'),
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
  const items = (input as { items?: SalaryItem[] }).items ?? []
  const gross_salary = items
    .filter((i) => i.type === 'EARNING')
    .reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const body = {
    employment_id: Number(employeeId),
    ...input,
    gross_salary,
    effective_from: (input as { effectiveFrom?: string }).effectiveFrom,
  }
  const { data } = await apiClient.post<SalaryStructure>('/payroll/salaries', body)
  return data
}

/** Employment ids with no open salary version (Add Payroll picker source). */
export async function listUnconfiguredEmploymentIds(): Promise<string[]> {  if (env.useMockApi) {
    await delay(200)
    const db = getDb() as unknown as { employments?: Array<{ id?: number | string }> }
    return (db.employments ?? [])
      .map((e) => String(e.id ?? ''))
      .filter((id) => id && !(id in salaryStructures))
  }
  const { data } = await apiClient.get<Array<number | string>>(
    '/payroll/salaries/unconfigured',
  )
  return (Array.isArray(data) ? data : []).map((v) => String(v))
}

/** Full version history for one employment (newest first). */export async function listSalaryVersions(employeeId: string): Promise<SalaryStructure[]> {
  if (env.useMockApi) {
    await delay(200)
    const s = salaryStructures[employeeId]
    return s ? [{ ...s, items: s.items.map((i) => ({ ...i })) }] : []
  }
  try {
    const { data } = await apiClient.get<unknown[]>(
      `/payroll/salaries/${encodeURIComponent(employeeId)}`,
    )
    const rows = Array.isArray(data) ? data : []
    return rows
      .map((r) => normalizeSalaryStructure((r ?? {}) as Record<string, unknown>, employeeId))
      .filter((s): s is SalaryStructure => s !== null)
  } catch {
    return []
  }
}

/** Open salary versions with employment display (salary page source). */
export async function listOpenSalaries(search?: string): Promise<PayrollEmployeeRow[]> {
  if (env.useMockApi) {
    await delay(200)
    const q = (search ?? '').trim().toLowerCase()
    return Object.entries(salaryStructures)
      .map(([employeeId, s]) => ({ employeeId, s }))
      .filter(({ employeeId, s }) => {
        if (!q) return true
        const emp = payrollEmployees.find((e) => e.id === employeeId)
        return (
          s.employeeId.toLowerCase().includes(q) ||
          (emp?.name ?? '').toLowerCase().includes(q) ||
          (emp?.code ?? '').toLowerCase().includes(q)
        )
      })
      .map(({ employeeId, s }) => {
        const emp = payrollEmployees.find((e) => e.id === employeeId)
        return normalizeEmployee({
          id: employeeId,
          employmentId: employeeId,
          name: emp?.name,
          code: emp?.code,
          role: emp?.role,
          department: emp?.department,
          gross: emp?.gross,
          effectiveFrom: s.effectiveFrom,
          salaryStatus: s.status,
          status: emp?.status ?? 'Calculated',
        } as unknown as Record<string, unknown>)
      })
  }
  const { data } = await apiClient.get<unknown[]>('/payroll/salaries/open', {
    params: search ? { search } : undefined,
  })
  const rows = Array.isArray(data) ? data : []
  return rows.map((r) => normalizeEmployee((r ?? {}) as Record<string, unknown>))
}
