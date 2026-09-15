import { Button } from '@/shared/components/ui/Button'
import { BackButton } from '@/shared/components/layout/BackButton'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { ResourceName } from '@/shared/schema'
import { exportAndDownload } from '@/shared/api/export'
import { usePayslip } from '../../hooks/payslip/use-payslip'
import { payrollStatusStyles } from '../../schemas/enums'
import { payrollRoutes } from '../../routes'
import { cn } from '@/shared/lib/cn'
import { PayslipSumCard } from '../../components/payslip/PayslipSumCard'

export function PayslipViewPage() {
  const { payslip, emp, formatMoney, isLoading, isError } = usePayslip()

  if (isLoading) {
    return <div className="p-8 text-body-md text-on-surface-variant">Loading payslip…</div>
  }
  if (isError || !payslip || !emp) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-body-md text-error">Payslip not found.</p>
        <BackButton to={payrollRoutes.monthly} />
      </div>
    )
  }

  const handleDownload = () => {
    void exportAndDownload({
      resource: ResourceName.PAYROLL,
      format: 'pdf',
      filenameStem: `payslip-${emp.code}-${payslip.periodLabel.replace(/\s+/g, '-')}`,
      filters: { employeeId: emp.id },
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <BackButton to={payrollRoutes.monthly} label="" className="!px-1" />
            <h1 className="text-headline-lg font-bold text-on-background">Payslip</h1>
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                payrollStatusStyles[emp.status] ?? 'status-badge status-neutral',
              )}
            >
              {emp.status.toUpperCase()}
            </span>
          </div>
          <p className="text-body-md text-on-surface-variant ml-10">
            {emp.name} <span className="mx-2 text-outline-variant">•</span> {emp.code}{' '}
            <span className="mx-2 text-outline-variant">•</span> {payslip.periodLabel}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-sm">visibility</span>}
            onClick={() => {
              /* PDF viewer stub — later */
            }}
          >
            View PDF
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-sm">download</span>}
            onClick={handleDownload}
          >
            Download
          </Button>
          <ExportButton
            resource={ResourceName.PAYROLL}
            filters={{ employeeId: emp.id }}
            filenameStem={`payslip-${emp.code}`}
          />
        </div>
      </div>

      <div className="bv-surface p-6 flex flex-col sm:flex-row gap-6 sm:gap-12">
        <div>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Payment Date</p>
          <p className="text-label-md font-semibold text-on-background">{payslip.paymentDate}</p>
        </div>
        <div>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Payment Method</p>
          <p className="text-label-md font-semibold text-on-background flex items-center">
            <span className="material-symbols-outlined text-sm mr-1 text-secondary">account_balance</span>
            {payslip.paymentMethod}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Reference Number</p>
          <p className="text-label-md font-semibold text-on-background font-mono text-sm">
            {payslip.referenceNumber}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <PayslipSumCard label="Gross Salary" value={formatMoney(payslip.gross)} />
        <PayslipSumCard
          label="Total Earnings"
          value={formatMoney(payslip.totalEarnings)}
          accent="border-l-4 border-l-secondary"
        />
        <PayslipSumCard
          label="Total Deductions"
          value={formatMoney(payslip.totalDeductions)}
          accent="border-l-4 border-l-error"
        />
        <PayslipSumCard
          label="Adjustments"
          value={`${payslip.netAdjustments >= 0 ? '+' : ''}${formatMoney(payslip.netAdjustments)}`}
          accent="border-l-4 border-l-primary"
        />
        <div className="bg-primary text-on-primary rounded-xl p-5 executive-shadow flex flex-col justify-center">
          <p className="text-label-sm text-inverse-primary mb-1 opacity-80">Net Salary</p>
          <p className="text-headline-md font-bold text-on-primary">{formatMoney(payslip.net)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bv-surface overflow-hidden">
          <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant flex justify-between items-center">
            <h3 className="text-title-lg font-semibold text-on-background flex items-center">
              <span className="material-symbols-outlined mr-2 text-secondary">add_circle</span>
              Earnings
            </h3>
            <span className="text-label-md text-on-surface-variant font-semibold">
              {formatMoney(payslip.totalEarnings)}
            </span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                <th className="py-3 px-6 text-label-sm text-on-surface-variant font-medium uppercase tracking-wider w-2/3">
                  Component
                </th>
                <th className="py-3 px-6 text-label-sm text-on-surface-variant font-medium uppercase tracking-wider text-right w-1/3">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="text-body-md text-on-background">
              {payslip.earnings.map((e) => (
                <tr key={e.name} className="border-b border-outline-variant zebra-row">
                  <td className="py-4 px-6">{e.name}</td>
                  <td className="py-4 px-6 text-right font-medium">{formatMoney(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="bv-surface overflow-hidden">
            <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <h3 className="text-title-lg font-semibold text-on-background flex items-center">
                <span className="material-symbols-outlined mr-2 text-error">remove_circle</span>
                Deductions
              </h3>
              <span className="text-label-md text-on-surface-variant font-semibold">
                {formatMoney(payslip.totalDeductions)}
              </span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="py-3 px-6 text-label-sm text-on-surface-variant font-medium uppercase tracking-wider w-2/3">
                    Component
                  </th>
                  <th className="py-3 px-6 text-label-sm text-on-surface-variant font-medium uppercase tracking-wider text-right w-1/3">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="text-body-md text-on-background">
                {payslip.deductions.map((d) => (
                  <tr key={d.name} className="border-b border-outline-variant zebra-row">
                    <td className="py-4 px-6">{d.name}</td>
                    <td className="py-4 px-6 text-right font-medium text-error">-{formatMoney(d.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bv-surface overflow-hidden">
            <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <h3 className="text-title-lg font-semibold text-on-background flex items-center">
                <span className="material-symbols-outlined mr-2 text-secondary">tune</span>
                Adjustments
              </h3>
              <span className="text-label-md text-on-surface-variant font-semibold">
                {payslip.netAdjustments >= 0 ? '+' : ''}
                {formatMoney(payslip.netAdjustments)}
              </span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="py-3 px-6 text-label-sm text-on-surface-variant font-medium uppercase tracking-wider w-2/3">
                    Description
                  </th>
                  <th className="py-3 px-6 text-label-sm text-on-surface-variant font-medium uppercase tracking-wider text-right w-1/3">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="text-body-md text-on-background">
                {payslip.adjustments.length === 0 ? (
                  <tr>
                    <td className="py-4 px-6 text-on-surface-variant" colSpan={2}>
                      No adjustments
                    </td>
                  </tr>
                ) : (
                  payslip.adjustments.map((adj) => (
                    <tr key={adj.id} className="zebra-row">
                      <td className="py-4 px-6">
                        <div>{adj.title}</div>
                        <div className="text-xs text-on-surface-variant mt-1">{adj.detail}</div>
                      </td>
                      <td
                        className={cn(
                          'py-4 px-6 text-right font-medium',
                          adj.amount >= 0 ? 'text-secondary' : 'text-error',
                        )}
                      >
                        {adj.amount >= 0 ? '+' : ''}
                        {formatMoney(adj.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
