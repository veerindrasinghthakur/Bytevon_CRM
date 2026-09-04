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

  // UI-only fields not in CreateEmployment payload / form schema
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
      setCreatedEmploymentId(created.id)
      setCreatedName(created.fullName)
      const slug = created.fullName.toLowerCase().replace(/\s+/g, '.')
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
        <section className="bv-surface p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full bg-surface-container-high border-2 border-dashed border-outline-variant overflow-hidden flex items-center justify-center text-on-surface-variant">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Icon name="person" className="text-5xl" />
                )}
              </div>
              <label className="absolute inset-0 rounded-full cursor-pointer flex items-center justify-center bg-on-background/0 group-hover:bg-on-background/40 transition-colors">
                <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-semibold">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div>
              <h3 className="text-title-md font-semibold text-on-background">Employee photo</h3>
              <p className="text-body-sm text-on-surface-variant mt-1">
                JPG or PNG, recommended square crop. Preview only in V1 mock.
              </p>
              {photoPreview && (
                <button
                  type="button"
                  className="mt-2 text-sm text-error hover:underline"
                  onClick={() => setPhotoPreview(null)}
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="bv-surface p-6 space-y-4 mb-6">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Icon name="person" />
            <h3 className="text-title-lg font-bold text-on-background">Personal Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="First Name" required error={errors.firstName?.message}>
              <input className={inputClass} {...form.register('firstName')} />
            </Field>
            <Field label="Last Name" required error={errors.lastName?.message}>
              <input className={inputClass} {...form.register('lastName')} />
            </Field>
            <Field label="Date of Birth">
              <input className={inputClass} type="date" {...form.register('dateOfBirth')} />
            </Field>
            <Field label="Gender">
              <Select
                value={gender}
                onChange={setGender}
                options={[...GENDER_OPTIONS]}
                placeholder="Select…"
                minWidthClass="w-full"
                aria-label="Gender"
              />
            </Field>
            <Field label="Nationality">
              <input
                className={inputClass}
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="e.g. Indian"
              />
            </Field>
          </div>
        </section>

        <section className="bv-surface p-6 space-y-4 mb-6">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Icon name="contact_mail" />
            <h3 className="text-title-lg font-bold text-on-background">Contact Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Personal Email" error={errors.personalEmail?.message}>
              <input className={inputClass} type="email" {...form.register('personalEmail')} />
            </Field>
            <Field label="Work Email (optional)">
              <input
                className={inputClass}
                type="email"
                value={workContactEmail}
                onChange={(e) => setWorkContactEmail(e.target.value)}
                placeholder="name@bytevon.com"
              />
            </Field>
            <Field label="Primary Phone">
              <input className={inputClass} {...form.register('personalPhone')} />
            </Field>
            <Field label="Alternate Phone">
              <input className={inputClass} value={altPhone} onChange={(e) => setAltPhone(e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="bv-surface p-6 space-y-4 mb-6">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Icon name="home" />
            <h3 className="text-title-lg font-bold text-on-background">Address</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Street">
              <input className={inputClass} {...form.register('street')} />
            </Field>
            <Field label="City">
              <input className={inputClass} {...form.register('city')} />
            </Field>
            <Field label="State / Region">
              <input className={inputClass} {...form.register('stateRegion')} />
            </Field>
            <Field label="ZIP / Postal">
              <input className={inputClass} {...form.register('zip')} />
            </Field>
            <Field label="Country">
              <input className={inputClass} {...form.register('country')} />
            </Field>
          </div>
        </section>

        <section className="bv-surface p-6 space-y-4 mb-6">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Icon name="emergency" />
            <h3 className="text-title-lg font-bold text-on-background">Emergency Contact</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Contact Name">
              <input className={inputClass} value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
            </Field>
            <Field label="Relationship">
              <input
                className={inputClass}
                value={emergencyRelation}
                onChange={(e) => setEmergencyRelation(e.target.value)}
                placeholder="Spouse, Parent…"
              />
            </Field>
            <Field label="Phone">
              <input className={inputClass} value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
            </Field>
          </div>
          <p className="text-xs text-on-surface-variant">
            Stored in UI state for documentation; wire to person emergency fields when schema exposes them.
          </p>
        </section>

        <section className="bv-surface p-6 space-y-4 mb-6">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Icon name="work" />
            <h3 className="text-title-lg font-bold text-on-background">Employment</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Employment ID" hint="Immutable — auto-assigned on save">
              <input className={cn(inputClass, 'bg-surface-container-low text-on-surface-variant')} value={previewEmpCode} readOnly />
            </Field>
            <Field label="Reporting Manager">
              <Controller
                name="managerId"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    options={managerSelectOptions}
                    placeholder="Unassigned"
                    minWidthClass="w-full"
                    aria-label="Reporting Manager"
                  />
                )}
              />
            </Field>
            <Field label="Joining Date" required error={errors.joiningDate?.message}>
              <input className={inputClass} type="date" {...form.register('joiningDate')} />
            </Field>
            <Field label="Employment Type" required error={errors.employmentType?.message}>
              <Controller
                name="employmentType"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={employmentTypeOptions}
                    placeholder="Select type…"
                    minWidthClass="w-full"
                    aria-label="Employment Type"
                  />
                )}
              />
            </Field>
            <Field label="Department" required error={errors.departmentId?.message}>
              <Controller
                name="departmentId"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={departmentOptions}
                    placeholder="Select department…"
                    minWidthClass="w-full"
                    aria-label="Department"
                  />
                )}
              />
            </Field>
            <Field label="Position" required error={errors.positionId?.message}>
              <Controller
                name="positionId"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={positionOptions}
                    placeholder="Select position…"
                    minWidthClass="w-full"
                    aria-label="Position"
                  />
                )}
              />
            </Field>
            <Field label="Location" required error={errors.locationId?.message}>
              <Controller
                name="locationId"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={locationOptions}
                    placeholder="Select location…"
                    minWidthClass="w-full"
                    aria-label="Location"
                  />
                )}
              />
            </Field>
            <Field label="Shift" required error={errors.shiftId?.message}>
              <Controller
                name="shiftId"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={shiftOptions}
                    placeholder="Select shift…"
                    minWidthClass="w-full"
                    aria-label="Shift"
                  />
                )}
              />
            </Field>
          </div>
        </section>

        <section className="bv-surface p-6 space-y-4 mb-6">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Icon name="payments" />
            <h3 className="text-title-lg font-bold text-on-background">Bank</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Account Holder Name">
              <input
                className={inputClass}
                placeholder="Defaults to employee full name"
                {...form.register('accountHolderName')}
              />
            </Field>
            <Field label="Bank Name">
              <input className={inputClass} {...form.register('bankName')} />
            </Field>
            <Field label="Account Number">
              <input className={inputClass} {...form.register('accountNumber')} />
            </Field>
            <Field label="IFSC">
              <input className={inputClass} {...form.register('ifsc')} />
            </Field>
          </div>
        </section>

        <section className="bv-surface p-6 space-y-4 mb-6">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Icon name="folder_open" />
            <h3 className="text-title-lg font-bold text-on-background">Documents</h3>
          </div>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-xl p-8 cursor-pointer hover:border-secondary/50 hover:bg-surface-container-low transition-colors">
            <Icon name="cloud_upload" className="text-4xl text-on-surface-variant mb-2" />
            <span className="text-sm font-medium text-on-surface">Click to upload or drag and drop</span>
            <span className="text-xs text-on-surface-variant mt-1">PDF, JPG, PNG (max 10MB each) — UI only</span>
            <input type="file" multiple className="sr-only" onChange={(e) => onDocsChange(e.target.files)} />
          </label>
          {docLabels.length > 0 && (
            <ul className="space-y-1">
              {docLabels.map((n) => (
                <li key={n} className="text-sm flex items-center gap-2 text-on-surface">
                  <Icon name="description" className="text-secondary text-lg" /> {n}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="fixed bottom-0 right-0 left-0 md:left-[var(--shell-left,0)] z-30 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant px-6 py-4 flex justify-between items-center executive-shadow">
          <Button type="button" variant="ghost" onClick={goList}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving}>
            {canCreateUser ? 'Save & continue' : 'Save Employee'}
          </Button>
        </div>
      </form>
    </div>
  )
}
