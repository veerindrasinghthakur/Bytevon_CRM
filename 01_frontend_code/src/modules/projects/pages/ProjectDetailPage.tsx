import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useNavigate, useSearch } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { Select } from '@/shared/components/ui/Select'
import { RefreshButton } from '@/shared/components/ui/RefreshButton'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { NotesPanel } from '@/shared/components/notes/NotesPanel'
import { UploadButton } from '@/shared/components/forms/UploadButton'
import type { EntityOption } from '@/shared/components/forms/EntitySearch'
import { looseLinkProps, safeNavigate } from '@/shared/lib/safeNavigate'
import { NoteReferenceType } from '@/shared/schema'
import { useProjectDetail } from '../hooks/use-project-detail'
import type { ProjectDetailTab } from '../types'
import { useDocuments, useUploadDocument } from '../hooks/use-documents'
import { ProjectStatusBadge } from '../components/ProjectStatusBadge'
import { TaskStatusBadge, TaskPriorityLabel } from '../components/TaskStatusBadge'
import { CreateTaskModal } from '../components/CreateTaskModal'
import { projectRoutes } from '../routes'
import { PROJECT_DETAIL_TABS as TABS } from '../components/project-detail-helpers'
import { ProjectDetailOverview } from '../components/ProjectDetailOverview'
import { getTeams } from '../api/teams'
import { listAuditLogs } from '@/modules/admin/api/audit'
import type { ActivityItem } from '@/shared/types'
import { cn } from '@/shared/lib/cn'

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
  } = detail

  const [teamOptions, setTeamOptions] = useState<EntityOption[]>([])
  const [selectedTeam, setSelectedTeam] = useState<EntityOption | null>(null)

  const {
    data: docsData,
    refetch: refetchDocs,
    isLoading: docsLoading,
  } = useDocuments({
    referenceType: 'PROJECT',
    referenceId: project?.id,
  })
  const uploadDoc = useUploadDocument({
    referenceType: 'PROJECT',
    referenceId: project?.id,
  })

  useEffect(() => {
    if (search.edit === '1' && project && !isEditing) startEditing()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.edit, project?.id])

  useEffect(() => {
    if (search.tab && TABS.some((t) => t.id === search.tab)) {
      setTab(search.tab as ProjectDetailTab)
    }
  }, [search.tab, setTab])

  const loadTeams = async () => {
    try {
      const { items } = await getTeams({ pageSize: 100 })
      setTeamOptions(
        (items ?? []).map((t) => ({
          id: String(t.id),
          label: t.name,
          sublabel: t.headName ? `Head: ${t.headName}` : undefined,
        })),
      )
    } catch {
      setTeamOptions([])
    }
  }

  useEffect(() => {
    if (changingTeam) {
      void loadTeams()
      setSelectedTeam(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changingTeam])

  const activityQuery = useQuery({
    queryKey: ['projects', 'activity', project?.id],
    queryFn: () => listAuditLogs({ limit: 40 }),
    enabled: project?.id != null,
    staleTime: 30_000,
  })

  const activityItems: ActivityItem[] = useMemo(() => {
    const logs = activityQuery.data ?? []
    const pid = project?.id
    const pname = (project?.name ?? '').toLowerCase()
    const filtered = logs.filter((l) => {
      if (pid != null && l.referenceId === pid) return true
      const blob = `${l.description} ${l.target} ${l.referenceType} ${l.module}`.toLowerCase()
      if (pname && blob.includes(pname)) return true
      if (pid != null && blob.includes(`#${pid}`)) return true
      return false
    })
    const source = filtered.length > 0 ? filtered : logs.slice(0, 8)
    return source.slice(0, 12).map((l) => ({
      id: l.id,
      title: l.action.replace(/_/g, ' '),
      description: l.description || l.target,
      timestamp: l.timestamp,
      actor: l.actor,
      icon: l.action.includes('CREATE')
        ? 'add_circle'
        : l.action.includes('UPDATE') || l.action.includes('STATUS')
          ? 'edit'
          : l.action.includes('ASSIGN')
            ? 'group'
            : 'history',
    }))
  }, [activityQuery.data, project?.id, project?.name])

  const repoHref = project?.repositoryUrl
    ? project.repositoryUrl.startsWith('http')
      ? project.repositoryUrl
      : `https://github.com/${project.repositoryUrl}`
    : null

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

  const hasTeam = Boolean(project.teamName || project.teamId)

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
              <Button type="button" variant="primary" size="sm" onClick={() => void save()} isLoading={isSaving}>
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <ProjectStatusBadge status={project.status} />
              <EditButton onClick={startEditing} label="Edit Project" />
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

      <div className="border-b border-outline-variant">
        <nav className="flex flex-wrap gap-1 -mb-px">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTab(t.id)}
              className={cn(
                'px-4 py-3 text-sm font-semibold border-b-2 transition-colors',
                tab === t.id
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface',
              )}
            >
              {t.label}
              {t.id === 'tasks' && (project.taskCount ?? 0) > 0 && (
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                  {project.taskCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

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
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                search
              </span>
              <input
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-outline-variant bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <Select
              value={taskStatusFilter}
              onChange={setTaskStatusFilter}
              placeholder="All statuses"
              options={taskStatusOptions.map((o) => ({ value: o.value, label: o.label }))}
              minWidthClass="min-w-[160px]"
            />
            <Button
              variant="primary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
              onClick={() => setCreateTaskOpen(true)}
            >
              New Task
            </Button>
          </div>

          {tasksLoading && <Skeleton className="h-40 w-full" />}
          {!tasksLoading && filteredTasks.length === 0 && (
            <p className="text-center text-on-surface-variant py-12">No tasks match filters.</p>
          )}
          {!tasksLoading && filteredTasks.length > 0 && (
            <div className="bv-surface overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low/50">
                    <th className="px-4 py-3 text-[11px] font-bold uppercase text-on-surface-variant">Task</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase text-on-surface-variant">Priority</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase text-on-surface-variant">Status</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase text-on-surface-variant">Assignee</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase text-on-surface-variant">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-outline-variant hover:bg-surface-container-low/40 cursor-pointer"
                      onClick={() =>
                        safeNavigate(navigate, {
                          to: projectRoutes.taskDetailPath,
                          params: { taskId: String(task.id) },
                        })
                      }
                    >
                      <td className="px-4 py-3 text-sm font-medium">{task.title}</td>
                      <td className="px-4 py-3"><TaskPriorityLabel priority={task.priority} /></td>
                      <td className="px-4 py-3"><TaskStatusBadge status={task.status} /></td>
                      <td className="px-4 py-3 text-sm">{task.assigneeName ?? '—'}</td>
                      <td className="px-4 py-3 text-sm">{task.dueDate ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'documents' && (
        <section className="bv-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant flex justify-between items-center gap-3 flex-wrap">
            <h3 className="font-semibold text-title-md">Documents</h3>
            <UploadButton
              onFiles={(files) => {
                void uploadDoc.mutateAsync(files).then(() => refetchDocs()).catch(() => {})
              }}
              isLoading={uploadDoc.isPending}
            />
          </div>
          {uploadDoc.isError && (
            <p className="px-5 py-2 text-body-sm text-error" role="alert">
              Failed to upload document.
            </p>
          )}
          {docsLoading ? (
            <p className="p-8 text-center text-on-surface-variant text-sm">Loading documents…</p>
          ) : (docsData?.items ?? []).length === 0 ? (
            <p className="p-8 text-center text-on-surface-variant text-sm">No documents linked yet.</p>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {(docsData?.items ?? []).map((doc) => (
                <li key={doc.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{doc.name}</p>
                    <p className="text-xs text-on-surface-variant">{doc.sizeLabel ?? doc.type ?? '—'}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'notes' && (
        <NotesPanel
          className="max-w-3xl"
          referenceType={NoteReferenceType.CLIENT}
          referenceId={project.id}
          title="Project notes"
        />
      )}

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
