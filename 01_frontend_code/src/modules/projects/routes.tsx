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

/** Teams UI is owned by Projects module */
const TeamsListPage = lazyPage(() => import('./pages/team/TeamsListPage'), 'TeamsListPage')
const TeamCreatePage = lazyPage(() => import('./pages/team/TeamCreatePage'), 'TeamCreatePage')
const TeamDetailPage = lazyPage(() => import('./pages/team/TeamDetailPage'), 'TeamDetailPage')
const TeamEditPage = lazyPage(() => import('./pages/team/TeamEditPage'), 'TeamEditPage')
const TeamMembersPage = lazyPage(() => import('./pages/team/TeamMembersPage'), 'TeamMembersPage')
const TeamProjectsPage = lazyPage(() => import('./pages/team/TeamProjectsPage'), 'TeamProjectsPage')
const AssignProjectPage = lazyPage(() => import('./pages/team/AssignProjectPage'), 'AssignProjectPage')
/** Add-member shared with workforce departments */
const AddMemberPage = lazyPage(() => import('@/modules/workforce/pages/AddMemberPage'), 'AddMemberPage')

/**
 * Canonical path helpers. Teams live under /projects/teams.
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
  teams: '/projects/teams',
  teamNew: '/projects/teams/new',
  teamDetail: (id: string | number) => `/projects/teams/${id}`,
  teamDetailPath: '/projects/teams/$teamId',
  teamEdit: (id: string | number) => `/projects/teams/${id}/edit`,
  teamEditPath: '/projects/teams/$teamId/edit',
  teamMembers: (id: string | number) => `/projects/teams/${id}/members`,
  teamMembersPath: '/projects/teams/$teamId/members',
  teamProjects: (id: string | number) => `/projects/teams/${id}/projects`,
  teamProjectsPath: '/projects/teams/$teamId/projects',
  teamAssignProject: (id: string | number) => `/projects/teams/${id}/assign-project`,
  teamAssignProjectPath: '/projects/teams/$teamId/assign-project',
  teamAddMember: (id: string | number) => `/projects/teams/${id}/add-member`,
  teamAddMemberPath: '/projects/teams/$teamId/add-member',
  tasks: '/projects/tasks',
  taskNew: '/projects/tasks/new',
  taskDetail: (id: string | number) => `/projects/tasks/${id}`,
  taskDetailPath: '/projects/tasks/$taskId',
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
    // Teams UI (owned by projects)
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/teams',
      component: TeamsListPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/teams/new',
      validateSearch: (search: Record<string, unknown>) => ({
        projectId: typeof search.projectId === 'string' ? search.projectId : undefined,
        returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
      }),
      component: TeamCreatePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/teams/$teamId',
      component: TeamDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/teams/$teamId/edit',
      component: TeamEditPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/teams/$teamId/members',
      component: TeamMembersPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/teams/$teamId/projects',
      component: TeamProjectsPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/teams/$teamId/assign-project',
      component: AssignProjectPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/projects/teams/$teamId/add-member',
      component: AddMemberPage,
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
