import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { listEmployments, type EmploymentListItem } from '../api/employment'
import { listDepartments } from '../api/departments'
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
  const [deptFilter, setDeptFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [items, setItems] = useState<EmploymentListItem[]>([])
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([])
  const [metrics, setMetrics] = useState({ total: 0, active: 0, archived: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const [res, depts] = await Promise.all([
        listEmployments({}),
        listDepartments({}),
      ])
      if (cancelled) return
      setItems(res.items)
      setMetrics(res.metrics)
      setDepartments(depts.items.map((d) => ({ id: d.id, name: d.name })))
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return items.filter((e) => {
      if (q) {
        const match =
          e.fullName.toLowerCase().includes(q) ||
          e.employee_code.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.departmentName.toLowerCase().includes(q) ||
          e.positionName.toLowerCase().includes(q)
        if (!match) return false
      }
      if (deptFilter !== 'all' && e.departmentName !== deptFilter) return false
      if (stateFilter !== 'all' && e.current_state !== stateFilter) return false
      if (typeFilter !== 'all' && e.employment_type !== typeFilter) return false
      return true
    })
  }, [items, search, deptFilter, stateFilter, typeFilter])

  const states = useMemo(
    () => Array.from(new Set(items.map((e) => e.current_state))).sort(),
    [items],
  )
  const types = useMemo(
    () => Array.from(new Set(items.map((e) => e.employment_type))).sort(),
    [items],
  )

  return (
    <div className="space-y-6 relative">
      <PageHeader
        title="Employee Management"
        description="Manage and organize all human capital records within the organization."
        actions={
          <Button
            variant="primary"
            leftIcon={<Icon name="add" />}
            onClick={() => navigate({ to: '/workforce/employees/new' })}
          >
            Add Employee
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl ml-auto">
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 shadow-sm">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Total</p>
          <p className="text-title-lg font-bold text-on-background">{metrics.total}</p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 shadow-sm">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Active</p>
          <p className="text-title-lg font-bold text-secondary">{metrics.active}</p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 shadow-sm">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Archived</p>
          <p className="text-title-lg font-bold text-on-surface-variant">{metrics.archived}</p>
        </div>
      </div>

      {/* Filter bar — matches Stitch employee management */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 flex flex-wrap items-center gap-3 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Icon
            name="person_search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
            placeholder="Search by Name, Code, Email, or Department..."
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-body-sm min-w-[140px] focus:ring-2 focus:ring-secondary/20"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-body-sm min-w-[140px] focus:ring-2 focus:ring-secondary/20"
        >
          <option value="all">All Statuses</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-body-sm min-w-[140px] focus:ring-2 focus:ring-secondary/20"
        >
          <option value="all">All Types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        {(search || deptFilter !== 'all' || stateFilter !== 'all' || typeFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('')
              setDeptFilter('all')
              setStateFilter('all')
              setTypeFilter('all')
            }}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-surface-container-high" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-surface-container-high rounded" />
                  <div className="h-3 w-24 bg-surface-container rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Icon name="person_search" className="text-4xl text-on-surface-variant" />
            <p className="text-title-lg font-semibold">No employees found</p>
            <p className="text-body-sm text-on-surface-variant">
              Try adjusting filters or add a new team member.
            </p>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setDeptFilter('all')
                  setStateFilter('all')
                  setTypeFilter('all')
                }}
              >
                Clear Filters
              </Button>
              <Button variant="primary" onClick={() => navigate({ to: '/workforce/employees/new' })}>
                Add Employee
              </Button>
            </div>
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
                    <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
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
          Showing {filtered.length} of {items.length} employees
        </div>
      </div>
    </div>
  )
}
