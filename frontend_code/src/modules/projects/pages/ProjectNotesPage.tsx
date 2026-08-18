import { useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { NotesPanel } from '../components/NotesPanel'

export function ProjectNotesPage() {
  const { projectId } = useParams({ strict: false }) as { projectId: string }

  return (
    <div className="space-y-6">
      <BackButton to={`/projects/${projectId}`} label="Back to project" />
      <PageHeader
        title="Project notes"
        description={`Notes linked to project #${projectId}`}
      />
      <NotesPanel className="max-w-3xl" />
    </div>
  )
}
