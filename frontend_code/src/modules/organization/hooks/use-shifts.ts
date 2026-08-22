import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createShift, getShift, getShifts, updateShift } from '../api/organization'
import { listEmployeesOnShift } from '@/modules/workforce/api/departments'
import type { ShiftRow } from '@/shared/schema'

const QK = ['organization', 'shifts'] as const

export function useShiftsList(includeArchived = true) {
  return useQuery({
    queryKey: [...QK, 'list', { includeArchived }],
    queryFn: () => getShifts({ includeArchived }),
  })
}

export function useShiftDetail(id: number, enabled = true) {
  return useQuery({
    queryKey: [...QK, 'detail', id],
    queryFn: () => getShift(id),
    enabled: enabled && Number.isFinite(id) && id > 0,
  })
}

export function useShiftStaff(id: number, enabled = true) {
  return useQuery({
    queryKey: [...QK, 'staff', id],
    queryFn: () => listEmployeesOnShift(id),
    enabled: enabled && Number.isFinite(id) && id > 0,
  })
}

export function useCreateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<ShiftRow, 'id' | 'created_at' | 'updated_at' | 'is_archived' | 'changed_by'>) =>
      createShift(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useUpdateShift(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<ShiftRow>) => updateShift(id, patch),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: QK })
      qc.setQueryData([...QK, 'detail', id], row)
    },
  })
}
