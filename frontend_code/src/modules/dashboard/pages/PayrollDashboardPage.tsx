export function PayrollDashboardPage() {
  return (
    <div className="space-y-8">
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
            className="px-5 py-2.5 bg-surface-container border border-outline-variant text-on-surface text-label-md rounded-lg flex items-center gap-2 hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[20px]">ios_share</span> Export Payroll
          </button>
          <button
            type="button"
            className="px-5 py-2.5 bg-surface-container border border-outline-variant text-on-surface text-label-md rounded-lg flex items-center gap-2 hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[20px]">description</span> Generate Payslips
          </button>
          <button
            type="button"
            className="px-6 py-2.5 bg-secondary text-on-secondary text-label-md rounded-lg flex items-center gap-2 shadow-lg shadow-secondary/20 hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[20px]">payments</span> Run Payroll
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Processed', value: '$1.2M', note: '+4.2% vs last month' },
          { label: 'Pending Payroll', value: '$245K', note: 'Due in 4 days' },
          { label: 'Total Salary', value: '$850K', note: 'Monthly average' },
          { label: 'Deductions', value: '$120K', note: 'Tax & Benefits' },
          { label: 'Bonuses', value: '$85K', note: 'Q3 Incentives' },
        ].map((c) => (
          <div
            key={c.label}
            className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-all"
          >
            <p className="text-label-md text-on-surface-variant mb-2">{c.label}</p>
            <h3 className="text-title-lg text-on-surface mb-2">{c.value}</h3>
            <p className="text-body-sm text-on-surface-variant opacity-70">{c.note}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-title-lg text-on-surface">Monthly Payroll Trend</h4>
              <p className="text-body-sm text-on-surface-variant">Expenditure over the last 6 months</p>
            </div>
            <select className="bg-surface-container-low border-none rounded-lg text-label-md px-4 py-2">
              <option>Last 6 Months</option>
              <option>Current Year</option>
            </select>
          </div>
          <div className="h-[260px] flex items-end justify-between gap-4 px-2">
            {[
              { m: 'Apr', h: 60 },
              { m: 'May', h: 55 },
              { m: 'Jun', h: 70 },
              { m: 'Jul', h: 65 },
              { m: 'Aug', h: 80 },
              { m: 'Sep', h: 75 },
            ].map((b) => (
              <div key={b.m} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-secondary/20 rounded-t relative" style={{ height: `${b.h}%` }}>
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-secondary rounded-full ring-4 ring-white" />
                </div>
                <span className="mt-3 text-label-sm text-on-surface-variant">{b.m}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
          <h4 className="text-title-lg text-on-surface mb-4">Department Cost Distribution</h4>
          <div className="flex items-center justify-center py-6">
            <div
              className="relative w-40 h-40 rounded-full border-[16px] border-secondary-container flex items-center justify-center"
              style={{ borderRightColor: '#0059bb', borderBottomColor: '#0b1c30' }}
            >
              <div className="text-center">
                <p className="text-title-lg font-bold text-on-surface">$1.2M</p>
                <p className="text-label-sm text-on-surface-variant">Total Cost</p>
              </div>
            </div>
          </div>
          <div className="space-y-3 mt-2">
            {[
              { name: 'Engineering', val: '$540K (45%)', color: 'bg-secondary-container' },
              { name: 'Sales & Ops', val: '$360K (30%)', color: 'bg-secondary' },
              { name: 'Marketing', val: '$300K (25%)', color: 'bg-primary' },
            ].map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${d.color}`} />
                  <span className="text-label-md text-on-surface">{d.name}</span>
                </div>
                <span className="text-label-md font-bold text-on-surface">{d.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
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
              {[
                { name: 'Jane Doe', role: 'Senior Engineer', dept: 'Engineering', amount: '$8,450', initials: 'JD' },
                { name: 'Alex Smith', role: 'Marketing Lead', dept: 'Marketing', amount: '$7,200', initials: 'AS' },
                { name: 'Michael Ross', role: 'Account Manager', dept: 'Sales', amount: '$6,800', initials: 'MR' },
              ].map((r) => (
                <tr key={r.name} className="hover:bg-surface-container-low/40">
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
                    <button type="button" className="px-3 py-1.5 text-error text-label-md hover:bg-error-container/20 rounded">
                      Reject
                    </button>
                    <button type="button" className="px-4 py-1.5 bg-secondary text-on-secondary text-label-md rounded shadow-sm hover:opacity-90">
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
