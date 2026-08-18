import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { DynamicRouteCrumbs } from '../components/RouteCrumbs'
import { cn } from '@/shared/lib/cn'
import { getEmployeeDetail } from '../api/employment'
import type { EmployeeDetailDto } from '@/shared/schema'
import { Can } from '@/shared/rbac'
import { Action, ResourceName } from '@/shared/schema'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

export function EmployeeDetailPage() {
  const { employeeId } = useParams({ strict: false }) as { employeeId: string }
  const navigate = useNavigate()
  const id = Number(employeeId)
  const [data, setData] = useState<EmployeeDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'overview' | 'history' | 'salary' | 'documents'>('overview')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getEmployeeDetail(id)
      .then((dto) => {
        if (cancelled) return
        if (!dto) setError('Employee not found')
        setData(dto)
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message || 'Failed to load employee')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-surface-container rounded" />
        <div className="h-40 bg-surface-container-low rounded-xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <BackButton to="/workforce/employees" label="Back to employees" />
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center">
          <Icon name="person_off" className="text-4xl text-on-surface-variant" />
          <p className="mt-2 text-title-md font-semibold">{error ?? 'Employee not found'}</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate({ to: '/workforce/employees' })}>
            Return to list
          </Button>
        </div>
      </div>
    )
  }

  const fullName = `${data.person.first_name} ${data.person.last_name}`
  const initials = `${data.person.first_name[0] ?? ''}${data.person.last_name[0] ?? ''}`.toUpperCase()

  return (
    <div className="space-y-6">
      <div>
        <BackButton to="/workforce/employees" label="Back to employees" />
        <DynamicRouteCrumbs className="mt-2 mb-2" lastLabel={fullName} />
      </div>

      <PageHeader
        title={fullName}
        description={`${data.position?.name ?? '—'} · ${data.department?.name ?? '—'}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Can action={Action.UPDATE} resource={ResourceName.EMPLOYMENT}>
              <Button
                variant="primary"
                leftIcon={<Icon name="edit" className="text-lg" />}
                onClick={() => navigate({ to: '/workforce/employees/new' })}
              >
                Edit Employee
              </Button>
            </Can>
            <Button variant="outline" leftIcon={<Icon name="print" className="text-lg" />}>
              Print
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="px-3 py-1 bg-secondary/15 text-secondary text-xs font-bold rounded-full border border-secondary/20">
          {data.employment.current_state}
        </span>
        <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-xs font-bold rounded-full">
          {data.employment.employment_type}
        </span>
        <span className="text-label-sm text-on-surface-variant">
          Emp code: {data.employment.employee_code}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 text-center shadow-sm card-hover">
            <div className="w-28 h-28 mx-auto rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-3xl font-bold mb-3">
              {initials}
            </div>
            <h2 className="text-title-lg font-semibold">{fullName}</h2>
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-4">
              {data.employment.employee_code}
            </p>
            <div className="text-left space-y-3 border-t border-outline-variant pt-4">
              {data.person.personal_email && (
                <div className="flex gap-3">
                  <Icon name="mail" className="text-secondary" />
                  <div>
                    <p className="text-label-sm text-on-surface-variant">Personal email</p>
                    <p className="text-body-sm">{data.person.personal_email}</p>
                  </div>
                </div>
              )}
              {data.person.personal_phone && (
                <div className="flex gap-3">
                  <Icon name="call" className="text-secondary" />
                  <div>
                    <p className="text-label-sm text-on-surface-variant">Phone</p>
                    <p className="text-body-sm">{data.person.personal_phone}</p>
                  </div>
                </div>
              )}
              {data.location && (
                <div className="flex gap-3">
                  <Icon name="location_on" className="text-secondary" />
                  <div>
                    <p className="text-label-sm text-on-surface-variant">Location</p>
                    <p className="text-body-sm">{data.location.name}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 p-3 bg-surface-container-low rounded-lg text-left space-y-2">
              <div>
                <p className="text-label-sm text-on-surface-variant">Department</p>
                <p className="font-semibold text-sm">{data.department?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant">Position</p>
                <p className="font-medium text-sm">{data.position?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant">Shift</p>
                <p className="font-medium text-sm">{data.shift?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant">Work mode</p>
                <p className="font-medium text-sm">{data.currentAssignment?.work_mode ?? '—'}</p>
              </div>
              {data.roleNames.length > 0 && (
                <div>
                  <p className="text-label-sm text-on-surface-variant">Roles</p>
                  <p className="font-medium text-sm">{data.roleNames.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-9">
          <div className="bg-surface-container-lowest rounded-t-xl border border-outline-variant flex overflow-x-auto">
            {(
              [
                ['overview', 'Overview'],
                ['history', 'State & assignments'],
                ['salary', 'Salary'],
                ['documents', 'Documents'],
              ] as const
            ).map(([idTab, label]) => (
              <button
                key={idTab}
                type="button"
                onClick={() => setTab(idTab)}
                className={cn(
                  'px-6 py-4 text-label-md whitespace-nowrap border-b-2 transition-colors cursor-pointer',
                  tab === idTab
                    ? 'border-secondary text-secondary font-semibold'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="bg-surface-container-lowest border border-t-0 border-outline-variant rounded-b-xl p-6 space-y-6 shadow-sm">
            {tab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-outline-variant rounded-lg card-hover">
                  <p className="text-label-sm text-on-surface-variant mb-1">Joining date</p>
                  <p className="text-title-lg font-semibold">{data.employment.joining_date}</p>
                </div>
                <div className="p-4 border border-outline-variant rounded-lg card-hover">
                  <p className="text-label-sm text-on-surface-variant mb-1">Current state</p>
                  <p className="text-title-lg font-semibold text-secondary">{data.employment.current_state}</p>
                </div>
                <div className="p-4 border border-outline-variant rounded-lg card-hover">
                  <p className="text-label-sm text-on-surface-variant mb-1">Employment type</p>
                  <p className="text-title-lg font-semibold">{data.employment.employment_type}</p>
                </div>
              </div>
            )}

            {tab === 'history' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-3">
                    State history (append-only)
                  </h4>
                  {data.stateHistory.length === 0 ? (
                    <p className="text-body-sm text-on-surface-variant">No state transitions recorded.</p>
                  ) : (
                    <ul className="space-y-2">
                      {data.stateHistory.map((h) => (
                        <li
                          key={h.id}
                          className="rounded-lg border border-outline-variant p-3 text-body-sm card-hover"
                        >
                          <p className="font-semibold">
                            {h.previous_state ?? '—'} → {h.new_state}
                          </p>
                          <p className="text-on-surface-variant">
                            {h.effective_date}
                            {h.reason ? ` · ${h.reason}` : ''}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h4 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-3">
                    Assignment history
                  </h4>
                  {data.assignmentHistory.length === 0 ? (
                    <p className="text-body-sm text-on-surface-variant">No assignments.</p>
                  ) : (
                    <ul className="space-y-2">
                      {data.assignmentHistory.map((a) => (
                        <li
                          key={a.id}
                          className="rounded-lg border border-outline-variant p-3 text-body-sm card-hover"
                        >
                          <p className="font-semibold">
                            Dept #{a.department_id} · Position #{a.position_id} · {a.work_mode}
                          </p>
                          <p className="text-on-surface-variant">
                            {a.effective_from} → {a.effective_to ?? 'present'}
                          </p>
                          <p className="text-on-surface-variant">{a.change_reason}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {tab === 'salary' && (
              <Can
                action={Action.VIEW}
                resource={ResourceName.SALARY}
                fallback={
                  <p className="text-body-sm text-on-surface-variant">
                    You do not have permission to view salary.
                  </p>
                }
              >
                {data.currentSalary ? (
                  <div className="space-y-4">
                    <div className="bg-primary text-on-primary p-6 rounded-xl">
                      <p className="text-sm opacity-80 uppercase mb-1">Current gross salary</p>
                      <p className="text-4xl font-bold">{formatMoney(data.currentSalary.gross_salary)}</p>
                      <p className="text-sm opacity-80 mt-2">
                        Effective {data.currentSalary.effective_from}
                        {data.currentSalary.effective_to
                          ? ` → ${data.currentSalary.effective_to}`
                          : ' → present'}
                      </p>
                    </div>
                    <Link
                      to="/payroll/salary/$employeeId"
                      params={{ employeeId: String(data.employment.id) }}
                      className="inline-flex text-secondary font-medium hover:underline"
                    >
                      Open salary management →
                    </Link>
                  </div>
                ) : (
                  <p className="text-body-sm text-on-surface-variant">No active salary configuration.</p>
                )}
              </Can>
            )}

            {tab === 'documents' && (
              <div className="rounded-lg border border-dashed border-outline-variant p-8 text-center">
                <Icon name="folder_open" className="text-4xl text-on-surface-variant" />
                <p className="mt-2 text-body-sm text-on-surface-variant">
                  Documents will load from document_links once the Documents module is wired.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
