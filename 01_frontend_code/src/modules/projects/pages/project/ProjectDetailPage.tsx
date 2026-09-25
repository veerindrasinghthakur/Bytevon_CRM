import { useEffect } from 'react'
import { Link, useParams, useNavigate, useSearch } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { RefreshButton } from '@/shared/components/ui/RefreshButton'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { looseLinkProps, safeNavigate } from '@/shared/lib/safeNavigate'
import { useDeletedRedirect } from '@/shared/hooks/useDeletedRedirect'
import { useProjectDetail } from '../../hooks/project/use-project-detail'
import type { ProjectDetailTab } from '../../types'
import { ProjectStatusBadge } from '../../components/project/ProjectStatusBadge'
import { CreateTaskModal } from '../../components/task/CreateTaskModal'
import { PROJECT_DETAIL_TABS as TABS } from '../../components/project/project-detail-helpers'
import { ProjectDetailOverview } from '../../components/project/ProjectDetailOverview'
import { ProjectDetailTabNav } from '../../components/project/ProjectDetailTabNav'
import { ProjectDetailTasksTab } from '../../components/project/ProjectDetailTasksTab'
import { ProjectDetailDocumentsTab } from '../../components/project/ProjectDetailDocumentsTab'
import { ProjectNotesTab } from '../../components/project/ProjectNotesTab'
import { projectRoutes } from '../../routes'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

export function ProjectDetailPage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { projectId?: string }
  const search = useSearch({ strict: false }) as { edit?: string; tab?: string }
  const id = Number(params.projectId)

  const rawTab = search.tab as ProjectDetailTab | undefined
  const initialTab = (TABS.find((t) => t.id === rawTab)?.id ?? 'overview') as ProjectDetailTab
  const detail = useProjectDetail(Number.isFinite(id) ? id : undefined, initialTab)

  const {
    project,
    isLoading,
    isError,
    detailError,
    refetch,
    tab,
    setTab,
    tasksLoading,
    filteredTasks,
    taskStatusFilter,
    setTaskStatusFilter,
    taskSearch,
    setTaskSearch,
    openTasks,
    progress,
    daysToDeadline,
    isEditing,
    form,
    startEditing,
    save,
    cancelEdit,
    isSaving,
    saveError,
    createTaskOpen,
    setCreateTaskOpen,
    taskStatusOptions,
    changingTeam,
    setChangingTeam,
    assignTeam,
    teamAssignError,
    isAssigningTeam,
    teamOptions,
    selectedTeam,
    setSelectedTeam,
    hasTeam,
    activityItems,
    repoHref,
    docsData,
    docsLoading,
    uploadDoc,
    refetchDocs,
  } = detail

  useDeletedRedirect({ ready: !isLoading, data: project, error: detailError, listTo: projectRoutes.list })

  useEffect(() => {
    if (search.edit === '1' && project && !isEditing) startEditing()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.edit, project?.id])

  useEffect(() => {
    if (search.tab && TABS.some((t) => t.id === search.tab)) {
      setTab(search.tab as ProjectDetailTab)
    }
  }, [search.tab, setTab])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError || !project) {
    return (
      <div className="text-center py-16">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">folder_off</span>
        <h2 className="text-title-lg text-on-background mb-2">Project not found</h2>
        <Link {...looseLinkProps({ to: projectRoutes.list })}>
          <Button variant="outline">Back to Projects</Button>
        </Link>
      </div>
    )
  }

  const selectTab = (next: ProjectDetailTab) => {
    setTab(next)
    safeNavigate(navigate, {
      to: projectRoutes.projectDetailPath,
      params: { projectId: String(project.id) },
      search: { tab: next },
      replace: true,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={isEditing ? form.watch('name') || project.name : project.name}
        description={project.code ?? undefined}
        showBack
        backTo={projectRoutes.list}
        backLabel="Back to projects"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link {...looseLinkProps({ to: projectRoutes.list, className: 'hover:text-secondary' })}>
              Projects
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">{project.name}</span>
          </nav>
        }
        actions={
          isEditing ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={isSaving}>
                Cancel
              </Button>
              <Can action={Action.UPDATE} resource="project">
                <Button type="button" variant="primary" size="sm" onClick={() => void save()} isLoading={isSaving}>
                  Save
                </Button>
              </Can>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <ProjectStatusBadge status={project.status} />
              <Can action={Action.UPDATE} resource="project">
                <EditButton onClick={startEditing} label="Edit Project" />
              </Can>
              <RefreshButton iconOnly onClick={() => refetch()} />
            </div>
          )
        }
      />

      {saveError && (
        <p className="text-body-sm text-error" role="alert">
          {saveError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <span className="text-xs text-on-surface-variant">Progress: {progress}%</span>
        <div className="w-40 h-1.5 bg-surface-container rounded-full overflow-hidden">
          <div className="bg-secondary h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <ProjectDetailTabNav tab={tab} taskCount={project.taskCount} onSelect={selectTab} />

      {tab === 'overview' && (
        <ProjectDetailOverview
          project={project}
          openTasks={openTasks}
          progress={progress}
          daysToDeadline={daysToDeadline}
          isEditing={isEditing}
          form={form}
          hasTeam={hasTeam}
          changingTeam={changingTeam}
          setChangingTeam={setChangingTeam}
          teamOptions={teamOptions}
          selectedTeam={selectedTeam}
          setSelectedTeam={setSelectedTeam}
          teamAssignError={teamAssignError}
          isAssigningTeam={isAssigningTeam}
          assignTeam={assignTeam}
          activityItems={activityItems}
          repoHref={repoHref}
        />
      )}

      {tab === 'tasks' && (
        <ProjectDetailTasksTab
          tasksLoading={tasksLoading}
          filteredTasks={filteredTasks}
          taskSearch={taskSearch}
          setTaskSearch={setTaskSearch}
          taskStatusFilter={taskStatusFilter}
          setTaskStatusFilter={setTaskStatusFilter}
          taskStatusOptions={taskStatusOptions}
          onCreateTask={() => setCreateTaskOpen(true)}
        />
      )}

      {tab === 'documents' && (
        <ProjectDetailDocumentsTab
          docsLoading={docsLoading}
          documents={docsData?.items ?? []}
          uploadDoc={uploadDoc}
          onUploaded={() => void refetchDocs()}
        />
      )}

      {tab === 'notes' && <ProjectNotesTab projectId={project.id} />}

      <CreateTaskModal
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        projectId={project.id}
        projectName={project.name}
        onCreated={() => {
          setCreateTaskOpen(false)
          void refetch()
        }}
      />
    </div>
  )
}
