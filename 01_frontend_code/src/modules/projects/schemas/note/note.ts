import { z } from 'zod'

export const projectNoteSchema = z.object({
  id: z.string(),
  author: z.string(),
  body: z.string(),
  createdAt: z.string(),
  pinned: z.boolean().optional(),
})

export type ProjectNoteSchema = z.infer<typeof projectNoteSchema>

/** Re-export form schema from dedicated file */
export { noteFormSchema, type NoteFormInput } from './note-form'

