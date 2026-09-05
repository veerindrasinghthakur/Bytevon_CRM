import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createShift, getShift, getShifts, updateShift } from '../api/organization'
import { listEmployeesOnShift } from '@/modules/workforce/api/departments'
import type { ShiftRow } from '@/shared/schema'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'

export function useShiftsList(includeArchived = true) {
  return useQuery({
    queryKey: queryKeys.organization.shifts.list({ includeArchived }),
    queryFn: () => getShifts({ includeArchived }),
  })
}

export function useShiftDetail(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.organization.shifts.detail(id),
    queryFn: () => getShift(id),
    enabled: enabled && Number.isFinite(id) && id > 0,
  })
}

export function useShiftStaff(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.organization.shifts.staff(id),
    queryFn: () => listEmployeesOnShift(id),
    enabled: enabled && Number.isFinite(id) && id > 0,
  })
}

export function useCreateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<ShiftRow, 'id' | 'created_at' | 'updated_at' | 'is_archived' | 'changed_by'>) =>
      createShift(input),
    onSuccess: () => invalidate.orgShifts(qc),
    onError: () => {
      // Handled by consumer
    },
  })
}

export function useUpdateShift(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<ShiftRow>) => updateShift(id, patch),
    onSuccess: (row) => {
      invalidate.orgShifts(qc)
      qc.setQueryData(queryKeys.organization.shifts.detail(id), row)
    },
    onError: () => {
      // Handled by consumer
    },
  })
}
