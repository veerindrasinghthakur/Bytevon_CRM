export { createProjectsRoutes, projectRoutes } from './routes'
export type * from './types'

export { ProjectsListPage } from './pages/ProjectsListPage'
export { ProjectDetailPage } from './pages/ProjectDetailPage'
export { ProjectCreatePage } from './pages/ProjectCreatePage'
/** Teams UI is owned by Workforce — thin re-exports only */
export { TeamsListPage } from '@/modules/workforce/pages/TeamsListPage'
export { TeamDetailPage } from '@/modules/workforce/pages/TeamDetailPage'
export { TeamCreatePage } from './pages/TeamCreatePage'
export { TasksListPage } from './pages/TasksListPage'
export { TaskCreatePage } from './pages/TaskCreatePage'
export { TaskDetailPage } from './pages/TaskDetailPage'
export { DocumentsPage } from './pages/DocumentsPage'

export {
  getProjects,
  getProjectById,
  getProjectsForTeam,
  createProject,
  updateProject,
} from './api/projects'

export { useProjects, useProject, useCreateProject, useUpdateProject } from './hooks/use-projects'
export { useProjectsList } from './hooks/use-projects-list'
export { useTasks, useTask, useCreateTask, useUpdateTask } from './hooks/use-tasks'
export { useTasksList } from './hooks/use-tasks-list'
export { useTeams, useTeam, useCreateTeam, useUpdateTeam } from './hooks/use-teams'
export { useTeamsList } from './hooks/use-teams-list'
export { useProjectDetail } from './hooks/use-project-detail'
export { useTaskDetail } from './hooks/use-task-detail'
export { useTeamDetail } from './hooks/use-team-detail'
export { useDocuments, useUploadDocument } from './hooks/use-documents'

export { CreateTaskModal } from './components/CreateTaskModal'
export { CreateTeamModal } from './components/CreateTeamModal'
export { ProjectTeamTab } from './components/ProjectTeamTab'
