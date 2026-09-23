/**
 * Project documents — mock store or notes-documents backend links.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { paginateItems } from '@/shared/lib/list-params'
import type { ProjectDocument } from '../types'
import { documentsList as seedDocs } from '../data/documentsMock'
import { getProjects } from './project'

let store: ProjectDocument[] | null = null

/** Backend changed_by → "Name (Emp #code)"; falls back to Emp #id. */
function resolveUploader(doc: Record<string, unknown>): string {
  const name =
    (doc.uploaded_by_name as string | undefined) ??
    (doc.uploadedByName as string | undefined) ??
    null
  const code =
    (doc.uploaded_by_code as string | undefined) ??
    (doc.uploadedByCode as string | undefined) ??
    null
  const changedBy = doc.changed_by ?? doc.changedBy
  if (name && String(name).trim()) {
    return code ? `${String(name).trim()} (Emp #${code})` : String(name).trim()
  }
  if (code) return `Emp #${code}`
  if (changedBy != null && Number.isFinite(Number(changedBy))) return `Emp #${changedBy}`
  return '—'
}

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
  page?: number
  pageSize?: number
}): Promise<{ items: ProjectDocument[]; total: number }> {
  if (!env.useMockApi && params?.referenceType && params?.referenceId != null) {
    try {
      const entityType = params.referenceType.toUpperCase()
      const { data: links } = await apiClient.get<
        Array<Record<string, unknown>>
      >('/projects/links/by-entity', {
        params: { entity_type: entityType, entity_id: params.referenceId },
      })
      const items: ProjectDocument[] = []
      for (const link of links ?? []) {
        const docId = Number(link.document_id ?? link.documentId)
        if (!Number.isFinite(docId)) continue
        try {
          const { data: doc } = await apiClient.get<Record<string, unknown>>(
            `/projects/documents/${docId}`,
          )
          if (String(doc.status ?? 'ACTIVE').toUpperCase() === 'ARCHIVED') continue
          const ver = (doc.current_version ?? doc.currentVersion) as
            | Record<string, unknown>
            | undefined
          items.push({
            id: String(doc.id),
            name: String(ver?.file_name ?? ver?.fileName ?? doc.title ?? `Document ${doc.id}`),
            type: String(ver?.mime_type ?? ver?.mimeType ?? 'application/octet-stream'),
            sizeLabel: formatFileSize(Number(ver?.file_size ?? ver?.fileSize ?? 0)),
            uploadedBy: resolveUploader(doc),
            uploadedAt: String(doc.created_at ?? doc.createdAt ?? '').slice(0, 10),
            referenceType: params.referenceType,
            referenceId: params.referenceId,
          })
        } catch {
          items.push({
            id: String(docId),
            name: `Document ${docId}`,
            type: 'application/octet-stream',
            sizeLabel: '—',
            uploadedBy: '—',
            uploadedAt: String(link.created_at ?? '').slice(0, 10),
            referenceType: params.referenceType,
            referenceId: params.referenceId,
          })
        }
      }
      if (params.search) {
        const q = params.search.toLowerCase()
        return {
          items: items.filter((d) => d.name.toLowerCase().includes(q)),
          total: items.length,
        }
      }
      return { items, total: items.length }
    } catch {
      return { items: [], total: 0 }
    }
  }

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
    items = items.filter((d) => d.referenceType === params.referenceType)
  }
  if (params?.referenceId != null) {
    items = items.filter((d) => d.referenceId === params.referenceId)
  }
  if (params?.page != null || params?.pageSize != null) {
    return paginateItems(items, params.page, params.pageSize)
  }
  return { items, total: items.length }
}

export async function getDocumentById(id: string): Promise<ProjectDocument | null> {
  if (!env.useMockApi) {
    try {
      const { data: doc } = await apiClient.get<Record<string, unknown>>(
        `/projects/documents/${id}`,
      )
      const ver = (doc.current_version ?? doc.currentVersion) as Record<string, unknown> | undefined
      return {
        id: String(doc.id),
        name: String(ver?.file_name ?? doc.title ?? id),
        type: String(ver?.mime_type ?? 'application/octet-stream'),
        sizeLabel: formatFileSize(Number(ver?.file_size ?? 0)),
        uploadedBy: resolveUploader(doc),
        uploadedAt: String(doc.created_at ?? '').slice(0, 10),
      }
    } catch {
      return null
    }
  }
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
  fileSize?: number
}): Promise<ProjectDocument> {
  if (!env.useMockApi && input.referenceType && input.referenceId != null) {
    // Prefer first document type for V1 metadata create + link
    let typeId = 1
    try {
      const { data: types } = await apiClient.get<Array<{ id: number }>>(
        '/projects/document-types',
      )
      if (types?.[0]?.id) typeId = types[0].id
    } catch {
      /* use default */
    }
    const size = input.fileSize && input.fileSize > 0 ? input.fileSize : 1
    const { data } = await apiClient.post<Record<string, unknown>>('/projects/documents', {
      document_type_id: typeId,
      title: input.name,
      file_reference: input.url || `local://${input.name}`,
      file_name: input.name,
      mime_type: input.type || 'application/octet-stream',
      file_size: size,
      link_entity_type: input.referenceType.toUpperCase(),
      link_entity_id: input.referenceId,
    })
    const uploader = resolveUploader(data)
    return {
      id: String(data.id),
      name: input.name,
      type: input.type,
      sizeLabel: input.sizeLabel,
      uploadedBy: uploader === '—' ? (input.uploadedBy ?? 'You') : uploader,
      uploadedAt: new Date().toISOString().slice(0, 10),
      url: input.url,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
    }
  }

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
    referenceType: input.referenceType,
    referenceId: input.referenceId,
  }
  list.unshift(doc)
  return doc
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Global documents view — the backend has no list-all endpoint, so this
 * aggregates `/projects/links/by-entity` (PROJECT) across every project and
 * resolves each link to its document detail. Each item carries the owning
 * project id/name for display.
 */
export async function listAllProjectDocuments(params?: {
  search?: string
}): Promise<{ items: ProjectDocument[]; total: number }> {
  if (!env.useMockApi) {
    const { items: projects } = await getProjects({ pageSize: 200 })
    const seen = new Map<string, ProjectDocument>()
    await Promise.all(
      projects.map(async (p) => {
        try {
          const { items } = await listDocuments({ referenceType: 'PROJECT', referenceId: p.id })
          for (const d of items) {
            if (!seen.has(d.id)) {
              seen.set(d.id, {
                ...d,
                referenceType: 'PROJECT',
                referenceId: p.id,
                projectName: p.name,
              })
            }
          }
        } catch {
          // A project with no readable links contributes nothing.
        }
      }),
    )
    let items = [...seen.values()]
    if (params?.search) {
      const q = params.search.toLowerCase()
      items = items.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.projectName ?? '').toLowerCase().includes(q) ||
          d.uploadedBy.toLowerCase().includes(q),
      )
    }
    return { items, total: items.length }
  }
  return listDocuments(params)
}

/** Archive a document (backend POST /projects/documents/{id}/archive). */
export async function archiveDocument(id: string): Promise<void> {
  if (!env.useMockApi) {
    await apiClient.post(`/projects/documents/${id}/archive`)
    return
  }
  await delay(300)
  const list = ensureStore()
  const idx = list.findIndex((d) => d.id === id)
  if (idx === -1) throw new Error('Document not found')
  list.splice(idx, 1)
}
