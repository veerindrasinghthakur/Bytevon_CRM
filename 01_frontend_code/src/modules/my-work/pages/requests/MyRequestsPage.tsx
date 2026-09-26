import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { cn } from '@/shared/lib/cn'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { myWorkRoutes } from '../../routes'
import { statusStyles, REQUEST_FILTERS } from '../../schemas/enums'
import { useMyRequests } from '../../hooks/use-my-requests'
import { useMyLeave } from '../../hooks/use-my-leave'
import { useAttendanceCorrections } from '../../hooks/use-attendance-corrections'
import { useMyApprovals } from '../../hooks/use-my-approvals'
import { useRequestsPageFilter } from '../../hooks/use-requests-page-filter'

function StatCard({
  icon,
  iconClass,
  label,
  value,
}: {
  icon: string
  iconClass: string
  label: string
  value: number
}) {
  return (
    <div className="p-6 bv-surface card-hover">
      <div className="flex justify-between items-start mb-4">
        <span className={cn('material-symbols-outlined p-2 rounded-lg', iconClass)}>{icon}</span>
      </div>
      <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-on-background">{value}</h3>
    </div>
  )
}

type UnifiedRow = {
  id: string
  type: string
  date: string
  stage: string
  approver: string
  status: string
  to: string
  params: Record<string, string>
}

const TABS = ['All Requests', 'Leave', 'Corrections', 'Approvals'] as const
type Tab = (typeof TABS)[number]

