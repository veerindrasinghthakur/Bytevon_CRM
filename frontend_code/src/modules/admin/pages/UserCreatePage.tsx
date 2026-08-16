import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { adminRoles } from '../data/mock'

export function UserCreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    role: adminRoles[3]?.name ?? 'Employee',
    sendInvite: true,
  })

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

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
        description="Provision a new account, assign a role, and optionally send an invite email."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate({ to: '/admin/users' })}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">person_add</span>}>
              {form.sendInvite ? 'Create & Invite' : 'Create User'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 space-y-5">
            <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">badge</span>
              Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="First Name"
                value={form.firstName}
                onChange={(v) => set('firstName', v)}
                placeholder="Sarah"
              />
              <Field
                label="Last Name"
                value={form.lastName}
                onChange={(v) => set('lastName', v)}
                placeholder="Chen"
              />
              <Field
                label="Work Email"
                value={form.email}
                onChange={(v) => set('email', v)}
                placeholder="sarah.chen@bytevon.com"
                type="email"
              />
              <Field
                label="Department"
                value={form.department}
                onChange={(v) => set('department', v)}
                placeholder="Engineering"
              />
            </div>
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
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
                className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-body-sm outline-none focus:border-secondary bg-transparent"
              >
                {adminRoles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
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
                checked={form.sendInvite}
                onChange={(e) => set('sendInvite', e.target.checked)}
                className="mt-1 rounded border-outline-variant text-secondary"
              />
              <div>
                <p className="text-body-md font-medium text-on-background">Send invite email</p>
                <p className="text-body-sm text-on-surface-variant">
                  User receives a secure link to set their password (expires in 48h).
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
              At least one Super Admin must always remain on the system. Locked accounts can be unlocked
              from the user detail page.
            </p>
          </div>
        </div>
      </div>
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
