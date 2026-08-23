/**
 * My Work module routes — import createMyWorkRoutes into the app router tree.
 * Heavy pages lazy-loaded via shared lazyPage helper.
 */
import { createRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'

const MyWorkOverviewPage = lazyPage(() => import('./pages/MyWorkOverviewPage'), 'MyWorkOverviewPage')
const MyAttendancePage = lazyPage(() => import('./pages/MyAttendancePage'), 'MyAttendancePage')
const MarkAttendancePage = lazyPage(() => import('./pages/MarkAttendancePage'), 'MarkAttendancePage')
const AttendanceCorrectionsPage = lazyPage(
  () => import('./pages/AttendanceCorrectionsPage'),
  'AttendanceCorrectionsPage',
)
const AttendanceDetailPage = lazyPage(() => import('./pages/AttendanceDetailPage'), 'AttendanceDetailPage')
const TakeABreakPage = lazyPage(() => import('./pages/TakeABreakPage'), 'TakeABreakPage')
const MyLeavePage = lazyPage(() => import('./pages/MyLeavePage'), 'MyLeavePage')
const ApplyLeavePage = lazyPage(() => import('./pages/ApplyLeavePage'), 'ApplyLeavePage')
const LeaveDetailPage = lazyPage(() => import('./pages/LeaveDetailPage'), 'LeaveDetailPage')
const MyTasksPage = lazyPage(() => import('./pages/MyTasksPage'), 'MyTasksPage')
const MyTaskCreatePage = lazyPage(() => import('./pages/MyTaskCreatePage'), 'MyTaskCreatePage')
const MyTaskDetailPage = lazyPage(() => import('./pages/MyTaskDetailPage'), 'MyTaskDetailPage')
const MyApprovalsPage = lazyPage(() => import('./pages/MyApprovalsPage'), 'MyApprovalsPage')
const MyApprovalDetailPage = lazyPage(() => import('./pages/MyApprovalDetailPage'), 'MyApprovalDetailPage')
const MyRequestsPage = lazyPage(() => import('./pages/MyRequestsPage'), 'MyRequestsPage')
const MyBankDetailsPage = lazyPage(() => import('./pages/MyBankDetailsPage'), 'MyBankDetailsPage')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMyWorkRoutes(appLayoutRoute: any) {
  return [
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work',
      component: MyWorkOverviewPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/break',
      component: TakeABreakPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/attendance',
      component: MyAttendancePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/attendance/mark',
      component: MarkAttendancePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/attendance/corrections',
      component: AttendanceCorrectionsPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/attendance/$attendanceId',
      component: AttendanceDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/leave',
      component: MyLeavePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/leave/apply',
      component: ApplyLeavePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/leave/$leaveId',
      component: LeaveDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/tasks',
      component: MyTasksPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/tasks/new',
      component: MyTaskCreatePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/tasks/$taskId',
      component: MyTaskDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/approvals',
      component: MyApprovalsPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/approvals/$requestId',
      component: MyApprovalDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/requests',
      component: MyRequestsPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/my-work/bank-details',
      component: MyBankDetailsPage,
    }),
  ]
}
