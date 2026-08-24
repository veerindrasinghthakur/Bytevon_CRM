/**
 * Shared export API — mock generates a local file; real mode POSTs to backend.
 * Successful exports record an audit event (best-effort).
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { csvBlob, downloadFile } from '@/shared/lib/download-file'
import { recordAuditEvent } from '@/modules/admin/api/audit'

export type ExportFormat = 'csv' | 'xlsx' | 'pdf'

export interface ExportRequest {
  resource: string
  selectedIds?: string[]
  filters?: Record<string, unknown>
  query?: string
  sort?: { field: string; direction: 'asc' | 'desc' }
  format: ExportFormat
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

async function mockExport(req: ExportRequest): Promise<ExportResult> {
  await delay()
  const ids = req.selectedIds?.length ? req.selectedIds : ['(all filtered)']
  const rows: string[][] = [
    ['resource', 'format', 'query', 'id'],
    ...ids.map((id) => [req.resource, req.format, req.query ?? '', id]),
  ]
  if (req.filters && Object.keys(req.filters).length > 0) {
    rows.push(['filters', JSON.stringify(req.filters), '', ''])
  }
  const filename = `${stem(req)}.${FORMAT_EXT[req.format]}`
  if (req.format === 'csv') {
    return { blob: csvBlob(rows), filename }
  }
  const text = rows.map((r) => r.join('\t')).join('\n')
  return { blob: new Blob([text], { type: FORMAT_MIME[req.format] }), filename }
}

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

export async function exportResource(req: ExportRequest): Promise<ExportResult> {
  if (env.useMockApi) return mockExport(req)
  return realExport(req)
}

/** Export a resource and trigger a download.
 * Errors are caught and re‑thrown after optionally showing a user‑friendly toast.
 */
export async function exportAndDownload(req: ExportRequest): Promise<ExportResult> {
  try {
    const result = await exportResource(req)
    downloadFile(result)
    const count = req.selectedIds?.length
    // Record audit – fire‑and‑forget, but log any failure.
    void recordAuditEvent({
      action: 'Export completed',
      target: `${req.resource} (${req.format}${count != null ? `, ${count} selected` : ''})`,
      module: 'Export',
    }).catch((e) => console.warn('Export audit failed', e))
    return result
  } catch (err) {
    // Propagate a clearer error for callers/UI.
    console.error('Export failed', err)
    throw err
  }
}
