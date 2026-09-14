import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useNavigate, useSearch } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { Select } from '@/shared/components/ui/Select'
import { RefreshButton } from '@/shared/components/ui/RefreshButton'
import { ActivityFeed } from '@/shared/components/ui/ActivityFeed'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { NotesPanel } from '@/shared/components/notes/NotesPanel'
import { UploadButton } from '@/shared/components/forms/UploadButton'
import { EntitySearch, type EntityOption } from '@/shared/components/forms/EntitySearch'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'
import { looseLinkProps, safeNavigate } from '@/shared/lib/safeNavigate'
import { NoteReferenceType } from '@/shared/schema'
import { useProjectDetail } from '../hooks/use-project-detail'
import type { ProjectDetailTab } from '../types'
import { useDocuments, useUploadDocument } from '../hooks/use-documents'
import { ProjectStatusBadge } from '../components/ProjectStatusBadge'
import { TaskStatusBadge, TaskPriorityLabel } from '../components/TaskStatusBadge'
import { CreateTaskModal } from '../components/CreateTaskModal'
import { projectRoutes } from '../routes'
import { ProjectStatus as ProjectStatusValues } from '../enums'
import type { ProjectStatus } from '../schemas/project'
import { getTeams } from '../api/teams'
import { listAuditLogs } from '@/modules/admin/api/audit'
import type { ActivityItem } from '@/shared/types'
import { cn } from '@/shared/lib/cn'

const TABS: { id: ProjectDetailTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'documents', label: 'Documents' },
  { id: 'notes', label: 'Notes' },
]

const STATUS_TIMELINE: ProjectStatus[] = [...ProjectStatusValues]

export function ProjectDetailPage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { projectId?: string }
  const search = useSearch({ strict: false }) as { edit?: string; tab?: string }
  const id = Number(params.projectId)

  const rawTab = search.tab as ProjectDetailTab | undefined
  const initialTab = (
    TABS.find((t) => t.id === rawTab)?.id ??
    (rawTab === 'timeline' || rawTab === 'repository' || rawTab === 'team' ? 'overview' : 'overview')
  ) as ProjectDetailTab
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard label="Open Tasks" value={String(openTasks)} icon="format_list_bulleted" />
              <MetricCard
                label="Days to Deadline"
                value={daysToDeadline != null ? String(daysToDeadline) : '—'}
                icon="calendar_today"
              />
              <MetricCard label="Progress" value={`${progress}%`} icon="speed" />
              <MetricCard label="Team members" value={String(project.teamMemberCount ?? 0)} icon="groups" />
            </div>

            <section className="bv-surface p-6">
              <h3 className="text-title-md font-semibold mb-4">Project Description</h3>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="proj-name">
                      Name
                    </label>
                    <input
                      id="proj-name"
                      {...form.register('name')}
                      onKeyDown={(e) => handleEnterAdvance(e)}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                    {form.formState.errors.name && (
                      <p className="text-body-sm text-error mt-1">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="proj-desc">
                      Description
                    </label>
                    <textarea
                      id="proj-desc"
                      rows={5}
                      {...form.register('description')}
                      onKeyDown={(e) => handleEnterAdvance(e)}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-label-sm text-on-surface-variant block mb-1">Start date</label>
                      <input
                        type="date"
                        {...form.register('startDate')}
                        className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface"
                      />
                    </div>
                    <div>
                      <label className="text-label-sm text-on-surface-variant block mb-1">Target end date</label>
                      <input
                        type="date"
                        {...form.register('endDate')}
                        className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>
              )}
            </section>

            <section className="bv-surface p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-title-md font-semibold">Assigned Team</h3>
                {!changingTeam && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setChangingTeam(true)}>
                    {hasTeam ? 'Change team' : 'Assign team'}
                  </Button>
                )}
              </div>

              {changingTeam ? (
                <div className="space-y-3">
                  <EntitySearch
                    label="Select team"
                    placeholder="Search teams…"
                    options={teamOptions}
                    value={selectedTeam}
                    onChange={setSelectedTeam}
                  />
                  {teamAssignError && (
                    <p className="text-body-sm text-error" role="alert">
                      {teamAssignError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={!selectedTeam || isAssigningTeam}
                      isLoading={isAssigningTeam}
                      onClick={() => {
                        if (!selectedTeam) return
                        void assignTeam(Number(selectedTeam.id))
                      }}
                    >
                      Assign
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"\end{parameter}>