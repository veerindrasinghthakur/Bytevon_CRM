import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getLocation, getLocations, updateLocation } from '../api/organization'
import type { LocationRow } from '@/shared/schema'

const QK = ['organization', 'locations'] as const

export function useLocationsList(includeArchived = true) {
  return useQuery({
    queryKey: [...QK, 'list', { includeArchived }],
    queryFn: () => getLocations({ includeArchived }),
  })
}

export function useLocationDetail(id: number) {
  return useQuery({
    queryKey: [...QK, 'detail', id],
    queryFn: () => getLocation(id),
    enabled: Number.isFinite(id) && id > 0,
  })
}

export function useUpdateLocation(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<LocationRow>) => updateLocation(id, patch),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: QK })
      qc.setQueryData([...QK, 'detail', id], row)
    },
  })
}
