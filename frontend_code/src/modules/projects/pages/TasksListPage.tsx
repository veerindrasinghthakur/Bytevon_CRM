import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/feedback/EmptyState'

export function TasksListPage() {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="All project tasks."
        actions={
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
            onClick={() => navigate({ to: '/projects/tasks/new' })}
          >
            New Task
          </Button>
        }
      />
      <EmptyState
        icon="assignment"
        title="No tasks yet"
        description="Create your first task to start tracking work."
        actionLabel="New Task"
        onAction={() => navigate({ to: '/projects/tasks/new' })}
      />
    </div>
  )
}
