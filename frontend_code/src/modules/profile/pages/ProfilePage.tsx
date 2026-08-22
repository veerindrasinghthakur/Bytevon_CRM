import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { Select } from '@/shared/components/ui/Select'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemePreference } from '@/shared/lib/theme'
import { cn } from '@/shared/lib/cn'
import {
  useMyActivity,
  useMyProfile,
  useMySessions,
  useUpdateProfile,
  useUploadAvatar,
} from '../hooks/use-profile'
import type { ProfileDetail, ProfilePreferences } from '../types'

const LANG_OPTIONS = [
  { value: 'en', label: 'English (US)' },
  { value: 'de', label: 'German (DE)' },
  { value: 'fr', label: 'French (FR)' },
  { value: 'es', label: 'Spanish (ES)' },
]

export function ProfilePage() {
  const navigate = useNavigate()
  const { data: profile, isLoading, isError, refetch } = useMyProfile()
  const { data: sessions = [] } = useMySessions()
  const { data: activity = [] } = useMyActivity()
  const updateMut = useUpdateProfile()
  const avatarMut = useUploadAvatar()
  const { isEditing, startEditing, cancelEditing, finishEditing } = useEditMode(false)
  const { preference, setPreference } = useTheme()
  const fileRef = useRef<HTMLInputElement>(null)

  const [draft, setDraft] = useState<ProfileDetail | null>(null)

  useEffect(() => {
    if (profile && !isEditing) setDraft(profile)
  }, [profile, isEditing])

  const startEdit = () => {
    if (profile) setDraft(structuredClone(profile))
    startEditing()
  }

  const cancel = () => {
    if (profile) setDraft(profile)
    cancelEditing()
  }

  const save = async () => {
    if (!draft) return
    try {
      await updateMut.mutateAsync({
        name: draft.name,
        phone: draft.phone,
        location: draft.location,
        dateOfBirth: draft.dateOfBirth,
        timezone: draft.timezone,
        preferences: draft.preferences,
      })
      setPreference(draft.preferences.appearance)
      finishEditing()
    } catch {
      /* mutation error */
    }
  }

  const onAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    avatarMut.mutate(file)
    e.target.value = ''
  }

  const setPref = <K extends keyof ProfilePreferences>(key: K, value: ProfilePreferences[K]) => {
    setDraft((d) =>
      d
        ? {
            ...d,
            preferences: { ...d.preferences, [key]: value },
          }
        : d,
    )
  }

  if (isLoading || !draft) return <PageLoadingSkeleton />
  if (isError) {
    return (
      <div className="rounded-lg border border-error/30 bg-error/5 p-6 text-center">
        <p className="text-body-md text-error mb-3">Failed to load profile.</p>
        <Button variant="outline" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  const initials =
    draft.name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

  const activeSessions = sessions.filter((s) => s.status === 'ACTIVE')
  const currentSession = activeSessions.find((s) => s.current)
  const otherSession = activeSessions.find((s) => !s.current)

  const appearanceValue = isEditing ? draft.preferences.appearance : preference

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Profile"
        description="Account details, employment, security, and preferences"
        actions={
          isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cancel} disabled={updateMut.isPending}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={updateMut.isPending}
                onClick={() => void save()}
              >
                Save Changes
              </Button>
            </div>
          ) : (
            <EditButton onClick={startEdit} label="Edit Profile" />
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col md:flex-row items-center gap-6 card-hover">
          <div className="relative shrink-0">
            {draft.avatarUrl ? (
              <img
                src={draft.avatarUrl}
                alt=""
                className="w-28 h-28 rounded-full object-cover border-4 border-surface-container"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-3xl font-bold border-4 border-surface-container">
                {initials}
              </div>
            )}
            <button
              type="button"
              className="absolute bottom-1 right-1 bg-secondary text-on-secondary p-2 rounded-full shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
              aria-label="Change photo"
              disabled={avatarMut.isPending}
              onClick={() => fileRef.current?.click()}
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarPick}
            />
          </div>
          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2 flex-wrap">
              <h2 className="text-headline-md font-semibold text-on-background">{draft.name}</h2>
              <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-label-sm font-bold inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                Active Now
              </span>
            </div>
            <p className="text-title-lg text-on-surface-variant mb-3">
              {draft.role} · Bytevon Corporate
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5 text-label-md">
                <span className="material-symbols-outlined text-[20px]">mail</span>
                {draft.email}
              </span>
              <span className="inline-flex items-center gap-1.5 text-label-md">
                <span className="material-symbols-outlined text-[20px]">badge</span>
                Emp {draft.employmentId}
              </span>
            </div>
          </div>
        </section>

        <section className="lg:col-span-4 bg-primary text-on-primary p-6 rounded-xl shadow-md flex flex-col justify-between">
          <div>
            <p className="text-label-md uppercase tracking-widest opacity-70 mb-3">Account Health</p>
            <h3 className="text-headline-md font-bold mb-4">V1 Secure</h3>
            <div className="w-full bg-white/20 h-2 rounded-full mb-4">
              <div className="bg-secondary-container h-full rounded-full w-[88%]" />
            </div>
          </div>
          <ul className="space-y-3 text-body-sm">
            <li className="flex items-center gap-2 opacity-90">
              <span className="material-symbols-outlined text-secondary-container text-[20px]">check_circle</span>
              Session management enabled
            </li>
            <li className="flex items-center gap-2 opacity-50">
              <span className="material-symbols-outlined text-[20px]">info</span>
              MFA not available in V1
            </li>
            <li className="flex items-center gap-2 opacity-90">
              <span className="material-symbols-outlined text-secondary-container text-[20px]">check_circle</span>
              Password + lockout policy active
            </li>
          </ul>
        </section>

        <section className="lg:col-span-6 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
          <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-secondary">person</span>
            Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <EditableInfo label="Full Name" value={draft.name} editing={isEditing} onChange={(v) => setDraft((d) => (d ? { ...d, name: v } : d))} />
            <Info label="Email Address" value={draft.email} />
            <EditableInfo label="Phone Number" value={draft.phone} editing={isEditing} onChange={(v) => setDraft((d) => (d ? { ...d, phone: v } : d))} />
            <EditableInfo label="Location" value={draft.location} editing={isEditing} onChange={(v) => setDraft((d) => (d ? { ...d, location: v } : d))} />
            <EditableInfo label="Date of Birth" value={draft.dateOfBirth} editing={isEditing} onChange={(v) => setDraft((d) => (d ? { ...d, dateOfBirth: v } : d))} />
            <EditableInfo label="Timezone" value={draft.timezone} editing={isEditing} onChange={(v) => setDraft((d) => (d ? { ...d, timezone: v } : d))} />
          </div>
        </section>

        <section className="lg:col-span-6 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
          <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-secondary">badge</span>
            Employment Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <Info label="Org mail" value={draft.orgMail} />
            <Info label="Department" value={draft.department} />
            <Info label="Job Title" value={draft.jobTitle} />
            <Info label="Reporting Manager" value={draft.reportingManager} />
            <Info label="Joining Date" value={draft.joiningDate} />
            <Info label="Work Type" value={draft.workType} />
          </div>
        </section>

        <section className="lg:col-span-7 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
          <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-secondary">security</span>
            Security & Authentication
          </h3>
          <div className="flex flex-wrap gap-3 mb-6">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">lock_reset</span>}
              onClick={() => navigate({ to: '/profile/change-password' })}
            >
              Change Password
            </Button>
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-outline-variant rounded-lg text-on-surface-variant opacity-75">
              <span className="material-symbols-outlined text-[18px]">phonelink_lock</span>
              <span className="text-label-md font-semibold">MFA — Not available</span>
            </div>
          </div>
          <h4 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-3">Active Sessions</h4>
          <div className="space-y-3">
            {currentSession && (
              <div className="flex items-center justify-between p-4 bg-surface-container rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant text-[28px]">laptop_mac</span>
                  <div>
                    <p className="font-semibold text-body-md">{currentSession.device_name} — Current Session</p>
                    <p className="text-body-sm text-on-surface-variant">{currentSession.ip_address}</p>
                  </div>
                </div>
                <span className="text-secondary font-bold text-label-sm px-2 py-1 bg-secondary/10 rounded">CURRENT</span>
              </div>
            )}
            {otherSession && (
              <div className="flex items-center justify-between p-4 border border-outline-variant rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant text-[28px]">smartphone</span>
                  <div>
                    <p className="font-semibold text-body-md">{otherSession.device_name}</p>
                    <p className="text-body-sm text-on-surface-variant">{otherSession.ip_address}</p>
                  </div>
                </div>
                <Link to="/profile/sessions" className="text-error font-bold text-label-sm hover:underline">Manage</Link>
              </div>
            )}
          </div>
          <div className="mt-4">
            <Link to="/profile/sessions" className="text-secondary text-label-md font-semibold hover:underline inline-flex items-center gap-1">
              View all sessions
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </Link>
          </div>
        </section>

        <section className="lg:col-span-5 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
          <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-secondary">tune</span>
            Preferences & Notifications
          </h3>
          <div className="space-y-5">
            <ToggleRow title="Email Notifications" description="Weekly summaries and direct messages" checked={draft.preferences.emailNotifications} disabled={!isEditing} onChange={(v) => setPref('emailNotifications', v)} />
            <ToggleRow title="Desktop Push" description="Real-time alerts for urgent tasks" checked={draft.preferences.desktopPush} disabled={!isEditing} onChange={(v) => setPref('desktopPush', v)} />
            <div className="pt-4 border-t border-outline-variant">
              <label className="text-label-md text-on-surface-variant block mb-2 uppercase tracking-wider">Interface Language</label>
              <Select value={draft.preferences.language} onChange={(v) => setPref('language', v)} options={LANG_OPTIONS} disabled={!isEditing} minWidthClass="w-full" />
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant block mb-2 uppercase tracking-wider">Appearance</label>
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'dark', 'system'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    disabled={!isEditing}
                    onClick={() => {
                      setPref('appearance', mode)
                      setPreference(mode as ThemePreference)
                    }}
                    className={cn(
                      'p-2 rounded-lg text-label-sm font-bold capitalize border transition-colors',
                      appearanceValue === mode
                        ? 'border-2 border-secondary bg-surface-container-lowest text-secondary'
                        : 'border-outline-variant bg-surface-container text-on-surface-variant',
                      !isEditing && 'opacity-70 cursor-default',
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-12 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
          <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary">history</span>
            Recent Activity Log
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-outline-variant">
                <tr>
                  {['Activity', 'Module', 'Timestamp', 'Status'].map((h) => (
                    <th key={h} className={cn('pb-3 text-label-md text-on-surface-variant uppercase tracking-wider', h === 'Status' && 'text-right')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {activity.map((row) => (
                  <tr key={row.id} className="bv-row-hover">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-secondary/10 text-secondary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">{row.icon}</span>
                        </div>
                        <span className="font-semibold text-body-md">{row.title}</span>
                      </div>
                    </td>
                    <td className="py-4 text-body-sm">{row.module}</td>
                    <td className="py-4 text-body-sm text-on-surface-variant">{row.time}</td>
                    <td className="py-4 text-right">
                      <span className={cn('font-bold text-label-sm', row.status === 'COMPLETED' ? 'text-secondary' : 'text-on-surface-variant')}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="lg:col-span-12 flex flex-col md:flex-row items-center justify-between gap-4 pt-2 border-t border-outline-variant">
          <p className="text-body-sm text-on-surface-variant">Last login: {draft.lastLoginAt} from {draft.lastLoginIp}</p>
          <div className="flex gap-3">
            <Link to="/profile/sessions">
              <Button variant="outline" size="sm" className="border-error text-error hover:bg-error/10">Logout from All Devices</Button>
            </Link>
            {isEditing && (
              <Button variant="primary" size="sm" isLoading={updateMut.isPending} onClick={() => void save()}>Save Changes</Button>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-label-md text-on-surface-variant mb-0.5">{label}</p>
      <p className="text-body-md font-semibold text-on-background">{value}</p>
    </div>
  )
}

function EditableInfo({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange: (v: string) => void }) {
  if (!editing) return <Info label={label} value={value} />
  return (
    <div>
      <p className="text-label-md text-on-surface-variant mb-0.5">{label}</p>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30" />
    </div>
  )
}

function ToggleRow({ title, description, checked, onChange, disabled }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-bold text-body-md">{title}</p>
        <p className="text-body-sm text-on-surface-variant">{description}</p>
      </div>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => !disabled && onChange(!checked)} className={cn('relative w-11 h-6 rounded-full transition-colors shrink-0', checked ? 'bg-secondary' : 'bg-outline-variant', disabled && 'opacity-60 cursor-default')}>
        <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </button>
    </div>
  )
}
