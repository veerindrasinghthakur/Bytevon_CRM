import { useQuery } from '@tanstack/react-query'
import { getPositions } from '../../api/position'

export function usePositions(includeArchived = true) {
  return useQuery({
    queryKey: ['admin', 'positions', { includeArchived }],
    queryFn: () => getPositions(includeArchived),
  })
}
