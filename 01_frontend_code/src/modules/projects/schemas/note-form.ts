import { z } from 'zod'

/** UI form state for project notes. */
export const noteFormSchema = z.object({
  body: z.string().min(1, 'Note cannot be empty').max(4000),
  pinned: z.boolean().optional(),
})

export type NoteFormInput = z.infer<typeof noteFormSchema>
