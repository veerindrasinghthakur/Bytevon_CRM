/**
 * Workforce list metrics — pure compute from API/list data.
 * Pages must not re-implement these aggregations inline.
 */

import {DepartmentMetricInput,EmploymentMetricInput} from '@/modules/workforce/types'

export function computeDepartmentListMetrics(items: DepartmentMetricInput[]) {
  const total = items.length
  const active = items.filter((d) => d.status === 'Active').length
  const inactive = items.filter((d) => d.status !== 'Active').length
  const staffing = items.reduce((sum, d) => sum + (d.staffCount ?? 0), 0)
  return { total, active, inactive, staffing }
}



const ACTIVE_STATES = new Set(['CONFIRMED', 'PROBATION', 'ONBOARDING'])
const ARCHIVED_STATES = new Set(['RESIGNED', 'TERMINATED', 'ALUMNI'])

export function computeEmploymentListMetrics(items: EmploymentMetricInput[]) {
  return {
    total: items.length,
    active: items.filter((e) => ACTIVE_STATES.has(e.current_state)).length,
    archived: items.filter((e) => ARCHIVED_STATES.has(e.current_state)).length,
  }
}
