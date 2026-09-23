import { useParams, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import { listMyLeaveRequests, listMyLeaveBalances, getMyWorkOverview, requestLeaveCancel } from '../../api/my-work'
import { statusStyles } from '../../schemas/enums'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useDeletedRedirect } from '@/shared/hooks/useDeletedRedirect'
import { myWorkRoutes } from '../../routes'
import { cn } from '@/shared/lib/cn'

export function LeaveDetailPage() {
  const { leaveId } = useParams({ strict: false }) as { leaveId: string }
  const navigate = useNavigate()
  const qc = useQueryClient()
  const requestCancelMut = useMutation({
    mutationFn: (id: string) => requestLeaveCancel(id),
    onSuccess: () => invalidate.myWorkLeave(qc),
  })

  const listQuery = useQuery({
    queryKey: queryKeys.myWork.leave.list({ pageSize: 100 }),
    queryFn: () => listMyLeaveRequests({ pageSize: 100 }),
  })

  const balancesQuery = useQuery({
    queryKey: queryKeys.myWork.leave.balances(),
    queryFn: listMyLeaveBalances,
  })

  const overviewQuery = useQuery({
    queryKey: queryKeys.myWork.overview(),
    queryFn: getMyWorkOverview,
  })

  useDeletedRedirect({
    ready: !listQuery.isLoading,
    data: listQuery.data?.items.find((r) => r.id === leaveId) ?? null,
    error: listQuery.error,
    listTo: myWorkRoutes.leave,
  })

  if (listQuery.isLoading || balancesQuery.isLoading) {
    return <PageLoadingSkeleton />
  }

  const req =
    listQuery.data?.items.find((r) => r.id === leaveId) ?? listQuery.data?.items[0]
  const leaveBalances = balancesQuery.data ?? []
  const leaveBalances = balancesQuery.data ?? []
  const currentUser = overviewQuery.data?.user

  if (!req) {
    return (
      <div className="animate-fade-in space-y-4">
        <BackButton to={myWorkRoutes.leave} label="Back to My Leave" />
        <PageHeader title="Leave details" />
        <p className="text-body-md text-on-surface-variant">Request not found.</p>
      </div>
    )
  }

  const totalRemaining = leaveBalances.reduce((s, b) => s + b.remaining, 0)
  const totalAllocated = leaveBalances.reduce((s, b) => s + b.total, 0) || 1
  const remainingAfter =
    totalRemaining - (req.status === 'Pending' || req.status === 'Approved' ? req.days : 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to={myWorkRoutes.leave} label="Back to My Leave" />
      <PageHeader
        title={`Leave Request #${req.id.toUpperCase()}`}
        description={`${req.type} · ${req.from} → ${req.to} · ${req.days} day(s)`}
        actions={
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-label-sm font-semibold',
                statusStyles[req.status] ?? 'status-badge status-neutral',
              )}
            >
              {req.status === 'Pending' && (
                <span className="w-2 h-2 rounded-full bg-[var(--color-warning-amber)] animate-pulse" />
              )}
              {req.status}
            </span>
            {req.status === 'Pending' && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<span className="material-symbols-outlined text-base">cancel</span>}
                onClick={() => console.info('Cancel leave', req.id)}
              >
                Withdraw
              </Button>
            )}
            {req.status === 'Approved' &&
              req.from >= new Date().toISOString().slice(0, 10) && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={requestCancelMut.isPending}
                  leftIcon={<span className="material-symbols-outlined text-base">cancel</span>}
                  onClick={() => {
                    if (!window.confirm(`Request cancellation for ${req.id}?`)) return
                    requestCancelMut.mutate(req.id)
                  }}
                >
                  {requestCancelMut.isPending ? 'Requesting…' : 'Request cancellation'}
                </Button>
              )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <section className="bv-surface p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-3xl">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-title-lg font-semibold text-on-background">{currentUser?.name ?? '—'}</h3>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                <div>
                  <p className="text-label-sm text-on-surface-variant">Department</p>
                  <p className="text-label-md font-medium text-on-surface">{currentUser?.department ?? '—'}</p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant">Role</p>
                  <p className="text-label-md font-medium text-on-surface">{currentUser?.role ?? '—'}</p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant">Employee ID</p>
                  <p className="text-label-md font-medium text-on-surface">{currentUser?.employeeId ?? '—'}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bv-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h3 className="text-title-lg font-semibold text-on-background">Request Details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/50">
                <p className="text-label-sm text-on-surface-variant mb-1">Leave Type</p>
                <div className="flex items-center gap-2 text-secondary">
                  <span className="material-symbols-outlined">beach_access</span>
                  <span className="text-title-lg font-bold">{req.type}</span>
                </div>
              </div>
              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/50">
                <p className="text-label-sm text-on-surface-variant mb-1">Requested Period</p>
                <div className="flex items-center gap-2 text-on-surface">
                  <span className="material-symbols-outlined">calendar_today</span>
                  <span className="text-label-md font-semibold">{req.from} – {req.to}</span>
                </div>
              </div>
              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/50">
                <p className="text-label-sm text-on-surface-variant mb-1">Total Duration</p>
                <div className="flex items-center gap-2 text-on-surface">
                  <span className="material-symbols-outlined">schedule</span>
                  <span className="text-title-lg font-bold">{req.days} Days</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-label-sm text-on-surface-variant">Reason for Leave</p>
              <p className="text-body-md text-on-surface leading-relaxed p-4 bg-surface-container-low rounded-xl">{req.reason}</p>
            </div>
          </section>

          <section className="bv-surface p-6">
            <h3 className="text-title-lg font-semibold text-on-background mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined">forum</span> Discussion & Approver Notes
            </h3>
            <div className="space-y-5">
              {req.approver && (
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div className="flex-1 bg-surface-container-low rounded-xl p-4">
                    <div className="flex flex-wrap justify-between gap-2 mb-1">
                      <p className="text-label-md font-bold text-on-surface">
                        {req.approver} <span className="font-normal text-on-surface-variant">· Manager</span>
                      </p>
                      <span className="text-label-sm text-on-surface-variant">{req.appliedOn}</span>
                    </div>
                    <p className="text-body-sm text-on-surface">
                      {req.status === 'Approved'
                        ? 'Request approved. Enjoy your time off.'
                        : req.status === 'Rejected'
                          ? 'Request could not be approved at this time.'
                          : 'Request received and under review.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <section className="bv-surface p-6">
            <h3 className="text-title-lg font-semibold text-on-background mb-5">Approval Timeline</h3>
            <div className="relative space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/40">
              <div className="relative flex items-start pl-8">
                <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center z-10 border-2 border-surface-container-lowest executive-shadow">
                  <span className="material-symbols-outlined text-sm">check</span>
                </div>
                <div>
                  <p className="text-label-md font-bold text-on-surface">Request Submitted</p>
                  <p className="text-label-sm text-on-surface-variant">{req.appliedOn}</p>
                </div>
              </div>
              {req.status === 'Pending' && (
                <div className="relative flex items-start pl-8">
                  <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center z-10 border-2 border-surface-container-lowest ring-4 ring-secondary/15 executive-shadow">
                    <span className="material-symbols-outlined text-sm">pending</span>
                  </div>
                  <div>
                    <p className="text-label-md font-bold text-secondary">Manager Review</p>
                    <p className="text-label-sm text-on-surface-variant">In Progress</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="bg-primary text-on-primary rounded-xl p-6 executive-shadow relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <h3 className="text-label-md font-semibold text-on-primary/80 uppercase tracking-wider">Balance after request</h3>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-label-sm text-on-primary/60">Current</p>
                  <p className="text-2xl font-bold">{totalRemaining} days</p>
                </div>
                <div className="text-right">
                  <p className="text-label-sm text-on-primary/60">This request</p>
                  <p className="text-xl font-bold text-error-container">−{req.days} days</p>
                </div>
              </div>
              <p className="text-label-sm text-on-primary/70">
                Remaining after approval:{' '}
                <span className="font-bold text-on-primary">{Math.max(0, remainingAfter)} days</span>
              </p>
            </div>
          </section>

          <section className="bv-surface p-5 space-y-3">
            <div>
              <p className="text-label-sm text-on-surface-variant">Approver</p>
              <p className="text-body-md text-on-surface mt-0.5">{req.approver ?? '—'}</p>
            </div>
            <div className="pt-2 space-y-2">
              <Button variant="primary" className="w-full" onClick={() => safeNavigate(navigate, { to: myWorkRoutes.leaveApply })}>
                Apply again
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => safeNavigate(navigate, { to: myWorkRoutes.leave })}>
                All leave requests
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
