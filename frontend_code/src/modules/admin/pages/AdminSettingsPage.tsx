import { useState } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

const SECTIONS = [
  { id: 'organization', label: 'Organization Profile', icon: 'corporate_fare' },
  { id: 'head-office', label: 'Head Office', icon: 'location_city' },
  { id: 'locations', label: 'Office Locations', icon: 'apartment' },
  { id: 'branding', label: 'Branding', icon: 'palette' },
  { id: 'regional', label: 'Regional Config', icon: 'language' },
  { id: 'attendance', label: 'Attendance', icon: 'schedule' },
  { id: 'leave', label: 'Leave Management', icon: 'event_busy' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

export function AdminSettingsPage() {
  const [active, setActive] = useState<SectionId>('organization')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration Settings"
        description="Unified configuration for your enterprise identity, workforce tracking, and policy management."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Discard
            </Button>
            <Button variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        }
      />

      {/* Horizontal section tabs — same pattern as My Leave (Balance / History / Calendar) */}
      <div className="flex flex-wrap gap-2 border-b border-outline-variant pb-0">
        {SECTIONS.map((s) => {
          const isActive = active === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 text-label-md font-medium rounded-t-lg border-b-2 transition-all',
                isActive
                  ? 'border-secondary text-secondary bg-surface-container-high/60'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              )}
            >
              <span
                className="material-symbols-outlined text-lg"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {s.icon}
              </span>
              {s.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-6">
        {active === 'organization' && <OrganizationSection />}
        {active === 'head-office' && <HeadOfficeSection />}
        {active === 'locations' && <LocationsSection />}
        {active === 'branding' && <BrandingSection />}
        {active === 'regional' && <RegionalSection />}
        {active === 'attendance' && <AttendanceSection />}
        {active === 'leave' && <LeaveSection />}
      </div>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-on-surface">{value}</p>
    </div>
  )
}

function SettingsCard({
  title,
  description,
  action,
  children,
}: {
  title: string
  description: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <div className="px-6 py-5 border-b border-outline-variant flex flex-wrap justify-between items-start gap-4">
        <div>
          <h3 className="text-title-lg font-semibold text-on-surface">{title}</h3>
          <p className="text-body-sm text-on-surface-variant mt-0.5">{description}</p>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function Field({ label, defaultValue, type = 'text' }: { label: string; defaultValue?: string; type?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-on-surface-variant uppercase">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        className="w-full bg-white border border-outline-variant rounded px-3 py-2 text-sm outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all"
      />
    </div>
  )
}

function Toggle({ label, on = false }: { label: string; on?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-xs font-medium text-on-surface">{label}</span>
      <div
        className={cn(
          'w-8 h-4 rounded-full relative shrink-0 transition-colors',
          on ? 'bg-secondary' : 'bg-outline-variant'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all',
            on ? 'right-0.5' : 'left-0.5'
          )}
        />
      </div>
    </div>
  )
}

function Readonly({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-on-surface-variant uppercase">{label}</p>
      <p className="text-sm font-medium text-on-surface">{value}</p>
    </div>
  )
}

function SelectField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-on-surface-variant uppercase">{label}</label>
      <select className="w-full bg-white border border-outline-variant rounded px-3 py-2 text-sm outline-none focus:border-secondary">
        <option>{value}</option>
      </select>
    </div>
  )
}

function OrganizationSection() {
  return (
    <SettingsCard
      title="Organization Information"
      description="Manage the primary organization information."
      action={
        <Button variant="primary" size="sm">
          Save Changes
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
        <div className="space-y-4">
          <label className="block font-label-md text-on-surface-variant">Organization Logo</label>
          <div className="relative w-32 h-32 border border-outline-variant rounded-lg overflow-hidden bg-surface-container-low flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-outline">image</span>
          </div>
          <button type="button" className="text-xs font-medium text-secondary hover:underline">
            Upload Logo
          </button>
        </div>
        <div className="md:col-span-2 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Field label="Organization Name" defaultValue="Bytevon Global Holdings" />
          <Field label="Legal Name" defaultValue="Bytevon Global Holdings Inc." />
          <Field label="Organization Email" defaultValue="admin@bytevon.com" type="email" />
          <Field label="Primary Contact Number" defaultValue="+1 (555) 012-3456" type="tel" />
          <Field label="Website" defaultValue="https://bytevon.com" type="url" />
          <Field label="Tax Identification Number" defaultValue="TX-9928341" />
          <Field label="Business Registration Number" defaultValue="BRN-001293" />
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase">
              Organization Description
            </label>
            <textarea
              className="w-full bg-white border border-outline-variant rounded px-3 py-2 text-sm h-20 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30"
              defaultValue="Leading enterprise solutions provider for global workforce management."
            />
          </div>
        </div>
      </div>
    </SettingsCard>
  )
}

function HeadOfficeSection() {
  return (
    <SettingsCard
      title="Head Office"
      description="Configure the organization's default headquarters."
      action={
        <Button variant="outline" size="sm">
          Change Head Office
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        <Readonly label="Head Office Name" value="New York HQ" />
        <Readonly label="Country" value="United States" />
        <Readonly label="State" value="New York" />
        <Readonly label="City" value="New York City" />
        <div className="md:col-span-2">
          <Readonly label="Address" value="123 Enterprise Way, Suite 500" />
        </div>
        <Readonly label="Postal Code" value="10001" />
        <Readonly label="Timezone" value="UTC-05:00 Eastern Time" />
        <Readonly label="Currency" value="USD ($)" />
        <Readonly label="Fiscal Year" value="Jan - Dec" />
      </div>
      <p className="mt-6 text-[11px] text-on-surface-variant italic">
        The Head Office references one of the existing office locations.
      </p>
    </SettingsCard>
  )
}

function LocationsSection() {
  return (
    <SettingsCard
      title="Office Locations"
      description="Manage all company offices and branches."
      action={
        <Button variant="primary" size="sm">
          + Add Office
        </Button>
      }
    >
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="text-xs border border-outline-variant rounded px-3 py-1.5 bg-white w-full md:w-48 outline-none focus:border-secondary"
          placeholder="Search Office"
        />
        <select className="text-xs border border-outline-variant rounded px-3 py-1.5 bg-white">
          <option>Country</option>
        </select>
        <select className="text-xs border border-outline-variant rounded px-3 py-1.5 bg-white">
          <option>Timezone</option>
        </select>
        <select className="text-xs border border-outline-variant rounded px-3 py-1.5 bg-white">
          <option>Status</option>
        </select>
      </div>
      <div className="overflow-x-auto border border-outline-variant rounded-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold uppercase text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Office Name</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Timezone</th>
              <th className="px-4 py-3">Currency</th>
              <th className="px-4 py-3">Fiscal Year</th>
              <th className="px-4 py-3">Head Office</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            <tr className="hover:bg-surface-container-low/40 transition-colors">
              <td className="px-4 py-3 font-medium">New York HQ</td>
              <td className="px-4 py-3">USA</td>
              <td className="px-4 py-3">New York</td>
              <td className="px-4 py-3">EST</td>
              <td className="px-4 py-3">USD</td>
              <td className="px-4 py-3">Jan-Dec</td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full">
                  Primary
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 bg-green-500/10 text-green-600 text-[10px] font-bold rounded-full">
                  Active
                </span>
              </td>
              <td className="px-4 py-3 text-right space-x-2">
                <button type="button" className="material-symbols-outlined text-sm text-outline hover:text-secondary">
                  visibility
                </button>
                <button type="button" className="material-symbols-outlined text-sm text-outline hover:text-secondary">
                  edit
                </button>
                <button type="button" className="material-symbols-outlined text-sm text-outline hover:text-error">
                  archive
                </button>
              </td>
            </tr>
            <tr className="hover:bg-surface-container-low/40 transition-colors">
              <td className="px-4 py-3 font-medium">London Office</td>
              <td className="px-4 py-3">UK</td>
              <td className="px-4 py-3">London</td>
              <td className="px-4 py-3">GMT</td>
              <td className="px-4 py-3">GBP</td>
              <td className="px-4 py-3">Apr-Mar</td>
              <td className="px-4 py-3">—</td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 bg-green-500/10 text-green-600 text-[10px] font-bold rounded-full">
                  Active
                </span>
              </td>
              <td className="px-4 py-3 text-right space-x-2">
                <button type="button" className="material-symbols-outlined text-sm text-outline hover:text-secondary">
                  visibility
                </button>
                <button type="button" className="material-symbols-outlined text-sm text-outline hover:text-secondary">
                  edit
                </button>
                <button type="button" className="material-symbols-outlined text-sm text-outline hover:text-error">
                  archive
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </SettingsCard>
  )
}

function BrandingSection() {
  return (
    <SettingsCard title="Branding" description="Customize the organization's branding.">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Organization Logo</label>
            <button
              type="button"
              className="w-full py-2 border border-dashed border-outline-variant rounded-lg text-xs font-medium hover:border-secondary transition-all"
            >
              Upload Logo
            </button>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Favicon</label>
            <button
              type="button"
              className="w-full py-2 border border-dashed border-outline-variant rounded-lg text-xs font-medium hover:border-secondary transition-all"
            >
              Upload Icon
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Primary Color</label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary border border-outline-variant" />
              <input
                className="flex-1 text-xs border border-outline-variant rounded px-2 py-1.5 outline-none focus:border-secondary"
                defaultValue="#000613"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Secondary Color</label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-secondary border border-outline-variant" />
              <input
                className="flex-1 text-xs border border-outline-variant rounded px-2 py-1.5 outline-none focus:border-secondary"
                defaultValue="#0059bb"
              />
            </div>
          </div>
        </div>
      </div>
    </SettingsCard>
  )
}

function RegionalSection() {
  return (
    <SettingsCard title="Regional Config" description="Language, timezone, currency and formats.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField label="Default Language" value="English (US)" />
        <SelectField label="Default Timezone" value="UTC-05:00 Eastern Time" />
        <SelectField label="Default Currency" value="USD ($)" />
        <SelectField label="Date Format" value="MM/DD/YYYY" />
        <SelectField label="Number Format" value="1,234.56" />
        <SelectField label="First Day of Week" value="Sunday" />
      </div>
    </SettingsCard>
  )
}

function AttendanceSection() {
  return (
    <SettingsCard
      title="Attendance Management"
      description="Configure organization-wide attendance policies, working hours, and rules."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex justify-between items-end mb-3">
              <div>
                <h4 className="font-label-md text-on-surface">Work Shifts</h4>
                <p className="text-xs text-on-surface-variant">
                  Define standard working hours and break durations.
                </p>
              </div>
              <button type="button" className="text-secondary text-xs font-bold uppercase hover:underline">
                + Add Shift
              </button>
            </div>
            <div className="overflow-x-auto border border-outline-variant rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold uppercase text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3">Shift Name</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">End</th>
                    <th className="px-4 py-3">Break</th>
                    <th className="px-4 py-3">Grace</th>
                    <th className="px-4 py-3">Default</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-outline-variant/30">
                    <td className="px-4 py-3 font-medium">General Morning</td>
                    <td className="px-4 py-3">09:00</td>
                    <td className="px-4 py-3">18:00</td>
                    <td className="px-4 py-3">1h</td>
                    <td className="px-4 py-3">15m</td>
                    <td className="px-4 py-3">
                      <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-600 text-[10px] font-bold rounded-full">
                        Active
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="font-label-md text-on-surface">Quick Configuration</h4>
          <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg space-y-4">
            <Toggle label="Enable Attendance Tracking" on />
            <Toggle label="Enable Geolocation" />
            <Toggle label="Enable IP Validation" />
            <Toggle label="Enable Overtime" on />
            <Toggle label="Enable Corrections" on />
          </div>
          <h4 className="font-label-md text-on-surface">Correction Settings</h4>
          <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase">
                Correction Window (Days)
              </label>
              <input
                type="number"
                defaultValue={7}
                className="w-full bg-white border border-outline-variant rounded px-3 py-1.5 text-xs outline-none focus:border-secondary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase">
                Max Corrections/Month
              </label>
              <input
                type="number"
                defaultValue={3}
                className="w-full bg-white border border-outline-variant rounded px-3 py-1.5 text-xs outline-none focus:border-secondary"
              />
            </div>
            <Toggle label="Require Supporting Doc" on />
            <Toggle label="Require Manager Approval" on />
          </div>
        </div>
      </div>
    </SettingsCard>
  )
}

function LeaveSection() {
  return (
    <SettingsCard
      title="Leave Management"
      description="Configure leave policies, leave types, eligibility rules, and organization-wide leave settings."
      action={
        <Button
          variant="primary"
          size="sm"
          leftIcon={<span className="material-symbols-outlined text-sm">add</span>}
        >
          New Policy
        </Button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Kpi label="Policies" value="8" />
        <Kpi label="Leave Types" value="12" />
        <Kpi label="Departments" value="15" />
        <Kpi label="Employment Types" value="4" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h4 className="font-label-md text-on-surface">Leave Types</h4>
              <p className="text-xs text-on-surface-variant">
                Manage leave categories available across the organization.
              </p>
            </div>
            <button type="button" className="text-secondary text-xs font-bold uppercase hover:underline">
              + Add Type
            </button>
          </div>
          <div className="overflow-x-auto border border-outline-variant rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold uppercase text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3">Leave Type</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Paid/Unpaid</th>
                  <th className="px-4 py-3">Color</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {[
                  { name: 'Casual Leave', code: 'CL', paid: 'Paid', color: 'bg-blue-500' },
                  { name: 'Sick Leave', code: 'SL', paid: 'Paid', color: 'bg-red-500' },
                  { name: 'Earned Leave', code: 'EL', paid: 'Paid', color: 'bg-green-500' },
                ].map((row) => (
                  <tr key={row.code} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3">{row.code}</td>
                    <td className="px-4 py-3">{row.paid}</td>
                    <td className="px-4 py-3">
                      <div className={cn('w-3 h-3 rounded-full', row.color)} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-bold rounded-full">
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        className="material-symbols-outlined text-sm text-outline hover:text-secondary"
                      >
                        edit
                      </button>
                      <button
                        type="button"
                        className="material-symbols-outlined text-sm text-outline hover:text-error"
                      >
                        archive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="font-label-md text-on-surface">Quick Configuration</h4>
          <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg space-y-4">
            <Toggle label="Allow Cancel Leave" on />
            <Toggle label="Allow Half-Day" on />
            <Toggle label="Allow Multi-Day" on />
            <Toggle label="Leave During Probation" />
            <Toggle label="Enable Carry Forward" on />
            <Toggle label="Negative Balance" />
          </div>
        </div>
      </div>
      <div className="mt-8 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h4 className="font-label-md text-on-surface">Leave Policies</h4>
            <p className="text-xs text-on-surface-variant">
              Define organization leave policies and eligibility rules.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              className="text-xs border border-outline-variant rounded px-3 py-1.5 bg-white w-full md:w-48 outline-none focus:border-secondary"
              placeholder="Search policy..."
            />
            <select className="text-xs border border-outline-variant rounded px-3 py-1.5 bg-white">
              <option>All Types</option>
            </select>
            <select className="text-xs border border-outline-variant rounded px-3 py-1.5 bg-white">
              <option>All Depts</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto border border-outline-variant rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold uppercase text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Policy Name</th>
                <th className="px-4 py-3">Leave Type</th>
                <th className="px-4 py-3">Employment</th>
                <th className="px-4 py-3">Dept.</th>
                <th className="px-4 py-3">Quota</th>
                <th className="px-4 py-3">Carry Fwd</th>
                <th className="px-4 py-3">Approval</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-outline-variant/30 hover:bg-surface-container-low/40 transition-colors">
                <td className="px-4 py-3 font-medium">Standard Annual - Tech</td>
                <td className="px-4 py-3">Annual Leave</td>
                <td className="px-4 py-3">Full-time</td>
                <td className="px-4 py-3">Engineering</td>
                <td className="px-4 py-3">21 Days</td>
                <td className="px-4 py-3">Yes</td>
                <td className="px-4 py-3">Yes</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-bold rounded-full">
                    Active
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button type="button" className="material-symbols-outlined text-sm text-outline hover:text-secondary">
                    more_vert
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SettingsCard>
  )
}
