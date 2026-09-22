/**
 * My Work quick-action tiles — single source (routes live in ./routes).
 * Labels/icons here are navigation config, not backend data.
 */
import { myWorkRoutes } from './routes'

export type QuickAction = {
  label: string
  to: string
  icon: string
}

export const MY_WORK_QUICK_ACTIONS: QuickAction[] = [
  { label: 'Apply Leave', to: myWorkRoutes.leaveApply, icon: 'event_available' },
  { label: 'Mark Attendance', to: myWorkRoutes.attendanceMark, icon: 'calendar_today' },
  { label: 'View Tasks', to: myWorkRoutes.tasks, icon: 'task_alt' },
  { label: 'Request Approval', to: myWorkRoutes.requests, icon: 'approval' },
  { label: 'Update Bank Details', to: myWorkRoutes.root, icon: 'account_balance' },
]
