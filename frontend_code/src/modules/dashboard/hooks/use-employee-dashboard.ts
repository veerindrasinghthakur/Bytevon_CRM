import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useRbac } from '@/shared/rbac'
import { Action, ResourceName } from '@/shared/schema'
import { queryKeys } from '@/shared/lib/query-keys'
import { getEmployeeDashboard } from '../api/dashboard'

export function useEmployeeDashboard() {
  const { can, isLoading: rbacLoading } = useRbac()
  const query = useQuery({
    queryKey: queryKeys.dashboard.employee(),
    queryFn: getEmployeeDashboard,
  })

  const quickActions = useMemo(
    () =>
      (query.data?.quickActions ?? []).filter((action) => {
        if (action.to === '/my-work/leave/apply') {
          return can(Action.CREATE, ResourceName.LEAVE_REQUEST)
        }
        if (action.to === '/my-work/attendance/mark') {
          return can(Action.CREATE, ResourceName.ATTENDANCE)
        }
        if (action.to === '/my-work/tasks') {
          return can(Action.VIEW, ResourceName.TASK)
        }
        if (action.to === '/dashboard/employee') {
          return can(Action.VIEW, ResourceName.PAYROLL)
        }
        return true
      }),
    [can, query.data?.quickActions],
  )

  return {
    data: query.data,
    kpis: query.data?.kpis ?? [],
    tasks: query.data?.tasks ?? [],
    leaveSummary: query.data?.leaveSummary ?? [],
    meta: query.data?.meta,
    quickActions,
    isLoading: query.isLoading || rbacLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
