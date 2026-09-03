import type { ReactNode } from 'react'

import { can, } from './can'
import { CanParams } from '../types'
export function Can({
  action,
  resource,
  minScope,
  employmentId,
  fallback = null,
  children,
}: CanParams & {
  children: ReactNode
  fallback?: ReactNode
}) {
  if (!can({ action, resource, minScope, employmentId })) {
    return <>{fallback}</>
  }

  return <>{children}</>
}