import { z } from 'zod'

export const shiftCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  start: z.string().min(1),
  end: z.string().min(1),
  breakMin: z.coerce.number().min(0),
  days: z.string().min(1),
})

export type ShiftCreateInput = z.infer<typeof shiftCreateSchema>

export const emptyShiftCreateForm = (): ShiftCreateInput => ({
  name: '',
  code: '',
  start: '09:00',
  end: '18:00',
  breakMin: 60,
  days: 'Mon–Fri',
})
