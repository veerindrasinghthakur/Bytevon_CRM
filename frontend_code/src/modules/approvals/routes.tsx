/**
 * Approvals module routes — spread into app router.
 * Paths: /approvals, /approvals/pending, /approvals/$requestId
 * /approvals/my-requests redirects to /my-work/requests
 */
import { createRoute, redirect } from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'

const ApprovalCenterPage = lazyPage(() => import('./pages/ApprovalCenterPage'), 'ApprovalCenterPage')
const PendingApprovalsPage = lazyPage(() => import('./pages/PendingApprovalsPage'), 'PendingApprovalsPage')
const ApprovalDetailPage = lazyPage(() => import('./pages/ApprovalDetailPage'), 'ApprovalDetailPage')

export function createApprovalRoutes<TParent extends AnyRoute>(appLayoutRoute: TParent) {
  const approvalsRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/approvals',
    component: ApprovalCenterPage,
  })
  const approvalsPendingRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/approvals/pending',
    component: PendingApprovalsPage,
  })
  const approvalsDetailRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/approvals/$requestId',
    component: ApprovalDetailPage,
  })
  const approvalsMyRequestsRedirectRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/approvals/my-requests',
    beforeLoad: () => {
      throw redirect({ to: '/my-work/requests' })
    },
  })
  return [approvalsRoute, approvalsPendingRoute, approvalsDetailRoute, approvalsMyRequestsRedirectRoute]
}
