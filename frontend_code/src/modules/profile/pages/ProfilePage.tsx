import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { useAuth } from '@/modules/auth'
import { cn } from '@/shared/lib/cn'

const ACTIVITY = [
  {
    id: 1,
    title: 'Updated onboarding workflow for Engineering Dept',
    module: 'ERP / Workflows',
    time: 'Today, 10:45 AM',
    status: 'COMPLETED',
    icon: 'edit_note',
  },
  {
    id: 2,
    title: 'Approved 4 new employee records',
    module: 'HR Management',
    time: 'Yesterday, 4:20 PM',
    status: 'COMPLETED',
    icon: 'person_add',
  },
  {
    id: 3,
    title: 'Password rotation triggered',
    module: 'Security',
    time: 'Oct 24, 2023, 9:15 AM',
    status: 'AUTOMATED',
    icon: 'key',
  },
  {
    id: 4,
    title: 'Exported Q3 Payroll Report',
    module: 'Finance / Reports',
    time: 'Oct 22, 2023, 2:50 PM',
    status: 'COMPLETED',
    icon: 'file_download',
  },
]

export function ProfilePage() {
  const { user } = useAuth()
  const name = user?.name ?? 'Alex Harrison'
  const email = user?.email ?? 'alex.harrison@bytevon.com'
  const role = user?.role ?? 'Administrator'
  const employmentId = user?.employmentId ?? '—'
  const initials =
    name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

  const [emailNotif, setEmailNotif] = useState(true)
  const [desktopPush, setDesktopPush] = useState(true)
  const [appearance, setAppearance] = useState<'light' | 'dark' | 'system'>('light')
  const [language, setLanguage] = useState('en')

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Profile" description="Account details, employment, security, and preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Header card */}
        <section className="lg:col-span-8 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col md:flex-row items-center gap-6 card-hover">
          <div className="relative shrink-0">
            <div className="w-28 h-28 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-3xl font-bold border-4 border-surface-container">
              {initials}
            </div>
            <button
              type="button"
              className="absolute bottom-1 right-1 bg-secondary text-on-secondary p-2 rounded-full shadow-lg hover:scale-105 transition-transform"
              aria-label="Edit photo"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
          </div>
          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2 flex-wrap">
              <h2 className="text-headline-md font-semibold text-on-background">{name}</h2>
              <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-label-sm font-bold inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                Active Now
              </span>
            </div>
            <p className="text-title-lg text-on-surface-variant mb-3">{role} · Bytevon Corporate</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5 text-label-md">
                <span className="material-symbols-outlined text-[20px]">mail</span>
                {email}
              </span>
              <span className="inline-flex items-center gap-1.5 text-label-md">
                <span className="material-symbols-outlined text-[20px]">badge</span>
                Emp {employmentId}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Button variant="primary" size="sm">
              Edit Profile
            </Button>
            <Button variant="outline" size="sm">
              View Public Page
            </Button>
          </div>
        </section>

        {/* Account health — MFA unavailable in V1 */}
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

        {/* Personal */}
        <section className="lg:col-span-6 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
          <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-secondary">person</span>
            Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <Info label="Full Name" value={name} />
            <Info label="Email Address" value={email} />
            <Info label="Phone Number" value="+1 (555) 012-3456" />
            <Info label="Location" value="San Francisco, CA" />
            <Info label="Date of Birth" value="May 12, 1985" />
            <Info label="Timezone" value="Pacific Time (PT)" />
          </div>
        </section>

        {/* Employment */}
        <section className="lg:col-span-6 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
          <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-secondary">badge</span>
            Employment Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <Info label="Org mail" value={email} />
            <Info label="Department" value="HR Operations" />
            <Info label="Job Title" value={role} />
            <Info label="Reporting Manager" value="Sarah Jenkins (VP Ops)" />
            <Info label="Joining Date" value="January 15, 2018" />
            <Info label="Work Type" value="Hybrid (HQ / Remote)" />
          </div>
        </section>

        {/* Security */}
        <section className="lg:col-span-7 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
          <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-secondary">security</span>
            Security &amp; Authentication
          </h3>
          <div className="flex flex-wrap gap-3 mb-6">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">lock_reset</span>}
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
            <div className="flex items-center justify-between p-4 bg-surface-container rounded-lg">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-[28px]">laptop_mac</span>
                <div>
                  <p className="font-semibold text-body-md">MacBook Pro 16&quot; — Current Session</p>
                  <p className="text-body-sm text-on-surface-variant">San Francisco, CA · Chrome</p>
                </div>
              </div>
              <span className="text-secondary font-bold text-label-sm px-2 py-1 bg-secondary/10 rounded">CURRENT</span>
            </div>
            <div className="flex items-center justify-between p-4 border border-outline-variant rounded-lg">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-[28px]">smartphone</span>
                <div>
                  <p className="font-semibold text-body-md">iPhone 15 Pro</p>
                  <p className="text-body-sm text-on-surface-variant">San Francisco, CA · Mobile App</p>
                </div>
              </div>
              <Link to="/profile/sessions" className="text-error font-bold text-label-sm hover:underline">
                Manage
              </Link>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/profile/sessions"
              className="text-secondary text-label-md font-semibold hover:underline inline-flex items-center gap-1"
            >
              View all sessions
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </Link>
          </div>
        </section>

        {/* Preferences */}
        <section className="lg:col-span-5 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
          <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-secondary">tune</span>
            Preferences &amp; Notifications
          </h3>
          <div className="space-y-5">
            <ToggleRow
              title="Email Notifications"
              description="Weekly summaries and direct messages"
              checked={emailNotif}
              onChange={setEmailNotif}
            />
            <ToggleRow
              title="Desktop Push"
              description="Real-time alerts for urgent tasks"
              checked={desktopPush}
              onChange={setDesktopPush}
            />
            <div className="pt-4 border-t border-outline-variant">
              <label className="text-label-md text-on-surface-variant block mb-2 uppercase tracking-wider">
                Interface Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-body-sm outline-none focus:border-secondary"
              >
                <option value="en">English (US)</option>
                <option value="de">German (DE)</option>
                <option value="fr">French (FR)</option>
                <option value="es">Spanish (ES)</option>
              </select>
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant block mb-2 uppercase tracking-wider">
                Appearance
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'dark', 'system'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAppearance(mode)}
                    className={cn(
                      'p-2 rounded-lg text-label-sm font-bold capitalize border transition-colors',
                      appearance === mode
                        ? 'border-2 border-secondary bg-surface-container-lowest text-secondary'
                        : 'border-outline-variant bg-surface-container text-on-surface-variant',
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Activity */}
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
                {ACTIVITY.map((row) => (
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
                      <span
                        className={cn(
                          'font-bold text-label-sm',
                          row.status === 'COMPLETED' ? 'text-secondary' : 'text-on-surface-variant',
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="w-full mt-5 py-3 border border-outline-variant text-secondary font-bold hover:bg-surface-container transition-colors rounded-lg text-label-md"
          >
            View All Activity
          </button>
        </section>

        {/* Footer */}
        <section className="lg:col-span-12 flex flex-col md:flex-row items-center justify-between gap-4 pt-2 border-t border-outline-variant">
          <p className="text-body-sm text-on-surface-variant">Last login: 10:45 AM from 192.168.1.1</p>
          <div className="flex gap-3">
            <Link to="/profile/sessions">
              <Button variant="outline" size="sm" className="border-error text-error hover:bg-error/10">
                Logout from All Devices
              </Button>
            </Link>
            <Button variant="primary" size="sm">
              Save Changes
            </Button>
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

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-bold text-body-md">{title}</p>
        <p className="text-body-sm text-on-surface-variant">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors shrink-0',
          checked ? 'bg-secondary' : 'bg-outline-variant',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  )
}
