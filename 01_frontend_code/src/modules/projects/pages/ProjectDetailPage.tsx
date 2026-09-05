import { useEffect } from 'react'
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
import { cn } from '@/shared/lib/cn'

const TABS: { id: ProjectDetailTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'team', label: 'Team' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'documents', label: 'Documents' },
  { id: 'notes', label: 'Notes' },
  { id: 'repository', label: 'Repository' },
]

const STATUS_TIMELINE: ProjectStatus[] = [...ProjectStatusValues]

export function ProjectDetailPage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { projectId?: string }
  const search = useSearch({ strict: false }) as { edit?: string; tab?: string }
  const id = Number(params.projectId)

  const initialTab = (TABS.find((t) => t.id === search.tab)?.id ?? 'overview') as ProjectDetailTab
  const detail = useProjectDetail(Number.isFinite(id) ? id : undefined, initialTab)
  const {
    project,
    isLoading,
    isError,
    refetch,
    tab,
    setTab,
    tasks,
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
    createTaskOpen,
    setCreateTaskOpen,
    taskStatusOptions,
    linkedTeam,
    activityItems,
  } = detail

  const { data: docsData, refetch: refetchDocs } = useDocuments({
    referenceType: 'PROJECT',
    referenceId: project?.id,
  })
  const uploadDoc = useUploadDocument()

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
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => void save()} isLoading={isSaving}>
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <RefreshButton iconOnly onClick={() => refetch()} />
              <ProjectStatusBadge status={project.status} />
              <EditButton onClick={startEditing} label="Edit Project" />
              <Button
                variant="outline"
                size="sm"
                leftIcon={<span className="material-symbols-outlined text-lg">group</span>}
                onClick={() => selectTab('team')}
              >
                Manage Team
              </Button>
            </div>
          )
        }
      />

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
              {t.id === 'tasks' && tasks.length > 0 && (
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                  {tasks.length}
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
              <MetricCard label="Teams" value={String(project.teamCount ?? (linkedTeam ? 1 : 0))} icon="groups" />
            </div>

            <section className="bv-surface p-6">
              <h3 className="text-title-md font-semibold mb-4">Project Description</h3>
              {isEditing ? (
                <textarea
                  rows={5}
                  {...form.register('description')}
                  onKeyDown={(e) => handleEnterAdvance(e)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                />
              ) : (
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>
              )}
            </section>

            <section className="bv-surface p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-title-md font-semibold">Assigned Team</h3>
                <button
                  type="button"
                  className="text-sm font-semibold text-secondary hover:underline"
                  onClick={() => selectTab('team')}
                >
                  View All
                </button>
              </div>
              {linkedTeam ? (
                <div className="flex items-center gap-4 p-4 border border-outline-variant rounded-lg bg-surface-container-low">
                  <div className="w-12 h-12 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined">engineering</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-on-surface">{linkedTeam.name}</h4>
                    <p className="text-xs text-on-surface-variant">
                      {linkedTeam.memberCount} Members · {linkedTeam.headName ?? 'No lead'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      safeNavigate(navigate, {
                        to: projectRoutes.teamDetailPath,
                        params: { teamId: String(linkedTeam.id) },
                      })
                    }
                  >
                    Team detail
                  </Button>
                </div>
              ) : (
                <p className="text-body-sm text-on-surface-variant">No team linked yet.</p>
              )}
            </section>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-primary text-on-primary p-5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-on-primary/60 mb-3">Client</h4>
              <p className="font-bold text-lg">{project.clientName ?? '—'}</p>
              {isEditing && (
                <input
                  {...form.register('clientName')}
                  className="mt-2 w-full px-2 py-1 rounded text-on-background text-sm"
                />
              )}
            </div>
            <section className="bv-surface p-5 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Key Dates</h4>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Start</span>
                <span className="font-semibold">{project.startDate ?? '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Target End</span>
                <span className="font-semibold">{project.endDate ?? '—'}</span>
              </div>
            </section>
            <ActivityFeed title="Recent Activity" items={activityItems} variant="compact" framed />
          </div>
        </div>
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
                <tbody className="divide-y divide-outline-variant">
                  {filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="cursor-pointer hover:bg-surface-container-low"
                      onClick={() =>
                        safeNavigate(navigate, {
                          to: projectRoutes.taskDetailPath,
                          params: { taskId: String(task.id) },
                        })
                      }
                    >
                      <td className="px-4 py-3 font-medium text-on-surface">{task.title}</td>
                      <td className="px-4 py-3">
                        <TaskPriorityLabel priority={task.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <TaskStatusBadge status={task.status} />
                      </td>
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

      {tab === 'team' && (
        <div className="space-y-6">
          <section className="bv-surface p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">groups</span>
                </div>
                <div>
                  <p className="text-lg font-bold">{linkedTeam?.name ?? 'No team assigned'}</p>
                  <p className="text-sm text-on-surface-variant">
                    {linkedTeam
                      ? `${linkedTeam.memberCount} members · Lead: ${linkedTeam.headName ?? '—'}`
                      : 'Link a team from Teams.'}
                  </p>
                </div>
              </div>
              {linkedTeam && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    safeNavigate(navigate, {
                      to: projectRoutes.teamDetailPath,
                      params: { teamId: String(linkedTeam.id) },
                    })
                  }
                >
                  Open team detail
                </Button>
              )}
            </div>
          </section>
        </div>
      )}

      {tab === 'timeline' && (
        <section className="bv-surface p-6 max-w-2xl">
          <h3 className="text-title-md font-semibold mb-6">Project status timeline</h3>
          <ol className="relative border-l-2 border-outline-variant ml-3 space-y-8">
            {STATUS_TIMELINE.map((s) => {
              const reached =
                STATUS_TIMELINE.indexOf(s) <= STATUS_TIMELINE.indexOf(project.status) &&
                project.status !== 'CANCELLED'
              const active = project.status === s
              return (
                <li key={s} className="ml-6 relative">
                  <span
                    className={cn(
                      'absolute -left-[1.9rem] top-0 w-8 h-8 rounded-full flex items-center justify-center',
                      active
                        ? 'bg-secondary text-on-primary'
                        : reached
                          ? 'bg-secondary/20 text-secondary'
                          : 'bg-surface-container text-on-surface-variant',
                    )}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {s === 'COMPLETED' ? 'check' : s === 'CANCELLED' ? 'close' : 'radio_button_checked'}
                    </span>
                  </span>
                  <p className={cn('font-semibold', active && 'text-secondary')}>{s.replace('_', ' ')}</p>
                  {active && <p className="text-xs text-on-surface-variant mt-1">Current status</p>}
                </li>
              )
            })}
          </ol>
          <div className="mt-8">
            <ActivityFeed title="Activity log" items={activityItems} framed={false} />
          </div>
        </section>
      )}

      {tab === 'documents' && (
        <section className="bv-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant flex justify-between items-center gap-3 flex-wrap">
            <h3 className="font-semibold text-title-md">Documents</h3>
            <UploadButton
              onFiles={(files) => {
                void uploadDoc.mutateAsync(files).then(() => refetchDocs())
              }}
              isLoading={uploadDoc.isPending}
            />
          </div>
          {(docsData?.items ?? []).length === 0 ? (
            <p className="p-8 text-center text-on-surface-variant text-sm">No documents yet.</p>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {(docsData?.items ?? []).map((doc) => (
                <li key={doc.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-on-surface truncate">{doc.name}</p>
                    <p className="text-xs text-on-surface-variant">{doc.sizeLabel ?? doc.type ?? '—'}</p>
                  </div>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-secondary hover:underline shrink-0"
                    >
                      Open
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'notes' && (
        <NotesPanel
          className="max-w-3xl"
          referenceType={NoteReferenceType.TASK}
          referenceId={project.id}
          title="Project notes"
        />
      )}

      {tab === 'repository' && (
        <section className="bv-surface p-6 space-y-4">
          <h3 className="text-title-md font-semibold">Repository</h3>
          {isEditing ? (
            <div className="space-y-3 max-w-xl">
              <div>
                <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="repo-url">
                  Git URL
                </label>
                <input
                  id="repo-url"
                  {...form.register('repositoryUrl')}
                  onKeyDown={(e) => handleEnterAdvance(e)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-sm font-mono focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="https://github.com/org/repo"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-on-surface-variant">Git URL</p>
              {project.repositoryUrl ? (
                <a
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-secondary font-mono text-sm hover:underline break-all"
                >
                  {project.repositoryUrl}
                </a>
              ) : (
                <p className="text-sm text-on-surface-variant">No repository linked.</p>
              )}
            </div>
          )}
        </section>
      )}

      <CreateTaskModal
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        projectId={project.id}
      />
    </div>
  )
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bv-surface p-4">
      <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center mb-3">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <p className="text-title-lg font-bold text-on-background">{value}</p>
    </div>
  )
}
