import { useMemo, useState } from 'react'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { useProject, useUpdateProject } from './use-projects'
import { useTasks } from './use-tasks'
import type { ProjectDetail } from '../schemas/project'
import type { TaskStatus } from '../types'

export type ProjectDetailTab =
  | 'overview'
  | 'tasks'
  | 'team'
  | 'timeline'
  | 'documents'
  | 'notes'
  | 'repository'

export interface ProjectDetailDraft {
  name: string
  description: string
  clientName: string
  repositoryUrl: string
}

function toDraft(p: ProjectDetail): ProjectDetailDraft {
  return {
    name: p.name,
    description: p.description ?? '',
    clientName: p.clientName ?? '',
    repositoryUrl: p.repositoryUrl ?? '',
  }
}

export function useProjectDetail(projectId: number | undefined, initialTab: ProjectDetailTab = 'overview') {
  const query = useProject(projectId)
  const tasksQuery = useTasks(projectId != null ? { projectId } : undefined)
  const updateMutation = useUpdateProject()

  const [tab, setTab] = useState<ProjectDetailTab>(initialTab)
  const [taskStatusFilter, setTaskStatusFilter] = useState('')
  const [taskSearch, setTaskSearch] = useState('')
  const [createTaskOpen, setCreateTaskOpen] = useState(false)

  const edit = useEditMode<ProjectDetailDraft>({
    initial: {
      name: '',
      description: '',
      clientName: '',
      repositoryUrl: '',
    },
  })

  // Seed draft when project loads / edit starts
  const project = query.data ?? null
  if (project && !edit.isEditing && edit.draft.name === '' && project.name) {
    // lightweight seed on first paint without effect — callers call seedOnLoad
  }

  const seedFromProject = () => {
    if (project) edit.reset(toDraft(project))
  }

  const startEditing = () => {
    if (project) {
      edit.startEditing(toDraft(project))
    }
  }

  const save = async () => {
    if (!project) return
    await updateMutation.mutateAsync({
      id: project.id,
      patch: {
        name: edit.draft.name,
        description: edit.draft.description,
        clientName: edit.draft.clientName,
        repositoryUrl: edit.draft.repositoryUrl || null,
      },
    })
    edit.stopEditing()
  }

  const tasks = tasksQuery.data?.items ?? []
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskStatusFilter && t.status !== taskStatusFilter) return false
      if (taskSearch) {
        const q = taskSearch.toLowerCase()
        if (!t.title.toLowerCase().includes(q) && !(t.assigneeName ?? '').toLowerCase().includes(q))
          return false
      }
      return true
    })
  }, [tasks, taskStatusFilter, taskSearch])

  const openTasks = tasks.filter((t) => t.status !== 'DONE').length
  const progress = project?.progress ?? 0
  const daysToDeadline = project?.endDate
    ? Math.max(0, Math.ceil((new Date(project.endDate).getTime() - Date.now()) / 86400000))
    : null

  return {
    project,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch()
      void tasksQuery.refetch()
    },
    tab,
    setTab,
    tasks,
    tasksLoading: tasksQuery.isLoading,
    filteredTasks,
    taskStatusFilter,
    setTaskStatusFilter: setTaskStatusFilter as (v: string) => void,
    taskSearch,
    setTaskSearch,
    openTasks,
    progress,
    daysToDeadline,
    edit,
    startEditing,
    save,
    cancelEdit: () => {
      seedFromProject()
      edit.stopEditing()
    },
    isSaving: updateMutation.isPending,
    createTaskOpen,
    setCreateTaskOpen,
    taskStatusOptions: [
      { value: '', label: 'All statuses' },
      { value: 'TODO', label: 'To do' },
      { value: 'IN_PROGRESS', label: 'In progress' },
      { value: 'IN_REVIEW', label: 'In review' },
      { value: 'DONE', label: 'Done' },
      { value: 'BLOCKED', label: 'Blocked' },
      { value: 'ON_HOLD', label: 'On hold' },
    ] as { value: TaskStatus | ''; label: string }[],
  }
}
