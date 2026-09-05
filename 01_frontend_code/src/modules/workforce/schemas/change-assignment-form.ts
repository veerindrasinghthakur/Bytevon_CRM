import { z } from 'zod'

export const changeAssignmentSchema = z.object({
  department_id: z.string().min(1, 'Department is required'),
  position_id: z.string().min(1, 'Position is required'),
  location_id: z.string().min(1, 'Location is required'),
  shift_id: z.string().min(1, 'Shift is required'),
  work_mode: z.string().min(1),
  effective_from: z.string().min(1, 'Effective date is required'),
  change_reason: z.string().min(1, 'Change reason is required'),
})

export type ChangeAssignmentForm = z.infer<typeof changeAssignmentSchema>
