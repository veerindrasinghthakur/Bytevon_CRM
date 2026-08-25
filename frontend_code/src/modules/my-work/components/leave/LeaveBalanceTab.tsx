import type { LeaveBalance } from '../../types'

export function LeaveBalanceTab({
  totalAllocated,
  totalUsed,
  totalRemaining,
  pendingDays,
  balances,
}: {
  totalAllocated: number
  totalUsed: number
  totalRemaining: number
  pendingDays: number
  balances: LeaveBalance[]
}) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bv-surface card-hover p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              <span className="material-symbols-outlined text-primary">assignment</span>
            </div>
            <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded">
              ANNUAL
            </span>
          </div>
          <p className="text-label-sm text-on-surface-variant mb-1">Total Entitlement</p>
          <p className="text-3xl font-bold text-on-background">
            {totalAllocated}{' '}
            <span className="text-lg font-medium text-on-surface-variant">days</span>
          </p>
        </div>
        <div className="bv-surface card-hover p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-error/5 rounded-lg">
              <span className="material-symbols-outlined text-error">event_busy</span>
            </div>
            <span className="text-[10px] font-bold text-error bg-error/10 px-2 py-0.5 rounded">USED</span>
          </div>
          <p className="text-label-sm text-on-surface-variant mb-1">Used Leave</p>
          <p className="text-3xl font-bold text-on-background">
            {totalUsed} <span className="text-lg font-medium text-on-surface-variant">days</span>
          </p>
          <div className="mt-3 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-error rounded-full transition-all duration-1000"
              style={{
                width: `${totalAllocated ? (totalUsed / totalAllocated) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
        <div className="bv-surface card-hover p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-secondary/5 rounded-lg">
              <span className="material-symbols-outlined text-secondary">pending_actions</span>
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded">
              PENDING
            </span>
          </div>
          <p className="text-label-sm text-on-surface-variant mb-1">Pending Approval</p>
          <p className="text-3xl font-bold text-on-background">
            {pendingDays} <span className="text-lg font-medium text-on-surface-variant">days</span>
          </p>
        </div>
        <div className="bg-secondary p-5 rounded-xl border border-secondary executive-shadow text-white card-hover">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <span className="material-symbols-outlined text-white">account_balance_wallet</span>
            </div>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">AVAILABLE</span>
          </div>
          <p className="text-label-sm text-white/80 mb-1">Remaining Balance</p>
          <p className="text-3xl font-bold">
            {totalRemaining} <span className="text-lg font-medium text-white/70">days</span>
          </p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title-lg font-semibold text-on-background">Leave Type Breakdown</h2>
        </div>
        <div className="bv-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-on-surface-variant text-label-sm uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold">Leave Type</th>
                  <th className="px-6 py-3 font-semibold">Allocated</th>
                  <th className="px-6 py-3 font-semibold">Used</th>
                  <th className="px-6 py-3 font-semibold">Remaining</th>
                  <th className="px-6 py-3 font-semibold w-1/4">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {balances.map((lb) => {
                  const pct = lb.total ? Math.round((lb.used / lb.total) * 100) : 0
                  return (
                    <tr key={lb.type} className="zebra-row">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-secondary" />
                          <span className="text-label-md font-semibold text-on-surface">
                            {lb.type} Leave
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-label-md text-on-surface">{lb.total} days</td>
                      <td className="px-6 py-4 text-label-md text-error">{lb.used} days</td>
                      <td className="px-6 py-4 text-label-md font-bold text-on-surface">
                        {lb.remaining} days
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                            <div
                              className="h-full bg-secondary rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-on-surface-variant uppercase">
                            {pct}% utilized
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
