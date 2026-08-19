import { useEffect, useState } from 'react'
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
    <div className="space-y-6">
      <PageHeader
        title="Department Management"
        description={`Total Departments: ${items.length} (mock DB)`}
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

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-lg text-body-sm outline-none focus:border-secondary"
            placeholder="Search departments..."
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-outline-variant rounded-lg px-3 py-2 text-body-sm"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-on-surface-variant">Loading departments…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest">
                    Department Name
                  </th>
                  <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest">
                    Code
                  </th>
                  <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest">
                    Department Head
                  </th>
                  <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest text-center">
                    Staff
                  </th>
                  <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map((d) => (
                  <tr
                    key={d.id}
                    className="bv-row-hover cursor-pointer group"
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
                            'w-10 h-10 rounded-lg flex items-center justify-center',
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
                        className="p-2 hover:bg-secondary/10 rounded-lg text-on-surface-variant"
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
        )}
        <div className="px-6 py-4 border-t border-outline-variant text-body-sm text-on-surface-variant">
          Showing {filtered.length} of {items.length} departments
        </div>
      </div>
    </div>
  )
}
