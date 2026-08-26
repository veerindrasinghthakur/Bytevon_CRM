/** Central enum definitions for my-work module — imported by pages/components. */

export const priorityClass: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800',
  High: 'bg-red-50 text-red-700',
  Medium: 'bg-surface-container-high text-on-surface-variant',
  Low: 'bg-surface-container text-on-surface-variant',
}

export const statusDot: Record<string, string> = {
  'In Progress': 'bg-secondary',
  Pending: 'bg-outline',
  'Not Started': 'bg-outline',
  Completed: 'bg-emerald-500',
  Blocked: 'bg-orange-500',
}

export const statusStyles: Record<string, string> = {
  'In-Progress': 'bg-amber-50 text-amber-700 border-amber-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
}

export const attendanceStatusStyles: Record<string, string> = {
  Present: 'bg-emerald-50 text-emerald-700',
  Absent: 'bg-red-50 text-red-700',
  'Half Day': 'bg-amber-50 text-amber-800',
  'On Leave': 'bg-blue-50 text-blue-700',
  Holiday: 'bg-violet-50 text-violet-700',
  Weekend: 'bg-surface-container text-on-surface-variant',
}