/**
 * Approvals module routes — spread into app router.
 * Paths: /approvals, /approvals/pending, /approvals/$requestId
 * /approvals/my-requests redirects to /my-work/requests
 */
import { createRoute, redirect } from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'
import { safeRedirectOpts } from '@/shared/lib/safeNavigate'
import { requireView } from '@/shared/rbac/require-permission'

/** Variable grant: any approval VIEW opens the center; data is scope-filtered server-side. */
const requireApprovalView = () => requireView('approval')

const ApprovalCenterPage = lazyPage(() => import('./pages/request/ApprovalCenterPage'), 'ApprovalCenterPage')
const PendingApprovalsPage = lazyPage(
  () => import('./pages/approval_action/PendingApprovalsPage'),
  'PendingApprovalsPage',
)
const ApprovalDetailPage = lazyPage(() => import('./pages/request/ApprovalDetailPage'), 'ApprovalDetailPage')

/** Path helpers — always navigate via these + safeNavigate (no string literals in pages). */
export const approvalRoutes = {
  center: '/approvals',
  pending: '/approvals/pending',
  detail: (requestId: string) => `/approvals/${requestId}`,
  detailPath: '/approvals/$requestId',
  myRequestsRedirect: '/approvals/my-requests',
  myWorkRequests: '/my-work/requests',
} as const

export function createApprovalRoutes<TParent extends AnyRoute>(appLayoutRoute: TParent) {
  const approvalsRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/approvals',
    beforeLoad: requireApprovalView,
    component: ApprovalCenterPage,
  })
  const approvalsPendingRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/approvals/pending',
    beforeLoad: requireApprovalView,
    component: PendingApprovalsPage,
  })
  const approvalsDetailRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/approvals/$requestId',
    beforeLoad: requireApprovalView,
    component: ApprovalDetailPage,
  })
  const approvalsMyRequestsRedirectRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/approvals/my-requests',
    beforeLoad: () => {
      throw redirect(safeRedirectOpts({ to: approvalRoutes.myWorkRequests }))
    },
  })
  return [approvalsRoute, approvalsPendingRoute, approvalsDetailRoute, approvalsMyRequestsRedirectRoute]
}
