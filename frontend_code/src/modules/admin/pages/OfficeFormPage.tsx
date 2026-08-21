import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { getOffice } from '../api/offices'

export function OfficeFormPage() {
  const navigate = useNavigate()
  const { officeId } = useParams({ strict: false }) as { officeId?: string }
  const isEdit = Boolean(officeId && officeId !== 'new')

  const officeQuery = useQuery({
    queryKey: ['admin', 'offices', officeId],
    queryFn: () => getOffice(officeId as string),
    enabled: isEdit && Boolean(officeId),
  })

  const existing = officeQuery.data

  const [form, setForm] = useState({
    name: '',
    country: '',
    city: '',
    timezone: 'UTC-05:00 Eastern Time',
    currency: 'USD ($)',
    fiscal: 'Jan - Dec',
    address: '',
    postal: '',
  })

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        country: existing.country,
        city: existing.city,
        timezone: existing.timezone,
        currency: existing.currency,
        fiscal: existing.fiscal,
        address: existing.address,
        postal: existing.postal,
      })
    }
  }, [existing])

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))

  if (isEdit && officeQuery.isLoading) {
    return <div className="p-12 text-center text-on-surface-variant">Loading office…</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate({ to: '/admin/settings' })}
        className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors group"
      >
        <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>
        <span className="text-label-md font-medium">Back to Settings</span>
      </button>

      <PageHeader
        title={isEdit ? `Edit Office: ${existing?.name ?? officeId}` : 'Add Office'}
        description={
          isEdit
            ? 'Update office location details, timezone, and fiscal settings.'
            : 'Register a new company office or branch location.'
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate({ to: '/admin/settings' })}>
              Cancel
            </Button>
            <Button variant="primary" size="sm">
              {isEdit ? 'Save Changes' : 'Create Office'}
            </Button>
          </div>
        }
      />

      <div className="bv-surface p-6 space-y-5">
        <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">apartment</span>
          Office Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Office Name" value={form.name} onChange={(v) => set('name', v)} placeholder="e.g. Singapore Office" />
          <Field label="Country" value={form.country} onChange={(v) => set('country', v)} placeholder="Singapore" />
          <Field label="City" value={form.city} onChange={(v) => set('city', v)} placeholder="Singapore" />
          <Field label="Postal Code" value={form.postal} onChange={(v) => set('postal', v)} placeholder="018956" />
          <div className="md:col-span-2">
            <Field label="Address" value={form.address} onChange={(v) => set('address', v)} placeholder="Street, building, suite" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Timezone</label>
            <select
              value={form.timezone}
              onChange={(e) => set('timezone', e.target.value)}
              className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
            >
              {['UTC-05:00 Eastern Time', 'UTC+00:00 GMT', 'UTC+05:30 IST', 'UTC+08:00 SGT'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => set('currency', e.target.value)}
              className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
            >
              {['USD ($)', 'GBP (£)', 'INR (₹)', 'SGD (S$)', 'EUR (€)'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Fiscal Year</label>
            <select
              value={form.fiscal}
              onChange={(e) => set('fiscal', e.target.value)}
              className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
            >
              <option>Jan - Dec</option>
              <option>Apr - Mar</option>
              <option>Jul - Jun</option>
            </select>
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
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-on-surface-variant uppercase">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
      />
    </div>
  )
}
