import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { departments, departmentMetrics } from '../data/mock'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={cn('material-symbols-outlined', className)} aria-hidden>{name}</span>
}

export function DepartmentsListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')

  const filtered = useMemo(() => {
    return departments.filter((d) => {
      const q = search.toLowerCase()
      const matchQ = !q || d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)
      const matchS = status === 'All' || d.status === status
      return matchQ && matchS
    })
  }, [search, status])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Management"
        description={`Total Departments: ${departments.length}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" leftIcon={<Icon name="ios_share" />}>Export</Button>
            <Button variant="primary" leftIcon={<Icon name="add" />} onClick={() => navigate({ to: '/workforce/departments/new' })}>
              Add Department
            </Button>
          </div>
        }
      />

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="filter_list" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-lg text-body-sm outline-none focus:border-secondary"
            placeholder="Search departments..."
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-outline-variant rounded-lg px-3 py-2 text-body-sm">
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest">Department Name</th>
                <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest">Code</th>
                <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest">Department Head</th>
                <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest text-center">Staff</th>
                <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest text-center">Projects</th>
                <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-surface-container-low/50 transition-colors group cursor-pointer" onClick={() => navigate({ to: '/workforce/departments/$departmentId', params: { departmentId: d.id } })}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', d.status === 'Active' ? 'bg-primary-container text-white' : 'bg-surface-container-highest text-outline')}>
                        <Icon name={d.icon ?? 'domain'} className="text-xl" />
                      </div>
                      <span className="font-semibold text-on-surface text-title-lg">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-on-surface-variant">{d.code}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                        {d.headName.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-label-md">{d.headName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">{d.staffCount}</td>
                  <td className="px-6 py-5 text-center">{d.projectCount}</td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-medium',
                      d.status === 'Active' ? 'bg-secondary-fixed text-on-secondary-fixed-variant' : 'bg-surface-container-high text-outline'
                    )}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', d.status === 'Active' ? 'bg-secondary' : 'bg-outline')} />
                      {d.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
                      <button type="button" className="p-2 hover:bg-secondary/10 rounded-lg text-on-surface-variant" onClick={() => navigate({ to: '/workforce/departments/$departmentId', params: { departmentId: d.id } })}>
                        <Icon name="visibility" className="text-lg" />
                      </button>
                      <button type="button" className="p-2 hover:bg-secondary/10 rounded-lg text-on-surface-variant">
                        <Icon name="edit" className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-outline-variant text-body-sm text-on-surface-variant">
          Showing 1–{filtered.length} of {departments.length} departments
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {departmentMetrics.map((m) => (
          <div key={m.id} className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
            <div className="flex justify-between mb-3">
              <div className="p-2 bg-secondary/10 rounded-lg text-secondary"><Icon name={m.icon} /></div>
              {m.change && <span className="text-label-sm text-secondary bg-secondary/10 px-2 py-0.5 rounded">{m.change}</span>}
            </div>
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider">{m.label}</p>
            <p className="text-headline-md font-semibold mt-1">{m.value}</p>
            {m.subtitle && <p className="text-body-sm text-on-surface-variant mt-1">{m.subtitle}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
