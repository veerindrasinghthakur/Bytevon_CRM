/**
 * My Work module routes — import createMyWorkRoutes into the app router tree.
 */
import { createRoute } from '@tanstack/react-router'
import { MyWorkOverviewPage } from './pages/MyWorkOverviewPage'
import { MyAttendancePage } from './pages/MyAttendancePage'
import { MarkAttendancePage } from './pages/MarkAttendancePage'
import { AttendanceCorrectionsPage } from './pages/AttendanceCorrectionsPage'
import { AttendanceDetailPage } from './pages/AttendanceDetailPage'
import { TakeABreakPage } from './pages/TakeABreakPage'
import { MyLeavePage } from './pages/MyLeavePage'
import { ApplyLeavePage } from './pages/ApplyLeavePage'
import { LeaveDetailPage } from './pages/LeaveDetailPage'
import { MyTasksPage } from './pages/MyTasksPage'
import { MyTaskCreatePage } from './pages/MyTaskCreatePage'
import { MyTaskDetailPage } from './pages/MyTaskDetailPage'
import { MyApprovalsPage } from './pages/MyApprovalsPage'
import { MyApprovalDetailPage } from './pages/MyApprovalDetailPage'
import { MyRequestsPage } from './pages/MyRequestsPage'
import { MyBankDetailsPage } from './pages/MyBankDetailsPage'

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
