import { z } from 'zod'

export const projectNoteSchema = z.object({
  id: z.string(),
  author: z.string(),
  body: z.string(),
  createdAt: z.string(),
  pinned: z.boolean().optional(),
})

export type ProjectNoteSchema = z.infer<typeof projectNoteSchema>

export const noteFormSchema = z.object({
  body: z.string().min(1, 'Note cannot be empty').max(4000),
  pinned: z.boolean().optional(),
})

export type NoteFormInput = z.infer<typeof noteFormSchema>
