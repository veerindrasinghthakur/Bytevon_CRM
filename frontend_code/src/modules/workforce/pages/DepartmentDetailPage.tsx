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
    return <div className="p-12 text-center text-on-surface-variant">Loading department…</div>
  }

  if (!d) {
    return (
      <div className="space-y-4">
        <BackButton to="/workforce/departments" label="Back to departments" />
        <p className="text-title-lg">Department not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm card-hover">
          <p className="text-on-surface-variant text-label-md mb-2">Total Staff</p>
          <p className="text-display-lg font-bold">{d.staffCount}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm card-hover">
          <p className="text-on-surface-variant text-label-md mb-2">Department Head</p>
          <p className="text-title-lg font-bold">{d.headName}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm card-hover">
          <p className="text-on-surface-variant text-label-md mb-2">Active assignments</p>
          <p className="text-display-lg font-bold">{staff.length}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant">
          <h3 className="text-title-lg font-semibold">Employees in this department</h3>
          <p className="text-body-sm text-on-surface-variant">Current employment assignments</p>
        </div>
        {staff.length === 0 ? (
          <div className="p-10 text-center text-on-surface-variant space-y-3">
            <p>No employees assigned yet.</p>
            <Button variant="primary" size="sm" onClick={() => void openAdd()}>
              Add Member
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-6 py-3 text-label-sm uppercase text-on-surface-variant">Employee</th>
                  <th className="px-6 py-3 text-label-sm uppercase text-on-surface-variant">Position</th>
                  <th className="px-6 py-3 text-label-sm uppercase text-on-surface-variant">State</th>
                  <th className="px-6 py-3 text-label-sm uppercase text-on-surface-variant">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {staff.map((e) => (
                  <tr
                    key={e.employmentId}
                    className="bv-row-hover cursor-pointer"
                    onClick={() =>
                      navigate({
                        to: '/workforce/employees/$employeeId',
                        params: { employeeId: String(e.employmentId) },
                      })
                    }
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold">{e.name}</p>
                      <p className="text-label-sm text-on-surface-variant">{e.employeeCode}</p>
                    </td>
                    <td className="px-6 py-4 text-body-sm">{e.positionName}</td>
                    <td className="px-6 py-4 text-body-sm">{e.state.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant">{e.email || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add member modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setAddOpen(false)}
          />
          <div className="relative bg-surface-container-lowest rounded-xl border border-outline-variant shadow-2xl w-full max-w-md p-6 space-y-4 z-10">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-title-lg font-semibold text-on-background">Add Member</h3>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Add to {d.name}
                </p>
              </div>
              <button
                type="button"
                className="p-1 rounded-lg hover:bg-surface-container"
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
                      <p className="text-body-sm text-on-surface-variant">
                        Full onboarding form, then assign to this department
                      </p>
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
                      <p className="text-body-sm text-on-surface-variant">
                        Search and assign someone already in the directory
                      </p>
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
