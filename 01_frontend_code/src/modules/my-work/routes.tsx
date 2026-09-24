/**
 * My Work module routes (includes profile self-service).
 * Profile UI paths stay /profile/* — unchanged.
 */
import { createRoute } from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'
import { requirePermission, requireView } from '@/shared/rbac/require-permission'

/**
 * My Work is self-service — pages open on the variable grant
 * (action on the resource at whatever scope the user holds);
 * the backend scope-filters every record server-side.
 */
const requireSelfView = (resource: string) => () => requireView(resource)
/** Submit pages need the CREATE action — at whatever scope the user holds. */
const requireSelfCreate = (resource: string) => () =>
  requirePermission({ action: 'CREATE', resource })

const MyWorkOverviewPage = lazyPage(() => import('./pages/overview/MyWorkOverviewPage'), 'MyWorkOverviewPage')
const MyAttendancePage = lazyPage(() => import('./pages/attendance/MyAttendancePage'), 'MyAttendancePage')
const MarkAttendancePage = lazyPage(() => import('./pages/attendance/MarkAttendancePage'), 'MarkAttendancePage')
const AttendanceCorrectionsPage = lazyPage(
  () => import('./pages/attendance/AttendanceCorrectionsPage'),
  'AttendanceCorrectionsPage',
)
const AttendanceDetailPage = lazyPage(() => import('./pages/attendance/AttendanceDetailPage'), 'AttendanceDetailPage')
const TakeABreakPage = lazyPage(() => import('./pages/attendance/TakeABreakPage'), 'TakeABreakPage')
const MyLeavePage = lazyPage(() => import('./pages/leave/MyLeavePage'), 'MyLeavePage')
const ApplyLeavePage = lazyPage(() => import('./pages/leave/ApplyLeavePage'), 'ApplyLeavePage')
const LeaveDetailPage = lazyPage(() => import('./pages/leave/LeaveDetailPage'), 'LeaveDetailPage')
const MyTasksPage = lazyPage(() => import('./pages/tasks/MyTasksPage'), 'MyTasksPage')
const MyTaskCreatePage = lazyPage(() => import('./pages/tasks/MyTaskCreatePage'), 'MyTaskCreatePage')
const MyTaskDetailPage = lazyPage(() => import('./pages/tasks/MyTaskDetailPage'), 'MyTaskDetailPage')
const MyApprovalsPage = lazyPage(() => import('./pages/approvals/MyApprovalsPage'), 'MyApprovalsPage')
const MyApprovalDetailPage = lazyPage(() => import('./pages/approvals/MyApprovalDetailPage'), 'MyApprovalDetailPage')
const MyRequestsPage = lazyPage(() => import('./pages/requests/MyRequestsPage'), 'MyRequestsPage')
const MyBankDetailsPage = lazyPage(() => import('./pages/bank/MyBankDetailsPage'), 'MyBankDetailsPage')

const ProfilePage = lazyPage(() => import('./pages/profile/ProfilePage'), 'ProfilePage')
const ActiveSessionsPage = lazyPage(() => import('./pages/profile/ActiveSessionsPage'), 'ActiveSessionsPage')
const ChangePasswordPage = lazyPage(() => import('./pages/profile/ChangePasswordPage'), 'ChangePasswordPage')

export const myWorkRoutes = {
  root: '/my-work',
  break: '/my-work/break',
  attendance: '/my-work/attendance',
  attendanceMark: '/my-work/attendance/mark',
  attendanceCorrections: '/my-work/attendance/corrections',
  attendanceDetail: (attendanceId: string) => `/my-work/attendance/${attendanceId}`,
  leave: '/my-work/leave',
  leaveApply: '/my-work/leave/apply',
  leaveDetail: (leaveId: string) => `/my-work/leave/${leaveId}`,
  tasks: '/my-work/tasks',
  tasksNew: '/my-work/tasks/new',
  taskDetail: (taskId: string) => `/my-work/tasks/${taskId}`,
  approvals: '/my-work/approvals',
  approvalDetail: (requestId: string) => `/my-work/approvals/${requestId}`,
  requests: '/my-work/requests',
  bankDetails: '/my-work/bank-details',
} as const

export const profileRoutes = {
  root: '/profile',
  sessions: '/profile/sessions',
  changePassword: '/profile/change-password',
} as const

export function createMyWorkRoutes(appLayoutRoute: AnyRoute) {
  return [
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work',
      beforeLoad: requireSelfView('attendance'),
      component: MyWorkOverviewPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/break',
      beforeLoad: requireSelfCreate('attendance'),
      component: TakeABreakPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/attendance',
      beforeLoad: requireSelfView('attendance'),
      component: MyAttendancePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/attendance/mark',
      beforeLoad: requireSelfCreate('attendance'),
      component: MarkAttendancePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/attendance/corrections',
      beforeLoad: requireSelfCreate('attendance'),
      component: AttendanceCorrectionsPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/attendance/$attendanceId',
      beforeLoad: requireSelfView('attendance'),
      component: AttendanceDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/leave',
      beforeLoad: requireSelfView('leave_request'),
      component: MyLeavePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/leave/apply',
      beforeLoad: requireSelfCreate('leave_request'),
      component: ApplyLeavePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/leave/$leaveId',
      beforeLoad: requireSelfView('leave_request'),
      component: LeaveDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/tasks',
      beforeLoad: requireSelfView('task'),
      component: MyTasksPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/tasks/new',
      beforeLoad: requireSelfCreate('task'),
      component: MyTaskCreatePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/tasks/$taskId',
      beforeLoad: requireSelfView('task'),
      component: MyTaskDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/approvals',
      beforeLoad: requireSelfView('approval'),
      component: MyApprovalsPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/approvals/$requestId',
      beforeLoad: requireSelfView('approval'),
      component: MyApprovalDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/requests',
      beforeLoad: requireSelfView('leave_request'),
      component: MyRequestsPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/bank-details',
      beforeLoad: requireSelfView('employment'),
      component: MyBankDetailsPage,
    }),
    // Profile pages use backend authenticated-account checks — no RBAC grant needed.
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/profile', component: ProfilePage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/profile/sessions', component: ActiveSessionsPage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/profile/change-password', component: ChangePasswordPage }),
  ]
}
