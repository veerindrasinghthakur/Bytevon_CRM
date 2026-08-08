import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { AppShell } from '@/app/layouts/AppShell'
import { ProjectsListPage } from '@/modules/projects/pages/ProjectsListPage'
import { ProjectDetailPage } from '@/modules/projects/pages/ProjectDetailPage'
import { ProjectCreatePage } from '@/modules/projects/pages/ProjectCreatePage'
import { TeamsListPage } from '@/modules/projects/pages/TeamsListPage'
import { TasksListPage } from '@/modules/projects/pages/TasksListPage'

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

// Root – just renders child outlet
const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

// Pathless layout – wraps all app pages with AppShell
const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: AppShell,
})

// Redirect / → /dashboard
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
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
        Click <strong>Projects</strong> (folder icon) in the left rail to open the Projects module.
      </p>
    </div>
  ),
})

// Projects
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

const tasksRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects/tasks',
  component: TasksListPage,
})

// Sales
const salesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales',
  component: () => <Placeholder title="Sales" />,
})
const salesLeadsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales/leads',
  component: () => <Placeholder title="Leads" />,
})
const salesClientsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales/clients',
  component: () => <Placeholder title="Clients" />,
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

// Workforce
const workforceRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/workforce',
  component: () => <Placeholder title="Workforce" />,
})
const workforceEmployeesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/workforce/employees',
  component: () => <Placeholder title="Employees" />,
})
const workforceDepartmentsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/workforce/departments',
  component: () => <Placeholder title="Departments" />,
})
const workforceAttendanceRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/workforce/attendance',
  component: () => <Placeholder title="Attendance" />,
})

// My Work
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

// Approvals
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

// Admin
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
  appLayoutRoute.addChildren([
    dashboardRoute,
    projectsIndexRoute,
    projectsNewRoute,
    projectDetailRoute,
    teamsRoute,
    tasksRoute,
    salesRoute,
    salesLeadsRoute,
    salesClientsRoute,
    salesAnalyticsRoute,
    salesActivityRoute,
    workforceRoute,
    workforceEmployeesRoute,
    workforceDepartmentsRoute,
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
