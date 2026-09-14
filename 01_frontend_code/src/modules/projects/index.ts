export { createProjectsRoutes, projectRoutes } from './routes'
export type * from './types'

export { ProjectsListPage } from './pages/project/ProjectsListPage'
export { ProjectDetailPage } from './pages/project/ProjectDetailPage'
export { ProjectCreatePage } from './pages/project/ProjectCreatePage'
/** Teams UI is owned by Workforce — thin re-exports only */
export { TeamsListPage } from '@/modules/workforce/pages/TeamsListPage'
export { TeamDetailPage } from '@/modules/workforce/pages/TeamDetailPage'
export { TeamCreatePage } from './pages/team/TeamCreatePage'
export { TasksListPage } from './pages/task/TasksListPage'
export { TaskCreatePage } from './pages/task/TaskCreatePage'
export { TaskDetailPage } from './pages/task/TaskDetailPage'
export { DocumentsPage } from './pages/document/DocumentsPage'

export {
  getProjects,
  getProjectById,
  getProjectsForTeam,
  createProject,
  updateProject,
} from './api/project'

export { useProjects, useProject, useCreateProject, useUpdateProject } from './hooks/project/use-projects'
export { useProjectsList } from './hooks/project/use-projects'
export { useTasks, useTask, useCreateTask, useUpdateTask } from './hooks/task/use-tasks'
export { useTasksList } from './hooks/task/use-tasks'
export { useTeams, useTeam, useCreateTeam, useUpdateTeam } from './hooks/team/use-teams'
export { useTeamsList } from './hooks/team/use-teams'
export { useProjectDetail } from './hooks/project/use-project-detail'
export { useTaskDetail } from './hooks/task/use-task-detail'
export { useTeamDetail } from './hooks/team/use-team-detail'
export { useDocuments, useUploadDocument } from './hooks/document/use-documents'

export { CreateTaskModal } from './components/task/CreateTaskModal'
export { CreateTeamModal } from './components/team/CreateTeamModal'
export { ProjectTeamTab } from './components/project/ProjectTeamTab'
