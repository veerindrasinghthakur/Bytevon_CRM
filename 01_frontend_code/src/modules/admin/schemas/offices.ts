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

export const officeFormSchema = officeLocationSchema
  .omit({ id: true, fiscal: true })
  .extend({
    id: z.string().optional(),
    state: z.string().max(120).optional().or(z.literal('')),
    timezone: z.string().min(1),
    currency: z.string().min(1),
    fiscalMonth: z.union([z.string(), z.number()]).transform((v) => Number(v) || 4),
  })

export type OfficeFormInput = z.input<typeof officeFormSchema>
export type OfficeFormValues = z.output<typeof officeFormSchema>

export const emptyOfficeForm: OfficeFormValues = {
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