export function MyRequestsPage() {
  const navigate = useNavigate()
  const { filter, setFilter } = useRequestsPageFilter()
  const [tab, setTab] = useState<Tab>('All Requests')

  const requestsQuery = useMyRequests()
  const leave = useMyLeave()
  const corrections = useAttendanceCorrections()
  const approvals = useMyApprovals()

  const leaveRows: UnifiedRow[] = useMemo(
    () =>
      (leave.requests ?? []).map((r) => ({
        id: `leave-${r.id}`,
        type: `Leave · ${r.type}`,
        date: String(r.from ?? ''),
        stage: r.reason || `${r.from ?? ''} → ${r.to ?? ''}`,
        approver: r.approver ?? '—',
        status: String(r.status ?? 'Pending'),
        to: myWorkRoutes.leaveDetail(String(r.id)),
        params: { leaveId: String(r.id) },
      })),
    [leave.requests],
  )

  const correctionRows: UnifiedRow[] = useMemo(
    () =>
      (corrections.visible ?? []).map((c) => ({
        id: `corr-${c.id}`,
        type: 'Attendance Correction',
        date: String(c.date ?? ''),
        stage: c.reason || `${c.originalStatus ?? ''} → corrected`,
        approver: c.approver ?? '—',
        status: String(c.status ?? 'Pending'),
        to: myWorkRoutes.attendanceCorrections,
        params: {},
      })),
    [corrections.visible],
  )

  const approvalRows: UnifiedRow[] = useMemo(
    () =>
      (approvals.approvals ?? []).map((a) => ({
        id: `appr-${a.id}`,
        type: String(a.type ?? 'Approval'),
        date: String(a.submittedOn ?? ''),
        stage: a.summary || a.title || '',
        approver: '—',
        status: String(a.status ?? 'Pending'),
        to: myWorkRoutes.approvalDetail(String(a.id)),
        params: { requestId: String(a.id) },
      })),
    [approvals.approvals],
  )

  const submittedRows: UnifiedRow[] = useMemo(
    () =>
      (requestsQuery.items ?? []).map((r) => ({
        id: `req-${r.id}`,
        type: String(r.type ?? 'Request'),
        date: String((r as { date?: unknown }).date ?? ''),
        stage: String((r as { stage?: unknown }).stage ?? ''),
        approver: String(r.approver ?? '—'),
        status: String(r.status ?? 'Pending'),
        to: myWorkRoutes.approvalDetail(String(r.id)),
        params: { requestId: String(r.id) },
      })),
    [requestsQuery.items],
  )

  const tabRows =
    tab === 'Leave'
      ? leaveRows
      : tab === 'Corrections'
        ? correctionRows
        : tab === 'Approvals'
          ? approvalRows
          : [...submittedRows, ...leaveRows, ...correctionRows, ...approvalRows].sort((a, b) =>
              String(b.date ?? '').localeCompare(String(a.date ?? '')),
            )

  const stats = useMemo(() => {
    const total = tabRows.length
    const inProgress = tabRows.filter(
      (r) => r.status === 'In-Progress' || r.status === 'Pending',
    ).length
    const approved = tabRows.filter((r) => r.status === 'Approved').length
    const rejected = tabRows.filter((r) => r.status === 'Rejected').length
    return { total, inProgress, approved, rejected }
  }, [tabRows])

  const visible =
    filter === 'All Requests'
      ? tabRows
      : tabRows.filter(
          (r) => r.status === filter || (filter === 'In-Progress' && r.status === 'Pending'),
        )

  const isLoading =
    requestsQuery.isLoading || leave.isLoading || approvals.isLoading || corrections.isLoading
  const isError =
    requestsQuery.isError && leave.isError && approvals.isError

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Requests"
        description="Track and manage every organizational request you submitted and its status."
        actions={
          <ExportButton resource="approval" filenameStem="my-requests" label="Export" />
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon="assignment"
          iconClass="bg-secondary/10 text-secondary"
          label="Total Requests"
          value={stats.total}
        />
        <StatCard
          icon="pending_actions"
          iconClass="bg-[var(--color-warning-amber)]/15 text-[var(--color-warning-amber)]"
          label="In Progress"
          value={stats.inProgress}
        />
        <StatCard
          icon="verified"
          iconClass="bg-secondary/15 text-secondary"
          label="Approved"
          value={stats.approved}
        />
        <StatCard
          icon="cancel"
          iconClass="bg-error-container text-on-error-container"
          label="Rejected"
          value={stats.rejected}
        />
      </section>

      <section className="bv-surface overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex items-center gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Request type">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-label-md font-medium transition-colors',
                  tab === t
                    ? 'bg-secondary text-on-secondary'
                    : 'hover:bg-surface-container-low text-on-surface-variant',
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap ml-auto">
            {REQUEST_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-label-md font-medium transition-colors',
                  filter === f
                    ? 'bg-primary text-on-primary'
                    : 'hover:bg-surface-container-low text-on-surface-variant',
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <PageLoadingSkeleton />
        ) : isError ? (
          <div className="p-8">
            <ErrorState
              title="Could not load requests"
              description={getApiErrorMessage(
                requestsQuery.error,
                'We could not load your requests.',
              )}
              onRetry={() => {
                void requestsQuery.refetch()
                void leave.refetch()
                void approvals.refetch()
              }}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">
                      Request ID
                    </th>
                    <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">
                      Date Submitted
                    </th>
                    <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">
                      Current Stage
                    </th>
                    <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">
                      Assigned Approver
                    </th>
                    <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {visible.map((row) => (
                    <tr
                      key={row.id}
                      className="zebra-row group cursor-pointer"
                      onClick={() =>
                        safeNavigate(navigate, {
                          to: row.to,
                          params: row.params,
                        })
                      }
                    >
                      <td className="px-6 py-5 text-label-md text-secondary font-bold">#{row.id}</td>
                      <td className="px-6 py-5 text-body-md">{row.type}</td>
                      <td className="px-6 py-5 text-body-sm text-on-surface-variant">{row.date}</td>
                      <td className="px-6 py-5">
                        <span className="flex items-center gap-2 text-body-sm text-on-background">
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full',
                              row.status === 'Approved'
                                ? 'bg-secondary'
                                : row.status === 'Rejected'
                                  ? 'bg-error'
                                  : 'bg-[var(--color-warning-amber)]',
                            )}
                          />
                          {row.stage ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center text-label-sm font-bold text-secondary">
                            {(row.approver ?? '?')
                              .split(' ')
                              .map((p) => p[0])
                              .join('')
                              .slice(0, 2)}
                          </div>
                          <span className="text-label-md text-on-background">{row.approver ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={cn(
                            'px-3 py-1 rounded-full text-label-sm font-medium border',
                            statusStyles[row.status] ?? statusStyles.Pending,
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-surface-container rounded-lg transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-body-sm text-on-surface-variant">
                        No requests in this view yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between">
              <p className="text-body-sm text-on-surface-variant">
                Showing 1 to {visible.length} of {stats.total} entries
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
