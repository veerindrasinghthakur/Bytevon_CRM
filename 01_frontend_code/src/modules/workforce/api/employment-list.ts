/**
 * Employment list API.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb } from '@/shared/mock/db'
import { paginateItems, type EntityListParams } from '@/shared/lib/list-params'
import {
  enrichListRow,
  buildMetrics,
  mapApiEmployment,
} from './employment-helpers'

export type EmploymentListItem = ReturnType<typeof enrichListRow>

export async function listEmployments(
  params: {
    status?: string
    department?: string
    state?: string
    type?: string
  } & EntityListParams = {},
) {
  const { page = 1, pageSize = 20, search, status, department, state, type } = params
  const stateFilter = state ?? status

  if (!env.useMockApi) {
    const limit = Math.min(500, Math.max(Number(pageSize) || 20, 1) * Math.max(Number(page) || 1, 1))
    const { data } = await apiClient.get<
      | Array<Record<string, unknown>>
      | {
          items?: Array<Record<string, unknown>>
          total?: number
          metrics?: ReturnType<typeof buildMetrics>
        }
    >('/workforce/employments', {
      params: {
        state: stateFilter || undefined,
        limit,
        offset: 0,
      },
    })
    const raw = Array.isArray(data) ? data : (data.items ?? [])
    let items = raw.filter(Boolean).map((row) => mapApiEmployment(row as Record<string, unknown>))
    if (search) {
      const q = String(search).toLowerCase()
      items = items.filter(
        (e) =>
          e.employee_code.toLowerCase().includes(q) ||
          e.fullName.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.departmentName.toLowerCase().includes(q) ||
          e.positionName.toLowerCase().includes(q),
      )
    }
    if (type) {
      items = items.filter((e) => e.employment_type === type)
    }
    if (department) {
      const deptId = Number(department)
      if (Number.isFinite(deptId)) {
        items = items.filter((e) => e.departmentId === deptId)
      } else {
        const q = department.toLowerCase()
        items = items.filter((e) => e.departmentName.toLowerCase().includes(q))
      }
    }
    const metrics = buildMetrics(items)
    const pageResult = paginateItems(items, Number(page) || 1, Number(pageSize) || 20)
    return { ...pageResult, metrics }
  }

  await delay()
  let items = getDb().employments.map((e) => enrichListRow(e))
  if (search) {
    const q = String(search).toLowerCase()
    items = items.filter(
      (e) =>
        e.employee_code.toLowerCase().includes(q) ||
        e.fullName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.departmentName.toLowerCase().includes(q) ||
        e.positionName.toLowerCase().includes(q),
    )
  }
  if (stateFilter) {
    items = items.filter((e) => e.current_state === stateFilter)
  }
  if (type) {
    items = items.filter((e) => e.employment_type === type)
  }
  if (department) {
    const deptId = Number(department)
    if (Number.isFinite(deptId)) {
      items = items.filter((e) => e.departmentId === deptId)
    } else {
      const q = department.toLowerCase()
      items = items.filter((e) => e.departmentName.toLowerCase().includes(q))
    }
  }
  const metrics = buildMetrics(items)
  if (page != null || pageSize != null) {
    const pageResult = paginateItems(items, Number(page) || 1, Number(pageSize) || 20)
    return { ...pageResult, metrics }
  }
  return { items, total: items.length, metrics }
}
