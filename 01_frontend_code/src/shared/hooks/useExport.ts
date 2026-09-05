import { useMutation } from '@tanstack/react-query'
import {
  exportAndDownload,
  type ExportFormat,
  type ExportRequest,
  type ExportResult,
} from '@/shared/api/export'

export type { ExportFormat, ExportRequest, ExportResult }

export interface UseExportOptions {
  /** Called after a successful download */
  onSuccess?: (result: ExportResult) => void
  onError?: (error: unknown) => void
}

/**
 * Shared export mutation.
 * Pass the same filters / selectedIds / query the page already uses.
 */
export function useExport(options?: UseExportOptions) {
  const mutation = useMutation({
    mutationFn: (req: ExportRequest) => exportAndDownload(req),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })

  return {
    exportData: mutation.mutate,
    exportDataAsync: mutation.mutateAsync,
    isExporting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
    data: mutation.data,
  }
}
