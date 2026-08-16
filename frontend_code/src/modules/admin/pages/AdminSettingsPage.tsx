import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

const SECTIONS = [
  { id: 'organization', label: 'Organization Profile', icon: 'corporate_fare' },
  { id: 'head-office', label: 'Head Office', icon: 'location_city' },
  { id: 'locations', label: 'Office Locations', icon: 'apartment' },
  { id: 'branding', label: 'Branding', icon: 'palette' },
  { id: 'regional', label: 'Regional Config', icon: 'language' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

const OFFICES = [
  {
    id: 'ny',
    name: 'New York HQ',
    country: 'USA',
    city: 'New York',
    timezone: 'EST',
    currency: 'USD',
    fiscal: 'Jan-Dec',
    address: '123 Enterprise Way, Suite 500',
    postal: '10001',
    isPrimary: true,
    status: 'Active',
  },
  {
    id: 'ldn',
    name: 'London Office',
    country: 'UK',
    city: 'London',
    timezone: 'GMT',
    currency: 'GBP',
    fiscal: 'Apr-Mar',
    address: '10 Canary Wharf',
    postal: 'E14 5AB',
    isPrimary: false,
    status: 'Active',
  },
  {
    id: 'blr',
    name: 'Bangalore Hub',
    country: 'India',
    city: 'Bengaluru',
    timezone: 'IST',
    currency: 'INR',
    fiscal: 'Apr-Mar',
    address: 'Manyata Tech Park',
    postal: '560045',
    isPrimary: false,
    status: 'Active',
  },
]

export function AdminSettingsPage() {
  const [active, setActive] = useState<SectionId>('organization')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration Settings"
        description="Unified configuration for your enterprise identity and regional policies."
      />

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
      </div>
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

function Field({
  label,
  value,
  type = 'text',
  readOnly = false,
  onChange,
}: {
  label: string
  value?: string
  type?: string
  readOnly?: boolean
  onChange?: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-on-surface-variant uppercase">{label}</label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          'w-full border border-outline-variant rounded px-3 py-2 text-sm outline-none transition-all',
          readOnly
            ? 'bg-surface-container-low text-on-surface cursor-default'
            : 'bg-white focus:border-secondary focus:ring-1 focus:ring-secondary/30'
        )}
      />
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
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: 'Bytevon Global Holdings',
    legal: 'Bytevon Global Holdings Inc.',
    email: 'admin@bytevon.com',
    phone: '+1 (555) 012-3456',
    website: 'https://bytevon.com',
    tax: 'TX-9928341',
    reg: 'BRN-001293',
    description: 'Leading enterprise solutions provider for global workforce management.',
  })
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <SettingsCard
      title="Organization Information"
      description="Manage the primary organization information."
      action={
        editing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setEditing(false)}>
              Save Changes
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">edit</span>}
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        )
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
        <div className="space-y-4">
          <label className="block font-label-md text-on-surface-variant">Organization Logo</label>
          <div className="relative w-32 h-32 border border-outline-variant rounded-lg overflow-hidden bg-surface-container-low flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-outline">image</span>
          </div>
          {editing && (
            <button type="button" className="text-xs font-medium text-secondary hover:underline">
              Upload Logo
            </button>
          )}
        </div>
        <div className="md:col-span-2 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Field label="Organization Name" value={form.name} readOnly={!editing} onChange={(v) => set('name', v)} />
          <Field label="Legal Name" value={form.legal} readOnly={!editing} onChange={(v) => set('legal', v)} />
          <Field label="Organization Email" value={form.email} type="email" readOnly={!editing} onChange={(v) => set('email', v)} />
          <Field label="Primary Contact Number" value={form.phone} type="tel" readOnly={!editing} onChange={(v) => set('phone', v)} />
          <Field label="Website" value={form.website} type="url" readOnly={!editing} onChange={(v) => set('website', v)} />
          <Field label="Tax Identification Number" value={form.tax} readOnly={!editing} onChange={(v) => set('tax', v)} />
          <Field label="Business Registration Number" value={form.reg} readOnly={!editing} onChange={(v) => set('reg', v)} />
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Organization Description</label>
            <textarea
              readOnly={!editing}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className={cn(
                'w-full border border-outline-variant rounded px-3 py-2 text-sm h-20 outline-none',
                editing
                  ? 'bg-white focus:border-secondary focus:ring-1 focus:ring-secondary/30'
                  : 'bg-surface-container-low cursor-default'
              )}
            />
          </div>
        </div>
      </div>
    </SettingsCard>
  )
}

