import { usePayrollDashboard } from '../hooks/use-payroll-dashboard'

export function PayrollDashboardPage() {
  const { kpis, trendData, departmentCosts, pendingApprovals, meta, isLoading } = usePayrollDashboard()

  if (isLoading || !meta) {
    return (
      <div className="py-16 text-center text-body-sm text-on-surface-variant">Loading dashboard…</div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-label-sm text-on-surface-variant mb-1">
            <span>ERP</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-secondary font-semibold">Payroll</span>
          </nav>
          <h2 className="text-headline-lg text-on-surface">Payroll Overview</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="px-5 py-2.5 bg-surface-container border border-outline-variant text-on-surface text-label-md rounded-lg flex items-center gap-2 hover:bg-surface-container-high transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-[20px]">ios_share</span> Export Payroll
          </button>
          <button
            type="button"
            className="px-5 py-2.5 bg-surface-container border border-outline-variant text-on-surface text-label-md rounded-lg flex items-center gap-2 hover:bg-surface-container-high transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-[20px]">description</span> Generate Payslips
          </button>
          <button
            type="button"
            className="px-6 py-2.5 bg-secondary text-on-secondary text-label-md rounded-lg flex items-center gap-2 shadow-lg shadow-secondary/20 bv-pressable"
          >
            <span className="material-symbols-outlined text-[20px]">payments</span> Run Payroll
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((c) => (
          <div key={c.label} className="bv-surface card-hover p-6">
            <p className="text-label-md text-on-surface-variant mb-2">{c.label}</p>
            <h3 className="text-title-lg text-on-surface mb-2">{c.value}</h3>
            <p className="text-body-sm text-on-surface-variant opacity-70">{c.note}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bv-surface card-hover p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-title-lg text-on-surface">Monthly Payroll Trend</h4>
              <p className="text-body-sm text-on-surface-variant">Expenditure over the last 6 months</p>
            </div>
            <select className="bg-surface-container-low border border-outline-variant rounded-lg text-label-md px-4 py-2 outline-none focus:border-secondary transition-colors">
              {meta.trendPeriods.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="h-[260px] flex items-end justify-between gap-4 px-2">
            {trendData.map((b) => (
              <div key={b.month} className="flex-1 flex flex-col items-center group cursor-pointer">
                <div
                  className="w-full bg-secondary/20 rounded-t relative group-hover:bg-secondary/40 transition-colors"
                  style={{ height: `${b.value}%` }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-secondary rounded-full ring-4 ring-white" />
                </div>
                <span className="mt-3 text-label-sm text-on-surface-variant">{b.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bv-surface card-hover p-6">
          <h4 className="text-title-lg text-on-surface mb-4">Department Cost Distribution</h4>
          <div className="flex items-center justify-center py-6">
            <div
              className="relative w-40 h-40 rounded-full border-[16px] border-secondary-container flex items-center justify-center"
              style={{
                borderRightColor: 'var(--color-secondary)',
                borderBottomColor: 'var(--color-surface-container)',
              }}
            >
              <div className="text-center">
                <p className="text-title-lg font-bold text-on-surface">{meta.totalCost}</p>
                <p className="text-label-sm text-on-surface-variant">Total Cost</p>
              </div>
            </div>
          </div>
          <div className="space-y-3 mt-2">
            {departmentCosts.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${d.colorClass}`} />
                  <span className="text-label-md text-on-surface">{d.name}</span>
                </div>
                <span className="text-label-md font-bold text-on-surface">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bv-surface overflow-hidden">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
          <h4 className="text-title-lg text-on-surface">Pending Salary Approvals</h4>
          <button type="button" className="text-secondary text-label-md hover:underline">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-on-surface-variant text-label-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {pendingApprovals.map((r) => (
                <tr key={r.name} className="zebra-row group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-secondary font-bold text-xs">
                        {r.initials}
                      </div>
                      <div>
                        <p className="text-label-md text-on-surface">{r.name}</p>
                        <p className="text-[12px] text-on-surface-variant">{r.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-label-md">{r.dept}</td>
                  <td className="px-6 py-4 text-label-md font-bold">{r.amount}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 text-error text-label-md hover:bg-error-container/20 rounded transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="px-4 py-1.5 bg-secondary text-on-secondary text-label-md rounded executive-shadow bv-pressable"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}