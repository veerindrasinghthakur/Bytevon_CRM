import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys } from '@/shared/lib/query-keys'
import {
  assignEmployeeToDepartment,
  createDepartment,
  deleteDepartment,
  getDepartment,
  listDepartmentEmployees,
  listDepartments,
  listEmployeesNotInDepartment,
  listEmploymentOptionsForPicker,
  removeEmployeeFromDepartment,
  restoreDepartment,
  updateDepartment,
} from '../../api/departments'
import type { DeptListResult, DeptMetrics } from '../../types'

const FILTER_DEFAULTS = { status: 'All' }

export const DEPARTMENTS_LIST_KEY = queryKeys.workforce.departments.all
export const departmentDetailKey = (id: number) =>
  ['workforce', 'departments', 'detail', id] as const
export const departmentStaffKey = (id: number) =>
  ['workforce', 'departments', 'staff', id] as const

/** Single coherent department hook: list + detail + members + mutations. */
export function useDepartments() {
  const qc = useQueryClient()
  const controls = useListControls({ filterDefaults: FILTER_DEFAULTS })

  const listFilters = {
    includeArchived: false,
    search: controls.debouncedSearch || undefined,
    status: controls.filters.status !== 'All' ? controls.filters.status : undefined,
    page: controls.page,
    pageSize: controls.pageSize,
  }

  const listQuery = useQuery({
    queryKey: queryKeys.workforce.departments.list(listFilters),
    queryFn: () =>
      listDepartments({
        includeArchived: false,
        search: listFilters.search,
        status: listFilters.status,
        page: listFilters.page,
        pageSize: listFilters.pageSize,
      }) as Promise<DeptListResult>,
  })

  const invalidateAll = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: DEPARTMENTS_LIST_KEY }),
      qc.invalidateQueries({ queryKey: ['workforce', 'employees'] }),
    ])
  }

  const createMut = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => void invalidateAll(),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Parameters<typeof updateDepartment>[1] }) =>
      updateDepartment(id, patch),
    onSuccess: () => void invalidateAll(),
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteDepartment(id),
    onSuccess: () => void invalidateAll(),
  })
  const restoreMut = useMutation({
    mutationFn: (id: number) => restoreDepartment(id),
    onSuccess: () => void invalidateAll(),
  })

  const items = listQuery.data?.items ?? []
  const metrics: DeptMetrics = listQuery.data?.metrics ?? {
    total: 0,
    active: 0,
    inactive: 0,
    staffing: 0,
  }

  return {
    items,
    filtered: items,
    pageItems: items,
    totalCount: listQuery.data?.total ?? 0,
    metrics,
    loading: listQuery.isLoading,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    error: listQuery.isError,
    isError: listQuery.isError,
    search: controls.search,
    setSearch: controls.setSearch,
    status: controls.filters.status,
    setStatus: (v: string) => controls.setFilter('status', v),
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    reload: () => void listQuery.refetch(),
    refetch: listQuery.refetch,
    createDepartment: createMut.mutateAsync,
    updateDepartment: updateMut.mutateAsync,
    deleteDepartment: deleteMut.mutateAsync,
    restoreDepartment: restoreMut.mutateAsync,
    isMutating: createMut.isPending || updateMut.isPending || deleteMut.isPending || restoreMut.isPending,
  }
}

export function useDepartment(id: number) {
  const qc = useQueryClient()

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

  const invalidateOne = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: departmentDetailKey(id) }),
      qc.invalidateQueries({ queryKey: departmentStaffKey(id) }),
      qc.invalidateQueries({ queryKey: DEPARTMENTS_LIST_KEY }),
      qc.invalidateQueries({ queryKey: ['workforce', 'employees'] }),
    ])
  }

  const updateMut = useMutation({
    mutationFn: (patch: Parameters<typeof updateDepartment>[1]) => updateDepartment(id, patch),
    onSuccess: () => void invalidateOne(),
  })
  const deleteMut = useMutation({
    mutationFn: () => deleteDepartment(id),
    onSuccess: () => void invalidateOne(),
  })
  const restoreMut = useMutation({
    mutationFn: () => restoreDepartment(id),
    onSuccess: () => void invalidateOne(),
  })
  const assignMut = useMutation({
    mutationFn: (employmentId: number) => assignEmployeeToDepartment(employmentId, id),
    onSuccess: () => void invalidateOne(),
  })
  const removeMut = useMutation({
    mutationFn: (employmentId: number) => removeEmployeeFromDepartment(employmentId, id),
    onSuccess: () => void invalidateOne(),
  })

  return {
    department: deptQuery.data ?? null,
    staff: staffQuery.data ?? [],
    isLoading: deptQuery.isLoading || staffQuery.isLoading,
    isError: deptQuery.isError || staffQuery.isError,
    refetch: async () => {
      await Promise.all([deptQuery.refetch(), staffQuery.refetch()])
    },
    updateDepartment: updateMut.mutateAsync,
    deleteDepartment: deleteMut.mutateAsync,
    // Deprecated alias — use deleteDepartment
    archiveDepartment: deleteMut.mutateAsync,
    restoreDepartment: restoreMut.mutateAsync,
    assignEmployee: assignMut.mutateAsync,
    removeEmployee: removeMut.mutateAsync,
    isMutating:
      updateMut.isPending ||
      deleteMut.isPending ||
      restoreMut.isPending ||
      assignMut.isPending ||
      removeMut.isPending,
    listCandidates: () => listEmployeesNotInDepartment(id),
    listHeadOptions: listEmploymentOptionsForPicker,
  }
}
