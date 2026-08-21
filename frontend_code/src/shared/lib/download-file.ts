/**
 * Shared browser file download helper.
 * Used by export (and any future binary download flows).
 */

export interface DownloadFileOptions {
  /** Blob or already-built object URL */
  blob: Blob
  /** Suggested filename including extension */
  filename: string
}

/**
 * Trigger a browser download from a Blob.
 * Revokes the object URL after a short delay.
 */
export function downloadFile({ blob, filename }: DownloadFileOptions): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Defer revoke so the browser can start the download
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000)
}

/** Build a simple CSV Blob from string rows (mock export helper). */
export function csvBlob(rows: string[][]): Blob {
  const escape = (cell: string) => {
    if (/[",\n\r]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`
    return cell
  }
  const text = rows.map((r) => r.map((c) => escape(String(c ?? ''))).join(',')).join('\n')
  return new Blob([text], { type: 'text/csv;charset=utf-8' })
}
