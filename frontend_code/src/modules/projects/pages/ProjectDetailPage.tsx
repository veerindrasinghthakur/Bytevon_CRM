import { Link, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { useProject } from '../hooks/use-projects'
import { ProjectStatusBadge } from '../components/ProjectStatusBadge'

export function ProjectDetailPage() {
  // Use loose params so we don't depend on route id string
  const params = useParams({ strict: false }) as { projectId?: string }
  const id = Number(params.projectId)
  const { data: project, isLoading, isError, refetch } = useProject(
    Number.isFinite(id) ? id : undefined
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
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
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

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.code}
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to="/projects" className="hover:text-electric-blue">Projects</Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">{project.name}</span>
          </nav>
        }
        actions={
          <Button variant="outline" leftIcon={<span className="material-symbols-outlined text-lg">edit</span>}>
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
                {project.teamCount ?? 0} teams · {project.taskCount ?? 0} tasks
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
