import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import {
  createEmployment,
  getOrgMastersForEmployeeForm,
  listEmployments,
} from '../api/employment'
import { createUserLogin, listRoles } from '@/modules/admin/api/users'
import { can } from '@/shared/rbac'
import { Action, ResourceName, EmploymentType } from '@/shared/schema'
import type { RoleRow } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'

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

type Step = 'profile' | 'auth' | 'done'

export function EmployeeCreatePage() {
  const navigate = useNavigate()
  const canCreateUser = can({ action: Action.CREATE, resource: ResourceName.USER })

  const [step, setStep] = useState<Step>('profile')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [createdEmploymentId, setCreatedEmploymentId] = useState<number | null>(null)
  const [createdName, setCreatedName] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [masters, setMasters] = useState<{
    departments: { id: number; name: string }[]
    positions: { id: number; name: string }[]
    locations: { id: number; name: string }[]
    shifts: { id: number; name: string }[]
  } | null>(null)
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [managerOptions, setManagerOptions] = useState<{ id: number; name: string }[]>([])

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [nationality, setNationality] = useState('')
  const [personalEmail, setPersonalEmail] = useState('')
  const [workContactEmail, setWorkContactEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [altPhone, setAltPhone] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [stateRegion, setStateRegion] = useState('')
  const [zip, setZip] = useState('')
  const [country, setCountry] = useState('')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyRelation, setEmergencyRelation] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [joiningDate, setJoiningDate] = useState('')
  const [employmentType, setEmploymentType] = useState<string>(EmploymentType.FULL_TIME)
  const [departmentId, setDepartmentId] = useState<number | ''>('')
  const [positionId, setPositionId] = useState<number | ''>('')
  const [locationId, setLocationId] = useState<number | ''>('')
  const [shiftId, setShiftId] = useState<number | ''>('')
  const [managerId, setManagerId] = useState<number | ''>('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifsc, setIfsc] = useState('')
  const [docLabels, setDocLabels] = useState<string[]>([])

  const [workEmail, setWorkEmail] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [roleId, setRoleId] = useState<number | ''>('')

  // Preview-only immutable employment code (assigned on save)
  const previewEmpCode = 'EMP-AUTO'

  useEffect(() => {
    ;(async () => {
      const m = await getOrgMastersForEmployeeForm()
      setMasters(m)
      if (m.departments[0]) setDepartmentId(m.departments[0].id)
      if (m.positions[0]) setPositionId(m.positions[0].id)
      if (m.locations[0]) setLocationId(m.locations[0].id)
      if (m.shifts[0]) setShiftId(m.shifts[0].id)
      const list = await listEmployments({})
      setManagerOptions(list.items.map((e) => ({ id: e.id, name: e.fullName })))
      if (canCreateUser) {
        const r = await listRoles()
        setRoles(r)
        const empRole = r.find((x) => x.name === 'Employee') ?? r[0]
        if (empRole) setRoleId(empRole.id)
      }
    })()
  }, [canCreateUser])

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

  const composedAddress = [street, city, stateRegion, zip, country].filter(Boolean).join(', ')

  const handleSaveEmployee = async () => {
    setError('')
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required.')
      return
    }
    if (!joiningDate) {
      setError('Joining date is required.')
      return
    }
    if (!departmentId || !positionId || !locationId || !shiftId) {
      setError('Department, position, location, and shift are required.')
      return
    }
    setSaving(true)
    try {
      const holder =
        accountHolderName.trim() || `${firstName.trim()} ${lastName.trim()}`
      const created = await createEmployment({
        firstName,
        lastName,
        dateOfBirth: dob || null,
        personalEmail: personalEmail || null,
        personalPhone: phone || null,
        address: composedAddress || null,
        employmentType,
        joiningDate,
        departmentId: Number(departmentId),
        positionId: Number(positionId),
        locationId: Number(locationId),
        shiftId: Number(shiftId),
        bank: accountNumber
          ? {
              accountHolderName: holder,
              bankName,
              accountNumber,
              ifscCode: ifsc,
            }
          : undefined,
      })
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
  }

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
          <Button variant="outline" onClick={() => navigate({ to: '/workforce/employees' })}>
            Back to list
          </Button>
          {createdEmploymentId && (
            <Button
              variant="primary"
              onClick={() =>
                navigate({
                  to: '/workforce/employees/$employeeId',
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
            <select
              className={inputClass}
              value={roleId}
              onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : '')}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
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

      {/* Photo upload */}
      <section className="bv-surface p-6">
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

      <section className="bv-surface p-6 space-y-4">
        <div className="flex items-center gap-2 text-secondary mb-2">
          <Icon name="person" />
          <h3 className="text-title-lg font-bold text-on-background">Personal Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="First Name" required>
            <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label="Last Name" required>
            <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
          <Field label="Date of Birth">
            <input className={inputClass} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </Field>
          <Field label="Gender">
            <select className={inputClass} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select…</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
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

      <section className="bv-surface p-6 space-y-4">
        <div className="flex items-center gap-2 text-secondary mb-2">
          <Icon name="contact_mail" />
          <h3 className="text-title-lg font-bold text-on-background">Contact Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Personal Email">
            <input
              className={inputClass}
              type="email"
              value={personalEmail}
              onChange={(e) => setPersonalEmail(e.target.value)}
            />
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
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Alternate Phone">
            <input className={inputClass} value={altPhone} onChange={(e) => setAltPhone(e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="bv-surface p-6 space-y-4">
        <div className="flex items-center gap-2 text-secondary mb-2">
          <Icon name="home" />
          <h3 className="text-title-lg font-bold text-on-background">Address</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Street">
            <input className={inputClass} value={street} onChange={(e) => setStreet(e.target.value)} />
          </Field>
          <Field label="City">
            <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="State / Region">
            <input className={inputClass} value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} />
          </Field>
          <Field label="ZIP / Postal">
            <input className={inputClass} value={zip} onChange={(e) => setZip(e.target.value)} />
          </Field>
          <Field label="Country">
            <input className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="bv-surface p-6 space-y-4">
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

      <section className="bv-surface p-6 space-y-4">
        <div className="flex items-center gap-2 text-secondary mb-2">
          <Icon name="work" />
          <h3 className="text-title-lg font-bold text-on-background">Employment</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Employment ID" hint="Immutable — auto-assigned on save">
            <input className={cn(inputClass, 'bg-surface-container-low text-on-surface-variant')} value={previewEmpCode} readOnly />
          </Field>
          <Field label="Reporting Manager">
            <select
              className={inputClass}
              value={managerId}
              onChange={(e) => setManagerId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Unassigned</option>
              {managerOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Joining Date" required>
            <input className={inputClass} type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
          </Field>
          <Field label="Employment Type" required>
            <select className={inputClass} value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
              {Object.values(EmploymentType).map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Department" required>
            <select
              className={inputClass}
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
            >
              {(masters?.departments ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Position" required>
            <select
              className={inputClass}
              value={positionId}
              onChange={(e) => setPositionId(e.target.value ? Number(e.target.value) : '')}
            >
              {(masters?.positions ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Location" required>
            <select
              className={inputClass}
              value={locationId}
              onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : '')}
            >
              {(masters?.locations ?? []).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Shift" required>
            <select
              className={inputClass}
              value={shiftId}
              onChange={(e) => setShiftId(e.target.value ? Number(e.target.value) : '')}
            >
              {(masters?.shifts ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="bv-surface p-6 space-y-4">
        <div className="flex items-center gap-2 text-secondary mb-2">
          <Icon name="payments" />
          <h3 className="text-title-lg font-bold text-on-background">Bank</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Account Holder Name">
            <input
              className={inputClass}
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              placeholder="Defaults to employee full name"
            />
          </Field>
          <Field label="Bank Name">
            <input className={inputClass} value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </Field>
          <Field label="Account Number">
            <input className={inputClass} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
          </Field>
          <Field label="IFSC">
            <input className={inputClass} value={ifsc} onChange={(e) => setIfsc(e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="bv-surface p-6 space-y-4">
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
        <Button variant="ghost" onClick={() => navigate({ to: '/workforce/employees' })}>
          Cancel
        </Button>
        <Button variant="primary" isLoading={saving} onClick={handleSaveEmployee}>
          {canCreateUser ? 'Save & continue' : 'Save Employee'}
        </Button>
      </div>
    </div>
  )
}
