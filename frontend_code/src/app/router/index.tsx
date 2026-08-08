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

// ── Root ──────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

// ── App layout (AppShell wraps all authenticated pages) ───────────────
// Using path: '/' so the layout matches every route under it.
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: AppShell,
})

// Index → redirect to dashboard
const indexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})

// Dashboard
const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'dashboard',
  component: () => (
    <div>
      <h1 className="text-headline-lg text-on-background mb-2">Dashboard</h1>
      <p className="text-body-md text-on-surface-variant">
        Executive dashboard will be implemented in a later module.
      </p>
      <p className="text-body-sm text-on-surface-variant mt-4">
        Use the left Icon Rail to open <strong>Projects</strong>, Sales, etc.
      </p>
    </div>
  ),
})

// ── Projects ──────────────────────────────────────────────────────────
const projectsIndexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'projects',
  component: ProjectsListPage,
})

const projectsNewRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'projects/new',
  component: ProjectCreatePage,
})

const projectDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'projects/$projectId',
  component: ProjectDetailPage,
})

const teamsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'projects/teams',
  component: TeamsListPage,
})

const tasksRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'projects/tasks',
  component: TasksListPage,
})

// ── Placeholders for other modules ────────────────────────────────────
const salesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'sales',
  component: () => <Placeholder title="Sales" />,
})

const salesLeadsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'sales/leads',
  component: () => <Placeholder title="Leads" />,
})

const salesClientsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'sales/clients',
  component: () => <Placeholder title="Clients" />,
})

const salesAnalyticsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'sales/analytics',
  component: () => <Placeholder title="Sales Analytics" />,
})

const salesActivityRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'sales/activity',
  component: () => <Placeholder title="Sales Activity" />,
})

const workforceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'workforce',
  component: () => <Placeholder title="Workforce" />,
})

const workforceEmployeesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'workforce/employees',
  component: () => <Placeholder title="Employees" />,
})

const workforceDepartmentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'workforce/departments',
  component: () => <Placeholder title="Departments" />,
})

const workforceAttendanceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'workforce/attendance',
  component: () => <Placeholder title="Attendance" />,
})

const myWorkRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'my-work',
  component: () => <Placeholder title="My Work" />,
})

const myWorkAttendanceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'my-work/attendance',
  component: () => <Placeholder title="My Attendance" />,
})

const myWorkLeaveRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'my-work/leave',
  component: () => <Placeholder title="My Leave" />,
})

const myWorkTasksRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'my-work/tasks',
  component: () => <Placeholder title="My Tasks" />,
})

const myWorkApprovalsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'my-work/approvals',
  component: () => <Placeholder title="My Approvals" />,
})

const approvalsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'approvals',
  component: () => <Placeholder title="Approvals" />,
})

const approvalsPendingRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'approvals/pending',
  component: () => <Placeholder title="Pending Approvals" />,
})

const approvalsMyRequestsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'approvals/my-requests',
  component: () => <Placeholder title="My Requests" />,
})

const adminRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'admin',
  component: () => <Placeholder title="Administration" />,
})

const adminUsersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'admin/users',
  component: () => <Placeholder title="Users" />,
})

const adminRolesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'admin/roles',
  component: () => <Placeholder title="Roles & Permissions" />,
})

const adminSettingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'admin/settings',
  component: () => <Placeholder title="Settings" />,
})

const adminAuditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'admin/audit',
  component: () => <Placeholder title="Audit Logs" />,
})

const adminNotificationsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'admin/notifications',
  component: () => <Placeholder title="Notifications Management" />,
})

// ── Route tree ────────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  appRoute.addChildren([
    indexRoute,
    dashboardRoute,
    // Projects
    projectsIndexRoute,
    projectsNewRoute,
    projectDetailRoute,
    teamsRoute,
    tasksRoute,
    // Sales
    salesRoute,
    salesLeadsRoute,
    salesClientsRoute,
    salesAnalyticsRoute,
    salesActivityRoute,
    // Workforce
    workforceRoute,
    workforceEmployeesRoute,
    workforceDepartmentsRoute,
    workforceAttendanceRoute,
    // My Work
    myWorkRoute,
    myWorkAttendanceRoute,
    myWorkLeaveRoute,
    myWorkTasksRoute,
    myWorkApprovalsRoute,
    // Approvals
    approvalsRoute,
    approvalsPendingRoute,
    approvalsMyRequestsRoute,
    // Admin
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
