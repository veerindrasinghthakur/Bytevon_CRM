import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/feedback/EmptyState'

export function TeamsListPage() {
  return (
    <div>
      <PageHeader
        title="Teams"
        description="Project teams and members."
        actions={
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
          >
            New Team
          </Button>
        }
      />
      <EmptyState
        icon="groups"
        title="No teams yet"
        description="Teams will appear here once projects are staffed. Full Teams module is next."
        actionLabel="New Team"
      />
    </div>
  )
}