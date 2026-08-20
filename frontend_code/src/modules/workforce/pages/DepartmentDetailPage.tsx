import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { SearchableSelect } from '@/shared/components/ui/SearchableSelect'
import {
  assignEmployeeToDepartment,
  getDepartment,
  listDepartmentEmployees,
  listEmployeesNotInDepartment,
  type DepartmentEmployee,
  type DepartmentListItem,
} from '../api/departments'
import { DynamicRouteCrumbs } from '../components/RouteCrumbs'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

export function DepartmentDetailPage() {
  const { departmentId } = useParams({ strict: false }) as { departmentId: string }
  const navigate = useNavigate()
  const id = Number(departmentId)
  const [d, setD] = useState<DepartmentListItem | null>(null)
  const [staff, setStaff] = useState<DepartmentEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [mode, setMode] = useState<'choose' | 'existing'>('choose')
  const [candidates, setCandidates] = useState<{ value: string; label: string; meta?: string }[]>([])
  const [selectedEmp, setSelectedEmp] = useState('')
  const [saving, setSaving] = useState(false)

  const openPositions = Math.max(0, (d as DepartmentListItem & { openPositions?: number })?.openPositions ?? 0)

  const reload = async () => {
    const [dept, employees] = await Promise.all([
      getDepartment(id),
      listDepartmentEmployees(id),
    ])
    setD(dept)
    setStaff(employees)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      await reload()
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const openAdd = async () => {
    setMode('choose')
    setSelectedEmp('')
    setAddOpen(true)
  }

  const loadCandidates = async () => {
    const rows = await listEmployeesNotInDepartment(id)
    setCandidates(rows)
    setMode('existing')
  }

  const assignExisting = async () => {
    if (!selectedEmp) return
    setSaving(true)
    try {
      await assignEmployeeToDepartment(Number(selectedEmp), id)
      await reload()
      setAddOpen(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-on-surface-variant animate-fade-in">Loading department…</div>
  }

  if (!d) {
    return (
      <div className="space-y-4 animate-fade-in">
        <BackButton to="/workforce/departments" label="Back to departments" />
        <p className="text-title-lg">Department not found</p>
      </div>
    )
  }

  const headEmployee = staff.find((e) => e.name === d.headName) ?? staff[0]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <BackButton to="/workforce/departments" label="Back to departments" />
        <DynamicRouteCrumbs className="mt-2 mb-3" lastLabel={d.name} />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-headline-lg text-on-background">{d.name}</h1>
            <span className="px-3 py-1 bg-surface-container-highest text-secondary text-label-sm rounded-full">
              {d.code}
            </span>
            <span
              className={cn(
                'px-3 py-1 rounded-full text-label-sm font-medium',
                d.status === 'Active' ? 'bg-secondary/10 text-secondary' : 'bg-surface-container',
              )}
            >
              {d.status}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              leftIcon={<Icon name="edit" />}
              onClick={() => navigate({ to: '/workforce/departments/new' })}
            >
              Edit Department
            </Button>
            <Button variant="primary" leftIcon={<Icon name="person_add" />} onClick={() => void openAdd()}>
              Add Member
            </Button>
          </div>
        </div>
      </div>

      {/* Highlight metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bv-surface card-hover p-6 transition-all hover:-translate-y-0.5">
          <p className="text-on-surface-variant text-label-md mb-2">Total Staff</p>
          <p className="text-display-lg font-bold">{d.staffCount}</p>
        </div>
        <div className="bv-surface card-hover p-6 transition-all hover:-translate-y-0.5">
          <p className="text-on-surface-variant text-label-md mb-2">Active assignments</p>
          <p className="text-display-lg font-bold">{staff.length}</p>
        </div>
        {openPositions > 0 && (
          <div className="bv-surface card-hover p-6 border-secondary/30 transition-all hover:-translate-y-0.5">
            <p className="text-on-surface-variant text-label-md mb-2 flex items-center gap-1">
              <Icon name="work" className="text-base text-secondary" /> Open positions
            </p>
            <p className="text-display-lg font-bold text-secondary">{openPositions}</p>
          </div>
        )}
        <div className="bv-surface card-hover p-6 transition-all hover:-translate-y-0.5">
          <p className="text-on-surface-variant text-label-md mb-2">Department Head</p>
          <p className="text-title-lg font-bold">{d.headName || '—'}</p>
        </div>
      </div>

      {/* Head section */}
      <section className="bv-surface p-6 card-hover">
        <h3 className="text-title-md font-semibold mb-4 flex items-center gap-2">
          <Icon name="star" className="text-amber-500" /> Department Head
        </h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-xl font-bold">
            {(d.headName || '?')
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold text-on-background">{d.headName || 'Unassigned'}</p>
            <p className="text-sm text-on-surface-variant">
              {headEmployee?.positionName ?? 'Department Lead'} · {d.name}
            </p>
            {headEmployee?.email && (
              <p className="text-xs text-on-surface-variant mt-1">{headEmployee.email}</p>
            )}
          </div>
          {headEmployee && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate({
                  to: '/workforce/employees/$employeeId',
                  params: { employeeId: String(headEmployee.employmentId) },
                })
              }
            >
              View profile
            </Button>
          )}
        </div>
      </section>

      {/* Employee cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-title-lg font-semibold">Team members</h3>
          <span className="text-sm text-on-surface-variant">{staff.length} people</span>
        </div>

        {staff.length === 0 ? (
          <div className="bv-surface p-12 text-center text-on-surface-variant space-y-3">
            <Icon name="group_off" className="text-5xl" />
            <p>No employees assigned yet.</p>
            <Button variant="primary" size="sm" onClick={() => void openAdd()}>
              Add Member
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {staff.map((e) => {
              const initials = e.name
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
              const isHead = e.name === d.headName
              return (
                <button
                  key={e.employmentId}
                  type="button"
                  className="bv-surface p-5 text-left card-hover transition-all hover:-translate-y-1 hover:border-secondary/40 group"
                  onClick={() =>
                    navigate({
                      to: '/workforce/employees/$employeeId',
                      params: { employeeId: String(e.employmentId) },
                    })
                  }
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-on-background truncate flex items-center gap-1">
                        {e.name}
                        {isHead && (
                          <Icon name="star" className="text-amber-500 text-base" />
                        )}
                      </p>
                      <p className="text-sm text-on-surface-variant truncate">{e.positionName}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                          {e.employeeCode}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">
                          {e.state.replace(/_/g, ' ')}
                        </span>
                        {isHead && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Head
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setAddOpen(false)}
          />
          <div className="relative bv-surface executive-shadow w-full sm:max-w-md p-6 space-y-4 z-10 rounded-t-2xl sm:rounded-xl animate-slide-up">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-title-lg font-semibold text-on-background">Add Member</h3>
                <p className="text-body-sm text-on-surface-variant mt-1">Add to {d.name}</p>
              </div>
              <button
                type="button"
                className="p-1 rounded-lg hover:bg-surface-container transition-colors"
                onClick={() => setAddOpen(false)}
              >
                <Icon name="close" />
              </button>
            </div>

            {mode === 'choose' && (
              <div className="grid gap-3">
                <button
                  type="button"
                  className="text-left p-4 rounded-xl border border-outline-variant hover:border-secondary hover:bg-surface-container-low transition-all card-hover"
                  onClick={() =>
                    navigate({
                      to: '/workforce/employees/new',
                      search: { departmentId: String(id) } as never,
                    })
                  }
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                      <Icon name="person_add" />
                    </span>
                    <div>
                      <p className="font-semibold text-on-background">Create new employee</p>
                      <p className="text-body-sm text-on-surface-variant">Full onboarding form</p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  className="text-left p-4 rounded-xl border border-outline-variant hover:border-secondary hover:bg-surface-container-low transition-all card-hover"
                  onClick={() => void loadCandidates()}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon name="person_search" />
                    </span>
                    <div>
                      <p className="font-semibold text-on-background">Add existing employee</p>
                      <p className="text-body-sm text-on-surface-variant">Search directory</p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {mode === 'existing' && (
              <div className="space-y-4">
                <SearchableSelect
                  label="Employee"
                  options={candidates}
                  value={selectedEmp}
                  onChange={setSelectedEmp}
                  placeholder="Search employees…"
                  emptyLabel="Everyone is already in this department"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setMode('choose')}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!selectedEmp || saving}
                    onClick={() => void assignExisting()}
                  >
                    {saving ? 'Assigning…' : 'Assign to department'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
