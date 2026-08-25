import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { createLocation, getLocation, updateLocation } from '../api/organization'

export function OfficeFormPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { officeId } = useParams({ strict: false }) as { officeId?: string }
  const isEdit = Boolean(officeId && officeId !== 'new')
  const numericId = isEdit ? Number(officeId) : NaN

  const officeQuery = useQuery({
    queryKey: ['organization', 'locations', numericId],
    queryFn: () => getLocation(numericId),
    enabled: isEdit && Number.isFinite(numericId),
  })

  const existing = officeQuery.data

  const [form, setForm] = useState({
    name: '',
    country: '',
    city: '',
    state: '',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    fiscalMonth: 4,
    address: '',
    postal: '',
  })
  const [error, setError] = useState<string | null>(null)

  const seededOfficeIdRef = useRef<number | null>(null)
  useEffect(() => {
    if (!existing || seededOfficeIdRef.current === existing.id) return
    seededOfficeIdRef.current = existing.id
    setForm({
      name: existing.name,
      country: existing.country,
      city: existing.city,
      state: existing.state ?? '',
      timezone: existing.timezone,
      currency: existing.currency,
      fiscalMonth: existing.fiscal_year_start_month ?? 4,
      address: existing.address,
      postal: '',
    })
  }, [existing])

  const set = (k: keyof typeof form, v: string | number) => setForm((p) => ({ ...p, [k]: v }))

  const goLocations = () => safeNavigate(navigate, { to: '/admin/settings/locations' })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error('Office name is required')
      if (isEdit && Number.isFinite(numericId)) {
        return updateLocation(numericId, {
          name: form.name.trim(),
          country: form.country,
          city: form.city,
          state: form.state,
          timezone: form.timezone,
          currency: form.currency,
          fiscal_year_start_month: Number(form.fiscalMonth),
          address: form.address,
        })
      }
      return createLocation({
        name: form.name.trim(),
        timezone: form.timezone,
        working_week_id: 1,
        holiday_calendar_id: 1,
        latitude: 0,
        longitude: 0,
        attendance_radius_meters: 200,
        allowed_ip_cidrs: [],
        country: form.country || 'India',
        state: form.state || '',
        city: form.city || '',
        address: form.address || '',
        payroll_region: form.state || null,
        currency: form.currency || 'INR',
        fiscal_year_start_month: Number(form.fiscalMonth) || 4,
      })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['organization', 'locations'] })
      await qc.invalidateQueries({ queryKey: ['admin', 'offices'] })
      goLocations()
    },
    onError: (e: Error) => setError(e.message || 'Failed to save office'),
  })

  if (isEdit && officeQuery.isLoading) {
    return <div className="p-12 text-center text-on-surface-variant">Loading office…</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={goLocations}
        className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors group"
      >
        <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>
        <span className="text-label-md font-medium">Back to Locations</span>
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
            <Button variant="outline" size="sm" onClick={goLocations}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={saveMutation.isPending}
              onClick={() => {
                setError(null)
                saveMutation.mutate()
              }}
            >
              {isEdit ? 'Save Changes' : 'Create Office'}
            </Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-body-sm text-error">
          {error}
        </div>
      )}

      <div className="bv-surface p-6 space-y-5">
        <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">apartment</span>
          Office Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Office Name"
            value={form.name}
            onChange={(v) => set('name', v)}
            placeholder="e.g. Singapore Office"
          />
          <Field label="Country" value={form.country} onChange={(v) => set('country', v)} placeholder="India" />
          <Field label="State" value={form.state} onChange={(v) => set('state', v)} placeholder="Karnataka" />
          <Field label="City" value={form.city} onChange={(v) => set('city', v)} placeholder="Bengaluru" />
          <div className="md:col-span-2">
            <Field
              label="Address"
              value={form.address}
              onChange={(v) => set('address', v)}
              placeholder="Street, building, suite"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Timezone</label>
            <select
              value={form.timezone}
              onChange={(e) => set('timezone', e.target.value)}
              className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
            >
              {['Asia/Kolkata', 'America/New_York', 'Europe/London', 'Asia/Singapore', 'UTC'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
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
              {['INR', 'USD', 'GBP', 'SGD', 'EUR'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Fiscal Year Start Month</label>
            <select
              value={String(form.fiscalMonth)}
              onChange={(e) => set('fiscalMonth', Number(e.target.value))}
              className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
            >
              <option value={1}>January</option>
              <option value={4}>April</option>
              <option value={7}>July</option>
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
