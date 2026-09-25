import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { payrollStatusStyles } from '../../schemas/enums'
import { payrollRoutes } from '../../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'
import { useMonthlyDetail } from '../../hooks/monthly/use-monthly-detail'
import { RecordPaymentModal } from '../../components/review/RecordPaymentModal'
import { ManualPayModal } from '../../components/review/ManualPayModal'

export function MonthlyPayrollDetailPage() {
  const navigate = useNavigate()
  const d = useMonthlyDetail()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  if (d.isLoading) {
    return <div className="p-8 text-body-md text-on-surface-variant">Loading monthly payroll…</div>
  }
  if (d.isError || !d.emp || !d.review) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-body-md text-error">
          Monthly payroll row #{d.id} not found.
        </p>
        <p className="text-body-sm text-on-surface-variant">
          Detail links use the payroll ID (MonthlyPayroll.id). Employment IDs resolve
          automatically when a payroll exists for that employee — otherwise run payroll
          for the period first.
        </p>
        <div className="flex flex-wrap gap-3">
          <BackButton to={payrollRoutes.monthly} />
          <Button variant="outline" size="sm" onClick={() => d.refetch()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const { emp, review } = d
  const locked = emp.status === 'Paid'

  return (
    <div className="space-y-8 animate-fade-in">
      <BackButton to={payrollRoutes.monthly} label="Back to Monthly Payroll" />
      <PageHeader
        title={`${emp.name} — ${review.periodLabel}`}
        description={`${emp.code} • ${emp.department} • ${emp.role}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-medium',
                payrollStatusStyles[emp.status] ?? 'status-badge status-neutral',
              )}
            >
              {emp.status}
            </span>
            <Can action={Action.CREATE} resource="payroll">
              <Button
                variant="outline"
                size="sm"
                disabled={locked || d.recalcMut.isPending}
                leftIcon={<span className="material-symbols-outlined text-base">refresh</span>}
                onClick={() => d.recalcMut.mutate()}
              >
                {d.recalcMut.isPending ? 'Recalculating…' : 'Recalculate'}
              </Button>
            </Can>
            {emp.status === 'Calculated' && (
              <Can action={Action.APPROVE} resource="payroll">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={d.approveMut.isPending}
                  onClick={() => d.approveMut.mutate()}
                >
                  {d.approveMut.isPending ? 'Approving…' : 'Approve'}
                </Button>
              </Can>
            )}
            {emp.status === 'Approved' && (
              <>
                <Can action={Action.APPROVE} resource="payroll">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={d.rejectMut.isPending}
                    onClick={() => {
                      setRejectReason('')
                      setRejectOpen(true)
                    }}
                  >
                    Reject
                  </Button>
                </Can>
                <Can action={Action.CREATE} resource="payroll">
                  <Button variant="primary" size="sm" onClick={() => d.setShowPayModal(true)}>
                    Pay
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => d.setShowManualModal(true)}>
                    Manual Pay
                  </Button>
                </Can>
              </>
            )}
            {locked && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  safeNavigate(navigate, {
                    to: payrollRoutes.payslipPath,
                    params: { payrollId: emp.payrollId ?? emp.id },
                  })
                }
              >
                Payslip
              </Button>
            )}
          </div>
        }
      />

      {locked && (
        <div className="flex items-start gap-3 rounded-lg border border-secondary/30 bg-secondary/10 px-4 py-3 text-body-sm" role="status">
          <span className="material-symbols-outlined text-secondary shrink-0">lock</span>
          <p className="text-on-surface-variant">This row is paid and locked. Recalculate, approve and pay are closed.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: 'Gross Salary', value: d.formatMoney(d.review.gross) },
          { label: 'Earnings', value: d.formatMoney(d.review.totalEarnings) },
          { label: 'Deductions', value: d.formatMoney(d.review.totalDeductions) },
          { label: 'Net Payable', value: d.formatMoney(d.review.netPayable), highlight: true },
          { label: 'Payment Ref', value: emp.paymentRef ?? '—' },
          { label: 'Department', value: emp.department },
          { label: 'Role', value: emp.role },
        ].map((c) => (
          <div key={c.label} className="bv-surface p-5">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">{c.label}</p>
            <p className="text-headline-md font-bold text-on-background">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bv-surface p-6">
          <h3 className="text-title-lg font-semibold text-on-background mb-4">Monthly Info & Attendance</h3>
          {d.attendanceLoading ? (
            <p className="text-body-sm text-on-surface-variant">Loading attendance…</p>
          ) : d.attendance ? (
            <dl className="grid grid-cols-2 gap-3 text-body-md">
              {[
                ['Present', d.attendance.presentDays],
                ['Absent', d.attendance.absentDays],
                ['Half Day', d.attendance.halfDays],
                ['On Leave', d.attendance.onLeaveDays],
                ['Holidays', d.attendance.holidayDays],
                ['Week Off', d.attendance.weekOffDays],
                ['Total Hours', `${d.attendance.workingHours}h`],
                ['Break', `${Math.floor(d.attendance.breakMinutes / 60)}h ${d.attendance.breakMinutes % 60}m`],
                ['Overtime', `${d.attendance.overtimeHours}h`],
                ['Late Arrivals', d.attendance.lateCount ?? '—'],
                ['Early Departures', d.attendance.earlyDepartures ?? '—'],
                ['Attendance %', `${d.attendance.attendancePct}%`],
              ].map(([k, v]) => (
                <div key={String(k)} className="bg-surface-container-low rounded-lg p-3">
                  <dt className="text-label-sm text-on-surface-variant">{k}</dt>
                  <dd className="font-semibold text-on-background">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <dl className="grid grid-cols-2 gap-3 text-body-md">
              {[
                ['Working Days', review.attendance.workingDays],
                ['Present Days', review.attendance.presentDays],
                ['Paid Leave', review.attendance.paidLeave],
                ['LOP Days', review.attendance.lopDays],
                ['Working Hours', `${review.attendance.workingHours}h`],
                ['Overtime Hours', `${review.attendance.overtimeHours}h`],
              ].map(([k, v]) => (
                <div key={String(k)} className="bg-surface-container-low rounded-lg p-3">
                  <dt className="text-label-sm text-on-surface-variant">{k}</dt>
                  <dd className="font-semibold text-on-background">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section className="bv-surface p-6">
          <h3 className="text-title-lg font-semibold text-on-background mb-4">Earnings & Deductions</h3>
          <div className="space-y-2 text-body-md">
            {review.earnings.map((e) => (
              <div key={e.name} className="flex justify-between">
                <span className="text-on-surface">{e.name}</span>
                <span className="text-secondary font-medium">+{d.formatMoney(e.amount)}</span>
              </div>
            ))}
            {review.deductions.map((e) => (
              <div key={e.name} className="flex justify-between">
                <span className="text-on-surface">{e.name}</span>
                <span className="text-error font-medium">-{d.formatMoney(e.amount)}</span>
              </div>
            ))}
            {review.adjustments.map((a) => (
              <div key={a.id} className="flex justify-between">
                <span className="text-on-surface">{a.title}</span>
                <span className="font-medium">{d.formatMoney(a.amount)}</span>
              </div>
            ))}
            {review.earnings.length === 0 && review.deductions.length === 0 && (
              <p className="text-body-sm text-on-surface-variant">No line items.</p>
            )}
          </div>
        </section>
      </div>

      {d.showPayModal && (
        <RecordPaymentModal
          employeeName={emp.name}
          employeeCode={emp.code}
          role={emp.role}
          amount={review.netPayable}
          paymentRef={d.paymentRef}
          setPaymentRef={d.setPaymentRef}
          method={d.paymentMethod}
          setMethod={d.setPaymentMethod}
          paymentDate={d.paymentDate}
          setPaymentDate={d.setPaymentDate}
          receiptFiles={d.receiptFiles}
          setReceiptFiles={d.setReceiptFiles}
          isPending={d.payMut.isPending}
          formatMoney={d.formatMoney}
          onClose={() => d.setShowPayModal(false)}
          onConfirm={() => {
            d.payMut.mutate(undefined, {
              onSuccess: () => {
                d.setShowPayModal(false)
                safeNavigate(navigate, {
                  to: payrollRoutes.payslipPath,
                  params: { payrollId: emp.payrollId ?? emp.id },
                })
              },
            })
          }}
        />
      )}

      {rejectOpen && (
        <Modal title="Reject payroll" onClose={() => !d.rejectMut.isPending && setRejectOpen(false)}>
          <div className="space-y-4">
            <p className="text-body-sm text-on-surface-variant">
              {emp.name}'s {review.periodLabel} payroll will go back to Calculated. A reason is required.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason for rejection…"
              className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-sm resize-none focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-colors"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" disabled={d.rejectMut.isPending} onClick={() => setRejectOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!rejectReason.trim() || d.rejectMut.isPending}
                onClick={() => {
                  d.rejectMut.mutate(rejectReason.trim(), {
                    onSuccess: () => setRejectOpen(false),
                  })
                }}
              >
                {d.rejectMut.isPending ? 'Rejecting…' : 'Reject payroll'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {d.showManualModal && (
        <ManualPayModal
          employeeName={emp.name}
          employeeCode={emp.code}
          role={emp.role}
          systemAmount={review.netPayable}
          form={d.manualForm}
          setForm={d.setManualForm}
          isPending={d.manualPayMut.isPending}
          formatMoney={d.formatMoney}
          onClose={() => d.setShowManualModal(false)}
          onConfirm={() => {
            d.manualPayMut.mutate(undefined, {
              onSuccess: () => {
                d.setShowManualModal(false)
                safeNavigate(navigate, {
                  to: payrollRoutes.payslipPath,
                  params: { payrollId: emp.payrollId ?? emp.id },
                })
              },
            })
          }}
        />
      )}
    </div>
  )
}
