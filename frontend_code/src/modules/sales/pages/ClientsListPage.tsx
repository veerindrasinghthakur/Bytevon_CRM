import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/feedback/EmptyState'

export function ClientsListPage() {
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader
        title="Clients"
        description="Manage client accounts."
        actions={
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
            onClick={() => navigate({ to: '/sales/clients/new' })}
          >
            New Client
          </Button>
        }
      />
      <EmptyState
        icon="handshake"
        title="No clients yet"
        description="Create your first client record."
        actionLabel="New Client"
        onAction={() => navigate({ to: '/sales/clients/new' })}
      />
    </div>
  )
}
