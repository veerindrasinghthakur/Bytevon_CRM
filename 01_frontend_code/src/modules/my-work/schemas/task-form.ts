import { z } from 'zod'

export const myTaskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
export type MyTaskPriority = z.infer<typeof myTaskPrioritySchema>

export const myTaskFormSchema = z.object({
  name: z.string().min(2, 'Title must be at least 2 characters').max(200),
  projectId: z.coerce.number().int().positive('Select a project'),
  priority: myTaskPrioritySchema,
  startDate: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  estimatedHours: z.coerce.number().min(0).optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
})
export type MyTaskFormValues = z.infer<typeof myTaskFormSchema>

export const emptyMyTaskForm = (): MyTaskFormValues => ({
  name: '',
  projectId: 0,
  priority: 'MEDIUM',
  startDate: '',
  dueDate: '',
  estimatedHours: undefined,
  description: '',
})

/** Project-form parity: URGENT is stored as backend CRITICAL. */
export function toBackendTaskPriority(p: MyTaskPriority): string {
  return p === 'URGENT' ? 'CRITICAL' : p
}

/** Parse "4", "4h", "4.5" → hours number (or undefined when blank). */
export function parseEstimatedHours(raw: unknown): number | undefined {
  if (raw == null || raw === '') return undefined
  if (typeof raw === 'number') return Number.isFinite(raw) && raw >= 0 ? raw : undefined
  const m = String(raw).match(/[\d.]+/)
  if (!m) return undefined
  const n = Number(m[0])
  return Number.isFinite(n) && n >= 0 ? n : undefined
}
