import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { MetricCard } from '@/shared/components/ui/MetricCard'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { ResourceName } from '@/shared/schema'
import { useDepartmentsList } from '../hooks/use-departments-list'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

export function DepartmentsListPage() {
  const navigate = useNavigate()
  const {
    items,
    filtered,
    metrics,
    loading,
    search,
    setSearch,
    status,
    setStatus,
  } = useDepartmentsList()

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Department Management"
        description="Organize structure, heads, and staffing across the organization."
        actions={
          <div className="flex gap-2 flex-wrap">
            <ExportButton
              resource={ResourceName.DEPARTMENT}
              query={search}
              filters={{ status }}
              filenameStem="departments"
            />
            <Button
              variant="primary"
              leftIcon={<Icon name="add" />}
              onClick={() => navigate({ to: '/workforce/departments/new' })}
            >
              Add Department
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Departments" value={String(metrics.total)} icon="domain" />
        <MetricCard label="Total Staffing" value={String(metrics.staffing)} icon="groups" />
        <MetricCard label="Active" value={String(metrics.active)} icon="check_circle" valueClassName="text-secondary" />
        <MetricCard label="Inactive / Archived" value={String(metrics.inactive)} icon="archive" />
      </section>

      <div className="bv-surface p-4 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-lg text-body-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-colors"
            placeholder="Search departments..."
          />
        </div>
        <Select
          value={status}
          onChange={setStatus}
          placeholder="All Statuses"
          options={[
            { value: 'All', label: 'All Statuses' },
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
          ]}
        />
      </div>

      {!loading && filtered.length === 0 && (
        <div className="bv-surface p-16 text-center space-y-3">
          <Icon name="domain_disabled" className="text-5xl text-on-surface-variant" />
          <h3 className="text-title-lg font-semibold text-on-background">No departments found</h3>
          <p className="text-body-sm text-on-surface-variant max-w-md mx-auto">
            {search || status !== 'All'
              ? 'Try clearing filters or search.'
              : 'Create your first department to organize staff and reporting lines.'}
          </p>
          <Button variant="primary" onClick={() => navigate({ to: '/workforce/departments/new' })}>
            Add Department
          </Button>
        </div>
      )}

      <div className="bv-surface overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-on-surface-variant">Loading departments…</div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest">Department Name</th>
                  <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest">Code</th>
                  <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest">Department Head</th>
                  <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest text-center">Staff</th>
                  <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map((d) => (
                  <tr
                    key={d.id}
                    className="zebra-row cursor-pointer group"
                    onClick={() =>
                      navigate({
                        to: '/workforce/departments/$departmentId',
                        params: { departmentId: String(d.id) },
                      })
                    }
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105',
                            d.status === 'Active'
                              ? 'bg-secondary/15 text-secondary'
                              : 'bg-surface-container-highest text-outline',
                          )}
                        >
                          <Icon name="domain" className="text-xl" />
                        </div>
                        <span className="font-semibold text-on-surface text-title-lg">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-on-surface-variant">{d.code}</td>
                    <td className="px-6 py-5">
                      <span className="text-label-md">{d.headName}</span>
                    </td>
                    <td className="px-6 py-5 text-center">{d.staffCount}</td>
                    <td className="px-6 py-5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-medium',
                          d.status === 'Active'
                            ? 'bg-secondary/10 text-secondary'
                            : 'bg-surface-container-high text-outline',
                        )}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="p-2 hover:bg-secondary/10 rounded-lg text-on-surface-variant transition-colors"
                        onClick={() =>
                          navigate({
                            to: '/workforce/departments/$departmentId',
                            params: { departmentId: String(d.id) },
                          })
                        }
                      >
                        <Icon name="visibility" className="text-lg" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-outline-variant text-body-sm text-on-surface-variant">
            Showing {filtered.length} of {items.length} departments
          </div>
        )}
      </div>
    </div>
  )
}
