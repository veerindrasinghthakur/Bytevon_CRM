import { useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { NotesPanel } from '@/shared/components/notes/NotesPanel'
import { NoteReferenceType } from '@/shared/schema'
import { projectRoutes } from '../../routes'
import { projectNotes } from '../../data/notesMock'

/**
 * Project workspace notes.
 * Schema NoteReferenceType is LEAD | TASK | CLIENT only — project-level
 * notes are stored against a representative task id under the project.
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
      <NotesPanel
        className="max-w-3xl"
        referenceType={NoteReferenceType.TASK}
        referenceId={refId}
        initialNotes={projectNotes.filter(
          (n) =>
            n.reference_type === NoteReferenceType.TASK &&
            (refId === 0 || n.reference_id === refId),
        )}
      />
    </div>
  )
}
