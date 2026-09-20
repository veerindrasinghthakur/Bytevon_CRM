import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteLocation, getLocation, getLocations, updateLocation } from '../../api/organization'
import type { LocationRow } from '@/shared/schema'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'

export function useLocationsList(includeArchived = true) {
  return useQuery({
    queryKey: queryKeys.organization.locations.list({ includeArchived }),
    queryFn: () => getLocations({ includeArchived }),
  })
}

export function useLocationDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.organization.locations.detail(id),
    queryFn: () => getLocation(id),
    enabled: Number.isFinite(id) && id > 0,
  })
}

export function useUpdateLocation(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<LocationRow>) => updateLocation(id, patch),
    onSuccess: (row) => {
      invalidate.locations(qc)
      qc.setQueryData(queryKeys.organization.locations.detail(id), row)
    },
    onError: () => {
      // Handled by consumer
    },
  })
}

export function useDeleteLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteLocation(id),
    onSuccess: () => {
      invalidate.locations(qc)
    },
  })
}
