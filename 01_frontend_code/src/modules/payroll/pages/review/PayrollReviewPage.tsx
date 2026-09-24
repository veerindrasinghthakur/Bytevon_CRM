import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { BackButton } from '@/shared/components/layout/BackButton'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { usePayrollReview } from '../../hooks/review/use-payroll-review'
import { payrollRoutes } from '../../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { Can } from '@/shared/rbac'
import { ReviewMetricCard } from '../../components/review/ReviewMetricCard'
import { RecordPaymentModal } from '../../components/review/RecordPaymentModal'

export function PayrollReviewPage() {
  const navigate = useNavigate()
  const {
    emp,
    showPayModal,
    setShowPayModal,
    paymentRef,
    setPaymentRef,
    gross,
    totalEarnings,
    totalDeductions,
    netAdj,
    netPayable,
    attendanceSummary,
    earnings,
    deductions,
    adjustments,
    formatMoney,
    periodLabel,
    isLoading,
    isError,
    approveMut,
    payMut,
    rejectMut,
  } = usePayrollReview()

  if (isLoading) {
    return <div className="p-8 text-body-md text-on-surface-variant">Loading payroll review…</div>
  }
  if (isError || !emp) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-body-md text-error">Payroll review not found.</p>
        <BackButton to={payrollRoutes.monthly} />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BackButton to={payrollRoutes.monthly} label="" className="!px-2" />
            <h1 className="text-headline-lg font-semibold text-on-surface m-0">Payroll Review</h1>
            <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-label-sm flex items-center gap-1 ml-2">
              <span className="material-symbols-outlined text-[16px]">pending_actions</span>
              {emp.status.toUpperCase()}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-body-sm text-on-surface-variant ml-12">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">person</span>
              <span className="font-medium text-on-surface">{emp.name}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">badge</span>
              {emp.code}
            </span>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">work</span>
              {emp.department}
            </span>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span className="font-medium">{periodLabel}</span>
            </span>
          </div>
        </div>
        <div className="flex gap-2 ml-12 md:ml-0">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">print</span>}
          >
            Print
          </Button>
          <ExportButton
            resource={'payroll'}
            filenameStem={`payroll-review-${emp.code}`}
            label="Export"
          />
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReviewMetricCard
          title="Gross Salary"
          value={formatMoney(gross)}
          hint="Base package"
          icon="payments"
          iconBg="bg-surface-container text-secondary"
        />
        <ReviewMetricCard
          title="Total Earnings"
          value={formatMoney(totalEarnings)}
          hint={
            <span className="text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span> Includes allowances
            </span>
          }
          icon="trending_up"
          iconBg="bg-secondary/15 text-secondary"
        />
        <ReviewMetricCard
          title="Total Deductions"
          value={`-${formatMoney(totalDeductions)}`}
          hint="Taxes & benefits"
          icon="trending_down"
          iconBg="bg-error-container text-on-error-container"
        />
        <div className="bg-primary border border-primary rounded-lg p-6 executive-shadow flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-on-primary opacity-5 rounded-full blur-2xl" />
          <div className="flex items-start justify-between mb-4 relative z-10">
            <h3 className="text-body-sm text-inverse-primary">Net Payable</h3>
            <div className="p-2 bg-on-primary/10 rounded-lg text-on-primary">
              <span className="material-symbols-outlined">account_balance</span>
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-headline-lg font-semibold text-on-primary">{formatMoney(netPayable)}</div>
            <div className="text-body-sm text-inverse-primary mt-1">Final transfer amount</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <section className="bv-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center bg-surface-bright">
              <h2 className="text-title-lg font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant">schedule</span>
                Attendance Summary
              </h2>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
              {attendanceSummary.map(([l, v]) => (
                <div key={l} className="bg-surface p-4 rounded-lg border border-surface-variant card-hover">
                  <div className="text-body-sm text-on-surface-variant mb-1">{l}</div>
                  <div className="text-title-lg font-semibold text-on-surface">{v}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="bv-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-surface-bright">
              <h2 className="text-title-lg font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant">receipt_long</span>
                Salary Breakdown
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-outline-variant">
              <div className="p-6">
                <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-4">Earnings</h3>
                <ul className="space-y-4">
                  {earnings.map((e) => (
                    <li key={e.name} className="flex justify-between items-center text-body-md">
                      <span className="text-on-surface">{e.name}</span>
                      <span className="font-medium text-on-surface">{formatMoney(e.amount)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-4 border-t border-outline-variant flex justify-between items-center">
                  <span className="text-label-md text-on-surface-variant">Gross Earnings</span>
                  <span className="text-title-lg font-semibold text-on-surface">{formatMoney(totalEarnings)}</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-4">Deductions</h3>
                <ul className="space-y-4">
                  {deductions.map((d) => (
                    <li key={d.name} className="flex justify-between items-center text-body-md">
                      <span className="text-on-surface">{d.name}</span>
                      <span className="font-medium text-on-surface">{formatMoney(d.amount)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-4 border-t border-outline-variant flex justify-between items-center">
                  <span className="text-label-md text-on-surface-variant">Total Deductions</span>
                  <span className="text-title-lg font-semibold text-on-surface">-{formatMoney(totalDeductions)}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="bv-surface p-6">
            <h3 className="text-title-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant">tune</span>
              Adjustments
            </h3>
            <div className="space-y-3">
              {adjustments.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">No adjustments</p>
              ) : (
                adjustments.map((adj) => (
                  <div
                    key={adj.id}
                    className="bg-surface p-3 rounded border border-surface-variant flex justify-between items-start"
                  >
                    <div>
                      <div className="font-medium text-body-md text-on-surface">{adj.title}</div>
                      <div className="text-body-sm text-on-surface-variant mt-1">{adj.detail}</div>
                    </div>
                    <div
                      className={
                        adj.amount >= 0
                          ? 'font-medium text-body-md text-secondary bg-secondary/15 px-2 py-1 rounded'
                          : 'font-medium text-body-md text-on-error-container bg-error-container px-2 py-1 rounded'
                      }
                    >
                      {adj.amount >= 0 ? '+' : ''}
                      {formatMoney(adj.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-outline-variant flex justify-between items-center">
              <span className="text-label-md text-on-surface-variant">Net Adjustments</span>
              <span className="text-title-lg font-semibold text-on-surface">
                {netAdj >= 0 ? '+' : ''}
                {formatMoney(netAdj)}
              </span>
            </div>
          </section>

          <section className="bv-surface overflow-hidden flex flex-col">
            <div className="p-6 flex-grow">
              <h3 className="text-title-lg font-semibold text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant">calculate</span>
                Final Calculation
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-body-md">
                  <span className="text-on-surface-variant">Gross Earnings</span>
                  <span className="font-medium">{formatMoney(totalEarnings)}</span>
                </div>
                <div className="flex justify-between text-body-md">
                  <span className="text-on-surface-variant">Total Deductions</span>
                  <span className="font-medium">-{formatMoney(totalDeductions)}</span>
                </div>
                <div className="flex justify-between text-body-md">
                  <span className="text-on-surface-variant">Net Adjustments</span>
                  <span className="font-medium">
                    {netAdj >= 0 ? '+' : ''}
                    {formatMoney(netAdj)}
                  </span>
                </div>
              </div>
              <div className="bg-surface-container p-4 rounded-lg border border-secondary-fixed">
                <div className="text-body-sm text-on-surface-variant mb-1 font-medium">Net Payable</div>
                <div className="text-display-lg font-bold text-on-surface tracking-tight">
                  {formatMoney(netPayable)}
                </div>
              </div>
            </div>
            <div className="p-6 bg-surface-bright border-t border-outline-variant flex flex-col gap-3">
              <Can action="APPROVE" resource="payroll">
                <button
                  type="button"
                  className="w-full bg-primary text-on-primary font-medium py-3 px-4 rounded-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2 executive-shadow disabled:opacity-50"
                  disabled={approveMut.isPending || emp.status === 'Approved' || emp.status === 'Paid'}
                  onClick={() => approveMut.mutate()}
                >
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  {approveMut.isPending ? 'Approving…' : 'Approve Payroll'}
                </button>
              </Can>
              {emp.status === 'Approved' && (
                <Can action="APPROVE" resource="payroll">
                  <button
                    type="button"
                    className="w-full bg-surface-container-lowest border border-error/40 text-error font-medium py-3 px-4 rounded-lg hover:bg-error/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    disabled={rejectMut.isPending}
                    onClick={() => {
                      const reason = window.prompt('Reason for rejection?')
                      if (reason == null) return
                      if (!reason.trim()) return
                      rejectMut.mutate(reason.trim())
                    }}
                  >
                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                    {rejectMut.isPending ? 'Rejecting…' : 'Reject'}
                  </button>
                </Can>
              )}
              <button
                type="button"
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-medium py-3 px-4 rounded-lg hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">edit_note</span>
                Request Correction
              </button>
              <button
                type="button"
                className="w-full border border-primary text-primary font-medium py-3 px-4 rounded-lg hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={emp.status === 'Paid'}
                onClick={() => setShowPayModal(true)}
              >
                <span className="material-symbols-outlined text-[20px]">payments</span>
                Record Payment
              </button>
            </div>
          </section>
        </div>
      </div>

      {showPayModal && (
        <RecordPaymentModal
          employeeName={emp.name}
          employeeCode={emp.code}
          role={emp.role}
          amount={netPayable}
          paymentRef={paymentRef}
          setPaymentRef={setPaymentRef}
          isPending={payMut.isPending}
          formatMoney={formatMoney}
          onClose={() => setShowPayModal(false)}
          onConfirm={() => {
            payMut.mutate(paymentRef || undefined, {
              onSuccess: () => {
                setShowPayModal(false)
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
