import { useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { NotesPanel } from '@/shared/components/notes/NotesPanel'
import { defaultProjectNotes } from '@/shared/data/notesMock'

export function ProjectNotesPage() {
  const { projectId } = useParams({ strict: false }) as { projectId: string }
  const refId = Number(projectId) || 0

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to={`/projects/${projectId}`} label="Back to project" />
      <PageHeader
        title="Project notes"
        description={`Notes linked to project #${projectId}`}
      />
      <NotesPanel
        className="max-w-3xl"
        referenceType="PROJECT"
        referenceId={refId}
        initialNotes={defaultProjectNotes.filter(
          (n) => n.reference_type === 'PROJECT' && (refId === 0 || n.reference_id === refId),
        )}
      />
    </div>
  )
}
