import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archiveDocument,
  listAllProjectDocuments,
  listDocuments,
  uploadDocument,
  formatFileSize,
} from '../../api/document'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'

export function useDocuments(filters?: {
  search?: string
  referenceType?: string
  referenceId?: number
}) {
  return useQuery({
    queryKey: queryKeys.documents.list(filters ?? {}),
    queryFn: () => listDocuments(filters),
    enabled: filters?.referenceId == null || Number.isFinite(filters.referenceId),
  })
}

export function useUploadDocument(context?: {
  referenceType?: string
  referenceId?: number
}) {  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (files: File[]) => {
      const results = []
      for (const f of files) {
        results.push(
          await uploadDocument({
            name: f.name,
            type: f.type || 'application/octet-stream',
            sizeLabel: formatFileSize(f.size),
            fileSize: f.size || 1,
            url: URL.createObjectURL(f),
            referenceType: context?.referenceType,
            referenceId: context?.referenceId,
          }),
        )
      }
      return results
    },
    onSettled: () => {
      invalidate.documents(qc)
    },
  })
}

/** Global documents view — aggregated across all projects (backend CRUDs). */
export function useAllProjectDocuments(search?: string) {
  return useQuery({
    queryKey: queryKeys.documents.list({ scope: 'all-projects', search: search ?? '' }),
    queryFn: () => listAllProjectDocuments({ search }),
  })
}

export function useArchiveDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => archiveDocument(id),
    onSettled: () => {
      invalidate.documents(qc)
    },
  })
}
