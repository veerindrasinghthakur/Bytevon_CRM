import { useNavigate, useParams } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { payrollEmployees } from '../data/mock'

export function PayslipViewPage() {
  const navigate = useNavigate()
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }
  const emp = payrollEmployees.find((e) => e.id === employeeId) ?? payrollEmployees[0]

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button type="button" className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container" onClick={() => navigate({ to: '/payroll/monthly' })}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-headline-lg font-bold text-on-surface">Payslip</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">PAID</span>
          </div>
          <p className="text-body-md text-on-surface-variant ml-10">
            {emp.name} <span className="mx-2 text-outline-variant">•</span> {emp.code}{' '}
            <span className="mx-2 text-outline-variant">•</span> August 2026
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-sm">visibility</span>}>View PDF</Button>
          <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-sm">download</span>}>Download</Button>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col sm:flex-row gap-6 sm:gap-12">
        <div>
          <p className="text-[10px] text-outline uppercase tracking-wider mb-1">Payment Date</p>
          <p className="text-label-md font-semibold text-on-surface">Aug 31, 2026</p>
        </div>
        <div>
          <p className="text-[10px] text-outline uppercase tracking-wider mb-1">Payment Method</p>
          <p className="text-label-md font-semibold text-on-surface flex items-center">
            <span className="material-symbols-outlined text-sm mr-1 text-on-surface-variant">account_balance</span> Bank Transfer
          </p>
        </div>
        <div>
          <p className="text-[10px] text-outline uppercase tracking-wider mb-1">Reference Number</p>
          <p className="text-label-md font-semibold text-on-surface font-mono text-sm">TXN-98234105</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <SumCard label="Gross Salary" value="₹75,000" />
        <SumCard label="Total Earnings" value="₹75,000" accent="border-l-4 border-l-surface-tint" />
        <SumCard label="Total Deductions" value="₹6,500" accent="border-l-4 border-l-error" />
        <SumCard label="Adjustments" value="+₹1,500" accent="border-l-4 border-l-secondary" />
        <div className="bg-deep-navy text-white rounded-xl p-5 shadow-md flex flex-col justify-center">
          <p className="text-label-sm text-inverse-primary mb-1 opacity-80">Net Salary</p>
          <p className="text-headline-md font-bold">₹70,000</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant flex justify-between items-center">
            <h3 className="text-title-lg font-semibold text-on-surface flex items-center">
              <span className="material-symbols-outlined mr-2 text-surface-tint">add_circle</span> Earnings
            </h3>
            <span className="text-label-md text-on-surface-variant font-semibold">₹75,000</span>
          </div>
          <table className="w-full text-left">
            <tbody className="text-body-md text-on-surface">
              {[['Basic Salary', '₹45,000'], ['HRA', '₹15,000'], ['Conveyance', '₹5,000'], ['Special Allowance', '₹10,000']].map(([c, a]) => (
                <tr key={c} className="border-b border-outline-variant/30 hover:bg-surface-container-low/50">
                  <td className="py-4 px-6">{c}</td>
                  <td className="py-4 px-6 text-right font-medium">{a}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant flex justify-between items-center">
            <h3 className="text-title-lg font-semibold text-on-surface flex items-center">
              <span className="material-symbols-outlined mr-2 text-error">remove_circle</span> Deductions
            </h3>
            <span className="text-label-md text-on-surface-variant font-semibold">₹6,500</span>
          </div>
          <table className="w-full text-left">
            <tbody className="text-body-md text-on-surface">
              {[['PF', '-₹3,600'], ['TDS', '-₹2,400'], ['Professional Tax', '-₹500']].map(([c, a]) => (
                <tr key={c} className="border-b border-outline-variant/30">
                  <td className="py-4 px-6">{c}</td>
                  <td className="py-4 px-6 text-right font-medium text-error">{a}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SumCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className={`bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm ${accent ?? ''}`}>
      <p className="text-label-sm text-outline mb-2">{label}</p>
      <p className="text-title-lg font-semibold text-on-surface">{value}</p>
    </div>
  )
}
