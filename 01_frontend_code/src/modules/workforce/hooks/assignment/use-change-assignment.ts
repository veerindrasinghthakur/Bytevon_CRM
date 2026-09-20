import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { listDepartments } from '../../api/departments'
import { getPositions } from '@/modules/admin/api/position'
import { getLocations } from '@/modules/admin/api/location'
import { getShifts } from '@/modules/admin/api/shift'
import { createEmploymentAssignment } from '../../api/employment'
import type { IdName } from '../../types'

function asIdNameList(raw: unknown): IdName[] {
  if (Array.isArray(raw)) {
    return raw
      .map((row) => {
        const r = row as Record<string, unknown>
        const id = Number(r.id)
        const name = String(r.name ?? '')
        return Number.isFinite(id) ? { id, name } : null
      })
      .filter((x): x is IdName => x != null)
  }
  if (raw && typeof raw === 'object' && 'items' in raw) {
    return asIdNameList((raw as { items: unknown }).items)
  }
  return []
}

/** Assignment masters + create-assignment mutation for ChangeAssignmentPage. */
export function useChangeAssignment(employmentId: number | undefined) {
  const qc = useQueryClient()

  const mastersQuery = useQuery({
    queryKey: [...queryKeys.workforce.employees.all, 'assignment-masters'],
    queryFn: async () => {
      const [d, p, l, s] = await Promise.all([
        listDepartments({ page: 1, pageSize: 200 }),
        getPositions(),
        getLocations(),
        getShifts(),
      ])
      return {
        departments: asIdNameList(d),
        positions: asIdNameList(p),
        locations: asIdNameList(l),
        shifts: asIdNameList(s),
      }
    },
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  })

  const createMut = useMutation({
    mutationFn: (input: {
      departmentId?: number
      positionId?: number
      locationId?: number
      shiftId?: number
      workMode?: string
      effectiveFrom?: string
      changeReason?: string
    }) => createEmploymentAssignment(employmentId!, input),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.workforce.employees.all }),
        qc.invalidateQueries({ queryKey: DEPARTMENTS_KEY }),
      ])
    },
  })

  return {
    masters: mastersQuery.data ?? { departments: [], positions: [], locations: [], shifts: [] },
    isLoadingMasters: mastersQuery.isLoading,
    mastersError: mastersQuery.error,
    refetchMasters: mastersQuery.refetch,
    saveAssignment: createMut.mutateAsync,
    isSaving: createMut.isPending,
    saveError: createMut.error,
  }
}

const DEPARTMENTS_KEY = queryKeys.workforce.departments.all
