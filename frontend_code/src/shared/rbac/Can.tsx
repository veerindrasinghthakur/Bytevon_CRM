import type { ReactNode } from 'react'
import type { Action, ResourceName, ScopeName } from '@/shared/schema'
import { useRbac } from './use-rbac'

type CanProps = {
  children: ReactNode
  fallback?: ReactNode
  action?: Action | string
  resource?: ResourceName | string
  minScope?: ScopeName | string
  /** Pre-resolved boolean e.g. permission={permissions.project?.update} */
  permission?: boolean
  employmentId?: number
}

export function Can({
  children,
  fallback = null,
  action,
  resource,
  minScope,
  permission,
  employmentId,
}: CanProps) {
  const { can, isLoading } = useRbac(employmentId)

  if (isLoading) return <>{fallback}</>

  let allowed = false
  if (typeof permission === 'boolean') {
    allowed = permission
  } else if (action != null && resource != null) {
    allowed = can(action, resource, minScope)
  }

  if (!allowed) return <>{fallback}</>
  return <>{children}</>
}
