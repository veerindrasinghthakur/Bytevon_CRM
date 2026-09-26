import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archiveDocument,
  listAllProjectDocuments,
  listDocuments,
  uploadDocument,
  formatFileSize,
} from '../../api/document'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import { useScopeParams } from '@/shared/rbac'

export function useDocuments(filters?: {
  search?: string
  referenceType?: string
  referenceId?: number
}) {
  // Scope-tagged: backend enforces the boundary; key stays partitioned per scope.
  const scopedFilters = useScopeParams('document', filters ?? {})
  return useQuery({
    queryKey: queryKeys.documents.list(scopedFilters),
    queryFn: () => listDocuments(scopedFilters),
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

/** Global documents view — aggregated across projects the caller may see (backend enforces). */
export function useAllProjectDocuments(search?: string) {
  // Auth scope (not the 'all-projects' UI label) tags both key and fetcher.
  const scopedParams = useScopeParams('document', { search: search ?? '' })
  return useQuery({
    queryKey: queryKeys.documents.list(scopedParams),
    queryFn: () => listAllProjectDocuments(scopedParams),
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
