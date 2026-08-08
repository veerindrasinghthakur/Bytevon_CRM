import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'

/** Profile — layout aligned to 10_notifications_profile/user_profile_bytevon.html */
export function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Account settings, security, and preferences."
        showBack
        backTo="/dashboard"
        backLabel="Back"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile header card */}
        <section className="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="relative shrink-0">
            <div className="w-28 h-28 rounded-full bg-surface-container-high border-4 border-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-5xl">person</span>
            </div>
            <button
              type="button"
              className="absolute bottom-1 right-1 bg-secondary text-white p-2 rounded-full shadow-lg"
              aria-label="Edit photo"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
          </div>
          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <h3 className="text-headline-lg text-on-background">Marcus S.</h3>
              <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-label-sm font-bold flex items-center gap-1">
                <span className="w-2 h-2 bg-secondary rounded-full" />
                Active Now
              </span>
            </div>
            <p className="text-title-lg text-on-surface-variant mb-4">Administrator · Bytevon Corporate</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">location_on</span>
                <span className="text-label-md">San Francisco, CA</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">mail</span>
                <span className="text-label-md">marcus@bytevon.example</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Button variant="primary" size="sm">Edit Profile</Button>
            <Button variant="outline" size="sm">View Public Page</Button>
          </div>
        </section>

        {/* Account health */}
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

        {/* Personal information */}
        <section className="lg:col-span-6 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 shadow-sm">
          <h4 className="text-title-lg text-on-background flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary">person</span>
            Personal Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            <Field label="Full Name" value="Marcus S." />
            <Field label="Email Address" value="marcus@bytevon.example" />
            <Field label="Phone Number" value="+1 (555) 012-3456" />
            <Field label="Location" value="San Francisco, CA" />
            <Field label="Timezone" value="Pacific Time (PT)" />
            <Field label="Language" value="English (US)" />
          </div>
        </section>

        {/* Employment */}
        <section className="lg:col-span-6 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 shadow-sm">
          <h4 className="text-title-lg text-on-background flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary">badge</span>
            Employment Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            <Field label="Role" value="Administrator" />
            <Field label="Department" value="Operations" />
            <Field label="Job Title" value="System Administrator" />
            <Field label="Reporting Manager" value="—" />
            <Field label="Joining Date" value="January 15, 2020" />
            <Field label="Work Type" value="Hybrid" />
          </div>
        </section>

        {/* Security */}
        <section className="lg:col-span-7 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 shadow-sm">
          <h4 className="text-title-lg text-on-background flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary">security</span>
            Security &amp; Authentication
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

        {/* Preferences */}
        <section className="lg:col-span-5 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 shadow-sm">
          <h4 className="text-title-lg text-on-background flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary">tune</span>
            Preferences &amp; Notifications
          </h4>
          <div className="space-y-6">
            <PrefRow
              title="Email Notifications"
              description="Weekly summaries and direct messages"
              defaultOn
            />
            <PrefRow
              title="In-app Notifications"
              description="Alerts for approvals and assignments"
              defaultOn
            />
            <div className="pt-4 border-t border-outline-variant/30">
              <label className="text-label-md text-on-surface-variant block mb-3 uppercase tracking-wider">
                Interface Language
              </label>
              <select className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-on-background focus:outline-none focus:border-electric-blue">
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

        {/* Footer actions */}
        <section className="lg:col-span-12 flex flex-col md:flex-row items-center justify-between p-6 border-t border-outline-variant">
          <p className="text-body-sm text-on-surface-variant mb-4 md:mb-0">
            Last login: today · Full profile API will connect later.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" size="sm">
              Logout from All Devices
            </Button>
            <Button variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-label-md text-on-surface-variant block mb-1">{label}</p>
      <p className="text-body-md text-on-background font-semibold">{value}</p>
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
