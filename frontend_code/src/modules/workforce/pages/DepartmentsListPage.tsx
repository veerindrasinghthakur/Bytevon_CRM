import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/feedback/EmptyState'

export function DepartmentsListPage() {
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader
        title="Departments"
        description="Organization departments."
        actions={
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
            onClick={() => navigate({ to: '/workforce/departments/new' })}
          >
            New Department
          </Button>
        }
      />
      <EmptyState
        icon="domain"
        title="No departments yet"
        description="Create your first department."
        actionLabel="New Department"
        onAction={() => navigate({ to: '/workforce/departments/new' })}
      />
    </div>
  )
}
