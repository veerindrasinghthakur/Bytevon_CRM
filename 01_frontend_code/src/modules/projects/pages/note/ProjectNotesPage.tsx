import { useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { ProjectNotesTab } from '../../components/project/ProjectNotesTab'
import { projectRoutes } from '../../routes'

/**
 * Project workspace notes — live backend notes (GET/POST/PATCH
 * /projects/notes). Schema NoteReferenceType is LEAD | TASK | CLIENT only —
 * project-level notes are stored against a TASK reference carrying the
 * project id.
 */
export function ProjectNotesPage() {
  const { projectId } = useParams({ strict: false }) as { projectId: string }
  const refId = Number(projectId) || 0

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to={projectRoutes.projectDetail(Number(projectId))} label="Back to project" />
      <PageHeader
        title="Project notes"
        description={`Notes linked to work under project #${projectId}`}
      />
      <ProjectNotesTab projectId={refId} />
    </div>
  )
}
