import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { queryKeys } from '@/shared/lib/query-keys'
import { getSecurityKpis, listSecurityEvents } from '../api/security'
import { securityScoreDefault } from '../schemas/enums'
import { MetricCard } from '@/shared/components/ui/MetricCard'
import { UnavailableProtocol, ProtocolRow } from '../components/SecurityProtocols'
import { useSecurityScoreAnimation } from '../hooks/use-security-score'
import { securityEventBadge } from '../schemas/enums'

export function SecurityCenterPage() {
  const [sessionTimeout, setSessionTimeout] = useState(true)

  const kpisQuery = useQuery({
    queryKey: queryKeys.admin.security.kpis(),
    queryFn: getSecurityKpis,
  })
  const eventsQuery = useQuery({
    queryKey: queryKeys.admin.security.events(),
    queryFn: listSecurityEvents,
  })

  const targetScore = kpisQuery.data?.securityScore ?? securityScoreDefault
  const score = useSecurityScoreAnimation(targetScore, kpisQuery.isLoading)

  if (kpisQuery.isLoading || eventsQuery.isLoading) {
    return <PageLoadingSkeleton />
  }

  if (kpisQuery.isError || eventsQuery.isError) {
    return (
      <ErrorState
        title="Could not load security center"
        onRetry={() => {
          void kpisQuery.refetch()
          void eventsQuery.refetch()
        }}
      />
    )
  }

  const kpis = kpisQuery.data!
  const events = eventsQuery.data ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Security Center"
        description="Posture KPIs and recent auth-related audit events from GET /audit/logs. MFA is not available in V1."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full border border-outline-variant/30">
              <span className="w-2 h-2 rounded-full bg-[var(--color-success-emerald)] animate-pulse" />
              <span className="text-label-md text-on-surface">System Live</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void kpisQuery.refetch()
                void eventsQuery.refetch()
              }}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <section className="flex flex-col md:flex-row items-center justify-between bv-surface p-6">
        <div className="flex items-center gap-6">
          <div
            className="relative w-24 h-24 flex items-center justify-center rounded-full p-1"
            style={{
              background: `conic-gradient(var(--color-primary-blue) ${score}%, var(--color-outline-variant) 0)`,
            }}
          >
            <div className="w-full h-full bg-white rounded-full flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-primary leading-none">{score}</span>
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">/ 100</span>
            </div>
          </div>
          <div>
            <h2 className="text-title-lg font-semibold text-primary">Security Health Score</h2>
            <p className="text-body-md text-on-surface-variant max-w-md">
              Derived from today’s audit volume and alert-like actions. Auth V1: no MFA, lockout via
              failed_attempt_count.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bv-surface p-5 border-dashed opacity-70 relative">
          <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded">
            Not available
          </span>
          <div className="flex justify-between items-start mb-3">
            <span className="material-symbols-outlined p-2 bg-surface-container text-outline rounded-lg">
              fingerprint
            </span>
          </div>
          <p className="text-on-surface-variant text-label-md">MFA Adoption</p>
          <h3 className="text-3xl font-black text-outline">—</h3>
          <p className="text-label-sm text-on-surface-variant mt-1">Multi-factor auth is not in product V1</p>
        </div>

        <MetricCard
          icon="hub"
          label="Active logins"
          value={String(kpis.activeSessions.toLocaleString())}
          hint="Active user accounts (proxy until session list API)"
        />
        <MetricCard
          icon="check_circle"
          label="Open alerts"
          value={String(kpis.openAlerts)}
          hint="FAIL / LOCK / REJECT style audit actions today"
        />
        <MetricCard
          icon="history"
          label="Audit events today"
          value={String(kpis.auditEventsToday)}
          hint="Rows from GET /audit/logs (from_ts=today)"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bv-surface p-6">
          <h3 className="text-title-lg font-semibold text-primary mb-6">Authentication Protocols</h3>
          <div className="space-y-3">
            <UnavailableProtocol
              icon="security"
              title="Global MFA Enforcement"
              description="Multi-factor authentication is not available in V1."
            />
            <UnavailableProtocol
              icon="psychology"
              title="Adaptive Authentication"
              description="Step-up auth / risk signals — planned for a later release."
            />
            <ProtocolRow
              icon="timer"
              iconClass="bg-surface-container text-primary"
              title="Session Timeout Rules"
              description="Access JWT 5–10 min; inactivity re-auth supported."
              checked={sessionTimeout}
              onChange={setSessionTimeout}
            />
          </div>
        </div>

        <div className="lg:col-span-5 bg-primary text-white rounded-xl executive-shadow p-6 flex flex-col">
          <h3 className="text-title-lg font-semibold text-white mb-6">V1 Policy</h3>
          <ul className="space-y-3 text-body-sm text-white/85 flex-1">
            <li className="flex gap-2">
              <span className="material-symbols-outlined text-[18px]">check</span>
              No MFA in V1
            </li>
            <li className="flex gap-2">
              <span className="material-symbols-outlined text-[18px]">check</span>
              No password history
            </li>
            <li className="flex gap-2">
              <span className="material-symbols-outlined text-[18px]">check</span>
              Account lockout via failed_attempt_count + locked_until
            </li>
            <li className="flex gap-2">
              <span className="material-symbols-outlined text-[18px]">check</span>
              Always ≥1 super-admin
            </li>
            <li className="flex gap-2">
              <span className="material-symbols-outlined text-[18px]">check</span>
              Forgot-password with single-use hashed tokens
            </li>
          </ul>
        </div>
      </section>

      <section className="bv-surface overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant">
          <div>
            <h3 className="text-title-lg font-semibold text-primary">Recent security events</h3>
            <p className="text-body-sm text-on-surface-variant mt-1">
              Derived from audit logs (action, employment_id, reference_type, ip_address, description)
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[880px]">
            <thead className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant text-label-sm uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-bold">Action</th>
                <th className="px-4 py-3 font-bold">Employment</th>
                <th className="px-4 py-3 font-bold">Reference</th>
                <th className="px-4 py-3 font-bold">Description</th>
                <th className="px-4 py-3 font-bold">IP</th>
                <th className="px-4 py-3 font-bold">Time</th>
                <th className="px-4 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {events.map((ev) => (
                <tr key={ev.id} className="zebra-row">
                  <td className="px-4 py-4 text-body-sm font-medium text-on-surface">{ev.eventType}</td>
                  <td className="px-4 py-4 text-body-sm text-on-surface-variant">
                    {ev.employmentId != null ? `#${ev.employmentId}` : ev.identity}
                  </td>
                  <td className="px-4 py-4 text-body-sm text-on-surface-variant">{ev.referenceType || '—'}</td>
                  <td
                    className="px-4 py-4 text-body-sm text-on-surface max-w-[240px] truncate"
                    title={ev.description}
                  >
                    {ev.description || '—'}
                  </td>
                  <td className="px-4 py-4 text-body-sm font-mono text-on-surface-variant">
                    {ev.ipAddress ?? '—'}
                  </td>
                  <td className="px-4 py-4 text-body-sm text-on-surface-variant whitespace-nowrap">
                    {ev.timestamp}
                  </td>
                  <td className="px-4 py-4">
                    <span className={securityEventBadge[ev.status] ?? 'status-badge status-neutral'}>
                      {ev.status}
                    </span>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-on-surface-variant">
                    No security-related audit events yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
