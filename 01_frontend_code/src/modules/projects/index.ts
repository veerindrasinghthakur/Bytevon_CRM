export { createProjectsRoutes, projectRoutes } from './routes'
export type * from './types'

export { ProjectsListPage } from './pages/project/ProjectsListPage'
export { ProjectDetailPage } from './pages/project/ProjectDetailPage'
export { ProjectCreatePage } from './pages/project/ProjectCreatePage'
/** Teams UI owned by Projects */
export { TeamsListPage } from './pages/team/TeamsListPage'
export { TeamDetailPage } from './pages/team/TeamDetailPage'
export { TeamCreatePage } from './pages/team/TeamCreatePage'
export { TeamEditPage } from './pages/team/TeamEditPage'
export { TeamMembersPage } from './pages/team/TeamMembersPage'
export { TeamProjectsPage } from './pages/team/TeamProjectsPage'
export { AssignProjectPage } from './pages/team/AssignProjectPage'
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
export { TeamTopView } from './components/team/TeamTopView'
