import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/feedback/EmptyState'

export function LeadsListPage() {
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader
        title="Leads"
        description="Track and manage sales leads."
        actions={
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
            onClick={() => navigate({ to: '/sales/leads/new' })}
          >
            New Lead
          </Button>
        }
      />
      <EmptyState
        icon="person_search"
        title="No leads yet"
        description="Create your first lead to start the sales pipeline."
        actionLabel="New Lead"
        onAction={() => navigate({ to: '/sales/leads/new' })}
      />
    </div>
  )
}
