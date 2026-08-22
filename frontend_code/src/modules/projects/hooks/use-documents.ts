import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listDocuments, uploadDocument, formatFileSize } from '../api/documents'

export function useDocuments(filters?: {
  search?: string
  referenceType?: string
  referenceId?: number
}) {
  return useQuery({
    queryKey: ['documents', 'list', filters ?? {}],
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
      void qc.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}
