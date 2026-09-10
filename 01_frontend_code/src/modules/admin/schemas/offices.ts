import { z } from 'zod'

export const officeLocationSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name is required').max(120),
  country: z.string().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required'),
  timezone: z.string().min(1),
  currency: z.string().min(1),
  fiscal: z.string().min(1),
  address: z.string().max(300).optional().or(z.literal('')),
  postal: z.string().max(20).optional().or(z.literal('')),
})

export type OfficeLocationSchema = z.infer<typeof officeLocationSchema>

/**
 * Create/edit form aligned to backend LocationCreate:
 * name, timezone, latitude, longitude, attendance_radius_meters,
 * allowed_ip_cidrs, country, state, city, address, payroll_region,
 * currency, fiscal_year_start_month, working_week_id?, holiday_calendar_id?
 */
export const officeFormSchema = z.object({
  name: z.string().min(2, 'Name is required').max(150),
  country: z.string().min(1, 'Country is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  city: z.string().min(1, 'City is required').max(100),
  address: z.string().min(1, 'Address is required'),
  timezone: z.string().min(1, 'Timezone is required').max(100),
  currency: z.string().min(1, 'Currency is required').max(20),
  fiscalMonth: z.coerce.number().int().min(1).max(12).default(4),
  latitude: z.coerce.number().min(-90).max(90).default(0),
  longitude: z.coerce.number().min(-180).max(180).default(0),
  attendanceRadiusMeters: z.coerce.number().int().min(0).max(50000).default(200),
  payrollRegion: z.string().max(100).optional().or(z.literal('')),
  allowedIpCidrs: z.string().optional().or(z.literal('')), // comma-separated in UI
  // Optional FKs — empty/0 → omit on create (avoids 404 Working week/Holiday calendar not found)
  workingWeekId: z.union([z.string(), z.number(), z.literal('')]).optional(),
  holidayCalendarId: z.union([z.string(), z.number(), z.literal('')]).optional(),
})

export type OfficeFormInput = z.input<typeof officeFormSchema>
export type OfficeFormValues = z.output<typeof officeFormSchema>

export const emptyOfficeForm: OfficeFormValues = {
  name: '',
  country: 'India',
  state: '',
  city: '',
  address: '',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  fiscalMonth: 4,
  latitude: 0,
  longitude: 0,
  attendanceRadiusMeters: 200,
  payrollRegion: '',
  allowedIpCidrs: '',
  workingWeekId: '',
  holidayCalendarId: '',
}

/** Map form values → backend LocationCreate body (no fake FK defaults). */
export function toLocationCreatePayload(values: OfficeFormValues) {
  const optionalId = (v: unknown): number | null => {
    if (v === '' || v == null) return null
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n : null
  }

  const cidrs = (values.allowedIpCidrs ?? '')
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  const body: Record<string, unknown> = {
    name: values.name.trim(),
    timezone: values.timezone.trim(),
    latitude: values.latitude,
    longitude: values.longitude,
    attendance_radius_meters: values.attendanceRadiusMeters,
    allowed_ip_cidrs: cidrs,
    country: values.country.trim(),
    state: values.state.trim(),
    city: values.city.trim(),
    address: values.address.trim(),
    payroll_region: values.payrollRegion?.trim() || null,
    currency: values.currency.trim(),
    fiscal_year_start_month: values.fiscalMonth,
  }

  const ww = optionalId(values.workingWeekId)
  const hc = optionalId(values.holidayCalendarId)
  if (ww != null) body.working_week_id = ww
  if (hc != null) body.holiday_calendar_id = hc

  return body
}

export function toLocationUpdatePayload(values: OfficeFormValues) {
  return toLocationCreatePayload(values)
}
