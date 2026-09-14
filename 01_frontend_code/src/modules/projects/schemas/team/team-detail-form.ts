import { z } from 'zod'
import { TeamStatus } from '../../enums'

export const teamDetailFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().max(2000).optional(),
  department: z.string().max(120).optional(),
  headName: z.string().max(120).optional(),
  headRole: z.string().max(80).optional(),
  status: z.enum(TeamStatus).default('ACTIVE'),
})

export type TeamDetailFormInput = z.infer<typeof teamDetailFormSchema>
