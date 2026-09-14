import { createRoute, redirect } from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'
import { safeRedirectOpts } from '@/shared/lib/safeNavigate'

const ProjectsListPage = lazyPage(() => import('./pages/project/ProjectsListPage'), 'ProjectsListPage')
const ProjectDetailPage = lazyPage(() => import('./pages/project/ProjectDetailPage'), 'ProjectDetailPage')
const ProjectCreatePage = lazyPage(() => import('./pages/project/ProjectCreatePage'), 'ProjectCreatePage')
const TasksListPage = lazyPage(() => import('./pages/task/TasksListPage'), 'TasksListPage')
const TaskCreatePage = lazyPage(() => import('./pages/task/TaskCreatePage'), 'TaskCreatePage')
const TaskDetailPage = lazyPage(() => import('./pages/task/TaskDetailPage'), 'TaskDetailPage')
const DocumentsPage = lazyPage(() => import('./pages/document/DocumentsPage'), 'DocumentsPage')
const ProjectNotesPage = lazyPage(() => import('./pages/note/ProjectNotesPage'), 'ProjectNotesPage')

/**
 * Canonical path helpers.
 * Teams live under Workforce (single UI). projectRoutes.team* aliases point to
 * /workforce/teams so callers do not need dual paths.
 */
export const projectRoutes = {
  root: '/projects',
  list: '/projects',
  projectNew: '/projects/new',
  projectDetail: (id: string | number) => `/projects/${id}`,
  projectDetailPath: '/projects/$projectId',
  projectNotes: (id: string | number) => `/projects/${id}/notes`,
  projectNotesPath: '/projects/$projectId/notes',
  documents: '/projects/documents',
  /** Teams UI is workforce — these alias workforce paths */
  teams: '/workforce/teams',
  teamNew: '/workforce/teams/new',
  teamDetail: (id: string | number) => `/workforce/teams/${id}`,
  teamDetailPath: '/workforce/teams/$teamId',
  teamMembers: (id: string | number) => `/workforce/teams/${id}/members`,
  teamMembersPath: '/workforce/teams/$teamId/members',
  teamAddMember: (id: string | number) => `/workforce/teams/${id}/add-member`,
  teamAddMemberPath: '/workforce/teams/$teamId/add-member',
  tasks: '/projects/tasks',
  taskNew: '/projects/tasks/new',
  taskDetail: (id: string | number) => `/projects/tasks/${id}`,
  taskDetailPath: '/projects/tasks/$taskId',
} as const

function redirectTeams(to: string) {
  return () => {
    throw redirect(safeRedirectOpts({ to }))
  }
}

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
    // Legacy /projects/teams* → workforce (single Teams UI)
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/teams',
      beforeLoad: redirectTeams('/workforce/teams'),
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/teams/new',
      validateSearch: (search: Record<string, unknown>) => ({
        projectId: typeof search.projectId === 'string' ? search.projectId : undefined,
        returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
      }),
      beforeLoad: ({ search }) => {
        throw redirect(
          safeRedirectOpts({
            to: '/workforce/teams/new',
            search: {
              projectId: search.projectId,
              returnTo: search.returnTo,
            },
          }),
        )
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/teams/$teamId',
      beforeLoad: ({ params }) => {
        throw redirect(
          safeRedirectOpts({
            to: '/workforce/teams/$teamId',
            params: { teamId: String(params.teamId) },
          }),
        )
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/teams/$teamId/members',
      beforeLoad: ({ params }) => {
        throw redirect(
          safeRedirectOpts({
            to: '/workforce/teams/$teamId/members',
            params: { teamId: String(params.teamId) },
          }),
        )
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/teams/$teamId/members/add',
      beforeLoad: ({ params }) => {
        throw redirect(
          safeRedirectOpts({
            to: '/workforce/teams/$teamId/add-member',
            params: { teamId: String(params.teamId) },
          }),
        )
      },
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
