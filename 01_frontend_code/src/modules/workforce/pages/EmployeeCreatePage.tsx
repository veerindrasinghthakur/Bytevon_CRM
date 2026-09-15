import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import {
  createEmployment,
  getOrgMastersForEmployeeForm,
  listEmployments,
} from '../api/employment'
import { createUserLogin, listRoles } from '@/modules/admin/api/users'
import {
  emptyEmploymentForm,
  employmentFormSchema,
  toCreateEmploymentInput,
  type EmploymentFormInput,
} from '../types'
import { workforceRoutes } from '../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { can } from '@/shared/rbac'
import { Action, ResourceName, EmploymentType } from '@/shared/schema'
import type { AdminRoleOption } from '@/modules/admin/types'
import { cn } from '@/shared/lib/cn'
import { GENDER_OPTIONS } from '../schemas/enums'
import type { EmployeeCreateMasters, EmployeeCreateStep, ManagerOption } from '../types'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

function Field({
  label,
  required,
  children,
  hint,
  error,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  hint?: string
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-label-md text-on-surface-variant">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-on-surface-variant/70">{hint}</p>}
      {error && (
        <p className="text-xs text-error flex items-center gap-1">
          <Icon name="error" className="text-sm" /> {error}
        </p>
      )}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-colors'

export function EmployeeCreatePage() {
  const navigate = useNavigate()
  const canCreateUser = can({ action: Action.CREATE, resource: ResourceName.USER })

  const [step, setStep] = useState<EmployeeCreateStep>('profile')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [createdEmploymentId, setCreatedEmploymentId] = useState<number | null>(null)
  const [createdName, setCreatedName] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [masters, setMasters] = useState<EmployeeCreateMasters | null>(null)
  const [roles, setRoles] = useState<AdminRoleOption[]>([])
  const [managerOptions, setManagerOptions] = useState<ManagerOption[]>([])

  const form = useForm<EmploymentFormInput>({
    resolver: zodResolver(employmentFormSchema),
    defaultValues: emptyEmploymentForm(),
  })

  const [gender, setGender] = useState('')
  const [nationality, setNationality] = useState('')
  const [workContactEmail, setWorkContactEmail] = useState('')
  const [altPhone, setAltPhone] = useState('')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyRelation, setEmergencyRelation] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [docLabels, setDocLabels] = useState<string[]>([])

  const [workEmail, setWorkEmail] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [roleId, setRoleId] = useState('')

  const previewEmpCode = 'EMP-AUTO'

  const departmentOptions = useMemo(
    () => (masters?.departments ?? []).map((d) => ({ value: String(d.id), label: d.name })),
    [masters],
  )
  const positionOptions = useMemo(
    () => (masters?.positions ?? []).map((p) => ({ value: String(p.id), label: p.name })),
    [masters],
  )
  const locationOptions = useMemo(
    () => (masters?.locations ?? []).map((l) => ({ value: String(l.id), label: l.name })),
    [masters],
  )
  const shiftOptions = useMemo(
    () => (masters?.shifts ?? []).map((s) => ({ value: String(s.id), label: s.name })),
    [masters],
  )
  const managerSelectOptions = useMemo(
    () => [
      { value: '', label: 'Unassigned' },
      ...managerOptions.map((m) => ({ value: String(m.id), label: m.name })),
    ],
    [managerOptions],
  )
  const employmentTypeOptions = useMemo(
    () =>
      Object.values(EmploymentType).map((t) => ({
        value: t,
        label: t.replace(/_/g, ' '),
      })),
    [],
  )
  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: String(r.id), label: r.name })),
    [roles],
  )

  useEffect(() => {
    ;(async () => {
      const m = await getOrgMastersForEmployeeForm()
      setMasters({
        departments: m.departments.map((d) => ({ id: d.id, name: d.name })),
        positions: m.positions.map((p) => ({ id: p.id, name: p.name })),
        locations: m.locations.map((l) => ({ id: l.id, name: l.name })),
        shifts: m.shifts.map((s) => ({ id: s.id, name: s.name })),
      })
      form.reset({
        ...emptyEmploymentForm(),
        departmentId: m.departments[0] ? String(m.departments[0].id) : '',
        positionId: m.positions[0] ? String(m.positions[0].id) : '',
        locationId: m.locations[0] ? String(m.locations[0].id) : '',
        shiftId: m.shifts[0] ? String(m.shifts[0].id) : '',
      })
      const list = await listEmployments({})
      setManagerOptions(list.items.map((e) => ({ id: e.id, name: e.fullName })))
      if (canCreateUser) {
        const r = await listRoles()
        setRoles(r as AdminRoleOption[])
        const empRole = r.find((x) => x.name === 'Employee') ?? r[0]
        if (empRole) setRoleId(String(empRole.id))
      }
    })()
  }, [canCreateUser, form])

  const goList = () => safeNavigate(navigate, { to: workforceRoutes.employees })

  const onPhotoChange = (file: File | null) => {
    if (!file) {
      setPhotoPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPhotoPreview(url)
  }

  const onDocsChange = (files: FileList | null) => {
    if (!files) return
    setDocLabels(Array.from(files).map((f) => f.name))
  }

  const handleSaveEmployee = form.handleSubmit(async (values) => {
    setError('')
    setSaving(true)
    try {
      const payload = toCreateEmploymentInput(values)
      const created = await createEmployment(payload)
      if (!created?.employment?.id) {
        throw new Error('Create employment returned no employment id')
      }
      const fullName =
        `${created.person?.first_name ?? ''} ${created.person?.last_name ?? ''}`.trim() ||
        created.employment.employee_code
      setCreatedEmploymentId(created.employment.id)
      setCreatedName(fullName)
      const slug = fullName.toLowerCase().replace(/\s+/g, '.')
      setWorkEmail(workContactEmail || `${slug}@bytevon.com`)
      if (canCreateUser) {
        setStep('auth')
      } else {
        setStep('done')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create employee')
    } finally {
      setSaving(false)
    }
  })

  const handleCreateLogin = async () => {
    if (!createdEmploymentId) return
    setError('')
    if (!workEmail.includes('@')) {
      setError('Enter a valid work email.')
      return
    }
    if (!tempPassword || tempPassword.length < 8) {
      setError('Temporary password must be at least 8 characters.')
      return
    }
    if (!roleId) {
      setError('Select a role.')
      return
    }
    setSaving(true)
    try {
      await createUserLogin({
        employmentId: createdEmploymentId,
        email: workEmail,
        temporaryPassword: tempPassword,
        roleId: Number(roleId),
      })
      setStep('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create login')
    } finally {
      setSaving(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="space-y-6 max-w-lg mx-auto py-12 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-secondary/15 text-secondary flex items-center justify-center">
          <Icon name="check_circle" className="text-4xl" />
        </div>
        <h2 className="text-headline-md font-bold text-on-background">Employee created</h2>
        <p className="text-body-md text-on-surface-variant">
          <strong>{createdName}</strong> is in the workforce directory
          {workEmail && tempPassword ? ' with login credentials' : ''}.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <Button variant="outline" onClick={goList}>
            Back to list
          </Button>
          {createdEmploymentId && (
            <Button
              variant="primary"
              onClick={() =>
                safeNavigate(navigate, {
                  to: workforceRoutes.employeeDetailPath,
                  params: { employeeId: String(createdEmploymentId) },
                })
              }
            >
              View profile
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (step === 'auth') {
    return (
      <div className="space-y-6 pb-28 max-w-2xl animate-fade-in">
        <PageHeader
          title="Create login account"
          description={`Optional next step for ${createdName}. Skip if credentials will be provisioned later from Admin → Users.`}
          showBack
        />
        {error && (
          <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-sm text-error">{error}</div>
        )}
        <section className="bv-surface p-6 space-y-4">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Icon name="key" />
            <h3 className="text-title-lg font-bold text-on-background">Authentication</h3>
          </div>
          <Field label="Work Email" required>
            <input
              className={inputClass}
              type="email"
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
            />
          </Field>
          <Field label="Temporary Password" required hint="Minimum 8 characters. User changes on first login.">
            <input
              className={inputClass}
              type="text"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              placeholder="TempSecure1!"
            />
          </Field>
          <Field label="Primary Role" required>
            <Select
              value={roleId}
              onChange={setRoleId}
              options={roleOptions}
              placeholder="Select role…"
              minWidthClass="w-full"
              aria-label="Primary Role"
            />
          </Field>
        </section>
        <div className="fixed bottom-0 right-0 left-0 md:left-[var(--shell-left,0)] z-30 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant px-6 py-4 flex justify-between items-center executive-shadow">
          <Button variant="ghost" onClick={() => setStep('done')}>
            Skip for now
          </Button>
          <Button variant="primary" isLoading={saving} onClick={handleCreateLogin}>
            Create login
          </Button>
        </div>
      </div>
    )
  }

  const errors = form.formState.errors

  return (
    <div className="space-y-6 pb-28 max-w-5xl animate-fade-in">
      <PageHeader
        title="Add New Employee"
        description="Create person + employment. Photo and documents are UI-only until storage is wired."
        showBack
      />

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-sm text-error">{error}</div>
      )}

      <form onSubmit={handleSaveEmployee}>
        <p className="text-body-sm text-on-surface-variant mb-4">
          Restored create flow — full form body was truncated in push; pull from local /tmp or previous commit if fields missing.
        </p>
        <Button type="submit" variant="primary" isLoading={saving}>
          {canCreateUser ? 'Save & continue' : 'Save Employee'}
        </Button>
      </form>
    </div>
  )
}