function HeadOfficeSection() {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [headId, setHeadId] = useState('ny')
  const head = OFFICES.find((o) => o.id === headId) ?? OFFICES[0]

  return (
    <>
      <SettingsCard
        title="Head Office"
        description="Configure the organization's default headquarters."
        action={
          <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
            Change Head Office
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
          <Readonly label="Head Office Name" value={head.name} />
          <Readonly label="Country" value={head.country} />
          <Readonly label="City" value={head.city} />
          <Readonly label="Timezone" value={head.timezone} />
          <div className="md:col-span-2">
            <Readonly label="Address" value={head.address} />
          </div>
          <Readonly label="Postal Code" value={head.postal} />
          <Readonly label="Currency" value={head.currency} />
          <Readonly label="Fiscal Year" value={head.fiscal} />
        </div>
        <p className="mt-6 text-[11px] text-on-surface-variant italic">
          The Head Office references one of the existing office locations.
        </p>
      </SettingsCard>

      {pickerOpen && (
        <>
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-40" onClick={() => setPickerOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
                <h3 className="text-title-lg font-semibold text-on-background">Select Head Office</h3>
                <button type="button" className="p-1 rounded-lg hover:bg-surface-container" onClick={() => setPickerOpen(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                {OFFICES.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setHeadId(o.id)
                      setPickerOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-lg border transition-all',
                      o.id === headId
                        ? 'border-secondary bg-secondary/10 ring-1 ring-secondary/30'
                        : 'border-outline-variant hover:bg-surface-container-low'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-label-md font-semibold text-on-background">{o.name}</p>
                        <p className="text-body-sm text-on-surface-variant">
                          {o.city}, {o.country} · {o.timezone}
                        </p>
                      </div>
                      {o.id === headId && (
                        <span className="material-symbols-outlined text-secondary">check_circle</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

function LocationsSection() {
  const navigate = useNavigate()

  return (
    <SettingsCard
      title="Office Locations"
      description="Manage all company offices and branches."
      action={
        <Button variant="primary" size="sm" onClick={() => navigate({ to: '/admin/settings/offices/new' })}>
          + Add Office
        </Button>
      }
    >
      <div className="overflow-x-auto border border-outline-variant rounded-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold uppercase text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Office Name</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Timezone</th>
              <th className="px-4 py-3">Currency</th>
              <th className="px-4 py-3">Head Office</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {OFFICES.map((o) => (
              <tr key={o.id} className="hover:bg-surface-container-low/40 transition-colors">
                <td className="px-4 py-3 font-medium">{o.name}</td>
                <td className="px-4 py-3">{o.country}</td>
                <td className="px-4 py-3">{o.city}</td>
                <td className="px-4 py-3">{o.timezone}</td>
                <td className="px-4 py-3">{o.currency}</td>
                <td className="px-4 py-3">
                  {o.isPrimary ? (
                    <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full">Primary</span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-600 text-[10px] font-bold rounded-full">
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    type="button"
                    className="material-symbols-outlined text-sm text-outline hover:text-secondary"
                    onClick={() =>
                      navigate({ to: '/admin/settings/offices/$officeId/edit', params: { officeId: o.id } })
                    }
                  >
                    edit
                  </button>
                </td>
              </tr>
            ))}
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
