import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import { listMyLeaveRequests, listMyLeaveBalances, getMyWorkOverview, requestLeaveCancel, cancelLeaveRequest } from '../../api/my-work'
import { statusStyles } from '../../schemas/enums'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { useDeletedRedirect } from '@/shared/hooks/useDeletedRedirect'
import { toast } from '@/shared/hooks/use-toast'
import { myWorkRoutes } from '../../routes'
import { cn } from '@/shared/lib/cn'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'
import { useLeaveThread } from '../../hooks/use-leave-thread'

export function LeaveDetailPage() {
  const { leaveId } = useParams({ strict: false }) as { leaveId: string }
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [confirm, setConfirm] = useState<'withdraw' | 'request-cancel' | null>(null)
  const [comment, setComment] = useState('')
  const [cancelRequested, setCancelRequested] = useState(false)
  const requestCancelMut = useMutation({
    mutationFn: (id: string) => requestLeaveCancel(id),
    onSuccess: () => {
      setConfirm(null)
      setCancelRequested(true)
      void invalidate.myWorkLeave(qc)
      toast.success('Cancellation sent to your approver for approval')
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Could not request cancellation'))
    },
  })
  const withdrawMut = useMutation({
    mutationFn: (id: string) => cancelLeaveRequest(id),
    onSuccess: () => {
      setConfirm(null)
      void invalidate.myWorkLeave(qc)
      toast.success('Leave request withdrawn — balance restored')
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Could not withdraw the request'))
    },
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

  const matchLeave = (r: { id: string }) =>
    r.id === leaveId ||
    r.id.toLowerCase() === `lv-${leaveId}`.toLowerCase() ||
    r.id.replace(/^lv-/i, '') === leaveId.replace(/^lv-/i, '')

  useDeletedRedirect({
    ready: !listQuery.isLoading,
    data: listQuery.data?.items.find(matchLeave) ?? null,
    error: listQuery.error,
    listTo: myWorkRoutes.leave,
  })

  const reqMaybe = listQuery.data?.items.find(matchLeave)
  const thread = useLeaveThread(leaveId ?? '', reqMaybe ? {
    reason: reqMaybe.reason,
    appliedOn: reqMaybe.appliedOn,
    approver: reqMaybe.approver,
    approverRemarks: reqMaybe.approverRemarks,
    decidedOn: reqMaybe.decidedOn,
  } : undefined)

  if (listQuery.isLoading || balancesQuery.isLoading) {
    return <PageLoadingSkeleton />
  }

  const req = reqMaybe
  const leaveBalances = balancesQuery.data ?? []
  const currentUser = overviewQuery.data?.user

  const resendToApprover = () => {
    if (!req) return
    try {
      sessionStorage.setItem(
        'leave-reapply',
        JSON.stringify({ type: req.type, from: req.from, to: req.to, reason: req.reason }),
      )
    } catch {
      // Storage unavailable — apply page still opens blank.
    }
    safeNavigate(navigate, { to: myWorkRoutes.leaveApply })
  }

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
  const approverLabel = req.approver
    ? `${req.approver}${req.approverEmploymentId != null ? ` (Emp #${req.approverEmploymentId})` : req.approverEmployeeCode ? ` (${req.approverEmployeeCode})` : ''}`
    : null
  const isSelfApprover =
    !!req.approver &&
    !!currentUser &&
    (req.approver === currentUser.name ||
      (req.approverEmploymentId != null &&
        String(req.approverEmploymentId) === String(currentUser.employeeId).replace(/\D/g, '')))
  const managerLabel = approverLabel && !isSelfApprover ? approverLabel : approverLabel
  const withdrawButton = (
    <Button
      variant="outline"
      size="sm"
      disabled={withdrawMut.isPending}
      leftIcon={<span className="material-symbols-outlined text-base">cancel</span>}
      onClick={() => setConfirm('withdraw')}
    >
      {withdrawMut.isPending ? 'Withdrawing…' : 'Withdraw'}
    </Button>
  )

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
              <Can
                action={Action.UPDATE}
                resource="leave_request"
                minScope="SELF"
                fallback={withdrawButton}
              >
                {withdrawButton}
              </Can>
            )}
            {req.status === 'Approved' &&
              req.from >= new Date().toISOString().slice(0, 10) && (
                <Can action={Action.UPDATE} resource="leave_request" minScope="SELF">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={requestCancelMut.isPending}
                    leftIcon={<span className="material-symbols-outlined text-base">cancel</span>}
                    onClick={() => setConfirm('request-cancel')}
                  >
                    {requestCancelMut.isPending ? 'Requesting…' : 'Request cancellation'}
                  </Button>
                </Can>
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
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div className="flex-1 bg-surface-container-low rounded-xl p-4">
                  <div className="flex flex-wrap justify-between gap-2 mb-1">
                    <p className="text-label-md font-bold text-on-surface">
                      {currentUser?.name ?? 'You'}{' '}
                      <span className="font-normal text-on-surface-variant">· Requester</span>
                    </p>
                    <span className="text-label-sm text-on-surface-variant">{req.appliedOn}</span>
                  </div>
                  <p className="text-body-sm text-on-surface">{req.reason}</p>
                </div>
              </div>
              {thread.isLoading ? (
                <p className="text-body-sm text-on-surface-variant">Loading comments…</p>
              ) : (
                thread.entries.map((entry) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">supervisor_account</span>
                    </div>
                    <div className="flex-1 bg-surface-container-low rounded-xl p-4">
                      <div className="flex flex-wrap justify-between gap-2 mb-1">
                        <p className="text-label-md font-bold text-on-surface">
                          {entry.author}
                          {entry.authorEmploymentId != null ? ` (Emp #${entry.authorEmploymentId})` : ''}{' '}
                          <span className="font-normal text-on-surface-variant">· Manager</span>
                        </p>
                        <span className="text-label-sm text-on-surface-variant">{entry.createdAt}</span>
                      </div>
                      <p className="text-body-sm text-on-surface">{entry.body}</p>
                    </div>
                  </div>
                ))
              )}
              {!thread.isLoading && thread.entries.length === 0 && (
                <>
                  {managerLabel && (req.status !== 'Pending' || req.approverRemarks || req.decidedOn) && (
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined">supervisor_account</span>
                      </div>
                      <div className="flex-1 bg-surface-container-low rounded-xl p-4">
                        <div className="flex flex-wrap justify-between gap-2 mb-1">
                          <p className="text-label-md font-bold text-on-surface">
                            {managerLabel} <span className="font-normal text-on-surface-variant">· Manager</span>
                          </p>
                          <span className="text-label-sm text-on-surface-variant">{req.decidedOn ?? req.appliedOn}</span>
                        </div>
                        <p className="text-body-sm text-on-surface">
                          {req.approverRemarks ||
                            (req.status === 'Approved'
                              ? 'Request approved. Enjoy your time off.'
                              : req.status === 'Rejected'
                                ? 'Request could not be approved at this time.'
                                : 'Request received and under review.')}
                        </p>
                      </div>
                    </div>
                  )}
                  {req.status === 'Pending' && !req.approverRemarks && !req.decidedOn && (
                    <p className="text-body-sm text-on-surface-variant">
                      {managerLabel ? `Waiting on ${managerLabel}.` : 'Waiting on your manager.'}
                    </p>
                  )}
                </>
              )}
              <div className="flex gap-3 pt-1">
                <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">chat</span>
                </div>
                <div className="flex-1 space-y-2">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="Add a comment for your approver…"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-sm resize-none focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-colors"
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!comment.trim() || thread.isPosting}
                      onClick={() => {
                        const text = comment.trim()
                        if (!text) return
                        setComment('')
                        thread.postComment(text)
                      }}
                    >
                      {thread.isPosting ? 'Posting…' : 'Post comment'}
                    </Button>
                  </div>
                </div>
              </div>
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
                    <p className="text-label-sm text-on-surface-variant">
                      In Progress{managerLabel ? ` · waiting on ${managerLabel}` : ''}
                    </p>
                  </div>
                </div>
              )}
              {(req.status === 'Approved' || req.status === 'Rejected') && (
                <div className="relative flex items-start pl-8">
                  <div
                    className={cn(
                      'absolute left-0 top-0.5 w-6 h-6 rounded-full text-on-secondary flex items-center justify-center z-10 border-2 border-surface-container-lowest executive-shadow',
                      req.status === 'Approved' ? 'bg-secondary' : 'bg-error',
                    )}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {req.status === 'Approved' ? 'check' : 'close'}
                    </span>
                  </div>
                  <div>
                    <p className="text-label-md font-bold text-on-surface">
                      {req.status === 'Approved' ? 'Approved' : 'Rejected'}
                      {managerLabel ? ` by ${managerLabel}` : ''}
                    </p>
                    <p className="text-label-sm text-on-surface-variant">
                      {[req.decidedOn, req.approverRemarks].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                </div>
              )}
              {req.status === 'Cancelled' && (
                <div className="relative flex items-start pl-8">
                  <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center z-10 border-2 border-surface-container-lowest executive-shadow">
                    <span className="material-symbols-outlined text-sm">cancel</span>
                  </div>
                  <div>
                    <p className="text-label-md font-bold text-on-surface">Withdrawn</p>
                    <p className="text-label-sm text-on-surface-variant">Balance restored to your leave account</p>
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
              <p className="text-body-md text-on-surface mt-0.5">{managerLabel ?? '—'}</p>
            </div>
            <div className="pt-2 space-y-2">
              {(cancelRequested || req.status === 'Cancelled') && (
                <p className="text-label-sm text-on-surface-variant bg-surface-container-low rounded-lg p-3">
                  Cancellation sent to your approver for approval. You will be notified once decided.
                </p>
              )}
              <Button variant="primary" className="w-full" onClick={resendToApprover}>
                Apply again
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => safeNavigate(navigate, { to: myWorkRoutes.leave })}>
                All leave requests
              </Button>
            </div>
          </section>
        </div>
      </div>

      {confirm === 'withdraw' && (
        <ConfirmDialog
          title={`Withdraw leave request ${req.id}?`}
          message="The request will be cancelled and the held balance will be restored to your leave account."
          confirmLabel="Withdraw request"
          danger
          isLoading={withdrawMut.isPending}
          onConfirm={() => withdrawMut.mutate(req.id)}
          onClose={() => !withdrawMut.isPending && setConfirm(null)}
        />
      )}
      {confirm === 'request-cancel' && (
        <ConfirmDialog
          title={`Request cancellation for ${req.id}?`}
          message="Your approver will be notified to cancel this approved leave."
          confirmLabel="Send request"
          isLoading={requestCancelMut.isPending}
          onConfirm={() => requestCancelMut.mutate(req.id)}
          onClose={() => !requestCancelMut.isPending && setConfirm(null)}
        />
      )}
    </div>
  )
}
