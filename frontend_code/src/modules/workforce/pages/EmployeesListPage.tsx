import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { HEADER_HEIGHT_PX } from '@/shared/components/layout/Header'
import { Button } from '@/shared/components/ui/Button'
import { employees, employeeMetrics } from '../data/mock'
import type { Employee, EmployeeStatus } from '../types'
import { cn } from '@/shared/lib/cn'

const LONG_PRESS_MS = 3000
const QUICK_VIEW_BOTTOM_GAP_PX = 12

const statusStyles: Record<EmployeeStatus, string> = {
  Confirmed: 'bg-green-100 text-green-800 border-green-200',
  Active: 'bg-green-100 text-green-800 border-green-200',
  Onboarding: 'bg-blue-100 text-blue-800 border-blue-200',
  Probation: 'bg-amber-100 text-amber-800 border-amber-200',
  Remote: 'bg-blue-100 text-blue-800 border-blue-200',
  Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Archived: 'bg-slate-100 text-slate-600 border-slate-200',
}

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function EmployeesListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'All' | 'Active' | 'On Leave'>('All')
  const [quickView, setQuickView] = useState<Employee | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [archiveOpen, setArchiveOpen] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
      const matchView =
        view === 'All' ||
        (view === 'Active' &&
          (e.status === 'Active' || e.status === 'Confirmed' || e.status === 'Remote')) ||
        (view === 'On Leave' && e.status === 'Pending')
      return matchSearch && matchView && e.status !== 'Archived'
    })
  }, [search, view])

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      if (next.size === 0) setSelectionMode(false)
      else setSelectionMode(true)
      return next
    })
  }, [])

  const enterSelectionWith = (id: string) => {
    setSelectionMode(true)
    setSelectedIds(new Set([id]))
  }

  const startLongPress = (id: string) => {
    longPressTriggered.current = false
    clearLongPress()
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      enterSelectionWith(id)
    }, LONG_PRESS_MS)
  }

  const endLongPress = (emp: Employee) => {
    clearLongPress()
    if (longPressTriggered.current) {
      longPressTriggered.current = false
      return
    }
    if (selectionMode) toggleOne(emp.id)
    else setQuickView(emp)
  }

  const allSelected = filtered.length > 0 && filtered.every((e) => selectedIds.has(e.id))

  if (employees.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Team Management" description="Human Resources · Employees" />
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant min-h-[420px] flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
              <Icon name="person_search" className="text-4xl" />
            </div>
            <h3 className="text-headline-md text-on-background">No Employees Found</h3>
            <p className="text-body-md text-on-surface-variant">
              We couldn&apos;t find any employee records. Add a team member to get started.
            </p>
            <Button variant="primary" leftIcon={<Icon name="person_add" />} onClick={() => navigate({ to: '/workforce/employees/new' })}>
              Add Employee
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      <PageHeader
        title="Employee Management"
        description="Manage and organize all human capital records within the organization."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" leftIcon={<Icon name="filter_list" />}>Filters</Button>
            <Button variant="outline" leftIcon={<Icon name="download" />}>Export</Button>
            <Button variant="outline" leftIcon={<Icon name="upload" />}>Import</Button>
            <Button variant="primary" leftIcon={<Icon name="add" />} onClick={() => navigate({ to: '/workforce/employees/new' })}>
              Add Employee
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl ml-auto">
        {employeeMetrics.map((m) => (
          <div key={m.id} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">{m.label}</p>
            <p className="text-title-lg font-bold text-on-background">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Icon name="person_search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
            placeholder="Search by Name, Code, Email, or Department..."
          />
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-lg">
          {(['All', 'Active', 'On Leave'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                'px-3 py-1.5 rounded-md text-label-md',
                view === v ? 'bg-white shadow-sm text-on-background font-semibold' : 'text-on-surface-variant'
              )}
            >
              {v === 'All' ? 'All Staff' : v}
            </button>
          ))}
        </div>
      </div>

      {selectionMode && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-secondary text-white shadow-lg">
          <Icon name="check_circle" className="text-xl" />
          <div>
            <p className="font-semibold">{selectedIds.size} Employees Selected</p>
            <p className="text-xs text-white/80">Apply bulk changes to selected workforce records</p>
          </div>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="!border-white/40 !text-white hover:!bg-white/10">Export</Button>
          <Button variant="outline" size="sm" className="!border-white/40 !text-white hover:!bg-white/10">Change Status</Button>
          <Button variant="outline" size="sm" className="!border-white/40 !text-white hover:!bg-white/10">Assign Team</Button>
          <Button size="sm" className="!bg-error !text-white" onClick={() => setArchiveOpen(true)}>Archive</Button>
          <button type="button" className="p-2 hover:bg-white/10 rounded-full" onClick={() => { setSelectedIds(new Set()); setSelectionMode(false) }} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-4 py-3 w-12">
                  {selectionMode && (
                    <input
                      type="checkbox"
                      className="rounded border-outline-variant text-secondary"
                      checked={allSelected}
                      onChange={() => {
                        if (allSelected) {
                          setSelectedIds(new Set())
                          setSelectionMode(false)
                        } else {
                          setSelectedIds(new Set(filtered.map((e) => e.id)))
                          setSelectionMode(true)
                        }
                      }}
                    />
                  )}
                </th>
                <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Employee</th>
                <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Department</th>
                <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Position</th>
                <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Manager</th>
                <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {filtered.map((emp) => {
                const selected = selectedIds.has(emp.id)
                return (
                  <tr
                    key={emp.id}
                    className={cn(
                      'cursor-pointer group select-none transition-colors',
                      selected ? 'bg-secondary/10' : 'hover:bg-surface-container-low/50'
                    )}
                    onMouseDown={() => startLongPress(emp.id)}
                    onMouseUp={() => endLongPress(emp)}
                    onMouseLeave={clearLongPress}
                    onTouchStart={() => startLongPress(emp.id)}
                    onTouchEnd={() => endLongPress(emp)}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                      {selectionMode && (
                        <input
                          type="checkbox"
                          className="rounded border-outline-variant text-secondary"
                          checked={selected}
                          onChange={() => toggleOne(emp.id)}
                        />
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                          {emp.avatarInitials ?? initials(emp.name)}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface group-hover:text-secondary">{emp.name}</p>
                          <p className="text-label-sm text-on-surface-variant">{emp.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-body-md">{emp.department}</td>
                    <td className="px-4 py-4 text-body-md">{emp.title}</td>
                    <td className="px-4 py-4 text-body-md">{emp.employmentType.replace(' Regular', '')}</td>
                    <td className="px-4 py-4">
                      <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-label-sm font-bold border', statusStyles[emp.status])}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-body-md">{emp.managerName ?? '—'}</td>
                    <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant" onClick={() => setQuickView(emp)} aria-label="View">
                          <Icon name="visibility" className="text-lg" />
                        </button>
                        <button type="button" className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant" onClick={() => navigate({ to: '/workforce/employees/$employeeId', params: { employeeId: emp.id } })} aria-label="Open">
                          <Icon name="edit" className="text-lg" />
                        </button>
                        <button type="button" className="p-2 hover:bg-error/10 rounded-lg text-error" onClick={() => setArchiveOpen(true)} aria-label="Archive">
                          <Icon name="archive" className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between text-label-sm text-on-surface-variant">
          <span>
            Showing 1–{filtered.length} of {employees.length} employees
            {!selectionMode && <span className="ml-2 opacity-70">· Hold row 3s to multi-select</span>}
          </span>
        </div>
      </div>

      {quickView && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setQuickView(null)} aria-hidden />
          <div
            className="fixed right-0 z-50 w-full max-w-md bg-surface-container-lowest shadow-2xl border border-outline-variant rounded-l-xl flex flex-col overflow-hidden"
            style={{
              top: HEADER_HEIGHT_PX + QUICK_VIEW_BOTTOM_GAP_PX,
              bottom: QUICK_VIEW_BOTTOM_GAP_PX,
              height: `calc(100vh - ${HEADER_HEIGHT_PX + QUICK_VIEW_BOTTOM_GAP_PX * 2}px)`,
            }}
            role="dialog"
          >
            <div className="p-6 border-b border-outline-variant flex justify-between items-center shrink-0">
              <h3 className="text-title-lg font-bold">Employee Details</h3>
              <button type="button" className="p-2 hover:bg-surface-container rounded-full" onClick={() => setQuickView(null)} aria-label="Close">
                <Icon name="close" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-24 h-24 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-2xl font-bold">
                  {quickView.avatarInitials ?? initials(quickView.name)}
                </div>
                <div>
                  <h4 className="text-headline-md font-bold">{quickView.name}</h4>
                  <p className="text-secondary font-medium">{quickView.title}</p>
                  <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">{quickView.department}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <p className="text-label-sm text-on-surface-variant uppercase">Employee ID</p>
                  <p className="font-bold">{quickView.employeeCode}</p>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <p className="text-label-sm text-on-surface-variant uppercase">Status</p>
                  <p className="font-bold">{quickView.status}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-label-sm font-bold text-on-surface-variant uppercase">Contact</p>
                <p className="flex items-center gap-2 text-body-sm"><Icon name="mail" className="text-secondary text-lg" />{quickView.email}</p>
                {quickView.phone && <p className="flex items-center gap-2 text-body-sm"><Icon name="call" className="text-secondary text-lg" />{quickView.phone}</p>}
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant flex gap-3 shrink-0">
              <Button variant="primary" className="flex-1" onClick={() => { setQuickView(null); navigate({ to: '/workforce/employees/$employeeId', params: { employeeId: quickView.id } }) }}>
                View Full Profile
              </Button>
              <button type="button" className="p-3 border border-outline-variant rounded-lg text-error" onClick={() => setArchiveOpen(true)} aria-label="Archive">
                <Icon name="archive" />
              </button>
            </div>
          </div>
        </>
      )}

      {archiveOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm" onClick={() => setArchiveOpen(false)} aria-hidden />
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-surface-container-lowest w-full max-w-md rounded-xl shadow-2xl pointer-events-auto border border-outline-variant" role="dialog">
              <div className="p-6 border-b border-outline-variant flex items-center gap-3">
                <Icon name="archive" className="text-error" />
                <h3 className="text-title-lg font-bold">Archive Employee</h3>
              </div>
              <div className="p-6 text-body-md text-on-surface-variant">
                Are you sure you want to archive this employee? System access will be deactivated. Historical records are preserved.
              </div>
              <div className="p-6 bg-surface-container-low flex justify-end gap-3">
                <Button variant="outline" onClick={() => setArchiveOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => setArchiveOpen(false)}>Archive</Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
