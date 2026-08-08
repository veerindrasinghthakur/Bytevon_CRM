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

// Root
const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

// Authenticated layout
const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  component: AppShell,
})

// Dashboard placeholder
const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/dashboard',
  component: () => (
    <div>
      <h1 className="text-headline-lg text-on-background mb-2">Dashboard</h1>
      <p className="text-body-md text-on-surface-variant">
        Executive dashboard will be implemented in a later module.
      </p>
    </div>
  ),
})

// Projects module routes
const projectsIndexRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/projects',
  component: ProjectsListPage,
})

const projectsNewRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/projects/new',
  component: ProjectCreatePage,
})

const projectDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/projects/$projectId',
  component: ProjectDetailPage,
})

const teamsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/projects/teams',
  component: TeamsListPage,
})

const tasksRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/projects/tasks',
  component: TasksListPage,
})

// Redirect root → dashboard
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})

// Placeholder routes so rail links don't 404
const salesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/sales',
  component: () => <Placeholder title="Sales" />,
})

const workforceRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/workforce',
  component: () => <Placeholder title="Workforce" />,
})

const myWorkRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/my-work',
  component: () => <Placeholder title="My Work" />,
})

const approvalsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/approvals',
  component: () => <Placeholder title="Approvals" />,
})

const adminRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/admin',
  component: () => <Placeholder title="Administration" />,
})

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

const routeTree = rootRoute.addChildren([
  indexRoute,
  authenticatedRoute.addChildren([
    dashboardRoute,
    projectsIndexRoute,
    projectsNewRoute,
    projectDetailRoute,
    teamsRoute,
    tasksRoute,
    salesRoute,
    workforceRoute,
    myWorkRoute,
    approvalsRoute,
    adminRoute,
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