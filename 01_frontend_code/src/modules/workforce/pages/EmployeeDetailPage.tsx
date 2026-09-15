import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { DynamicRouteCrumbs } from '../components/RouteCrumbs'
import { cn } from '@/shared/lib/cn'
import { safeNavigate, looseLinkProps } from '@/shared/lib/safeNavigate'
import { getEmployeeDetail, updateEmployment } from '../api/employment'
import type { EmployeeDetailDto } from '@/shared/schema'
import { Can } from '@/shared/rbac'
import { Action, ResourceName } from '@/shared/schema'
import { workforceRoutes } from '../routes'
import { payrollRoutes } from '@/modules/payroll/routes'
import {
  employeeDetailEditSchema,
  type EmployeeDetailEditInput,
} from '../schemas/employment-form'
import { employmentStateStyles, loginEnabledClass } from '../schemas/enums'

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

/** Normalize employment state from snake_case or legacy camelCase payloads. */
function resolveEmploymentState(
  employment: EmployeeDetailDto['employment'] | null | undefined,
): string {
  if (!employment) return 'UNKNOWN'
  const row = employment as EmployeeDetailDto['employment'] & { currentState?: string }
  return row.current_state ?? row.currentState ?? 'UNKNOWN'
}

const inputClass =
  'w-full rounded-lg border border-outline-variant px-3 py-2 text-body-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-transparent transition-colors'

