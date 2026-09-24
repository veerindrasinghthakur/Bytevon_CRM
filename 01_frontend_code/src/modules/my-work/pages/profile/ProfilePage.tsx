import { useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { Select } from '@/shared/components/ui/Select'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemePreference } from '@/shared/lib/theme'
import { looseSearch, safeNavigate, looseParams } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'
import {
  useMyActivity,
  useMyProfile,
  useMySessions,
  useUpdatePreferences,
  useUpdateProfile,
  useUploadAvatar,
} from '../../hooks/use-profile'
import {
  PROFILE_LANG_OPTIONS,
  APPEARANCE_OPTIONS,
  profileEditFormSchema,
  emptyProfileForm,
  profileToFormValues,
  toProfileUpdateInput,
  type ProfileEditFormInput,
} from '../../types'
import { profileRoutes } from '../../routes'

export function ProfilePage() {
  const navigate = useNavigate()
  const { data: profile, isLoading, isError, refetch } = useMyProfile()
  const { data: sessions = [] } = useMySessions()
  const { data: activity = [] } = useMyActivity()
  const updateMut = useUpdateProfile()
  const prefsMut = useUpdatePreferences()
  const avatarMut = useUploadAvatar()
  const { isEditing, startEditing, cancelEditing, finishEditing } = useEditMode(false)
  const { preference, setPreference } = useTheme()
  const fileRef = useRef<HTMLInputElement>(null)

  const form = useForm<ProfileEditFormInput>({
    resolver: zodResolver(profileEditFormSchema),
    defaultValues: emptyProfileForm(),
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = form

  useEffect(() => {
    if (profile && !isEditing) {
      reset(profileToFormValues(profile))
    }
  }, [profile, isEditing, reset])

  const startEdit = () => {
    if (profile) reset(profileToFormValues(profile))
    startEditing()
  }

  const cancel = () => {
    if (profile) reset(profileToFormValues(profile))
    cancelEditing()
  }

  const onSave = handleSubmit(async (values) => {
    try {
      const payload = toProfileUpdateInput(values)
      // Person fields → PATCH /profile/me; settings → PATCH /profile/preferences.
      await updateMut.mutateAsync({
        name: payload.name,
        phone: payload.phone,
        dateOfBirth: payload.dateOfBirth,
      })
      await prefsMut.mutateAsync({
        location: values.location?.trim() || null,
        timezone: values.timezone?.trim() || null,
        language: values.preferences.language,
        appearance: values.preferences.appearance,
        emailNotifications: values.preferences.emailNotifications,
        desktopPush: values.preferences.desktopPush,
      })
      setPreference(values.preferences.appearance)
      finishEditing()
    } catch {
      /* mutation error surfaced by react-query */
    }
  })

  const onAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    avatarMut.mutate(file)
    e.target.value = ''
  }

  const tenure = useMemo(() => {
    const joining = profile?.joiningDate
    if (!joining) return '—'
    const start = new Date(joining)
    if (Number.isNaN(start.getTime())) return joining
    const now = new Date()
    let months =
      (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
    if (now.getDate() < start.getDate()) months -= 1
    if (months < 0) return '—'
    const years = Math.floor(months / 12)
    const rem = months % 12
    if (years === 0) return `${rem} mo`
    return rem === 0 ? `${years} yr` : `${years} yr ${rem} mo`
  }, [profile?.joiningDate])

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
  if (isLoading || !profile) return <PageLoadingSkeleton />

  const displayName = isEditing ? watch('name') : profile.name
  const initials =
    (displayName || profile.name)
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

  const activeSessions = sessions.filter((s) => s.status === 'ACTIVE')
  const recentActivity = activity.slice(0, 5)

  const formatTime = (iso: string): string => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    const pad = (n: number): string => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const prefs = watch('preferences')
  // Backend profile may omit preferences until normalizeProfile runs; never read bare.
  const savedPrefs = profile.preferences ?? {
    emailNotifications: true,
    desktopPush: true,
    language: 'en',
    appearance: 'system' as const,
  }
  const appearanceValue = isEditing ? prefs?.appearance ?? preference : preference

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
                onClick={() => void onSave()}
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
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
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
              <h2 className="text-headline-md font-semibold text-on-background">{displayName}</h2>
              <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-label-sm font-bold inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                Active Now
              </span>
            </div>
            <p className="text-title-lg text-on-surface-variant mb-3">
              {profile.role} · Bytevon Corporate
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5 text-label-md">
                <span className="material-symbols-outlined text-[20px]">mail</span>
                {profile.email}
              </span>
              <span className="inline-flex items-center gap-1.5 text-label-md">
                <span className="material-symbols-outlined text-[20px]">badge</span>
                {profile.employeeCode || `Emp ${profile.employmentId}`}
              </span>
            </div>
          </div>
        </section>

        <section className="lg:col-span-4 bg-primary text-on-primary p-6 rounded-xl shadow-md flex flex-col justify-between">
          <div>
            <p className="text-label-md uppercase tracking-widest opacity-70 mb-3">Account Health</p>
            <h3 className="text-headline-md font-bold mb-4">V1 Secure</h3>
            <div className="w-full bg-on-primary/20 h-2 rounded-full mb-4">
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
            <EditableInfo
              label="Full Name"
              value={profile.name}
              editing={isEditing}
              error={errors.name?.message}
              registerProps={register('name')}
            />
            <Info label="Email Address" value={profile.email} />
            <EditableInfo
              label="Phone Number"
              value={profile.phone}
              editing={isEditing}
              registerProps={register('phone')}
            />
            <EditableInfo
              label="Location"
              value={profile.location}
              editing={isEditing}
              registerProps={register('location')}
            />
            <EditableInfo
              label="Date of Birth"
              value={profile.dateOfBirth}
              editing={isEditing}
              registerProps={register('dateOfBirth')}
            />
            <EditableInfo
              label="Timezone"
              value={profile.timezone}
              editing={isEditing}
              registerProps={register('timezone')}
            />
          </div>
        </section>

        <section className="lg:col-span-6 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
          <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-secondary">badge</span>
            Employment Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <Info label="Employee Code" value={profile.employeeCode} />
            <Info label="Org mail" value={profile.orgMail} />
            <Info label="Department" value={profile.department} />
            <Info label="Job Title" value={profile.jobTitle} />
            <Info label="Reporting Manager" value={profile.reportingManager} />
            <Info label="Joining Date" value={profile.joiningDate} />
            <Info label="Tenure" value={tenure} />
            <Info label="Work Type" value={profile.workType} />
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
              onClick={() => safeNavigate(navigate, { to: profileRoutes.changePassword })}
            >
              Change Password
            </Button>
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-outline-variant rounded-lg text-on-surface-variant opacity-75">
              <span className="material-symbols-outlined text-[18px]">phonelink_lock</span>
              <span className="text-label-md font-semibold">MFA — Not available</span>
            </div>
          </div>
          <h4 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-3">
            Active Sessions ({activeSessions.length})
          </h4>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {activeSessions.map((s) => (
              <div
                key={s.id}
                className={
                  s.current
                    ? 'flex items-center justify-between p-4 bg-surface-container rounded-lg'
                    : 'flex items-center justify-between p-4 border border-outline-variant rounded-lg'
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="material-symbols-outlined text-on-surface-variant text-[28px]">
                    {String(s.device_type).toUpperCase().includes('MOBILE') ? 'smartphone' : 'laptop_mac'}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-body-md truncate">
                      {s.device_name}
                      {s.current ? ' — Current Session' : ''}
                    </p>
                    <p className="text-body-sm text-on-surface-variant truncate">
                      {s.ip_address}
                      {s.last_used_at ? ` · Last used ${formatTime(s.last_used_at)}` : ''}
                    </p>
                  </div>
                </div>
                {s.current ? (
                  <span className="text-secondary font-bold text-label-sm px-2 py-1 bg-secondary/10 rounded shrink-0">
                    CURRENT
                  </span>
                ) : (
                  <Link
                    to={profileRoutes.sessions}
                    search={looseSearch()}
                    params={looseParams()}
                    className="text-error font-bold text-label-sm hover:underline shrink-0"
                  >
                    Manage
                  </Link>
                )}
              </div>
            ))}
            {activeSessions.length === 0 && (
              <p className="text-body-sm text-on-surface-variant">No active sessions.</p>
            )}
          </div>
          <div className="mt-4">
            <Link
              to={profileRoutes.sessions}
              search={looseSearch()}
              params={looseParams()}
              className="text-secondary text-label-md font-semibold hover:underline inline-flex items-center gap-1"
            >
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
            <ToggleRow
              title="Email Notifications"
              description="Weekly summaries and direct messages"
              checked={isEditing ? !!prefs?.emailNotifications : !!savedPrefs.emailNotifications}
              disabled={!isEditing}
              onChange={(v) => setValue('preferences.emailNotifications', v)}
            />
            <ToggleRow
              title="Desktop Push"
              description="Real-time alerts for urgent tasks"
              checked={isEditing ? !!prefs?.desktopPush : !!savedPrefs.desktopPush}
              disabled={!isEditing}
              onChange={(v) => setValue('preferences.desktopPush', v)}
            />
            <div className="pt-4 border-t border-outline-variant">
              <label className="text-label-md text-on-surface-variant block mb-2 uppercase tracking-wider">
                Interface Language
              </label>
              <Select
                value={isEditing ? prefs?.language ?? 'en' : savedPrefs.language}
                onChange={(v) => setValue('preferences.language', v)}
                options={[...PROFILE_LANG_OPTIONS]}
                disabled={!isEditing}
                minWidthClass="w-full"
              />
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant block mb-2 uppercase tracking-wider">
                Appearance
              </label>
              <div className="grid grid-cols-3 gap-2">
                {APPEARANCE_OPTIONS.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    disabled={!isEditing}
                    onClick={() => {
                      setValue('preferences.appearance', mode)
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
                    <th
                      key={h}
                      className={cn(
                        'pb-3 text-label-md text-on-surface-variant uppercase tracking-wider',
                        h === 'Status' && 'text-right',
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {recentActivity.map((row) => (
                  <tr key={row.id} className="bv-row-hover">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-secondary/10 text-secondary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">{row.icon}</span>
                        </div>
                        <span className="font-medium text-body-md">{row.title}</span>
                      </div>
                    </td>
                    <td className="py-4 text-body-sm text-on-surface-variant">{row.module}</td>
                    <td className="py-4 text-body-sm text-on-surface-variant">{formatTime(row.time)}</td>
                    <td className="py-4 text-right">
                      <span className="text-label-sm font-semibold text-secondary">{row.status}</span>
                    </td>
                  </tr>
                ))}
                {recentActivity.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-on-surface-variant text-body-sm">
                      No recent activity
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
      <p className="text-body-md font-medium text-on-background">{value || '—'}</p>
    </div>
  )
}

function EditableInfo({
  label,
  value,
  editing,
  error,
  registerProps,
}: {
  label: string
  value?: string | null
  editing: boolean
  error?: string
  registerProps: ReturnType<ReturnType<typeof useForm<ProfileEditFormInput>>['register']>
}) {
  if (!editing) return <Info label={label} value={value} />
  return (
    <div>
      <label className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1 block">
        {label}
      </label>
      <input
        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-background focus:outline-none focus:ring-2 focus:ring-secondary/40"
        defaultValue={value ?? ''}
        {...registerProps}
      />
      {error && <p className="text-label-sm text-error mt-1">{error}</p>}
    </div>
  )
}

function ToggleRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-body-md font-semibold text-on-background">{title}</p>
        <p className="text-body-sm text-on-surface-variant">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-secondary' : 'bg-outline-variant'
        } ${disabled ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
