import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import {
  createEmployment,
  getOrgMastersForEmployeeForm,
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
  'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-1 focus:ring-secondary'

type Step = 'profile' | 'auth' | 'done'

export function EmployeeCreatePage() {
  const navigate = useNavigate()
  const canCreateUser = can({ action: Action.CREATE, resource: ResourceName.USER })

  const [step, setStep] = useState<Step>('profile')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [createdEmploymentId, setCreatedEmploymentId] = useState<number | null>(null)
  const [createdName, setCreatedName] = useState('')

  const [masters, setMasters] = useState<{
    departments: { id: number; name: string }[]
    positions: { id: number; name: string }[]
    locations: { id: number; name: string }[]
    shifts: { id: number; name: string }[]
  } | null>(null)
  const [roles, setRoles] = useState<RoleRow[]>([])

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [personalEmail, setPersonalEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [joiningDate, setJoiningDate] = useState('')
  const [employmentType, setEmploymentType] = useState<string>(EmploymentType.FULL_TIME)
  const [departmentId, setDepartmentId] = useState<number | ''>('')
  const [positionId, setPositionId] = useState<number | ''>('')
  const [locationId, setLocationId] = useState<number | ''>('')
  const [shiftId, setShiftId] = useState<number | ''>('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifsc, setIfsc] = useState('')

  // Auth step
  const [workEmail, setWorkEmail] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [roleId, setRoleId] = useState<number | ''>('')

  useEffect(() => {
    ;(async () => {
      const m = await getOrgMastersForEmployeeForm()
      setMasters(m)
      if (m.departments[0]) setDepartmentId(m.departments[0].id)
      if (m.positions[0]) setPositionId(m.positions[0].id)
      if (m.locations[0]) setLocationId(m.locations[0].id)
      if (m.shifts[0]) setShiftId(m.shifts[0].id)
      if (canCreateUser) {
        const r = await listRoles()
        setRoles(r)
        const empRole = r.find((x) => x.name === 'Employee') ?? r[0]
        if (empRole) setRoleId(empRole.id)
      }
    })()
  }, [canCreateUser])

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
      const created = await createEmployment({
        firstName,
        lastName,
        dateOfBirth: dob || null,
        personalEmail: personalEmail || null,
        personalPhone: phone || null,
        address: address || null,
        employmentType,
        joiningDate,
        departmentId: Number(departmentId),
        positionId: Number(positionId),
        locationId: Number(locationId),
        shiftId: Number(shiftId),
        bank: accountNumber
          ? {
              accountHolderName: `${firstName} ${lastName}`,
              bankName,
              accountNumber,
              ifscCode: ifsc,
            }
          : undefined,
      })
      setCreatedEmploymentId(created.id)
      setCreatedName(created.fullName)
      const slug = created.fullName.toLowerCase().replace(/\s+/g, '.')
      setWorkEmail(`${slug}@bytevon.com`)
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
      <div className="space-y-6 max-w-lg mx-auto py-12 text-center">
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
      <div className="space-y-6 pb-28 max-w-2xl">
        <PageHeader
          title="Create login account"
          description={`Optional next step for ${createdName}. Skip if credentials will be provisioned later from Admin → Users."`}
          showBack
        />
        {error && (
          <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-sm text-error">{error}</div>
        )}
        <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
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
        <div className="fixed bottom-0 right-0 left-0 md:left-[var(--shell-left,0)] z-30 bg-surface border-t border-outline-variant px-6 py-4 flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <Button
            variant="ghost"
            onClick={() => setStep('done')}
          >
            Skip for now
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() =>
                navigate({
                  to: '/admin/users/new',
                  search: { employmentId: String(createdEmploymentId) },
                } as never)
              }
            >
              Open full user form
            </Button>
            <Button variant="primary" isLoading={saving} onClick={handleCreateLogin}>
              Create login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-28 max-w-5xl">
      <PageHeader
        title="Add New Employee"
        description="Create person + employment from organization masters. Login can be added on the next step if you have permission."
        showBack
      />

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-sm text-error">{error}</div>
      )}

      <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
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
          <Field label="Personal Email">
            <input
              className={inputClass}
              type="email"
              value={personalEmail}
              onChange={(e) => setPersonalEmail(e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Address">
            <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-secondary mb-2">
          <Icon name="work" />
          <h3 className="text-title-lg font-bold text-on-background">Employment</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Joining Date" required>
            <input
              className={inputClass}
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
            />
          </Field>
          <Field label="Employment Type" required>
            <select
              className={inputClass}
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
            >
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

      <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-secondary mb-2">
          <Icon name="payments" />
          <h3 className="text-title-lg font-bold text-on-background">Bank (optional)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Bank Name">
            <input className={inputClass} value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </Field>
          <Field label="Account Number">
            <input
              className={inputClass}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </Field>
          <Field label="IFSC">
            <input className={inputClass} value={ifsc} onChange={(e) => setIfsc(e.target.value)} />
          </Field>
        </div>
      </section>

      <div className="fixed bottom-0 right-0 left-0 md:left-[var(--shell-left,0)] z-30 bg-surface border-t border-outline-variant px-6 py-4 flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
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
