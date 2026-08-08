import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/feedback/EmptyState'

export function EmployeesListPage() {
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage workforce employees."
        actions={
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
            onClick={() => navigate({ to: '/workforce/employees/new' })}
          >
            New Employee
          </Button>
        }
      />
      <EmptyState
        icon="badge"
        title="No employees yet"
        description="Add your first employee to the directory."
        actionLabel="New Employee"
        onAction={() => navigate({ to: '/workforce/employees/new' })}
      />
    </div>
  )
}
