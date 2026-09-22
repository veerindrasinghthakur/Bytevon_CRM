import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { Pagination } from '@/shared/components/ui/Pagination'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { useSalaryList } from '../../hooks/salary/use-salary-list'
import { payrollRoutes } from '../../routes'

/** List of all employees with gross salary only. Row → employee salary detail. */
export function SalaryManagementPage() {
  const navigate = useNavigate()
  const {
    rows,
    total,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    formatMoney,
    isLoading,
    isError,
    error,
    refetch,
  } = useSalaryList()

  if (isError) {
    return (
      <ErrorState
        title="Failed to load salaries"
        description={getApiErrorMessage(error, 'Could not load salary management data.')}
        onRetry={() => void refetch()}
        onBack={() => safeNavigate(navigate, { to: payrollRoutes.root })}
      />
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Salary Management"
        description="View and manage employee gross salary configurations."
        actions={
          <ExportButton
            resource={'salary'}
            filenameStem="salary-management"
            query={search}
            label="Export"
          />
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition-colors"
            placeholder="Search employee, code, department..."
            type="text"
          />
        </div>
        <p className="text-caption text-on-surface-variant">
          {isLoading ? 'Loading…' : `${total} employees`}
        </p>
      </div>

      <section className="bv-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="p-4 pl-6 font-medium">Employee</th>
                <th className="p-4 font-medium">Code</th>
                <th className="p-4 font-medium">Department</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 text-right font-medium">Gross Salary</th>
                <th className="p-4 font-medium">Effective From</th>
                <th className="p-4 font-medium text-center">Status</th>
                <th className="p-4 pr-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="zebra-row cursor-pointer h-[72px]"
                  onClick={() =>
                    safeNavigate(navigate, {
                      to: payrollRoutes.salaryDetailPath,
                      params: { employeeId: r.id },
                    })
                  }
                >
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary text-label-sm">
                        {r.initials}
                      </div>
                      <span className="text-body-md font-semibold text-on-background">{r.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-caption text-on-surface-variant">{r.code}</td>
                  <td className="p-4 text-body-md text-on-background">{r.department}</td>
                  <td className="p-4 text-body-md text-on-surface-variant">{r.role}</td>
                  <td className="p-4 text-right text-body-md font-semibold text-on-background">
                    {formatMoney(r.gross)}
                    <span className="text-caption text-on-surface-variant font-normal">/mo</span>
                  </td>
                  <td className="p-4 text-body-sm text-on-surface-variant">{r.effectiveFrom ?? '—'}</td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold status-badge status-success">
                      {r.salaryStatus ?? 'ACTIVE'}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button
                      type="button"
                      className="text-primary hover:text-secondary text-label-md transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        safeNavigate(navigate, {
                          to: payrollRoutes.salaryDetailPath,
                          params: { employeeId: r.id },
                        })
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > pageSize && (
          <div className="p-4 border-t border-outline-variant flex justify-end">
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          </div>
        )}
      </section>
    </div>
  )
}
