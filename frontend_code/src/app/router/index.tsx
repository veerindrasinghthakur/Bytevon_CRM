import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { AppShell } from '@/app/layouts/AppShell'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { loadStoredSession } from '@/modules/auth/api/auth'

import {
  LoginPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  SessionExpiredPage,
  AccessDeniedPage,
  NotFoundPage,
} from '@/modules/auth'

import { ProjectsListPage } from '@/modules/projects/pages/ProjectsListPage'
import { ProjectDetailPage } from '@/modules/projects/pages/ProjectDetailPage'
import { ProjectCreatePage } from '@/modules/projects/pages/ProjectCreatePage'
import { TeamsListPage } from '@/modules/projects/pages/TeamsListPage'
import { TeamCreatePage } from '@/modules/projects/pages/TeamCreatePage'
import { TeamDetailPage } from '@/modules/projects/pages/TeamDetailPage'
import { TasksListPage } from '@/modules/projects/pages/TasksListPage'
import { TaskCreatePage } from '@/modules/projects/pages/TaskCreatePage'
import { TaskDetailPage } from '@/modules/projects/pages/TaskDetailPage'
import { DocumentsPage } from '@/modules/projects/pages/DocumentsPage'
import { ProjectNotesPage } from '@/modules/projects/pages/ProjectNotesPage'

import { SalesDashboardPage } from '@/modules/sales/pages/SalesDashboardPage'
import { LeadsListPage } from '@/modules/sales/pages/LeadsListPage'
import { LeadCreatePage } from '@/modules/sales/pages/LeadCreatePage'
import { LeadDetailPage } from '@/modules/sales/pages/LeadDetailPage'
import { ClientsListPage } from '@/modules/sales/pages/ClientsListPage'
import { ClientCreatePage } from '@/modules/sales/pages/ClientCreatePage'
import { ClientDetailPage } from '@/modules/sales/pages/ClientDetailPage'
import { SalesAnalyticsPage } from '@/modules/sales/pages/SalesAnalyticsPage'
import { SalesActivityTimelinePage } from '@/modules/sales/pages/SalesActivityTimelinePage'
import { CaseStudiesListPage } from '@/modules/sales/pages/CaseStudiesListPage'

import { EmployeesListPage } from '@/modules/workforce/pages/EmployeesListPage'
import { EmployeeCreatePage } from '@/modules/workforce/pages/EmployeeCreatePage'
import { EmployeeDetailPage } from '@/modules/workforce/pages/EmployeeDetailPage'
import { DepartmentsListPage } from '@/modules/workforce/pages/DepartmentsListPage'
import { DepartmentCreatePage } from '@/modules/workforce/pages/DepartmentCreatePage'
import { WorkforceRosterPage } from '@/modules/workforce/pages/WorkforceRosterPage'
import { AttendanceDayDetailPage } from '@/modules/workforce/pages/AttendanceDayDetailPage'
import { ChangeAssignmentPage } from '@/modules/workforce/pages/ChangeAssignmentPage'

import { ProfilePage } from '@/modules/profile/pages/ProfilePage'
import { ActiveSessionsPage } from '@/modules/profile/pages/ActiveSessionsPage'
import { NotificationsPage } from '@/modules/notifications/pages/NotificationsPage'

import {
  MyWorkOverviewPage,
  MyAttendancePage,
  MyLeavePage,
  MyTasksPage,
  MyApprovalsPage,
  MarkAttendancePage,
  AttendanceDetailPage,
  AttendanceCorrectionsPage,
  ApplyLeavePage,
  LeaveDetailPage,
  MyTaskCreatePage,
  MyTaskDetailPage,
  MyApprovalDetailPage,
  TakeABreakPage,
  MyRequestsPage,
  MyBankDetailsPage,
} from '@/modules/my-work'

import {
  ApprovalCenterPage,
  PendingApprovalsPage,
  ApprovalDetailPage,
} from '@/modules/approvals'

import {
  UsersListPage,
  UserDetailPage,
  UserCreatePage,
  RolesListPage,
  RoleDetailPage,
  RoleEditPage,
  RoleCreatePage,
  AuditLogsPage,
  AdminSettingsPage,
  OfficeFormPage,
  AttendanceSettingsPage,
  LeaveSettingsPage,
  SecurityCenterPage,
  LeavePoliciesPage,
  LeaveLedgerPage,
} from '@/modules/admin'

