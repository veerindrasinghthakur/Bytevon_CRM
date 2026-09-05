/**
 * Home dashboard (/dashboard) — API metrics + RBAC-filtered catalog.
 */
import { useMemo } from 'react'
import { useRbac } from '@/shared/rbac'
import { useExecutiveDashboard } from './use-executive-dashboard'
import {
  HOME_KPI_DEFS,
  HOME_QUICK_ACTIONS,
  HOME_SECTIONS,
  MAX_QUICK_ACTIONS,
  isGateAllowed,
  type DashboardSectionId,
} from '../catalog'

export function useHomeDashboard() {
  const exec = useExecutiveDashboard()
  const { can, isLoading: rbacLoading, isSuperAdmin, scope } = useRbac()

  const quickActions = useMemo(() => {
    return HOME_QUICK_ACTIONS.filter((a) => isGateAllowed(a, can))
      .sort((a, b) => a.priority - b.priority)
      .slice(0, MAX_QUICK_ACTIONS)
  }, [can])

  const kpis = useMemo(() => {
    const allowedLabels = new Set(
      HOME_KPI_DEFS.filter((d) => isGateAllowed(d, can)).map((d) => d.label),
    )
    // Map mock "Revenue" → pipeline slot when lead VIEW and no revenue resource
    const fromApi = exec.kpis.filter((k) => {
      if (k.label === 'Revenue') return allowedLabels.has('Pipeline')
      return allowedLabels.has(k.label)
    })
    return fromApi.map((k) =>
      k.label === 'Revenue' ? { ...k, label: 'Pipeline', icon: 'trending_up' } : k,
    )
  }, [can, exec.kpis])

  const sections = useMemo(() => {
    const map = {} as Record<DashboardSectionId, boolean>
    for (const s of HOME_SECTIONS) {
      map[s.id] = isGateAllowed(s, can)
    }
    return map
  }, [can])

  const canApprove = can('APPROVE', 'approval')

  return {
    ...exec,
    quickActions,
    kpis,
    sections,
    canApprove,
    isSuperAdmin,
    scope,
    isLoading: exec.isLoading || rbacLoading,
  }
}
