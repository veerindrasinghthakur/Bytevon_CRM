import { z } from 'zod'

export const approvalActionFormSchema = z.object({
  action: z.enum(['approved', 'rejected', 'revision']),
  comment: z.string().optional(),
})

export type ApprovalActionFormInput = z.infer<typeof approvalActionFormSchema>
