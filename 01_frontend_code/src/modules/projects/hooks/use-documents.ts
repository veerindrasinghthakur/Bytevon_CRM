import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listDocuments, uploadDocument, formatFileSize } from '../api/documents'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'

export function useDocuments(filters?: {
  search?: string
  referenceType?: string
  referenceId?: number
}) {
  return useQuery({
    queryKey: queryKeys.documents.list(filters ?? {}),
    queryFn: () => listDocuments(filters),
  })
}

export function useUploadDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (files: File[]) => {
      const results = []
      for (const f of files) {
        results.push(
          await uploadDocument({
            name: f.name,
            type: f.type || 'application/octet-stream',
            sizeLabel: formatFileSize(f.size),
            url: URL.createObjectURL(f),
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
