import { delay, getDb, nextId } from '@/shared/mock/db'
import type { ProjectDocument } from '../types'
import { documentsList as seedDocs } from '../data/documentsMock'

/** In-memory store seeded from mock (mock DB may not have documents table yet). */
let store: ProjectDocument[] | null = null

function ensureStore(): ProjectDocument[] {
  if (!store) {
    store = seedDocs.map((d) => ({
      id: String(d.id),
      name: d.name,
      type: d.mime_type,
      sizeLabel: d.size_label,
      uploadedBy: d.uploaded_by,
      uploadedAt: d.uploaded_at,
      url: undefined,
      referenceType: d.reference_type,
      referenceId: d.reference_id,
    }))
  }
  return store
}

export async function listDocuments(params?: {
  search?: string
  referenceType?: string
  referenceId?: number
}): Promise<{ items: ProjectDocument[]; total: number }> {
  await delay()
  let items = [...ensureStore()]
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.uploadedBy.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q),
    )
  }
  if (params?.referenceType) {
    items = items.filter((d) => (d as { referenceType?: string }).referenceType === params.referenceType)
  }
  if (params?.referenceId != null) {
    items = items.filter((d) => (d as { referenceId?: number }).referenceId === params.referenceId)
  }
  return { items, total: items.length }
}

export async function getDocumentById(id: string): Promise<ProjectDocument | null> {
  await delay()
  return ensureStore().find((d) => d.id === id) ?? null
}

export async function uploadDocument(input: {
  name: string
  type: string
  sizeLabel: string
  uploadedBy?: string
  referenceType?: string
  referenceId?: number
  url?: string
}): Promise<ProjectDocument> {
  await delay(400)
  const list = ensureStore()
  const numericIds = list.map((d) => Number(d.id)).filter((n) => !Number.isNaN(n))
  const id = String((numericIds.length ? Math.max(...numericIds) : 0) + 1)
  const doc: ProjectDocument = {
    id,
    name: input.name,
    type: input.type,
    sizeLabel: input.sizeLabel,
    uploadedBy: input.uploadedBy ?? 'You',
    uploadedAt: new Date().toISOString().slice(0, 10),
    url: input.url,
  }
  ;(doc as { referenceType?: string }).referenceType = input.referenceType
  ;(doc as { referenceId?: number }).referenceId = input.referenceId
  list.unshift(doc)
  return doc
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
