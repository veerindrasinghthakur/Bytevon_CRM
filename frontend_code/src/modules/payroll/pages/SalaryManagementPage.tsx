import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'

export function SalaryManagementPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant text-label-md mb-2">
            <span className="cursor-pointer hover:text-secondary transition-colors" onClick={() => navigate({ to: '/payroll' })}>
              Payroll
            </span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-deep-navy font-medium">Salary Management</span>
          </div>
          <h1 className="text-headline-lg font-semibold text-deep-navy">Salary Management</h1>
        </div>
        <div className="flex items-center gap-4 bg-surface-container-lowest px-6 py-4 rounded-xl border border-outline-variant shadow-sm">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary">
            SJ
          </div>
          <div>
            <h2 className="text-title-lg font-semibold text-deep-navy">Sarah Jenkins</h2>
            <div className="flex items-center gap-3 text-on-surface-variant text-body-sm mt-1">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">badge</span> BT-092
              </span>
              <span className="w-1 h-1 rounded-full bg-outline-variant" />
              <span>Engineering</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant" />
              <span>Senior Engineer</span>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 card-hover">
        <div className="flex gap-12 flex-wrap">
          <div>
            <p className="text-on-surface-variant text-label-md uppercase tracking-wider mb-2">Gross Salary</p>
            <p className="text-display-lg font-bold text-deep-navy">
              $8,500<span className="text-headline-md text-on-surface-variant font-normal">/mo</span>
            </p>
          </div>
          <div className="pt-2">
            <p className="text-on-surface-variant text-label-md uppercase tracking-wider mb-2">Effective From</p>
            <p className="text-title-lg font-semibold text-deep-navy flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">calendar_month</span>
              Jan 01, 2024
            </p>
          </div>
          <div className="pt-2">
            <p className="text-on-surface-variant text-label-md uppercase tracking-wider mb-2">Status</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-emerald/10 text-success-emerald border border-success-emerald/20">
              <span className="w-1.5 h-1.5 rounded-full bg-success-emerald mr-1.5" />
              ACTIVE
            </span>
          </div>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>edit_document</span>}
          onClick={() => navigate({ to: '/payroll/salary/revise' })}
        >
          Revise Salary
        </Button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h3 className="text-title-lg font-semibold text-deep-navy">Salary Breakdown</h3>
            <button type="button" className="text-on-surface-variant hover:text-secondary transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-bright border-b border-outline-variant">
                  <th className="py-3 px-6 text-label-sm text-on-surface-variant uppercase tracking-wider">Salary Item</th>
                  <th className="py-3 px-6 text-label-sm text-on-surface-variant uppercase tracking-wider">Type</th>
                  <th className="py-3 px-6 text-label-sm text-on-surface-variant uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {[
                  ['Basic Salary', 'EARNING', '$4,500.00'],
                  ['House Rent Allowance (HRA)', 'EARNING', '$1,500.00'],
                  ['Conveyance Allowance', 'EARNING', '$500.00'],
                  ['Special Allowance', 'EARNING', '$2,000.00'],
                ].map(([item, type, amt]) => (
                  <tr key={item} className="bv-row-hover">
                    <td className="py-4 px-6 text-label-md text-deep-navy">{item}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary-container text-on-secondary-container border border-outline-variant">
                        {type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-body-md text-deep-navy text-right font-medium">{amt}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-surface-container-low border-t-2 border-outline-variant">
                <tr>
                  <td className="py-4 px-6 text-title-lg font-semibold text-deep-navy text-right" colSpan={2}>
                    Total Gross
                  </td>
                  <td className="py-4 px-6 text-title-lg font-semibold text-deep-navy text-right">$8,500.00</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h3 className="text-title-lg font-semibold text-deep-navy">Salary History</h3>
            <button type="button" className="text-on-surface-variant hover:text-secondary p-1 rounded hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-bright border-b border-outline-variant">
                  <th className="py-3 px-6 text-label-sm text-on-surface-variant uppercase tracking-wider">Period</th>
                  <th className="py-3 px-6 text-label-sm text-on-surface-variant uppercase tracking-wider text-right">Gross Salary</th>
                  <th className="py-3 px-6 text-label-sm text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="py-3 px-6 text-label-sm text-on-surface-variant uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-on-surface-variant">
                {[
                  { from: 'Oct 01, 2023', to: 'Dec 31, 2023', gross: '$7,800.00' },
                  { from: 'Jan 01, 2023', to: 'Sep 30, 2023', gross: '$7,200.00' },
                ].map((h) => (
                  <tr key={h.from} className="bv-row-hover">
                    <td className="py-4 px-6 text-body-sm">
                      <div className="flex flex-col">
                        <span className="font-medium text-deep-navy">{h.from}</span>
                        <span className="text-xs text-on-surface-variant">to {h.to}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-body-md text-right text-deep-navy">{h.gross}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-container text-on-surface-variant border border-outline-variant">
                        HISTORICAL
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        type="button"
                        className="text-primary hover:text-secondary text-label-md transition-colors flex items-center justify-center gap-1 mx-auto"
                        onClick={() => navigate({ to: '/payroll/history/$employeeId', params: { employeeId: 'e1' } })}
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
