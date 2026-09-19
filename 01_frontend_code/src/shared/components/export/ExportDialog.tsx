import { useEffect, useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import type { ExportFormat } from '@/shared/api/export'
import type { ExportDialogProps } from '@/shared/types'

const FORMATS: { value: ExportFormat; label: string; hint: string }[] = [
  { value: 'csv', label: 'CSV', hint: 'Comma-separated values' },
  { value: 'xlsx', label: 'Excel', hint: 'Microsoft Excel (.xlsx)' },
  { value: 'pdf', label: 'PDF', hint: 'Portable document' },
]

/**
 * Format-selection modal for shared export.
 * Closes when the user clicks the backdrop (outside the dialog card).
 */
export function ExportDialog({
  open,
  onClose,
  onConfirm,
  isExporting = false,
  errorMessage,
  contextLabel,
  title = 'Export Data',
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('csv')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExporting) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, isExporting, onClose])

  if (!open) return null

  const requestClose = () => {
    if (!isExporting) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      {/* Backdrop — click outside closes dialog */}
      <button
        type="button"
        className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm border-0 cursor-default"
        aria-label="Close export dialog"
        onClick={requestClose}
        disabled={isExporting}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
        className="bv-surface executive-shadow w-full max-w-md overflow-hidden relative z-10"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h3 id="export-dialog-title" className="text-title-lg font-semibold text-on-background">
            {title}
          </h3>
          <button
            type="button"
            disabled={isExporting}
            onClick={requestClose}
            className="p-1 rounded-lg hover:bg-surface-container transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-body-sm text-on-surface-variant">
            You&apos;re downloading the data. Please select a format.
            {contextLabel ? (
              <>
                {' '}
                <span className="font-medium text-on-surface">({contextLabel})</span>
              </>
            ) : null}
          </p>

          <fieldset className="space-y-2" disabled={isExporting}>
            <legend className="sr-only">File format</legend>
            {FORMATS.map((f) => (
              <label
                key={f.value}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  format === f.value
                    ? 'border-secondary bg-secondary/10 ring-1 ring-secondary/30'
                    : 'border-outline-variant hover:bg-surface-container-low',
                )}
              >
                <input
                  type="radio"
                  name="export-format"
                  value={f.value}
                  checked={format === f.value}
                  onChange={() => setFormat(f.value)}
                  className="mt-1 accent-secondary"
                />
                <span>
                  <span className="block text-label-md font-semibold text-on-background">{f.label}</span>
                  <span className="block text-body-sm text-on-surface-variant">{f.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {isExporting && (
            <p className="text-body-sm text-secondary flex items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              Generating your file…
            </p>
          )}

          {errorMessage && !isExporting && (
            <p className="text-body-sm text-error" role="alert">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={requestClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isExporting}
            onClick={() => onConfirm(format)}
            leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}
          >
            Export
          </Button>
        </div>
      </div>
    </div>
  )
}
