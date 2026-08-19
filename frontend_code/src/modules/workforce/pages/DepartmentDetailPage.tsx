import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import {
  getDepartment,
  listDepartmentEmployees,
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

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const [dept, employees] = await Promise.all([
        getDepartment(id),
        listDepartmentEmployees(id),
      ])
      if (cancelled) return
      setD(dept)
      setStaff(employees)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return <div className="p-12 text-center text-on-surface-variant">Loading department…</div>
  }

  if (!d) {
    return (
      <div className="space-y-4">
        <BackButton to="/workforce/departments" label="Back to departments" />
        <p className="text-title-lg">Department not found</p>
        <p className="text-body-sm text-on-surface-variant">
          ID must match a row in schema_departments (numeric). Legacy string ids from static mock no longer apply.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <BackButton to="/workforce/departments" label="Back to departments" />
        <DynamicRouteCrumbs className="mt-2 mb-3" lastLabel={d.name} />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-3">
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
          <Button
            variant="primary"
            leftIcon={<Icon name="person_add" />}
            onClick={() => navigate({ to: '/workforce/employees/new' })}
          >
            Add Employee
          </Button>
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
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
          <div>
            <h3 className="text-title-lg font-semibold">Employees in this department</h3>
            <p className="text-body-sm text-on-surface-variant">
              Current employment assignments (effective_to is null)
            </p>
          </div>
        </div>
        {staff.length === 0 ? (
          <div className="p-10 text-center text-on-surface-variant">
            No employees assigned yet. Assign department when creating or editing an employee.
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
    </div>
  )
}
