/** Notes hooks — backend not ready. Placeholder only. */
import { useQuery } from '@tanstack/react-query'
import { listNotes } from '../../api/note'

export function useNotes(params?: { referenceType?: string; referenceId?: number }) {
  return useQuery({
    queryKey: ['projects', 'notes', params ?? {}],
    queryFn: () => listNotes(params),
    enabled: false, // TODO: enable when Notes API is ready
  })
}
