import { z } from 'zod'

export const teamMemberRoleSchema = z.enum(['Lead', 'Senior', 'Junior'])

export const teamMemberFormSchema = z.object({
  roles: z.array(
    z.object({
      candidateId: z.string(),
      role: teamMemberRoleSchema,
    }),
  ),
})
