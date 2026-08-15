import { useState } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

const SECTIONS = [
  { id: 'organization', label: 'Organization Profile', icon: 'info' },
  { id: 'head-office', label: 'Head Office', icon: 'location_city' },
  { id: 'locations', label: 'Office Locations', icon: 'apartment' },
  { id: 'branding', label: 'Branding', icon: 'palette' },
  { id: 'regional', label: 'Regional Config', icon: 'language' },
  { id: 'attendance', label: 'Attendance Management', icon: 'calendar_today' },
  { id: 'leave', label: 'Leave Management', icon: 'event_busy' },
] as const

export function AdminSettingsPage() {
  const [active, setActive] = useState<(typeof SECTIONS)[number]['id']>('organization')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Settings"
        description="Unified configuration for identity, offices, branding, and workforce policies."
        actions={
          <Button variant="primary" size="sm">
            Save Changes
          </Button>
        }
      />

      <div className="flex flex-col xl:flex-row gap-6 min-h-0">
        <nav className="xl:w-64 shrink-0 bg-surface-container-lowest border border-outline-variant rounded-xl p-3 space-y-1">
          <p className="px-3 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            Section Overview
          </p>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-sm text-left border-l-4',
                active === s.id
                  ? 'bg-secondary/5 text-secondary font-semibold border-secondary'
                  : 'text-on-surface-variant font-medium border-transparent hover:bg-surface-container-low'
              )}
            >
              <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 space-y-6 min-w-0">
          {active === 'organization' && (
            <SettingsCard
              title="Organization Information"
              description="Primary organization identity and registration details."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Organization Name" defaultValue="Bytevon Global Holdings" />
                <Field label="Legal Name" defaultValue="Bytevon Global Holdings Inc." />
                <Field label="Organization Email" defaultValue="admin@bytevon.com" />
                <Field label="Primary Contact" defaultValue="+1 (555) 012-3456" />
                <Field label="Website" defaultValue="https://bytevon.com" />
                <Field label="Tax ID" defaultValue="TX-9928341" />
              </div>
            </SettingsCard>
          )}

          {active === 'head-office' && (
            <SettingsCard title="Head Office" description="Default headquarters reference.">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Readonly label="Name" value="New York HQ" />
                <Readonly label="Country" value="United States" />
                <Readonly label="City" value="New York City" />
                <Readonly label="Timezone" value="UTC-05:00 Eastern Time" />
                <Readonly label="Currency" value="USD ($)" />
                <Readonly label="Fiscal Year" value="Jan – Dec" />
              </div>
            </SettingsCard>
          )}

          {active === 'locations' && (
            <SettingsCard
              title="Office Locations"
              description="Manage company offices and branches."
              actionLabel="+ Add Office"
            >
              <div className="overflow-x-auto border border-outline-variant rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
                    <tr>
                      <th className="px-4 py-3">Office</th>
                      <th className="px-4 py-3">Country</th>
                      <th className="px-4 py-3">City</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-outline-variant">
                      <td className="px-4 py-3 font-medium">New York HQ</td>
                      <td className="px-4 py-3">USA</td>
                      <td className="px-4 py-3">New York</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-label-sm rounded-full">
                          Active
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </SettingsCard>
          )}

          {active === 'branding' && (
            <SettingsCard title="Branding" description="Organization colors and assets.">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Primary Color" defaultValue="#000613" />
                <Field label="Secondary Color" defaultValue="#0059bb" />
              </div>
            </SettingsCard>
          )}

          {active === 'regional' && (
            <SettingsCard title="Regional Config" description="Language, timezone, and formats.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField label="Default Language" value="English (US)" />
                <SelectField label="Default Timezone" value="UTC-05:00 Eastern Time" />
                <SelectField label="Default Currency" value="USD ($)" />
                <SelectField label="Date Format" value="MM/DD/YYYY" />
              </div>
            </SettingsCard>
          )}

          {active === 'attendance' && (
            <SettingsCard
              title="Attendance Management"
              description="Work shifts, tracking, and overtime policies."
              actionLabel="Manage Policies"
            >
              <div className="space-y-3">
                <ToggleRow label="Attendance Tracking" on />
                <ToggleRow label="Geolocation" />
                <ToggleRow label="Overtime" on />
              </div>
            </SettingsCard>
          )}

          {active === 'leave' && (
            <SettingsCard title="Leave Management" description="Leave types and global behavior.">
              <div className="space-y-3">
                <ToggleRow label="Allow Employees to Cancel Leave" on />
                <ToggleRow label="Allow Half-Day Leave" on />
                <ToggleRow label="Allow Multi-Day Leave" on />
                <ToggleRow label="Allow Leave During Probation" />
                <ToggleRow label="Enable Carry Forward" on />
                <ToggleRow label="Enable Negative Leave Balance" />
              </div>
            </SettingsCard>
          )}
        </div>
      </div>
    </div>
  )
}

function SettingsCard({
  title,
  description,
  actionLabel,
  children,
}: {
  title: string
  description: string
  actionLabel?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center gap-4">
        <div>
          <h3 className="text-title-lg font-semibold text-on-background">{title}</h3>
          <p className="text-body-sm text-on-surface-variant">{description}</p>
        </div>
        {actionLabel && (
          <Button variant="primary" size="sm">
            {actionLabel}
          </Button>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div className="space-y-1">
      <label className="text-label-sm font-bold text-on-surface-variant uppercase">{label}</label>
      <input
        defaultValue={defaultValue}
        className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-transparent outline-none focus:ring-2 focus:ring-secondary/30"
      />
    </div>
  )
}

function SelectField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <label className="text-label-sm font-bold text-on-surface-variant uppercase">{label}</label>
      <select className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-transparent outline-none">
        <option>{value}</option>
      </select>
    </div>
  )
}

function Readonly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-0.5">{label}</p>
      <p className="text-body-sm font-medium">{value}</p>
    </div>
  )
}

function ToggleRow({ label, on }: { label: string; on?: boolean }) {
  return (
    <div className="flex justify-between items-center p-3 bg-surface-container-low border border-outline-variant rounded-lg">
      <span className="text-body-sm font-medium">{label}</span>
      <div
        className={cn(
          'w-9 h-5 rounded-full relative',
          on ? 'bg-secondary' : 'bg-outline-variant'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 w-4 h-4 bg-white rounded-full',
            on ? 'right-0.5' : 'left-0.5'
          )}
        />
      </div>
    </div>
  )
}
