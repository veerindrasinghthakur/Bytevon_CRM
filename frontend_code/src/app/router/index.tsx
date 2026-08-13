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

import { LeadsListPage } from '@/modules/sales/pages/LeadsListPage'
import { LeadCreatePage } from '@/modules/sales/pages/LeadCreatePage'
import { ClientsListPage } from '@/modules/sales/pages/ClientsListPage'
import { ClientCreatePage } from '@/modules/sales/pages/ClientCreatePage'

import { EmployeesListPage } from '@/modules/workforce/pages/EmployeesListPage'
import { EmployeeCreatePage } from '@/modules/workforce/pages/EmployeeCreatePage'
import { DepartmentsListPage } from '@/modules/workforce/pages/DepartmentsListPage'
import { DepartmentCreatePage } from '@/modules/workforce/pages/DepartmentCreatePage'

import { ProfilePage } from '@/modules/profile/pages/ProfilePage'
import { NotificationsPage } from '@/modules/notifications/pages/NotificationsPage'

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
  component: () => (
    <div>
      <h1 className="text-headline-lg text-on-background mb-2">Dashboard</h1>
      <p className="text-body-md text-on-surface-variant">
        Executive dashboard will be implemented in a later module.
      </p>
      <p className="text-body-sm text-on-surface-variant mt-4">
        Use the left Icon Rail to open Projects, Sales, Workforce, etc.
      </p>
    </div>
  ),
})

const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/profile',
  component: ProfilePage,
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
  component: () => <Placeholder title="Sales" />,
})
const salesLeadsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales/leads',
  component: LeadsListPage,
})
const salesLeadsNewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales/leads/new',
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
const salesAnalyticsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales/analytics',
  component: () => <Placeholder title="Sales Analytics" />,
})
const salesActivityRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales/activity',
  component: () => <Placeholder title="Sales Activity" />,
})

const workforceRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/workforce',
  component: () => <Placeholder title="Workforce" />,
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
  component: () => <Placeholder title="Attendance" />,
})

const myWorkRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work',
  component: () => <Placeholder title="My Work" />,
})
const myWorkAttendanceRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work/attendance',
  component: () => <Placeholder title="My Attendance" />,
})
const myWorkLeaveRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work/leave',
  component: () => <Placeholder title="My Leave" />,
})
const myWorkTasksRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work/tasks',
  component: () => <Placeholder title="My Tasks" />,
})
const myWorkApprovalsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/my-work/approvals',
  component: () => <Placeholder title="My Approvals" />,
})

const approvalsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/approvals',
  component: () => <Placeholder title="Approvals" />,
})
const approvalsPendingRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/approvals/pending',
  component: () => <Placeholder title="Pending Approvals" />,
})
const approvalsMyRequestsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/approvals/my-requests',
  component: () => <Placeholder title="My Requests" />,
})

const adminRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin',
  component: () => <Placeholder title="Administration" />,
})
const adminUsersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/users',
  component: () => <Placeholder title="Users" />,
})
const adminRolesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/roles',
  component: () => <Placeholder title="Roles & Permissions" />,
})
const adminSettingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/settings',
  component: () => <Placeholder title="Settings" />,
})
const adminAuditRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/audit',
  component: () => <Placeholder title="Audit Logs" />,
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
    notificationsRoute,
    projectsIndexRoute,
    projectsNewRoute,
    projectDetailRoute,
    teamsRoute,
    teamsNewRoute,
    teamDetailRoute,
    tasksRoute,
    tasksNewRoute,
    taskDetailRoute,
    salesRoute,
    salesLeadsRoute,
    salesLeadsNewRoute,
    salesClientsRoute,
    salesClientsNewRoute,
    salesAnalyticsRoute,
    salesActivityRoute,
    workforceRoute,
    workforceEmployeesRoute,
    workforceEmployeesNewRoute,
    workforceDepartmentsRoute,
    workforceDepartmentsNewRoute,
    workforceAttendanceRoute,
    myWorkRoute,
    myWorkAttendanceRoute,
    myWorkLeaveRoute,
    myWorkTasksRoute,
    myWorkApprovalsRoute,
    approvalsRoute,
    approvalsPendingRoute,
    approvalsMyRequestsRoute,
    adminRoute,
    adminUsersRoute,
    adminRolesRoute,
    adminSettingsRoute,
    adminAuditRoute,
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
