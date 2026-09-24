import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { createLocation, getLocation, updateLocation } from '../../api/organization'
import type { OfficeFormValues } from '../../schemas/offices'
import { toLocationCreatePayload, toLocationUpdatePayload } from '../../schemas/offices'

/** Office (location) form data: detail + create/update mutations. */
export function useOfficeForm(officeId: string | undefined) {
  const qc = useQueryClient()
  const isEdit = Boolean(officeId && officeId !== 'new')
  const numericId = isEdit ? Number(officeId) : NaN

  const officeQuery = useQuery({
    queryKey: queryKeys.organization.locations.detail(numericId),
    queryFn: () => getLocation(numericId),
    enabled: isEdit && Number.isFinite(numericId),
  })

  const saveMut = useMutation({
    mutationFn: async (values: OfficeFormValues) => {
      if (isEdit && Number.isFinite(numericId)) {
        return updateLocation(numericId, toLocationUpdatePayload(values) as never)
      }
      return createLocation(toLocationCreatePayload(values) as never)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.organization.locations.all })
    },
  })

  return {
    isEdit,
    existing: officeQuery.data ?? null,
    isLoading: isEdit && officeQuery.isLoading,
    isError: isEdit && officeQuery.isError,
    error: officeQuery.error,
    refetch: officeQuery.refetch,
    saveOffice: saveMut.mutateAsync,
    isSaving: saveMut.isPending,
    saveError: saveMut.error,
  }
}
