/**
 * Shared export API — mock generates a local file; real mode POSTs to backend.
 * Pages never call Axios directly; use useExport / exportResource.
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { csvBlob, downloadFile } from '@/shared/lib/download-file'

export type ExportFormat = 'csv' | 'xlsx' | 'pdf'

export interface ExportRequest {
  /** Resource key aligned with RBAC resource names where possible (e.g. user, employment) */
  resource: string
  /** Selected row ids when in bulk-selection mode; empty = full filtered set */
  selectedIds?: string[]
  /** Opaque filters the backend understands for this resource */
  filters?: Record<string, unknown>
  /** Free-text search / query from the page */
  query?: string
  /** Optional sort descriptor */
  sort?: { field: string; direction: 'asc' | 'desc' }
  format: ExportFormat
  /** Optional display name for the downloaded file stem */
  filenameStem?: string
}

export interface ExportResult {
  blob: Blob
  filename: string
}

const FORMAT_EXT: Record<ExportFormat, string> = {
  csv: 'csv',
  xlsx: 'xlsx',
  pdf: 'pdf',
}

const FORMAT_MIME: Record<ExportFormat, string> = {
  csv: 'text/csv;charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
}

function delay(ms = 400) {
  return new Promise((r) => setTimeout(r, ms))
}

function stem(req: ExportRequest): string {
  return req.filenameStem ?? req.resource.replace(/[^a-z0-9_-]/gi, '_')
}

/** Mock: produce a small CSV (or placeholder binary) representing the export. */
async function mockExport(req: ExportRequest): Promise<ExportResult> {
  await delay()
  const ids = req.selectedIds?.length ? req.selectedIds : ['(all filtered)']
  const rows: string[][] = [
    ['resource', 'format', 'query', 'id'],
    ...ids.map((id) => [
      req.resource,
      req.format,
      req.query ?? '',
      id,
    ]),
  ]
  if (req.filters && Object.keys(req.filters).length > 0) {
    rows.push(['filters', JSON.stringify(req.filters), '', ''])
  }
  const filename = `${stem(req)}.${FORMAT_EXT[req.format]}`
  if (req.format === 'csv') {
    return { blob: csvBlob(rows), filename }
  }
  // xlsx/pdf mock: still downloadable bytes with correct MIME; real backend supplies real files
  const text = rows.map((r) => r.join('\t')).join('\n')
  return {
    blob: new Blob([text], { type: FORMAT_MIME[req.format] }),
    filename,
  }
}

/** Real backend: POST export job params; response is the file body. */
async function realExport(req: ExportRequest): Promise<ExportResult> {
  const response = await apiClient.post<Blob>(
    `/export/${encodeURIComponent(req.resource)}`,
    {
      selectedIds: req.selectedIds ?? [],
      filters: req.filters ?? {},
      query: req.query ?? '',
      sort: req.sort ?? null,
      format: req.format,
    },
    {
      responseType: 'blob',
      headers: { Accept: FORMAT_MIME[req.format] },
    },
  )

  const disposition = response.headers['content-disposition'] as string | undefined
  let filename = `${stem(req)}.${FORMAT_EXT[req.format]}`
  if (disposition) {
    const match = /filename\*?=(?:UTF-8''|"?)([^";]+)/i.exec(disposition)
    if (match?.[1]) filename = decodeURIComponent(match[1].replace(/"/g, ''))
  }

  return { blob: response.data, filename }
}

/**
 * Request an export. Does not auto-download — caller should call downloadFile.
 */
export async function exportResource(req: ExportRequest): Promise<ExportResult> {
  if (env.useMockApi) return mockExport(req)
  return realExport(req)
}

/** Convenience: export + trigger browser download. */
export async function exportAndDownload(req: ExportRequest): Promise<ExportResult> {
  const result = await exportResource(req)
  downloadFile(result)
  return result
}
