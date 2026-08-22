/**
 * Approvals module routes — spread into app router.
 * Paths: /approvals, /approvals/pending, /approvals/$requestId
 * /approvals/my-requests redirects to /my-work/requests
 */
import { createRoute, redirect } from '@tanstack/react-router'
import { ApprovalCenterPage } from './pages/ApprovalCenterPage'
import { PendingApprovalsPage } from './pages/PendingApprovalsPage'
import { ApprovalDetailPage } from './pages/ApprovalDetailPage'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createApprovalRoutes(appLayoutRoute: any) {
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
