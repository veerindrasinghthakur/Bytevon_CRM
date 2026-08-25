import { z } from 'zod'
import { recordStatusSchema } from './lead'
import { clientTypeSchema, clientContactFormSchema } from './client'

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

export type ClientFormSchemaInput = z.infer<typeof clientFormSchema>
