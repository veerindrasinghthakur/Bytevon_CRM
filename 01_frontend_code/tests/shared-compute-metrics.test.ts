import { describe, expect, it } from 'vitest'
import { computeProjectListMetrics } from '@/shared/compute/project-metrics'
import {
  computeDepartmentListMetrics,
  computeEmploymentListMetrics,
} from '@/shared/compute/workforce-metrics'

describe('computeProjectListMetrics', () => {
  it('aggregates status buckets and average progress', () => {
    const m = computeProjectListMetrics([
      { status: 'IN_PROGRESS', progress: 50 },
      { status: 'PLANNING', progress: 10 },
      { status: 'ON_HOLD', progress: 90 },
      { status: 'COMPLETED', progress: 100 },
    ])
    expect(m).toMatchObject({ total: 4, active: 2, atRisk: 1, completed: 1, avgProgress: 63 })
  })
  it('handles empty input', () => {
    expect(computeProjectListMetrics([])).toMatchObject({ total: 0, avgProgress: 0 })
  })
})

describe('workforce metrics', () => {
  it('splits departments active/inactive and sums staffing', () => {
    const m = computeDepartmentListMetrics([
      { status: 'Active', staffCount: 3 },
      { status: 'Archived', staffCount: 2 },
    ] as never)
    expect(m).toMatchObject({ total: 2, active: 1, inactive: 1, staffing: 5 })
  })
  it('buckets employment states into active/archived', () => {
    const m = computeEmploymentListMetrics([
      { current_state: 'CONFIRMED' },
      { current_state: 'PROBATION' },
      { current_state: 'RESIGNED' },
      { current_state: 'TERMINATED' },
      null,
    ] as never)
    expect(m).toMatchObject({ total: 4, active: 2, archived: 2 })
  })
})
