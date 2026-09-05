import { z } from 'zod'
import { leaveTypeSchema } from './leave'

export const leaveFormSchema = z
  .object({
    type: leaveTypeSchema,
    halfDay: z.boolean().optional(),
    from: z.string().min(1, 'Start date required'),
    to: z.string().min(1, 'End date required'),
    reason: z.string().min(10, 'Minimum 10 characters required').max(500),
  })
  .refine((data) => !data.from || !data.to || data.to >= data.from, {
    message: 'End date must be on or after start date',
    path: ['to'],
  })

export type LeaveFormValues = z.infer<typeof leaveFormSchema>

export const emptyLeaveForm = (): LeaveFormValues => ({
  type: 'Casual',
  halfDay: false,
  from: '',
  to: '',
  reason: '',
})
