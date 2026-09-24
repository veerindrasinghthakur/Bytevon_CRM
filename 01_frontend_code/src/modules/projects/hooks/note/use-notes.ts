/** Notes hooks — live backend notes under /projects/notes. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createNote, listNotes, updateNote } from '../../api/note'

export function useNotes(params?: { referenceType?: string; referenceId?: number }) {
  return useQuery({
    queryKey: ['projects', 'notes', params?.referenceType, params?.referenceId],
    queryFn: () => listNotes(params),
    enabled: params?.referenceType != null && params?.referenceId != null,
  })
}

export function useCreateNote(context?: { referenceType?: string; referenceId?: number }) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { title: string; body: string }) =>
      createNote({
        title: input.title,
        body: input.body,
        referenceType: context?.referenceType ?? 'TASK',
        referenceId: context?.referenceId ?? 0,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['projects', 'notes'] })
    },
  })
}

export function useUpdateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: { title?: string; body?: string } }) =>
      updateNote(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['projects', 'notes'] })
    },
  })
}
