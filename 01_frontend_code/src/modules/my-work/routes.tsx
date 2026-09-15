/**
 * My Work module routes (includes profile self-service).
 * Profile UI paths stay /profile/* — unchanged.
 */
import { createRoute } from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'

const MyWorkOverviewPage = lazyPage(() => import('./pages/overview/MyWorkOverviewPage'), 'MyWorkOverviewPage')
const MyAttendancePage = lazyPage(() => import('./pages/MyAttendancePage'), 'MyAttendancePage')
const MarkAttendancePage = lazyPage(() => import('./pages/MarkAttendancePage'), 'MarkAttendancePage')
const AttendanceCorrectionsPage = lazyPage(
  () => import('./pages/AttendanceCorrectionsPage'),
  'AttendanceCorrectionsPage',
)
const AttendanceDetailPage = lazyPage(() => import('./pages/AttendanceDetailPage'), 'AttendanceDetailPage')
const TakeABreakPage = lazyPage(() => import('./pages/TakeABreakPage'), 'TakeABreakPage')
const MyLeavePage = lazyPage(() => import('./pages/leave/MyLeavePage'), 'MyLeavePage')
const ApplyLeavePage = lazyPage(() => import('./pages/leave/ApplyLeavePage'), 'ApplyLeavePage')
const LeaveDetailPage = lazyPage(() => import('./pages/leave/LeaveDetailPage'), 'LeaveDetailPage')
const MyTasksPage = lazyPage(() => import('./pages/MyTasksPage'), 'MyTasksPage')
const MyTaskCreatePage = lazyPage(() => import('./pages/MyTaskCreatePage'), 'MyTaskCreatePage')
const MyTaskDetailPage = lazyPage(() => import('./pages/MyTaskDetailPage'), 'MyTaskDetailPage')
const MyApprovalsPage = lazyPage(() => import('./pages/MyApprovalsPage'), 'MyApprovalsPage')
const MyApprovalDetailPage = lazyPage(() => import('./pages/MyApprovalDetailPage'), 'MyApprovalDetailPage')
const MyRequestsPage = lazyPage(() => import('./pages/MyRequestsPage'), 'MyRequestsPage')
const MyBankDetailsPage = lazyPage(() => import('./pages/MyBankDetailsPage'), 'MyBankDetailsPage')

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
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/my-work', component: MyWorkOverviewPage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/my-work/break', component: TakeABreakPage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/my-work/attendance', component: MyAttendancePage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/my-work/attendance/mark', component: MarkAttendancePage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/my-work/attendance/corrections', component: AttendanceCorrectionsPage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/my-work/attendance/$attendanceId', component: AttendanceDetailPage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/my-work/leave', component: MyLeavePage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/my-work/leave/apply', component: ApplyLeavePage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/my-work/leave/$leaveId', component: LeaveDetailPage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/my-work/tasks', component: MyTasksPage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/my-work/tasks/new', component: MyTaskCreatePage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/my-work/tasks/$taskId', component: MyTaskDetailPage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/my-work/approvals', component: MyApprovalsPage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/my-work/approvals/$requestId', component: MyApprovalDetailPage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/my-work/requests', component: MyRequestsPage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/my-work/bank-details', component: MyBankDetailsPage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/profile', component: ProfilePage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/profile/sessions', component: ActiveSessionsPage }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/profile/change-password', component: ChangePasswordPage }),
  ]
}
