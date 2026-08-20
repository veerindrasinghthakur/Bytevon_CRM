import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { listDepartments, type DepartmentListItem } from '../api/departments'
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
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [items, setItems] = useState<DepartmentListItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await listDepartments({ includeArchived: true })
    setItems(res.items)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const metrics = useMemo(() => {
    const total = items.length
    const active = items.filter((d) => d.status === 'Active').length
    const inactive = items.filter((d) => d.status !== 'Active').length
    const staffing = items.reduce((sum, d) => sum + (d.staffCount ?? 0), 0)
    return { total, active, inactive, staffing }
  }, [items])

  const filtered = items.filter((d) => {
    const q = search.toLowerCase()
    const matchQ =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      d.headName.toLowerCase().includes(q)
    const matchS = status === 'All' || d.status === status
    return matchQ && matchS
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Department Management"
        description="Organize structure, heads, and staffing across the organization."
        actions={
          <div className="flex gap-2">
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
        <MetricCard label="Total Departments" value={String(metrics.total)} icon="domain" tone="bg-secondary/10 text-secondary" />
        <MetricCard label="Total Staffing" value={String(metrics.staffing)} icon="groups" tone="bg-purple-100 text-purple-700" />
        <MetricCard label="Active" value={String(metrics.active)} icon="check_circle" tone="bg-emerald-100 text-emerald-700" />
        <MetricCard label="Inactive / Archived" value={String(metrics.inactive)} icon="archive" tone="bg-surface-container text-on-surface-variant" />
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
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-outline-variant rounded-lg px-3 py-2 text-body-sm transition-colors"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
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

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: string
  tone: string
}) {
  return (
    <div className="bv-surface card-hover p-5 flex flex-col justify-between min-h-[120px]">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', tone)}>
        <Icon name={icon} />
      </div>
      <div className="mt-3">
        <p className="text-label-sm text-on-surface-variant">{label}</p>
        <p className="text-3xl font-bold text-on-background leading-none mt-1">{value}</p>
      </div>
    </div>
  )
}
