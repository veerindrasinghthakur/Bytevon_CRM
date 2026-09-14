import {
  QuickSection,
  QuickMetaTile,
  QuickRelatedRow,
  QuickPersonRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { TaskStatusBadge, TaskPriorityLabel } from './TaskStatusBadge'
import type { Task } from '../../types'

export function TaskQuickContent({ task }: { task: Task }) {
  return (
    <>
      <QuickSection title="General Info">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile icon="flag" label="Status" value={<TaskStatusBadge status={task.status} />} />
          <QuickMetaTile
            icon="priority_high"
            label="Priority"
            value={<TaskPriorityLabel priority={task.priority} />}
          />
          <QuickMetaTile icon="event" label="Due date" value={task.dueDate ?? '—'} />
          <QuickMetaTile icon="folder_open" label="Project" value={task.projectName ?? '—'} />
        </div>
      </QuickSection>
      <QuickSection title="Assignment">
        {task.assigneeName ? (
          <QuickPersonRow
            initials={task.assigneeName
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2)}
            roleLabel="Assignee"
            name={task.assigneeName}
          />
        ) : (
          <QuickRelatedRow icon="person_off" label="Assignee" value="Unassigned" />
        )}
      </QuickSection>
      <QuickSection title="Related">
        <QuickRelatedRow icon="folder_open" label="Project" value={task.projectName ?? '—'} />
        <QuickRelatedRow icon="event" label="Due" value={task.dueDate ?? '—'} />
        <QuickRelatedRow icon="title" label="Task" value={task.title} />
      </QuickSection>
    </>
  )
}
