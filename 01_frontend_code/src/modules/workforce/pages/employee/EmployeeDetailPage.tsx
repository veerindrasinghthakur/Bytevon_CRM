import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { DynamicRouteCrumbs } from '../../components/RouteCrumbs'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getEmployeeDetail, rehireEmployment, updateEmployment } from '../../api/employment'
import { invalidate } from '@/shared/lib/query-keys'
import type { EmployeeDetailDto } from '@/shared/schema'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'
import { workforceRoutes } from '../../routes'
import {
  employeeDetailEditSchema,
  type EmployeeDetailEditInput,
} from '../../schemas/employment-form'
import { employmentStateStyles, loginEnabledClass } from '../../schemas/enums'
import {
  Icon,
  resolveEmploymentState,
  type EmployeeDetailTab,
} from '../../components/employee/employee-detail-utils'
import { EmployeeEditForm } from '../../components/employee/EmployeeEditForm'
import { EmployeeProfileSidebar } from '../../components/employee/EmployeeProfileSidebar'
import { EmployeeDetailTabNav } from '../../components/employee/EmployeeDetailTabNav'
import { EmployeeOverviewTab } from '../../components/employee/EmployeeOverviewTab'
import { EmployeeHistoryTab } from '../../components/employee/EmployeeHistoryTab'
import { EmployeeSalaryTab } from '../../components/employee/EmployeeSalaryTab'
import { EmployeeDocumentsTab } from '../../components/employee/EmployeeDocumentsTab'
import { EmployeeQuickLinks } from '../../components/employee/EmployeeQuickLinks'

export function EmployeeDetailPage() {
  const { employeeId } = useParams({ strict: false }) as { employeeId: string }
  const navigate = useNavigate()
  const id = Number(employeeId)
  const [data, setData] = useState<EmployeeDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<EmployeeDetailTab>('overview')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const qc = useQueryClient()
  const rehireMut = useMutation({
    mutationFn: () => rehireEmployment(id, { reason: 'Rehired' }),
    onSuccess: () => {
      invalidate.employees(qc)
      return load()
    },
  })

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

  const fullName =
    `${data.person?.first_name ?? ''} ${data.person?.last_name ?? ''}`.trim() || 'Employee'
  const initials =
    `${data.person?.first_name?.[0] ?? ''}${data.person?.last_name?.[0] ?? ''}`.toUpperCase() || '?'
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
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Icon name="download" className="text-lg" />}
              onClick={downloadProfile}
            >
              Download
            </Button>
            <Can action={Action.UPDATE} resource={'employment'}>
              {editing ? (
                <>
                  <Button variant="outline" size="sm" onClick={cancelEdit}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={saving}
                    onClick={() => void saveEdit()}
                  >
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    leftIcon={<Icon name="edit" className="text-lg" />}
                    onClick={startEdit}
                  >
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
        <span className="text-label-sm text-on-surface-variant">
          Emp code: {data.employment?.employee_code}
        </span>
        {data.hasLogin && <span className={loginEnabledClass}>Login: {data.loginEmail}</span>}
        {['RESIGNED', 'TERMINATED', 'ALUMNI'].includes(currentState) && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Icon name="person_add" className="text-lg" />}
            isLoading={rehireMut.isPending}
            onClick={() => {
              if (!window.confirm(`Rehire ${fullName}?`)) return
              rehireMut.mutate()
            }}
          >
            {rehireMut.isPending ? 'Rehiring…' : 'Rehire'}
          </Button>
        )}
      </div>

      {editing && <EmployeeEditForm form={form} />}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <EmployeeProfileSidebar data={data} fullName={fullName} initials={initials} />

        <div className="xl:col-span-6">
          <EmployeeDetailTabNav tab={tab} onTabChange={setTab} />
          <div className="bv-surface rounded-t-none border-t-0 p-6 space-y-6">
            {tab === 'overview' && <EmployeeOverviewTab data={data} stateLabel={stateLabel} />}
            {tab === 'history' && <EmployeeHistoryTab data={data} />}
            {tab === 'salary' && <EmployeeSalaryTab data={data} employmentId={id} />}
            {tab === 'documents' && <EmployeeDocumentsTab />}
          </div>
        </div>

        <EmployeeQuickLinks employmentId={id} />
      </div>
    </div>
  )
}