export function EmployeeDetailPage() {
  const { employeeId } = useParams({ strict: false }) as { employeeId: string }
  const navigate = useNavigate()
  const id = Number(employeeId)
  const [data, setData] = useState<EmployeeDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'overview' | 'history' | 'salary' | 'documents'>('overview')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const form = useForm<EmployeeDetailEditInput>({
    resolver: zodResolver(employeeDetailEditSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      personalEmail: '',
      personalPhone: '',
      address: '',
      dateOfBirth: '',
    },
  })

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const dto = await getEmployeeDetail(id)
      if (!dto) {
        setError('Employee not found')
        setData(null)
      } else {
        setData(dto)
        form.reset({
          firstName: dto.person?.first_name ?? '',
          lastName: dto.person?.last_name ?? '',
          personalEmail: dto.person?.personal_email ?? '',
          personalPhone: dto.person?.personal_phone ?? '',
          address: dto.person?.address ?? '',
          dateOfBirth: dto.person?.date_of_birth ?? '',
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const startEdit = () => {
    if (!data) return
    form.reset({
      firstName: data.person?.first_name ?? '',
      lastName: data.person?.last_name ?? '',
      personalEmail: data.person?.personal_email ?? '',
      personalPhone: data.person?.personal_phone ?? '',
      address: data.person?.address ?? '',
      dateOfBirth: data.person?.date_of_birth ?? '',
    })
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    if (data) {
      form.reset({
        firstName: data.person?.first_name ?? '',
        lastName: data.person?.last_name ?? '',
        personalEmail: data.person?.personal_email ?? '',
        personalPhone: data.person?.personal_phone ?? '',
        address: data.person?.address ?? '',
        dateOfBirth: data.person?.date_of_birth ?? '',
      })
    }
  }

  const saveEdit = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      await updateEmployment(id, {
        firstName: values.firstName,
        lastName: values.lastName,
        personalEmail: values.personalEmail || null,
        personalPhone: values.personalPhone || null,
        address: values.address || null,
        dateOfBirth: values.dateOfBirth || null,
      })
      setEditing(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  })

  const deactivate = async () => {
    if (!confirm('Deactivate this employment record?')) return
    setSaving(true)
    try {
      await updateEmployment(id, { currentState: 'RESIGNED' })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deactivate failed')
    } finally {
      setSaving(false)
    }
  }

  const downloadProfile = () => {
    if (!data) return
    const blob = new Blob(
      [
        JSON.stringify(
          {
            employee_code: data.employment?.employee_code,
            name: `${data.person?.first_name ?? ''} ${data.person?.last_name ?? ''}`.trim(),
            department: data.department?.name,
            position: data.position?.name,
            state: resolveEmploymentState(data.employment),
            joining_date: data.employment?.joining_date,
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.employment?.employee_code ?? 'employee'}-profile.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const goList = () => safeNavigate(navigate, { to: workforceRoutes.employees })

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
      <div className="space-y-4 animate-fade-in">
        <BackButton to={workforceRoutes.employees} label="Back to employees" />
        <div className="bv-surface p-8 text-center">
          <Icon name="person_off" className="text-4xl text-on-surface-variant" />
          <p className="mt-2 text-title-md font-semibold">{error ?? 'Employee not found'}</p>
          <Button className="mt-4" variant="outline" onClick={goList}>
            Return to list
          </Button>
        </div>
      </div>
    )
  }

  const fullName = `${data.person?.first_name ?? ''} ${data.person?.last_name ?? ''}`.trim() || 'Employee'
  const initials = `${data.person?.first_name?.[0] ?? ''}${data.person?.last_name?.[0] ?? ''}`.toUpperCase() || '?'
  const currentState = resolveEmploymentState(data.employment)
  const stateLabel = currentState.replace(/_/g, ' ')
  const stateClass = employmentStateStyles[currentState] ?? 'status-badge status-neutral'

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <BackButton to={workforceRoutes.employees} label="Back to employees" />
        <DynamicRouteCrumbs className="mt-2 mb-2" lastLabel={fullName} />
      </div>

      <PageHeader
        title={fullName}
        description={`${data.position?.name ?? '—'} · ${data.department?.name ?? '—'}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" leftIcon={<Icon name="download" className="text-lg" />} onClick={downloadProfile}>
              Download
            </Button>
            <Can action={Action.UPDATE} resource={ResourceName.EMPLOYMENT}>
              {editing ? (
                <>
                  <Button variant="outline" size="sm" onClick={cancelEdit}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" isLoading={saving} onClick={() => void saveEdit()}>
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="primary" leftIcon={<Icon name="edit" className="text-lg" />} onClick={startEdit}>
                    Edit Employee
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-error border-error/30 hover:bg-error/5"
                    leftIcon={<Icon name="person_off" className="text-lg" />}
                    onClick={() => void deactivate()}
                    isLoading={saving}
                  >
                    Deactivate
                  </Button>
                </>
              )}
            </Can>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className={stateClass}>{stateLabel}</span>
        <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-xs font-bold rounded-full">
          {data.employment?.employment_type ?? '—'}
        </span>
        <span className="text-label-sm text-on-surface-variant">Emp code: {data.employment?.employee_code}</span>
        {data.hasLogin && <span className={loginEnabledClass}>Login: {data.loginEmail}</span>}
      </div>

      {editing && (
        <div className="bv-surface border-secondary/30 p-6 space-y-4">
          <h3 className="text-title-lg font-semibold flex items-center gap-2">
            <Icon name="edit" className="text-secondary" /> Edit profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-label-sm text-on-surface-variant" htmlFor="emp-first">First name</label>
              <input id="emp-first" className={inputClass} {...form.register('firstName')} />
              {form.formState.errors.firstName && (
                <p className="text-xs text-error mt-1">{form.formState.errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="text-label-sm text-on-surface-variant" htmlFor="emp-last">Last name</label>
              <input id="emp-last" className={inputClass} {...form.register('lastName')} />
              {form.formState.errors.lastName && (
                <p className="text-xs text-error mt-1">{form.formState.errors.lastName.message}</p>
              )}
            </div>
            <div>
              <label className="text-label-sm text-on-surface-variant" htmlFor="emp-dob">Date of birth</label>
              <input id="emp-dob" className={inputClass} type="date" {...form.register('dateOfBirth')} />
            </div>
            <div>
              <label className="text-label-sm text-on-surface-variant" htmlFor="emp-email">Personal email</label>
              <input id="emp-email" className={inputClass} type="email" {...form.register('personalEmail')} />
              {form.formState.errors.personalEmail && (
                <p className="text-xs text-error mt-1">{form.formState.errors.personalEmail.message}</p>
              )}
            </div>
            <div>
              <label className="text-label-sm text-on-surface-variant" htmlFor="emp-phone">Phone</label>
              <input id="emp-phone" className={inputClass} {...form.register('personalPhone')} />
            </div>
            <div>
              <label className="text-label-sm text-on-surface-variant" htmlFor="emp-addr">Address</label>
              <input id="emp-addr" className={inputClass} {...form.register('address')} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-3 space-y-4">
          <div className="bv-surface card-hover p-6 text-center">
            <div className="w-28 h-28 mx-auto rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-3xl font-bold mb-3">
              {initials}
            </div>
            <h2 className="text-title-lg font-semibold">{fullName}</h2>
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-4">
              {data.employment?.employee_code}
            </p>
            <div className="text-left space-y-3 border-t border-outline-variant pt-4">
              {data.person?.personal_email && (
                <div className="flex gap-3">
                  <Icon name="mail" className="text-secondary" />
                  <div>
                    <p className="text-label-sm text-on-surface-variant">Personal email</p>
                    <p className="text-body-sm">{data.person.personal_email}</p>
                  </div>
                </div>
              )}
              {data.person?.personal_phone && (
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
              {(data.roleNames?.length ?? 0) > 0 && (
                <div>
                  <p className="text-label-sm text-on-surface-variant">Roles</p>
                  <p className="font-medium text-sm">{data.roleNames.join(', ')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bv-surface p-5 card-hover">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-3">
              Reporting manager
            </p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center">
                <Icon name="supervisor_account" />
              </div>
              <div>
                <p className="font-semibold text-sm text-on-background">Not linked</p>
                <p className="text-xs text-on-surface-variant">Wire manager when assignment supports it</p>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-6">
          <div className="bv-surface rounded-b-none flex overflow-x-auto border-b-0">
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

          <div className="bv-surface rounded-t-none border-t-0 p-6 space-y-6">
            {tab === 'overview' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-outline-variant rounded-lg card-hover">
                    <p className="text-label-sm text-on-surface-variant mb-1">Joining date</p>
                    <p className="text-title-lg font-semibold">{data.employment?.joining_date ?? '—'}</p>
                  </div>
                  <div className="p-4 border border-outline-variant rounded-lg card-hover">
                    <p className="text-label-sm text-on-surface-variant mb-1">Current state</p>
                    <p className="text-title-lg font-semibold text-secondary">{stateLabel}</p>
                  </div>
                  <div className="p-4 border border-outline-variant rounded-lg card-hover">
                    <p className="text-label-sm text-on-surface-variant mb-1">Employment type</p>
                    <p className="text-title-lg font-semibold">{data.employment?.employment_type ?? '—'}</p>
                  </div>
                </div>
                <p className="text-body-sm text-on-surface-variant">
                  Full history and related records are available in the other tabs.
                </p>
              </>
            )}

            {tab === 'history' && (
              <div className="space-y-4">
                <h4 className="font-semibold">State history</h4>
                {(data.stateHistory ?? []).length === 0 ? (
                  <p className="text-body-sm text-on-surface-variant">No state changes recorded.</p>
                ) : (
                  <ul className="space-y-2">
                    {(data.stateHistory ?? []).map((h) => (
                      <li key={h.id} className="p-3 border border-outline-variant rounded-lg text-sm">
                        {String(h.previous_state ?? '—')} → {String(h.new_state)} on {h.effective_date}
                        {h.reason ? <p className="text-on-surface-variant mt-1">{h.reason}</p> : null}
                      </li>
                    ))}
                  </ul>
                )}
                <h4 className="font-semibold pt-2">Assignment history</h4>
                {(data.assignmentHistory ?? []).length === 0 ? (
                  <p className="text-body-sm text-on-surface-variant">No assignment history.</p>
                ) : (
                  <ul className="space-y-2">
                    {(data.assignmentHistory ?? []).map((a) => (
                      <li key={a.id} className="p-3 border border-outline-variant rounded-lg text-sm">
                        {a.work_mode} · from {a.effective_from}
                        {a.effective_to ? ` to ${a.effective_to}` : ' (current)'}
                        {a.change_reason ? <p className="text-on-surface-variant mt-1">{a.change_reason}</p> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === 'salary' && (
              <div className="space-y-3">
                {data.currentSalary ? (
                  <p className="text-title-lg font-semibold">
                    Gross: {formatMoney(Number(data.currentSalary.gross_salary ?? 0))}
                  </p>
                ) : (
                  <p className="text-body-sm text-on-surface-variant">No active salary structure.</p>
                )}
                <Link
                  {...looseLinkProps({
                    to: payrollRoutes.historyEmployeePath,
                    params: { employeeId: String(id) },
                    className: 'text-secondary text-sm font-medium hover:underline',
                  })}
                >
                  Open payroll history
                </Link>
              </div>
            )}

            {tab === 'documents' && (
              <p className="text-body-sm text-on-surface-variant">Documents are managed in the Documents module.</p>
            )}
          </div>
        </div>

        <aside className="xl:col-span-3 space-y-4">
          <div className="bv-surface p-5 space-y-3">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Icon name="account_balance" className="text-lg" />
              <p className="text-label-md font-semibold uppercase tracking-wide">Quick links</p>
            </div>
            <Link
              {...looseLinkProps({
                to: payrollRoutes.historyEmployeePath,
                params: { employeeId: String(id) },
                className: 'block text-sm text-secondary hover:underline',
              })}
            >
              Payroll history
            </Link>
            <button
              type="button"
              className="block text-sm text-secondary hover:underline text-left cursor-pointer"
              onClick={() =>
                safeNavigate(navigate, {
                  to: workforceRoutes.employeeBankPath,
                  params: { employeeId: String(id) },
                })
              }
            >
              Bank details
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
