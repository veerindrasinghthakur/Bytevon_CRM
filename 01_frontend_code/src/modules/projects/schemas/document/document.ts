import { z } from 'zod'

export const projectDocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  sizeLabel: z.string(),
  uploadedBy: z.string(),
  uploadedAt: z.string(),
  url: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.number().optional(),
})

export type ProjectDocumentSchema = z.infer<typeof projectDocumentSchema>

export const documentListResponseSchema = z.object({
  items: z.array(projectDocumentSchema),
  total: z.number(),
})

export const uploadDocumentSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  type: z.string().min(1),
  sizeLabel: z.string().min(1),
  uploadedBy: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.number().optional(),
  url: z.string().optional(),
})

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>

