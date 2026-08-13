import { useState } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'
import { cn } from '@/shared/lib/cn'

interface ProfileForm {
  fullName: string
  email: string
  phone: string
  location: string
  timezone: string
  language: string
  role: string
  department: string
  jobTitle: string
  manager: string
  joiningDate: string
  workType: string
}

const INITIAL: ProfileForm = {
  fullName: 'Marcus S.',
  email: 'marcus@bytevon.example',
  phone: '+1 (555) 012-3456',
  location: 'San Francisco, CA',
  timezone: 'Pacific Time (PT)',
  language: 'English (US)',
  role: 'Administrator',
  department: 'Operations',
  jobTitle: 'System Administrator',
  manager: '—',
  joiningDate: 'January 15, 2020',
  workType: 'Hybrid',
}

/** Profile — view + edit mode (Edit Profile / pencil) */
export function ProfilePage() {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<ProfileForm>(INITIAL)
  const [draft, setDraft] = useState<ProfileForm>(INITIAL)

  const startEdit = () => {
    setDraft(form)
    setEditing(true)
  }

  const cancelEdit = () => {
    setDraft(form)
    setEditing(false)
  }

  const saveEdit = () => {
    setForm(draft)
    setEditing(false)
  }

  const set =
    (key: keyof ProfileForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setDraft((d) => ({ ...d, [key]: e.target.value }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Account settings, security, and preferences."
        showBack
        backTo="/dashboard"
        backLabel="Back"
        actions={
          editing ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={saveEdit}>
                Save Changes
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">edit</span>}
              onClick={startEdit}
            >
              Edit Profile
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="relative shrink-0">
            <div className="w-28 h-28 rounded-full bg-surface-container-high border-4 border-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-5xl">person</span>
            </div>
            <button
              type="button"
              className="absolute bottom-1 right-1 bg-secondary text-white p-2 rounded-full shadow-lg"
              aria-label="Edit photo"
              onClick={startEdit}
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
          </div>
          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              {editing ? (
                <input
                  className="text-headline-lg font-bold text-on-background bg-surface border border-outline-variant rounded-lg px-3 py-1 max-w-full"
                  value={draft.fullName}
                  onChange={set('fullName')}
                  onKeyDown={(e) => handleEnterAdvance(e)}
                  id="profile-fullName"
                />
              ) : (
                <h3 className="text-headline-lg text-on-background">{form.fullName}</h3>
              )}
              <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-label-sm font-bold flex items-center gap-1">
                <span className="w-2 h-2 bg-secondary rounded-full" />
                Active Now
              </span>
            </div>
            <p className="text-title-lg text-on-surface-variant mb-4">
              {form.role} · Bytevon Corporate
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">location_on</span>
                <span className="text-label-md">{editing ? draft.location : form.location}</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">mail</span>
                <span className="text-label-md">{editing ? draft.email : form.email}</span>
              </div>
            </div>
          </div>
          {!editing && (
            <div className="flex flex-col gap-2 shrink-0">
              <Button variant="primary" size="sm" onClick={startEdit}>
                Edit Profile
              </Button>
              <Button variant="outline" size="sm">
                View Public Page
              </Button>
            </div>
          )}
        </section>

        <section className="lg:col-span-4 bg-deep-navy text-white p-8 rounded-xl shadow-md flex flex-col justify-between">
          <div>
            <p className="text-label-md text-white/60 uppercase tracking-widest mb-4">Account Health</p>
            <h4 className="text-headline-md font-bold mb-6 text-white">94% Secure</h4>
            <div className="w-full bg-white/20 h-2 rounded-full mb-6">
              <div className="bg-electric-blue h-full rounded-full" style={{ width: '94%' }} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-electric-blue">check_circle</span>
              <span className="text-body-sm text-white">Password set</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-electric-blue">check_circle</span>
              <span className="text-body-sm text-white">Email verified</span>
            </div>
            <div className="flex items-center gap-3 opacity-60">
              <span className="material-symbols-outlined text-white">info</span>
              <span className="text-body-sm text-white">MFA not enabled (V1)</span>
            </div>
          </div>
        </section>

        <section className="lg:col-span-6 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-title-lg text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">person</span>
              Personal Information
            </h4>
            {!editing && (
              <button
                type="button"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-background"
                aria-label="Edit personal information"
                onClick={startEdit}
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            <EditableField
              label="Full Name"
              editing={editing}
              value={editing ? draft.fullName : form.fullName}
              onChange={set('fullName')}
              id="fullName"
            />
            <EditableField
              label="Email Address"
              editing={editing}
              value={editing ? draft.email : form.email}
              onChange={set('email')}
              id="email"
            />
            <EditableField
              label="Phone Number"
              editing={editing}
              value={editing ? draft.phone : form.phone}
              onChange={set('phone')}
              id="phone"
            />
            <EditableField
              label="Location"
              editing={editing}
              value={editing ? draft.location : form.location}
              onChange={set('location')}
              id="location"
            />
            <EditableField
              label="Timezone"
              editing={editing}
              value={editing ? draft.timezone : form.timezone}
              onChange={set('timezone')}
              id="timezone"
            />
            <EditableField
              label="Language"
              editing={editing}
              value={editing ? draft.language : form.language}
              onChange={set('language')}
              id="language"
            />
          </div>
        </section>

        <section className="lg:col-span-6 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-title-lg text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">badge</span>
              Employment Information
            </h4>
            {!editing && (
              <button
                type="button"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-background"
                aria-label="Edit employment information"
                onClick={startEdit}
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            <EditableField label="Role" editing={editing} value={editing ? draft.role : form.role} onChange={set('role')} id="role" />
            <EditableField label="Department" editing={editing} value={editing ? draft.department : form.department} onChange={set('department')} id="department" />
            <EditableField label="Job Title" editing={editing} value={editing ? draft.jobTitle : form.jobTitle} onChange={set('jobTitle')} id="jobTitle" />
            <EditableField label="Reporting Manager" editing={editing} value={editing ? draft.manager : form.manager} onChange={set('manager')} id="manager" />
            <EditableField label="Joining Date" editing={editing} value={editing ? draft.joiningDate : form.joiningDate} onChange={set('joiningDate')} id="joiningDate" />
            <EditableField label="Work Type" editing={editing} value={editing ? draft.workType : form.workType} onChange={set('workType')} id="workType" />
          </div>
        </section>

        <section className="lg:col-span-7 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 shadow-sm">
          <h4 className="text-title-lg text-on-background flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary">security</span>
            Security & Authentication
          </h4>
          <div className="flex flex-wrap gap-3 mb-8">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">lock_reset</span>}
            >
              Change Password
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">phonelink_lock</span>}
            >
              Enable MFA
            </Button>
          </div>
          <h5 className="text-label-md text-on-surface-variant uppercase tracking-widest mb-4">Active Sessions</h5>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-surface-container rounded-lg">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-on-surface-variant text-[32px]">laptop_mac</span>
                <div>
                  <p className="text-body-md font-bold text-on-background">MacBook Pro — Current Session</p>
                  <p className="text-body-sm text-on-surface-variant">San Francisco, CA · Chrome</p>
                </div>
              </div>
              <span className="text-secondary font-bold text-label-sm px-2 py-1 bg-secondary/10 rounded">CURRENT</span>
            </div>
            <div className="flex items-center justify-between p-4 border border-outline-variant/30 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-on-surface-variant text-[32px]">smartphone</span>
                <div>
                  <p className="text-body-md font-bold text-on-background">iPhone 15 Pro</p>
                  <p className="text-body-sm text-on-surface-variant">San Francisco, CA · Mobile App</p>
                </div>
              </div>
              <button type="button" className="text-error font-bold text-label-sm hover:underline">
                LOGOUT
              </button>
            </div>
          </div>
        </section>

        <section className="lg:col-span-5 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 shadow-sm">
          <h4 className="text-title-lg text-on-background flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary">tune</span>
            Preferences & Notifications
          </h4>
          <div className="space-y-6">
            <PrefRow title="Email Notifications" description="Weekly summaries and direct messages" defaultOn />
            <PrefRow title="In-app Notifications" description="Alerts for approvals and assignments" defaultOn />
            <div className="pt-4 border-t border-outline-variant/30">
              <label className="text-label-md text-on-surface-variant block mb-3 uppercase tracking-wider">
                Interface Language
              </label>
              <select
                className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-on-background focus:outline-none focus:border-electric-blue"
                disabled={!editing}
                value={editing ? draft.language : form.language}
                onChange={set('language')}
              >
                <option>English (US)</option>
                <option>German (DE)</option>
                <option>French (FR)</option>
              </select>
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant block mb-3 uppercase tracking-wider">
                Appearance
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" className="p-2 border-2 border-secondary bg-surface-container-lowest rounded-lg text-label-sm font-bold text-on-background">
                  Light
                </button>
                <button type="button" className="p-2 border border-outline-variant rounded-lg text-label-sm font-bold text-on-surface-variant">
                  Dark
                </button>
                <button type="button" className="p-2 border border-outline-variant rounded-lg text-label-sm font-bold text-on-surface-variant">
                  System
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-12 flex flex-col md:flex-row items-center justify-between p-6 border-t border-outline-variant">
          <p className="text-body-sm text-on-surface-variant mb-4 md:mb-0">
            {editing
              ? 'Editing mode — changes apply locally until API is connected.'
              : 'Last login: today · Full profile API will connect later.'}
          </p>
          <div className="flex gap-3">
            <Button variant="danger" size="sm">
              Logout from All Devices
            </Button>
            {editing ? (
              <Button variant="primary" size="sm" onClick={saveEdit}>
                Save Changes
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={startEdit}>
                Edit Profile
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function EditableField({
  label,
  value,
  editing,
  onChange,
  id,
}: {
  label: string
  value: string
  editing: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  id: string
}) {
  return (
    <div>
      <p className="text-label-md text-on-surface-variant block mb-1">{label}</p>
      {editing ? (
        <input
          id={id}
          value={value}
          onChange={onChange}
          onKeyDown={(e) => handleEnterAdvance(e)}
          className={cn(
            'w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface',
            'text-body-md text-on-background font-semibold',
            'focus:outline-none focus:ring-2 focus:ring-electric-blue'
          )}
        />
      ) : (
        <p className="text-body-md text-on-background font-semibold">{value}</p>
      )}
    </div>
  )
}

function PrefRow({
  title,
  description,
  defaultOn,
}: {
  title: string
  description: string
  defaultOn?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-body-md font-bold text-on-background">{title}</p>
        <p className="text-body-sm text-on-surface-variant">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input type="checkbox" className="sr-only peer" defaultChecked={defaultOn} />
        <div className="w-11 h-6 bg-outline-variant rounded-full peer peer-checked:bg-secondary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
      </label>
    </div>
  )
}
