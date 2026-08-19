import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { listEmployments, type EmploymentListItem } from '../api/employment'
import { cn } from '@/shared/lib/cn'

const stateStyles: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  ONBOARDING: 'bg-blue-100 text-blue-800 border-blue-200',
  PROBATION: 'bg-amber-100 text-amber-800 border-amber-200',
  SERVING_NOTICE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  RESIGNED: 'bg-slate-100 text-slate-600 border-slate-200',
  TERMINATED: 'bg-red-100 text-red-800 border-red-200',
  ALUMNI: 'bg-slate-100 text-slate-600 border-slate-200',
}

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

export function EmployeesListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<EmploymentListItem[]>([])
  const [metrics, setMetrics] = useState({ total: 0, active: 0, archived: 0 })
  const [loading, setLoading] = useState(true)

  const load = async (q?: string) => {
    setLoading(true)
    const res = await listEmployments({ search: q })
    setItems(res.items)
    setMetrics(res.metrics)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return items
    return items.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.employee_code.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.departmentName.toLowerCase().includes(q),
    )
  }, [items, search])

  return (
    <div className="space-y-6 relative">
      <PageHeader
        title="Employee Management"
        description="Schema-backed workforce directory (persons + employments from mock DB)."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="primary"
              leftIcon={<Icon name="add" />}
              onClick={() => navigate({ to: '/workforce/employees/new' })}
            >
              Add Employee
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl ml-auto">
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Total</p>
          <p className="text-title-lg font-bold text-on-background">{metrics.total}</p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Active</p>
          <p className="text-title-lg font-bold text-on-background">{metrics.active}</p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Archived</p>
          <p className="text-title-lg font-bold text-on-background">{metrics.archived}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
        <div className="relative max-w-md">
          <Icon
            name="person_search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
            placeholder="Search by Name, Code, Email, or Department..."
          />
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-on-surface-variant">Loading employees…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Icon name="person_search" className="text-4xl text-on-surface-variant" />
            <p className="text-title-lg font-semibold">No employees found</p>
            <Button variant="primary" onClick={() => navigate({ to: '/workforce/employees/new' })}>
              Add Employee
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
                    Login
                  </th>
                  <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    className="cursor-pointer group bv-row-hover"
                    onClick={() =>
                      navigate({
                        to: '/workforce/employees/$employeeId',
                        params: { employeeId: String(emp.id) },
                      })
                    }
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                          {emp.avatarInitials}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface group-hover:text-secondary">{emp.fullName}</p>
                          <p className="text-label-sm text-on-surface-variant">
                            {emp.employee_code}
                            {emp.email ? ` · ${emp.email}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-body-md">{emp.departmentName}</td>
                    <td className="px-4 py-4 text-body-md">{emp.positionName}</td>
                    <td className="px-4 py-4 text-body-md">{emp.employment_type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'inline-flex px-2.5 py-0.5 rounded-full text-label-sm font-bold border',
                          stateStyles[emp.current_state] ?? 'bg-surface-container',
                        )}
                      >
                        {emp.current_state.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {emp.hasLogin ? (
                        <span className="text-label-sm text-emerald-700 font-medium">Yes</span>
                      ) : (
                        <span className="text-label-sm text-amber-700 font-medium">No login</span>
                      )}
                    </td>
                    <td
                      className="px-4 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant"
                        onClick={() =>
                          navigate({
                            to: '/workforce/employees/$employeeId',
                            params: { employeeId: String(emp.id) },
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
        )}
        <div className="px-6 py-4 border-t border-outline-variant text-label-sm text-on-surface-variant">
          Showing {filtered.length} of {items.length} employees (mock DB)
        </div>
      </div>
    </div>
  )
}
