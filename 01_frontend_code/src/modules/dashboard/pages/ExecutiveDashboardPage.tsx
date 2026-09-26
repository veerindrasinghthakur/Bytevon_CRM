import { useNavigate } from '@tanstack/react-router'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useHomeDashboard } from '../hooks/use-home-dashboard'
import { ExecutiveHero } from '../components/executive/executive-hero'
import { ExecutiveQuickActions } from '../components/executive/executive-quick-actions'
import { ExecutiveKpiStrip } from '../components/executive/executive-kpi-strip'
import { ExecutiveTrends } from '../components/executive/executive-trends'
import { ExecutiveBottomRow } from '../components/executive/executive-bottom-row'

export function ExecutiveDashboardPage() {
  const navigate = useNavigate()
  const {
    kpis,
    pending,
    activities,
    meta,
    quickActions,
    sections,
    canApprove,
    isLoading,
    isError,
    error,
    refetch,
  } = useHomeDashboard()

  const go = (to: string) => safeNavigate(navigate, { to, search: {} })

  if (isError) {
    return (
      <div className="py-16">
        <ErrorState
          title="Could not load dashboard"
          description={getApiErrorMessage(error, 'We could not load the dashboard data.')}
          onRetry={() => void refetch?.()}
        />
      </div>
    )
  }

  if (isLoading || !meta) {
    return (
      <div className="py-16 text-center text-body-sm text-on-surface-variant">
        Loading dashboard…
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero — always */}
      <ExecutiveHero meta={meta} />

      {/* Quick actions — RBAC filtered */}
      <ExecutiveQuickActions quickActions={quickActions} onNavigate={go} />

      {/* KPI strip — RBAC filtered */}
      <ExecutiveKpiStrip kpis={kpis} />

      {/* Trends — attendance / pipeline by permission */}
      <ExecutiveTrends
        meta={meta}
        showAttendance={sections.attendance_trend}
        showPipeline={sections.pipeline_trend}
      />

      {/* Bottom panels */}
      <ExecutiveBottomRow
        pending={pending}
        activities={activities}
        sections={sections}
        canApprove={canApprove}
        onNavigate={go}
      />
    </div>
  )
}