import {
  LocationsListPage,
  LocationDetailPage,
  ShiftsListPage,
  WorkingWeeksPage,
  HolidayCalendarsPage,
  HolidaysListPage,
  PositionsListPage,
  OrganizationSettingsPage,
} from '@/modules/organization'

import { ExecutiveDashboardPage } from '@/modules/dashboard'

import {
  PayrollDashboardPage,
  MonthlyPayrollPage,
  RunPayrollPage,
  GeneratingPayrollPage,
  PayrollReviewPage,
  PayslipViewPage,
  SalaryManagementPage,
  EmployeeSalaryDetailPage,
  ReviseSalaryPage,
  EmployeePayrollHistoryPage,
  PayrollHistoryPage,
} from '@/modules/payroll'

function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-headline-lg text-on-background mb-2">{title}</h1>
      <p className="text-body-md text-on-surface-variant">
        This module will be implemented next. Navigation and shell are ready.
      </p>
    </div>
  )
}

function requireAuth() {
  const session = loadStoredSession()
  if (!session) {
    throw redirect({ to: '/login', search: { redirect: window.location.pathname } })
  }
}

function requireGuest() {
  const session = loadStoredSession()
  if (session) {
    throw redirect({ to: '/dashboard' })
  }
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFoundPage,
})

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  component: AuthLayout,
})

const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/login',
  beforeLoad: () => {
    requireGuest()
  },
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
})

const forgotPasswordRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/forgot-password',
  beforeLoad: () => {
    requireGuest()
  },
  component: ForgotPasswordPage,
})

const resetPasswordRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/reset-password',
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: ResetPasswordPage,
})

const sessionExpiredRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/session-expired',
  component: SessionExpiredPage,
})

const accessDeniedRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/access-denied',
  component: AccessDeniedPage,
})

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  beforeLoad: () => {
    requireAuth()
  },
  component: AppShell,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const session = loadStoredSession()
    throw redirect({ to: session ? '/dashboard' : '/login' })
  },
})

const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/dashboard',
  component: ExecutiveDashboardPage,
})

const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/profile',
  component: ProfilePage,
})

const profileSessionsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/profile/sessions',
  component: ActiveSessionsPage,
})

const notificationsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/notifications',
  component: NotificationsPage,
})

const projectsIndexRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects',
  component: ProjectsListPage,
})
const projectsNewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects/new',
  component: ProjectCreatePage,
})
const projectDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects/$projectId',
  component: ProjectDetailPage,
})
const projectNotesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects/$projectId/notes',
  component: ProjectNotesPage,
})
const projectsDocumentsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects/documents',
  component: DocumentsPage,
})
const teamsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects/teams',
  component: TeamsListPage,
})
const teamsNewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects/teams/new',
  component: TeamCreatePage,
})
const teamDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects/teams/$teamId',
  component: TeamDetailPage,
})
const tasksRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects/tasks',
  component: TasksListPage,
})
const tasksNewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects/tasks/new',
  component: TaskCreatePage,
})
const taskDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects/tasks/$taskId',
  component: TaskDetailPage,
})

const salesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales',
  component: LeadsListPage,
})
const salesDashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales/dashboard',
  component: SalesDashboardPage,
})
const salesLeadsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales/leads',
  beforeLoad: () => {
    throw redirect({ to: '/sales' })
  },
})
const salesLeadsNewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales/leads/new',
  component: LeadCreatePage,
})
const salesLeadDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales/leads/$leadId',
  component: LeadDetailPage,
})
const salesLeadEditRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales/leads/$leadId/edit',
  component: LeadCreatePage,
})
const salesClientsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales/clients',
  component: ClientsListPage,
})
const salesClientsNewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales/clients/new',
  component: ClientCreatePage,
})
const salesClientDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales/clients/$clientId',
  component: ClientDetailPage,
})
const salesAnalyticsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales/analytics',
  component: SalesAnalyticsPage,
})
const salesActivityRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales/activity',
  component: SalesActivityTimelinePage,
})
const salesCaseStudiesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales/case-studies',
  component: CaseStudiesListPage,
})

const workforceRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/workforce',
  beforeLoad: () => {
    throw redirect({ to: '/workforce/employees' })
  },
})
const workforceEmployeesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/workforce/employees',
  component: EmployeesListPage,
})
const workforceEmployeesNewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/workforce/employees/new',
  component: EmployeeCreatePage,
})
const workforceEmployeeDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/workforce/employees/$employeeId',
  component: EmployeeDetailPage,
})
const workforceChangeAssignmentRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/workforce/employees/$employeeId/assignment',
  component: ChangeAssignmentPage,
})
const workforceDepartmentsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/workforce/departments',
  component: DepartmentsListPage,
})
const workforceDepartmentsNewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/workforce/departments/new',
  component: DepartmentCreatePage,
})
const workforceAttendanceRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/workforce/attendance',
  component: WorkforceRosterPage,
})
const workforceAttendanceDayRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/workforce/attendance/$employmentId',
  validateSearch: (search: Record<string, unknown>) => ({
    date: typeof search.date === 'string' ? search.date : undefined,
  }),
  component: AttendanceDayDetailPage,
})

const payrollRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/payroll',
  component: PayrollDashboardPage,
})
const payrollMonthlyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/payroll/monthly',
  component: MonthlyPayrollPage,
})
const payrollRunRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/payroll/run',
  component: RunPayrollPage,
})
const payrollGeneratingRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/payroll/generating',
  component: GeneratingPayrollPage,
})
const payrollReviewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/payroll/review/$employeeId',
  component: PayrollReviewPage,
})
const payrollPayslipRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/payroll/payslip/$employeeId',
  component: PayslipViewPage,
})
const payrollSalaryRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/payroll/salary',
  component: SalaryManagementPage,
})
const payrollSalaryDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/payroll/salary/$employeeId',
  component: EmployeeSalaryDetailPage,
})
const payrollSalaryReviseRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/payroll/salary/$employeeId/revise',
  component: ReviseSalaryPage,
})
const payrollHistoryListRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/payroll/history',
  component: PayrollHistoryPage,
})
const payrollHistoryEmployeeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/payroll/history/$employeeId',
  component: EmployeePayrollHistoryPage,
})

const myWorkRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work',
  component: MyWorkOverviewPage,
})
const myWorkBreakRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work/break',
  component: TakeABreakPage,
})
const myWorkAttendanceRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work/attendance',
  component: MyAttendancePage,
})
const myWorkAttendanceMarkRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work/attendance/mark',
  component: MarkAttendancePage,
})
const myWorkAttendanceCorrectionsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work/attendance/corrections',
  component: AttendanceCorrectionsPage,
})
const myWorkAttendanceDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work/attendance/$attendanceId',
  component: AttendanceDetailPage,
})
const myWorkLeaveRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work/leave',
  component: MyLeavePage,
})
const myWorkLeaveApplyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work/leave/apply',
  component: ApplyLeavePage,
})
const myWorkLeaveDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work/leave/$leaveId',
  component: LeaveDetailPage,
})
const myWorkTasksRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work/tasks',
  component: MyTasksPage,
})
const myWorkTasksNewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work/tasks/new',
  component: MyTaskCreatePage,
})
const myWorkTaskDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work/tasks/$taskId',
  component: MyTaskDetailPage,
})
const myWorkApprovalsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work/approvals',
  component: MyApprovalsPage,
})
const myWorkApprovalDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work/approvals/$requestId',
  component: MyApprovalDetailPage,
})
const myWorkRequestsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work/requests',
  component: MyRequestsPage,
})
const myWorkBankDetailsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work/bank-details',
  component: MyBankDetailsPage,
})

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

const adminRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin',
  beforeLoad: () => {
    throw redirect({ to: '/admin/users' })
  },
})
const adminUsersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/users',
  component: UsersListPage,
})
const adminUsersNewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/users/new',
  component: UserCreatePage,
})
const adminUserDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/users/$userId',
  component: UserDetailPage,
})
const adminRolesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/roles',
  component: RolesListPage,
})
const adminRolesNewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/roles/new',
  component: RoleCreatePage,
})
const adminRoleDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/roles/$roleId',
  component: RoleDetailPage,
})
const adminRoleEditRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/roles/$roleId/edit',
  component: RoleEditPage,
})
const adminSettingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/settings',
  component: AdminSettingsPage,
})
const adminOfficeNewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/settings/offices/new',
  component: OfficeFormPage,
})
const adminOfficeEditRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/settings/offices/$officeId/edit',
  component: OfficeFormPage,
})
const adminOrganizationRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/organization',
  component: OrganizationSettingsPage,
})
const adminLocationsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/organization/locations',
  component: LocationsListPage,
})
const adminLocationDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/organization/locations/$locationId',
  component: LocationDetailPage,
})
const adminShiftsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/organization/shifts',
  component: ShiftsListPage,
})
const adminWorkingWeeksRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/organization/working-weeks',
  component: WorkingWeeksPage,
})
const adminHolidayCalendarsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/organization/holidays',
  component: HolidayCalendarsPage,
})
const adminHolidaysRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/organization/holidays/$calendarId',
  component: HolidaysListPage,
})
const adminPositionsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/organization/positions',
  component: PositionsListPage,
})
const adminAttendanceSettingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/attendance-settings',
  component: AttendanceSettingsPage,
})
const adminLeaveSettingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/leave-settings',
  component: LeaveSettingsPage,
})
const adminLeavePoliciesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/leave-policies',
  component: LeavePoliciesPage,
})
const adminLeaveLedgerRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/leave-ledger/$employeeId',
  component: LeaveLedgerPage,
})
const adminAuditRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/audit',
  component: AuditLogsPage,
})
const adminSecurityRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/security',
  component: SecurityCenterPage,
})
const adminNotificationsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/notifications',
  component: () => <Placeholder title="Notifications Management" />,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  authLayoutRoute.addChildren([
    loginRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
    sessionExpiredRoute,
    accessDeniedRoute,
  ]),
  appLayoutRoute.addChildren([
    dashboardRoute,
    profileRoute,
    profileSessionsRoute,
    notificationsRoute,
    projectsIndexRoute,
    projectsNewRoute,
    projectsDocumentsRoute,
    projectDetailRoute,
    projectNotesRoute,
    teamsRoute,
    teamsNewRoute,
    teamDetailRoute,
    tasksRoute,
    tasksNewRoute,
    taskDetailRoute,
    salesRoute,
    salesDashboardRoute,
    salesLeadsRoute,
    salesLeadsNewRoute,
    salesLeadDetailRoute,
    salesLeadEditRoute,
    salesClientsRoute,
    salesClientsNewRoute,
    salesClientDetailRoute,
    salesAnalyticsRoute,
    salesActivityRoute,
    salesCaseStudiesRoute,
    workforceRoute,
    workforceEmployeesRoute,
    workforceEmployeesNewRoute,
    workforceEmployeeDetailRoute,
    workforceChangeAssignmentRoute,
    workforceDepartmentsRoute,
    workforceDepartmentsNewRoute,
    workforceAttendanceRoute,
    workforceAttendanceDayRoute,
    payrollRoute,
    payrollMonthlyRoute,
    payrollRunRoute,
    payrollGeneratingRoute,
    payrollReviewRoute,
    payrollPayslipRoute,
    payrollSalaryRoute,
    payrollSalaryDetailRoute,
    payrollSalaryReviseRoute,
    payrollHistoryListRoute,
    payrollHistoryEmployeeRoute,
    myWorkRoute,
    myWorkBreakRoute,
    myWorkAttendanceRoute,
    myWorkAttendanceMarkRoute,
    myWorkAttendanceCorrectionsRoute,
    myWorkAttendanceDetailRoute,
    myWorkLeaveRoute,
    myWorkLeaveApplyRoute,
    myWorkLeaveDetailRoute,
    myWorkTasksRoute,
    myWorkTasksNewRoute,
    myWorkTaskDetailRoute,
    myWorkApprovalsRoute,
    myWorkApprovalDetailRoute,
    myWorkRequestsRoute,
    myWorkBankDetailsRoute,
    approvalsRoute,
    approvalsPendingRoute,
    approvalsDetailRoute,
    approvalsMyRequestsRedirectRoute,
    adminRoute,
    adminUsersRoute,
    adminUsersNewRoute,
    adminUserDetailRoute,
    adminRolesRoute,
    adminRolesNewRoute,
    adminRoleDetailRoute,
    adminRoleEditRoute,
    adminSettingsRoute,
    adminOfficeNewRoute,
    adminOfficeEditRoute,
    adminOrganizationRoute,
    adminLocationsRoute,
    adminLocationDetailRoute,
    adminShiftsRoute,
    adminWorkingWeeksRoute,
    adminHolidayCalendarsRoute,
    adminHolidaysRoute,
    adminPositionsRoute,
    adminAttendanceSettingsRoute,
    adminLeaveSettingsRoute,
    adminLeavePoliciesRoute,
    adminLeaveLedgerRoute,
    adminAuditRoute,
    adminSecurityRoute,
    adminNotificationsRoute,
  ]),
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
