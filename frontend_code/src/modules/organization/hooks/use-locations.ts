import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getLocation, getLocations, updateLocation } from '../api/organization'
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
      // Prefer alias that always exists on invalidate map
      invalidate.locations(qc)
      qc.setQueryData(queryKeys.organization.locations.detail(id), row)
    },
  })
}
