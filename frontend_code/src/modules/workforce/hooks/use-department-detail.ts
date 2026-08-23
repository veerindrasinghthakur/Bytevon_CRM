import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  assignEmployeeToDepartment,
  getDepartment,
  listDepartmentEmployees,
  listEmployeesNotInDepartment,
  listEmploymentOptionsForPicker,
  removeEmployeeFromDepartment,
  updateDepartment,
} from '../api/departments'
import { DEPARTMENTS_LIST_KEY } from './use-departments-list'

export const departmentDetailKey = (id: number) =>
  ['workforce', 'departments', 'detail', id] as const
export const departmentStaffKey = (id: number) =>
  ['workforce', 'departments', 'staff', id] as const

export function useDepartmentDetail(id: number) {
  const queryClient = useQueryClient()

  const deptQuery = useQuery({
    queryKey: departmentDetailKey(id),
    queryFn: () => getDepartment(id),
    enabled: Number.isFinite(id),
  })

  const staffQuery = useQuery({
    queryKey: departmentStaffKey(id),
    queryFn: () => listDepartmentEmployees(id),
    enabled: Number.isFinite(id),
  })

  const invalidateDepartment = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: departmentDetailKey(id) }),
      queryClient.invalidateQueries({ queryKey: departmentStaffKey(id) }),
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_LIST_KEY }),
      // Employees list may show department labels
      queryClient.invalidateQueries({ queryKey: ['workforce', 'employees'] }),
    ])
  }

  const updateMutation = useMutation({
    mutationFn: (patch: {
      name?: string
      headEmploymentId?: number | null
      isArchived?: boolean
    }) => updateDepartment(id, patch),
    onSuccess: async () => {
      await invalidateDepartment()
    },
  })

  const assignMutation = useMutation({
    mutationFn: (employmentId: number) => assignEmployeeToDepartment(employmentId, id),
    onSuccess: async () => {
      await invalidateDepartment()
    },
  })

  const removeMutation = useMutation({
    mutationFn: (employmentId: number) => removeEmployeeFromDepartment(employmentId, id),
    onSuccess: async () => {
      await invalidateDepartment()
    },
  })

  return {
    department: deptQuery.data ?? null,
    staff: staffQuery.data ?? [],
    isLoading: deptQuery.isLoading || staffQuery.isLoading,
    isError: deptQuery.isError || staffQuery.isError,
    refetch: async () => {
      await Promise.all([deptQuery.refetch(), staffQuery.refetch()])
    },
    updateDepartment: updateMutation.mutateAsync,
    assignEmployee: assignMutation.mutateAsync,
    removeEmployee: removeMutation.mutateAsync,
    isMutating:
      updateMutation.isPending || assignMutation.isPending || removeMutation.isPending,
    listCandidates: () => listEmployeesNotInDepartment(id),
    listHeadOptions: listEmploymentOptionsForPicker,
  }
}
