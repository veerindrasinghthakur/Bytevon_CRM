import { useParams, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { leaveRequests, currentUser, leaveBalances } from '../data/mock'
import type { LeaveStatus } from '../types'

const statusStyles: Record<LeaveStatus, string> = {
  Pending: 'bg-amber-100 text-amber-800 border border-amber-200',
  Approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Rejected: 'bg-red-50 text-red-700 border border-red-200',
  Cancelled: 'bg-surface-container text-on-surface-variant border border-outline-variant',
}

export function LeaveDetailPage() {
  const { leaveId } = useParams({ strict: false }) as { leaveId: string }
  const navigate = useNavigate()
  const req = leaveRequests.find((r) => r.id === leaveId) ?? leaveRequests[0]

  if (!req) {
    return (
      <div>
        <PageHeader title="Leave details" showBack />
        <p className="text-body-md text-on-surface-variant">Request not found.</p>
      </div>
    )
  }

  const remainingAfter =
    leaveBalances.reduce((s, b) => s + b.remaining, 0) -
    (req.status === 'Pending' || req.status === 'Approved' ? req.days : 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Leave Request #${req.id.toUpperCase()}`}
        description={`${req.type} · ${req.from} → ${req.to} · ${req.days} day(s)`}
        showBack
        backTo="/my-work/leave"
        backLabel="Back to My Leave"
        actions={
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-label-sm font-semibold ${
                statusStyles[req.status]
              }`}
            >
              {req.status === 'Pending' && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
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
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Employee overview */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-3xl">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-title-lg font-semibold text-on-background">{currentUser.name}</h3>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                <div>
                  <p className="text-label-sm text-on-surface-variant">Department</p>
                  <p className="text-label-md font-medium text-on-surface">{currentUser.department}</p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant">Role</p>
                  <p className="text-label-md font-medium text-on-surface">{currentUser.role}</p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant">Employee ID</p>
                  <p className="text-label-md font-medium text-on-surface">{currentUser.employeeId}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Request details */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h3 className="text-title-lg font-semibold text-on-background">Request Details</h3>
              {req.status === 'Pending' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<span className="material-symbols-outlined text-base">edit</span>}
                  >
                    Edit Request
                  </Button>
                </div>
              )}
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
                  <span className="text-label-md font-semibold">
                    {req.from} – {req.to}
                  </span>
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
              <p className="text-body-md text-on-surface leading-relaxed p-4 bg-surface-container-low rounded-xl">
                {req.reason}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-label-sm text-on-surface-variant mb-3">Supporting Documents</p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-3 p-3 border border-outline-variant rounded-lg hover:border-secondary transition-colors cursor-pointer group bg-surface-container-low">
                  <div className="w-10 h-10 bg-error/10 text-error rounded flex items-center justify-center">
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                  </div>
                  <div>
                    <p className="text-label-md text-on-surface group-hover:text-secondary">
                      attachment.pdf
                    </p>
                    <p className="text-label-sm text-on-surface-variant">Optional · Uploaded with request</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant ml-2 group-hover:text-secondary">
                    download
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Discussion */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <h3 className="text-title-lg font-semibold text-on-background mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined">forum</span>
              Discussion & Approver Notes
            </h3>
            <div className="space-y-5">
              {req.approver && (
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div className="flex-1 bg-surface-container-low rounded-xl p-4">
                    <div className="flex flex-wrap justify-between gap-2 mb-1">
                      <p className="text-label-md font-bold text-on-surface">
                        {req.approver}{' '}
                        <span className="font-normal text-on-surface-variant">· Manager</span>
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

              <div className="flex gap-3 items-start pt-4 border-t border-outline-variant">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div className="flex-1">
                  <textarea
                    className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl text-body-sm outline-none focus:border-secondary resize-none"
                    placeholder="Add a note or reply…"
                    rows={2}
                  />
                  <div className="flex justify-end mt-2">
                    <Button variant="secondary" size="sm">
                      Post Note
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 space-y-4">
          {/* Approval timeline */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <h3 className="text-title-lg font-semibold text-on-background mb-5">Approval Timeline</h3>
            <div className="relative space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/40">
              <div className="relative flex items-start pl-8">
                <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center z-10 border-2 border-surface-container-lowest">
                  <span className="material-symbols-outlined text-white text-sm">check</span>
                </div>
                <div>
                  <p className="text-label-md font-bold text-on-surface">Request Submitted</p>
                  <p className="text-label-sm text-on-surface-variant">{req.appliedOn}</p>
                  <p className="text-body-sm text-on-surface-variant mt-0.5">
                    Submitted by <span className="font-medium text-on-surface">{currentUser.name}</span>
                  </p>
                </div>
              </div>

              {req.status !== 'Pending' && req.approver && (
                <div className="relative flex items-start pl-8">
                  <div
                    className={`absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center z-10 border-2 border-surface-container-lowest ${
                      req.status === 'Approved' ? 'bg-emerald-500' : 'bg-error'
                    }`}
                  >
                    <span className="material-symbols-outlined text-white text-sm">
                      {req.status === 'Approved' ? 'check' : 'close'}
                    </span>
                  </div>
                  <div>
                    <p className="text-label-md font-bold text-on-surface">
                      {req.status === 'Approved' ? 'Approved' : 'Rejected'}
                    </p>
                    <p className="text-label-sm text-on-surface-variant">Handled by {req.approver}</p>
                  </div>
                </div>
              )}

              {req.status === 'Pending' && (
                <div className="relative flex items-start pl-8">
                  <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-secondary flex items-center justify-center z-10 border-2 border-surface-container-lowest ring-4 ring-secondary/15">
                    <span className="material-symbols-outlined text-white text-sm">pending</span>
                  </div>
                  <div>
                    <p className="text-label-md font-bold text-secondary">Manager Review</p>
                    <p className="text-label-sm text-on-surface-variant">In Progress</p>
                    <p className="text-body-sm text-on-surface-variant mt-0.5">Awaiting decision</p>
                  </div>
                </div>
              )}

              <div className="relative flex items-start pl-8 opacity-40">
                <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-outline-variant flex items-center justify-center z-10 border-2 border-surface-container-lowest">
                  <span className="material-symbols-outlined text-white text-sm">lock</span>
                </div>
                <div>
                  <p className="text-label-md font-bold text-on-surface">Final Confirmation</p>
                  <p className="text-label-sm text-on-surface-variant">Waiting…</p>
                </div>
              </div>
            </div>
          </section>

          {/* Balance impact */}
          <section className="bg-primary text-white rounded-xl p-6 shadow-lg relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <h3 className="text-label-md font-semibold text-white/80 uppercase tracking-wider">
                Balance after request
              </h3>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-label-sm text-white/60">Current</p>
                  <p className="text-2xl font-bold">
                    {leaveBalances.reduce((s, b) => s + b.remaining, 0)} days
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-label-sm text-white/60">This request</p>
                  <p className="text-xl font-bold text-red-300">−{req.days} days</p>
                </div>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary-container rounded-full"
                  style={{
                    width: `${Math.max(10, (remainingAfter / (leaveBalances.reduce((s, b) => s + b.total, 0) || 1)) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-label-sm text-white/70">
                Remaining after approval:{' '}
                <span className="font-bold text-white">{Math.max(0, remainingAfter)} days</span>
              </p>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-secondary/20 rounded-full blur-2xl" />
          </section>

          {/* Meta + actions */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 space-y-3 shadow-sm">
            <div>
              <p className="text-label-sm text-on-surface-variant">Approver</p>
              <p className="text-body-md text-on-surface mt-0.5">{req.approver ?? '—'}</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Applied on</p>
              <p className="text-body-md text-on-surface mt-0.5">{req.appliedOn}</p>
            </div>
            <div className="pt-2 space-y-2">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => navigate({ to: '/my-work/leave/apply' })}
              >
                Apply again
              </Button>
              <Button
                variant="outline"
                className="w-full"
                leftIcon={<span className="material-symbols-outlined text-base">print</span>}
              >
                Download PDF Summary
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate({ to: '/my-work/leave' })}
              >
                All leave requests
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
