import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/feedback/EmptyState'

export function TasksListPage() {
  return (
    <div>
      <PageHeader
        title="Tasks"
        description="All project tasks."
        actions={
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
          >
            New Task
          </Button>
        }
      />
      <EmptyState
        icon="assignment"
        title="No tasks yet"
        description="Tasks will be listed here. Full Tasks module is next."
        actionLabel="New Task"
      />
    </div>
  )
}