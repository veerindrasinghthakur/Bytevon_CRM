import { createRoute } from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'

const ProjectsListPage = lazyPage(() => import('./pages/ProjectsListPage'), 'ProjectsListPage')
const ProjectDetailPage = lazyPage(() => import('./pages/ProjectDetailPage'), 'ProjectDetailPage')
const ProjectCreatePage = lazyPage(() => import('./pages/ProjectCreatePage'), 'ProjectCreatePage')
const TeamsListPage = lazyPage(() => import('./pages/TeamsListPage'), 'TeamsListPage')
const TeamCreatePage = lazyPage(() => import('./pages/TeamCreatePage'), 'TeamCreatePage')
const TeamDetailPage = lazyPage(() => import('./pages/TeamDetailPage'), 'TeamDetailPage')
const TeamMembersPage = lazyPage(() => import('./pages/TeamMembersPage'), 'TeamMembersPage')
const TeamAddMemberPage = lazyPage(() => import('./pages/TeamAddMemberPage'), 'TeamAddMemberPage')
const TasksListPage = lazyPage(() => import('./pages/TasksListPage'), 'TasksListPage')
const TaskCreatePage = lazyPage(() => import('./pages/TaskCreatePage'), 'TaskCreatePage')
const TaskDetailPage = lazyPage(() => import('./pages/TaskDetailPage'), 'TaskDetailPage')
const DocumentsPage = lazyPage(() => import('./pages/DocumentsPage'), 'DocumentsPage')
const ProjectNotesPage = lazyPage(() => import('./pages/ProjectNotesPage'), 'ProjectNotesPage')

/** Canonical path helpers — prefer these over hard-coded strings in pages. */
export const projectRoutes = {
  root: '/projects',
  list: '/projects',
  projectNew: '/projects/new',
  projectDetail: (id: string | number) => `/projects/${id}`,
  projectNotes: (id: string | number) => `/projects/${id}/notes`,
  documents: '/projects/documents',
  teams: '/projects/teams',
  teamNew: '/projects/teams/new',
  teamDetail: (id: string | number) => `/projects/teams/${id}`,
  teamMembers: (id: string | number) => `/projects/teams/${id}/members`,
  teamAddMember: (id: string | number) => `/projects/teams/${id}/members/add`,
  tasks: '/projects/tasks',
  taskNew: '/projects/tasks/new',
  taskDetail: (id: string | number) => `/projects/tasks/${id}`,
} as const

export function createProjectsRoutes<TParent extends AnyRoute>(appLayoutRoute: TParent) {
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
      path: '/projects/teams/$teamId/members',
      component: TeamMembersPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/teams/$teamId/members/add',
      component: TeamAddMemberPage,
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
