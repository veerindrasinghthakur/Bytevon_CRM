import { Link, useParams, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { useProject } from '../hooks/use-projects'
import { useTasks } from '../hooks/use-tasks'
import { ProjectStatusBadge } from '../components/ProjectStatusBadge'
import { TaskStatusBadge, TaskPriorityLabel } from '../components/TaskStatusBadge'

export function ProjectDetailPage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { projectId?: string }
  const id = Number(params.projectId)
  const { data: project, isLoading, isError, refetch } = useProject(
    Number.isFinite(id) ? id : undefined
  )
  const { data: tasksData, isLoading: tasksLoading } = useTasks(
    Number.isFinite(id) ? { projectId: id } : undefined
  )

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

  return (
    <div className="space-y-8">
      <PageHeader
        title={project.name}
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
          <Button
            variant="outline"
            leftIcon={<span className="material-symbols-outlined text-lg">edit</span>}
            onClick={() => console.info('Edit project', project.id)}
          >
            Edit
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
            <h3 className="text-title-lg text-on-background mb-4">Overview</h3>
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
          </section>

          {/* Tasks are sub-parts of this project */}
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <div>
                <h3 className="text-title-lg text-on-background">Tasks</h3>
                <p className="text-body-sm text-on-surface-variant mt-0.5">
                  Work items belonging to this project
                </p>
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
                        <td className="px-4 py-2 text-body-md text-on-surface">
                          {task.assigneeName ?? '—'}
                        </td>
                        <td className="px-4 py-2 text-body-md text-on-surface">
                          {task.dueDate ?? '—'}
                        </td>
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
              <p className="text-body-md text-on-surface">{project.clientName ?? '—'}</p>
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
