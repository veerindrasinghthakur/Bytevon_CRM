import { z } from 'zod'
import { clientTypeSchema, recordStatusSchema } from '../enums'

export const clientContactFormSchema = z.object({
  id: z.string(),
  name: z.string(),
  designation: z.string(),
  email: z.string().email().or(z.literal('')),
  phone: z.string(),
})

/** UI form state for create/edit client (string fields + contacts array). */
export const clientFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  legalName: z.string().optional().or(z.literal('')),
  type: clientTypeSchema,
  status: recordStatusSchema,
  industry: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  taxId: z.string().optional().or(z.literal('')),
  founded: z.string().optional().or(z.literal('')),
  chatLink: z.string().optional().or(z.literal('')),
  contacts: z.array(clientContactFormSchema).min(1),
})

export type ClientContactForm = z.infer<typeof clientContactFormSchema>
export type ClientFormSchemaInput = z.infer<typeof clientFormSchema>
export type ClientForm = ClientFormSchemaInput

export function emptyClientContact(): ClientContactForm {
  return {
    id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    designation: '',
    email: '',
    phone: '',
  }
}

export const emptyClientForm = (): ClientForm => ({
  name: '',
  legalName: '',
  type: 'SMB',
  status: 'Active',
  industry: '',
  website: '',
  country: '',
  state: '',
  city: '',
  address: '',
  taxId: '',
  founded: '',
  chatLink: '',
  contacts: [emptyClientContact()],
})
