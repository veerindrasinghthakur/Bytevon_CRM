import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm, type UseFormRegister } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { cn } from '@/shared/lib/cn'
import { useOfficeForm } from '../../hooks/office/use-office-form'
import {
  emptyOfficeForm,
  officeFormSchema,
  type OfficeFormValues,
} from '../../schemas/offices'

export function OfficeFormPage() {
  const navigate = useNavigate()
  const { officeId } = useParams({ strict: false }) as { officeId?: string }
  const {
    isEdit,
    existing,
    isLoading: officeLoading,
    isError: officeError,
    error: officeQueryError,
    saveOffice,
    isSaving,
  } = useOfficeForm(officeId)

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
      latitude: Number(existing.latitude) || 0,
      longitude: Number(existing.longitude) || 0,
      attendanceRadiusMeters: existing.attendance_radius_meters ?? 200,
      payrollRegion: existing.payroll_region ?? '',
      allowedIpCidrs: Array.isArray(existing.allowed_ip_cidrs)
        ? existing.allowed_ip_cidrs.join(', ')
        : '',
      workingWeekId: existing.working_week_id ?? '',
      holidayCalendarId: existing.holiday_calendar_id ?? '',
    })
  }, [existing, reset])

  const [error, setError] = useState<string | null>(null)

  const goLocations = () => safeNavigate(navigate, { to: '/admin/settings/locations' })

  const saveMutation = {
    isPending: isSaving,
    error: null as unknown,
    mutate: (values: OfficeFormValues) => {
      void saveOffice(values).then(
        () => goLocations(),
        (e: unknown) => setError(getApiErrorMessage(e, 'Failed to save location')),
      )
    },
  }

  if (isEdit && officeLoading) {
    return <div className="p-12 text-center text-on-surface-variant">Loading location…</div>
  }

  if (isEdit && officeError) {
    return (
      <div className="p-6 rounded-lg border border-error/30 bg-error/10 text-body-sm text-error">
        {getApiErrorMessage(officeQueryError, 'Could not load location')}
      </div>
    )
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
        title={isEdit ? `Edit Location: ${existing?.name ?? officeId}` : 'Add Location'}
        description={
          isEdit
            ? 'Update location details, geo fence, timezone, and fiscal settings.'
            : 'Register a new office / branch. Matches POST /admin/locations.'
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
                setError(null)
                saveMutation.mutate(values)
              })}
            >
              {isEdit ? 'Save Changes' : 'Create Location'}
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
          Location details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Name" error={errors.name?.message} registration={register('name')} placeholder="e.g. Singapore Office" />
          <TextField label="Country" error={errors.country?.message} registration={register('country')} placeholder="India" />
          <TextField label="State" error={errors.state?.message} registration={register('state')} placeholder="Karnataka" />
          <TextField label="City" error={errors.city?.message} registration={register('city')} placeholder="Bengaluru" />
          <div className="md:col-span-2">
            <TextField label="Address" error={errors.address?.message} registration={register('address')} placeholder="Street, building, suite" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Timezone</label>
            <select
              {...register('timezone')}
              className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
            >
              {['Asia/Kolkata', 'America/New_York', 'Europe/London', 'Asia/Singapore', 'UTC'].map((t) => (
                <option key={t} value={t}>{t}</option>
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
                <option key={c} value={c}>{c}</option>
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
          <TextField label="Payroll region" error={errors.payrollRegion?.message} registration={register('payrollRegion')} placeholder="Optional" />
        </div>
      </div>

      <div className="bv-surface p-6 space-y-5">
        <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">my_location</span>
          Geo & attendance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Latitude" error={errors.latitude?.message} registration={register('latitude')} placeholder="0" />
          <TextField label="Longitude" error={errors.longitude?.message} registration={register('longitude')} placeholder="0" />
          <TextField label="Attendance radius (meters)" error={errors.attendanceRadiusMeters?.message} registration={register('attendanceRadiusMeters')} placeholder="200" />
          <TextField label="Allowed IP CIDRs" error={errors.allowedIpCidrs?.message} registration={register('allowedIpCidrs')} placeholder="Comma-separated, optional" />
        </div>
      </div>

      <div className="bv-surface p-6 space-y-5">
        <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">link</span>
          Optional links
        </h3>
        <p className="text-body-sm text-on-surface-variant">
          Leave blank unless the working week / holiday calendar already exists. Sending id 0 or a
          missing id returns 404 from the API.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Working week ID" error={errors.workingWeekId?.message as string | undefined} registration={register('workingWeekId')} placeholder="Optional" />
          <TextField label="Holiday calendar ID" error={errors.holidayCalendarId?.message as string | undefined} registration={register('holidayCalendarId')} placeholder="Optional" />
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
