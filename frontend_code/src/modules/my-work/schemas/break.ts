import { z } from 'zod'

export const breakModeSchema = z.enum(['countdown', 'stopwatch'])
export type BreakMode = z.infer<typeof breakModeSchema>

export const breakSessionSchema = z.object({
  id: z.string(),
  mode: breakModeSchema,
  startedAt: z.string(),
  durationMinutes: z.number().optional(),
  endedAt: z.string().optional(),
  note: z.string().optional(),
})
export type BreakSession = z.infer<typeof breakSessionSchema>
