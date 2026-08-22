/** Project list aggregates from API rows. */

export interface ProjectMetricInput {
  status: string
  progress?: number | null
}

export function computeProjectListMetrics(items: ProjectMetricInput[]) {
  const total = items.length
  const active = items.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'PLANNING').length
  const atRisk = items.filter((p) => p.status === 'ON_HOLD').length
  const completed = items.filter((p) => p.status === 'COMPLETED').length
  const avgProgress =
    total === 0
      ? 0
      : Math.round(
          items.reduce((s, p) => s + (p.progress ?? 0), 0) / total,
        )
  return { total, active, atRisk, completed, avgProgress }
}
