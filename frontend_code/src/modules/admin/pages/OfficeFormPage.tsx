import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, type UseFormRegister } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'
import { createLocation, getLocation, updateLocation } from '../api/organization'
import { officeFormSchema, type OfficeFormValues } from '../schemas/offices'

const emptyOfficeForm = {
  name: '',
  country: '',
  city: '',
  state: '',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  fiscalMonth: 4,
  address: '',
  postal: '',
}

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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OfficeFormValues>({
    resolver: zodResolver(officeFormSchema),
    defaultValues: emptyOfficeForm,
  })

  const seededOfficeIdRef = useRef<number | null>(null)
  useEffect(() => {
    if (!existing || seededOfficeIdRef.current === existing.id) return
    seededOfficeIdRef.current = existing.id
    reset({
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
  }, [existing, reset])

  const [error, setError] = useState<string | null>(null)

  const goLocations = () => safeNavigate(navigate, { to: '/admin/settings/locations' })

  const saveMutation = useMutation({
    mutationFn: async (values: OfficeFormValues) => {
      if (isEdit && Number.isFinite(numericId)) {
        return updateLocation(numericId, {
          name: values.name.trim(),
          country: values.country,
          city: values.city,
          state: values.state ?? '',
          timezone: values.timezone,
          currency: values.currency,
          fiscal_year_start_month: Number(values.fiscalMonth),
          address: values.address ?? '',
        })
      }
      return createLocation({
        name: values.name.trim(),
        timezone: values.timezone,
        working_week_id: 1,
        holiday_calendar_id: 1,
        latitude: 0,
        longitude: 0,
        attendance_radius_meters: 200,
        allowed_ip_cidrs: [],
        country: values.country || 'India',
        state: values.state || '',
        city: values.city || '',
        address: values.address || '',
        payroll_region: values.state || null,
        currency: values.currency || 'INR',
        fiscal_year_start_month: Number(values.fiscalMonth) || 4,
      })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['organization', 'locations'] })
      await qc.invalidateQueries({ queryKey: ['admin', 'offices'] })
      goLocations()
    },
    onError: (e: Error) => {
      setError(e.message || 'Failed to save office')
    },
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
              onClick={handleSubmit((values) => {
                saveMutation.reset()
                saveMutation.mutate(values)
              })}
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
          <TextField
            label="Office Name"
            error={errors.name?.message}
            registration={register('name')}
            placeholder="e.g. Singapore Office"
          />
          <TextField
            label="Country"
            error={errors.country?.message}
            registration={register('country')}
            placeholder="India"
          />
          <TextField
            label="State"
            error={errors.state?.message}
            registration={register('state')}
            placeholder="Karnataka"
          />
          <TextField
            label="City"
            error={errors.city?.message}
            registration={register('city')}
            placeholder="Bengaluru"
          />
          <div className="md:col-span-2">
            <TextField
              label="Address"
              error={errors.address?.message}
              registration={register('address')}
              placeholder="Street, building, suite"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Timezone</label>
            <select
              {...register('timezone')}
              className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
            >
              {['Asia/Kolkata', 'America/New_York', 'Europe/London', 'Asia/Singapore', 'UTC'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {errors.timezone && <p className="text-caption text-error">{errors.timezone.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Currency</label>
            <select
              {...register('currency')}
              className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
            >
              {['INR', 'USD', 'GBP', 'SGD', 'EUR'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.currency && <p className="text-caption text-error">{errors.currency.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Fiscal Year Start Month</label>
            <select
              {...register('fiscalMonth')}
              className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
            >
              <option value={1}>January</option>
              <option value={4}>April</option>
              <option value={7}>July</option>
            </select>
            {errors.fiscalMonth && <p className="text-caption text-error">{errors.fiscalMonth.message}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function TextField({
  label,
  error,
  registration,
  placeholder,
}: {
  label: string
  error?: string
  registration: UseFormRegister<OfficeFormValues> extends (name: infer _N) => infer R ? R : never
  placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-on-surface-variant uppercase">{label}</label>
      <input
        {...registration}
        placeholder={placeholder}
        className={cn(
          'w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors',
          error
            ? 'border-error focus:border-error focus:ring-2 focus:ring-error/30'
            : 'border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/30',
          'bg-white',
        )}
      />
      {error && <p className="text-caption text-error">{error}</p>}
    </div>
  )
}
