import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

export function OrganizationProfileSection() {
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
                  : 'bg-surface-container-low cursor-default',
              )}
            />
          </div>
        </div>
      </div>
    </SettingsCard>
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
            : 'bg-white focus:border-secondary focus:ring-1 focus:ring-secondary/30',
        )}
      />
    </div>
  )
}
