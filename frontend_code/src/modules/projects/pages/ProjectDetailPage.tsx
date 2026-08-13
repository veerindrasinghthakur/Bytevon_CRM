import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate, useSearch } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { useProject, useUpdateProject } from '../hooks/use-projects'
import { useTasks } from '../hooks/use-tasks'
import { ProjectStatusBadge } from '../components/ProjectStatusBadge'
import { TaskStatusBadge, TaskPriorityLabel } from '../components/TaskStatusBadge'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'

export function ProjectDetailPage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { projectId?: string }
  const search = useSearch({ strict: false }) as { edit?: string }
  const id = Number(params.projectId)
  const { data: project, isLoading, isError, refetch } = useProject(
    Number.isFinite(id) ? id : undefined
  )
  const { data: tasksData, isLoading: tasksLoading } = useTasks(
    Number.isFinite(id) ? { projectId: id } : undefined
  )
  const updateMutation = useUpdateProject()

  const [editing, setEditing] = useState(search.edit === '1')
  const [draft, setDraft] = useState({
    name: '',
    description: '',
    clientName: '',
    repositoryUrl: '',
  })

  useEffect(() => {
    if (project) {
      setDraft({
        name: project.name,
        description: project.description ?? '',
        clientName: project.clientName ?? '',
        repositoryUrl: project.repositoryUrl ?? '',
      })
      setEditing(search.edit === '1')
    }
  }, [project, search.edit])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-error/30 bg-error/5 p-6 text-center">
        <p className="text-body-md text-error mb-3">Failed to load project.</p>
        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">folder_off</span>
        <h2 className="text-title-lg text-on-background mb-2">Project not found</h2>
        <p className="text-body-md text-on-surface-variant mb-6">This project does not exist or was removed.</p>
        <Link to="/projects">
          <Button variant="outline">Back to Projects</Button>
        </Link>
      </div>
    )
  }

  const tasks = tasksData?.items ?? []

  const startEdit = () => {
    setDraft({
      name: project.name,
      description: project.description ?? '',
      clientName: project.clientName ?? '',
      repositoryUrl: project.repositoryUrl ?? '',
    })
    setEditing(true)
  }

  const cancelEdit = () => setEditing(false)

  const saveEdit = () => {
    updateMutation.mutate(
      {
        id: project.id,
        patch: {
          name: draft.name,
          description: draft.description,
          clientName: draft.clientName,
          repositoryUrl: draft.repositoryUrl || null,
        },
      },
      { onSuccess: () => setEditing(false) }
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={editing ? draft.name || project.name : project.name}
        description={project.code}
        showBack
        backTo="/projects"
        backLabel="Back to projects"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to="/projects" className="hover:text-electric-blue">Projects</Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">{project.name}</span>
          </nav>
        }
        actions={
          editing ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                onClick={saveEdit}
                isLoading={updateMutation.isPending}
              >
                Save
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              leftIcon={<span className="material-symbols-outlined text-lg">edit</span>}
              onClick={startEdit}
            >
              Edit
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title-lg text-on-background">Overview</h3>
              {!editing && (
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container"
                  aria-label="Edit overview"
                  onClick={startEdit}
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="edit-name">Project name</label>
                  <input
                    id="edit-name"
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    onKeyDown={(e) => handleEnterAdvance(e)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-electric-blue"
                  />
                </div>
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="edit-desc">Description</label>
                  <textarea
                    id="edit-desc"
                    rows={4}
                    value={draft.description}
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                    onKeyDown={(e) => handleEnterAdvance(e)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-electric-blue resize-none"
                  />
                </div>
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="edit-repo">Repository URL</label>
                  <input
                    id="edit-repo"
                    value={draft.repositoryUrl}
                    onChange={(e) => setDraft((d) => ({ ...d, repositoryUrl: e.target.value }))}
                    onKeyDown={(e) => handleEnterAdvance(e)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="text-body-md text-on-surface-variant">
                  {project.description || 'No description provided.'}
                </p>
                {project.repositoryUrl && (
                  <a
                    href={project.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-electric-blue text-body-sm hover:underline"
                  >
                    <span className="material-symbols-outlined text-lg">code</span>
                    Repository
                  </a>
                )}
              </>
            )}
          </section>

          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <div>
                <h3 className="text-title-lg text-on-background">Tasks</h3>
                <p className="text-body-sm text-on-surface-variant mt-0.5">Work items belonging to this project</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
                onClick={() =>
                  navigate({
                    to: '/projects/tasks/new',
                    search: { projectId: String(project.id) } as never,
                  })
                }
              >
                New Task
              </Button>
            </div>

            {tasksLoading && (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}

            {!tasksLoading && tasks.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-body-md text-on-surface-variant mb-3">No tasks on this project yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate({
                      to: '/projects/tasks/new',
                      search: { projectId: String(project.id) } as never,
                    })
                  }
                >
                  Create first task
                </Button>
              </div>
            )}

            {!tasksLoading && tasks.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface/50">
                      <th className="px-6 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Task</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Priority</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Assignee</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {tasks.map((task) => (
                      <tr key={task.id} className="h-14">
                        <td className="px-6 py-2">
                          <p className="text-body-md font-medium text-on-surface">{task.title}</p>
                        </td>
                        <td className="px-4 py-2">
                          <TaskPriorityLabel priority={task.priority} />
                        </td>
                        <td className="px-4 py-2">
                          <TaskStatusBadge status={task.status} />
                        </td>
                        <td className="px-4 py-2 text-body-md text-on-surface">{task.assigneeName ?? '—'}</td>
                        <td className="px-4 py-2 text-body-md text-on-surface">{task.dueDate ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
            <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-3">Status</h3>
            <ProjectStatusBadge status={project.status} />
          </section>
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 space-y-3">
            <div>
              <p className="text-label-sm text-on-surface-variant">Client</p>
              {editing ? (
                <input
                  value={draft.clientName}
                  onChange={(e) => setDraft((d) => ({ ...d, clientName: e.target.value }))}
                  onKeyDown={(e) => handleEnterAdvance(e)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-electric-blue"
                />
              ) : (
                <p className="text-body-md text-on-surface">{project.clientName ?? '—'}</p>
              )}
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Progress</p>
              <p className="text-body-md text-on-surface">{project.progress ?? 0}%</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Teams / Tasks</p>
              <p className="text-body-md text-on-surface">
                {project.teamCount ?? 0} teams · {tasksData?.total ?? project.taskCount ?? 0} tasks
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
