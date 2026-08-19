import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import {
  createUserLogin,
  listEmploymentsWithoutLogin,
  listRoles,
  type EmploymentWithoutLogin,
} from '../api/users'
import type { RoleRow } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'

export function UserCreatePage() {
  const navigate = useNavigate()
  // Optional pre-select from employee create success
  const search = useSearch({ strict: false }) as { employmentId?: string }
  const preselectId = search?.employmentId ? Number(search.employmentId) : null

  const [candidates, setCandidates] = useState<EmploymentWithoutLogin[]>([])
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [employmentId, setEmploymentId] = useState<number | ''>(preselectId ?? '')
  const [email, setEmail] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [roleId, setRoleId] = useState<number | ''>('')
  const [sendInvite, setSendInvite] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const [emps, roleList] = await Promise.all([
        listEmploymentsWithoutLogin(),
        listRoles(),
      ])
      if (cancelled) return
      setCandidates(emps)
      setRoles(roleList)
      const defaultRole = roleList.find((r) => r.name === 'Employee') ?? roleList[0]
      if (defaultRole) setRoleId(defaultRole.id)
      if (preselectId && emps.some((e) => e.employmentId === preselectId)) {
        setEmploymentId(preselectId)
        const emp = emps.find((e) => e.employmentId === preselectId)
        if (emp) {
          const slug = emp.name.toLowerCase().replace(/\s+/g, '.')
          setEmail(`${slug}@bytevon.com`)
        }
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [preselectId])

  const selected = candidates.find((c) => c.employmentId === employmentId)

  const handleCreate = async () => {
    setError('')
    if (!employmentId) {
      setError('Select an employee who does not yet have a login.')
      return
    }
    if (!email.includes('@')) {
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
        employmentId: Number(employmentId),
        email,
        temporaryPassword: tempPassword,
        roleId: Number(roleId),
      })
      navigate({ to: '/admin/users' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate({ to: '/admin/users' })}
        className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors group"
      >
        <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>
        <span className="text-label-md font-medium">Back to Users</span>
      </button>

      <PageHeader
        title="Add New User"
        description="Provision a login for an existing employee who does not yet have credentials. Employee profile data is not re-entered."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate({ to: '/admin/users' })}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={saving}
              leftIcon={<span className="material-symbols-outlined text-[18px]">person_add</span>}
              onClick={handleCreate}
            >
              {sendInvite ? 'Create & Invite' : 'Create User'}
            </Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-sm text-error flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-on-surface-variant">Loading employees without login…</div>
      ) : candidates.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-10 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">person_check</span>
          <h3 className="text-title-lg font-semibold">All employees have logins</h3>
          <p className="text-body-sm text-on-surface-variant max-w-md mx-auto">
            Create a new employee first, then return here to provision their account.
          </p>
          <Button variant="primary" size="sm" onClick={() => navigate({ to: '/workforce/employees/new' })}>
            Add Employee
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 space-y-5">
              <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">badge</span>
                Select Employee
              </h3>
              <p className="text-body-sm text-on-surface-variant">
                Only employees without an existing login appear in this list.
              </p>
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant uppercase mb-1">
                  Employee
                </label>
                <select
                  value={employmentId}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : ''
                    setEmploymentId(id)
                    const emp = candidates.find((c) => c.employmentId === id)
                    if (emp && !email) {
                      const slug = emp.name.toLowerCase().replace(/\s+/g, '.')
                      setEmail(`${slug}@bytevon.com`)
                    }
                  }}
                  className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-body-sm outline-none focus:border-secondary bg-transparent"
                >
                  <option value="">Choose employee…</option>
                  {candidates.map((c) => (
                    <option key={c.employmentId} value={c.employmentId}>
                      {c.name} · {c.employeeCode} · {c.department}
                    </option>
                  ))}
                </select>
              </div>

              {selected && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-lg bg-surface-container-low border border-outline-variant">
                  <ReadOnly label="Code" value={selected.employeeCode} />
                  <ReadOnly label="Department" value={selected.department} />
                  <ReadOnly label="Position" value={selected.position} />
                  <ReadOnly label="Joined" value={selected.joiningDate} />
                </div>
              )}
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 space-y-5">
              <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">key</span>
                Login Credentials
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Work Email"
                  value={email}
                  onChange={setEmail}
                  placeholder="name@bytevon.com"
                  type="email"
                />
                <Field
                  label="Temporary Password"
                  value={tempPassword}
                  onChange={setTempPassword}
                  placeholder="Min. 8 characters"
                  type="text"
                />
              </div>
              <p className="text-xs text-on-surface-variant">
                User must change this password on first login (mock: stored in memory only).
              </p>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 space-y-5">
              <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">admin_panel_settings</span>
                Access
              </h3>
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant uppercase mb-1">
                  Primary Role
                </label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-body-sm outline-none focus:border-secondary bg-transparent"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                      {r.description ? ` — ${r.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="text-title-lg font-semibold text-on-background">Invite Options</h3>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendInvite}
                  onChange={(e) => setSendInvite(e.target.checked)}
                  className="mt-1 rounded border-outline-variant text-secondary"
                />
                <div>
                  <p className="text-body-md font-medium text-on-background">Send invite email</p>
                  <p className="text-body-sm text-on-surface-variant">
                    User receives a secure link to set their password (mock notification).
                  </p>
                </div>
              </label>
            </div>
            <div className="bg-surface-container-low p-5 rounded-xl border border-secondary/20">
              <h4 className="text-label-md text-secondary flex items-center gap-2 mb-2 font-medium">
                <span className="material-symbols-outlined text-[18px]">info</span>
                Note
              </h4>
              <p className="text-body-sm text-on-surface-variant">
                Creating a user does not create a new employee record. Use Workforce → Add Employee for
                person and employment data first.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-label-sm font-bold text-on-surface-variant uppercase mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-body-sm outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 bg-transparent"
      />
    </div>
  )
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-on-surface-variant uppercase">{label}</p>
      <p className={cn('text-body-sm font-medium text-on-background truncate')}>{value}</p>
    </div>
  )
}
