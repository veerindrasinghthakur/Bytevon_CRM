import { createRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'

const ProjectsListPage = lazyPage(() => import('./pages/ProjectsListPage'), 'ProjectsListPage')
const ProjectDetailPage = lazyPage(() => import('./pages/ProjectDetailPage'), 'ProjectDetailPage')
const ProjectCreatePage = lazyPage(() => import('./pages/ProjectCreatePage'), 'ProjectCreatePage')
const TeamsListPage = lazyPage(() => import('./pages/TeamsListPage'), 'TeamsListPage')
const TeamCreatePage = lazyPage(() => import('./pages/TeamCreatePage'), 'TeamCreatePage')
const TeamDetailPage = lazyPage(() => import('./pages/TeamDetailPage'), 'TeamDetailPage')
const TasksListPage = lazyPage(() => import('./pages/TasksListPage'), 'TasksListPage')
const TaskCreatePage = lazyPage(() => import('./pages/TaskCreatePage'), 'TaskCreatePage')
const TaskDetailPage = lazyPage(() => import('./pages/TaskDetailPage'), 'TaskDetailPage')
const DocumentsPage = lazyPage(() => import('./pages/DocumentsPage'), 'DocumentsPage')
const ProjectNotesPage = lazyPage(() => import('./pages/ProjectNotesPage'), 'ProjectNotesPage')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createProjectsRoutes(appLayoutRoute: any) {
  return [
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/projects', component: ProjectsListPage }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/new',
      component: ProjectCreatePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/documents',
      component: DocumentsPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/$projectId',
      component: ProjectDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/$projectId/notes',
      component: ProjectNotesPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/teams',
      component: TeamsListPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/teams/new',
      component: TeamCreatePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/teams/$teamId',
      validateSearch: (search: Record<string, unknown>) => ({
        edit: typeof search.edit === 'string' ? search.edit : undefined,
      }),
      component: TeamDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/tasks',
      component: TasksListPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/tasks/new',
      component: TaskCreatePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/tasks/$taskId',
      component: TaskDetailPage,
    }),
  ]
}
