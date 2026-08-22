import { createRoute } from '@tanstack/react-router'
import { ProjectsListPage } from './pages/ProjectsListPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { ProjectCreatePage } from './pages/ProjectCreatePage'
import { TeamsListPage } from './pages/TeamsListPage'
import { TeamCreatePage } from './pages/TeamCreatePage'
import { TeamDetailPage } from './pages/TeamDetailPage'
import { TasksListPage } from './pages/TasksListPage'
import { TaskCreatePage } from './pages/TaskCreatePage'
import { TaskDetailPage } from './pages/TaskDetailPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { ProjectNotesPage } from './pages/ProjectNotesPage'

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
