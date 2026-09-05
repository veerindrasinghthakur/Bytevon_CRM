import { z } from 'zod'
import { attendanceStatusSchema } from './attendance'

export const correctionFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  originalStatus: attendanceStatusSchema,
  requestedCheckIn: z.string().min(1, 'Check-in time is required'),
  requestedCheckOut: z.string().min(1, 'Check-out time is required'),
  reason: z.string().min(10, 'Minimum 10 characters required').max(500),
  approverId: z.string().min(1, 'Approver is required'),
})

export type CorrectionFormValues = z.infer<typeof correctionFormSchema>

export const emptyCorrectionForm = (): CorrectionFormValues => ({
  date: '',
  originalStatus: 'Present',
  requestedCheckIn: '09:00 AM',
  requestedCheckOut: '06:00 PM',
  reason: '',
  approverId: '',
})