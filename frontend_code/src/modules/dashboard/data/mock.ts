export const executiveKpis = [
  { label: 'Employees', value: '1,482', trend: '+4.2%', up: true, icon: 'groups' },
  { label: 'Attendance', value: '96.8%', trend: '+0.5%', up: true, icon: 'how_to_reg' },
  { label: 'Leave Requests', value: '14', trend: '-2.1%', up: false, icon: 'event_busy' },
  { label: 'Revenue', value: '$42.8M', trend: '+12.4%', up: true, icon: 'payments' },
  { label: 'Open Tasks', value: '245', trend: '+8%', up: true, icon: 'task_alt' },
]

export const executiveQuickActions = [
  { label: 'Add Employee', icon: 'person_add', to: '/workforce/employees/new' },
  { label: 'Create Invoice', icon: 'receipt_long', to: '/dashboard' },
  { label: 'New Task', icon: 'assignment', to: '/projects/tasks/new' },
  { label: 'Schedule Meet', icon: 'event', to: '/dashboard' },
  { label: 'Import Data', icon: 'upload_file', to: '/dashboard' },
  { label: 'View All', icon: 'more_horiz', to: '/dashboard' },
]

export const executivePending = [
  { name: 'Sarah Chen', detail: 'Annual Leave • 3 Days', initials: 'SC' },
  { name: 'Marcus Miller', detail: 'Expense Claim • $1,240', initials: 'MM' },
  { name: 'Elena Rossi', detail: 'Training Request • AI Ethics', initials: 'ER' },
]

/** ActivityFeed-compatible items for executive dashboard */
export const executiveActivities = [
  {
    id: 'act-1',
    icon: 'person_add',
    title: 'New employee onboarded',
    description: 'Jordan Smith added to Engineering team',
    timestamp: '10m ago',
    badge: 'HR',
  },
  {
    id: 'act-2',
    icon: 'security',
    title: 'Security Policy Updated',
    description: '2FA enforcement enabled for all Admin accounts',
    timestamp: '1h ago',
    badge: 'AUTH',
  },
  {
    id: 'act-3',
    icon: 'database',
    title: 'Cloud Backup Completed',
    description: 'ERP primary database successfully mirrored to AWS-West',
    timestamp: '4h ago',
    badge: 'SYSTEM',
  },
]

export const executiveMeta = {
  greetingName: 'Alex',
  dateLine:
    'Today is October 24th. You have 3 pending employee approvals and your quarterly revenue targets are trending 12% above forecast. Systems are optimal.',
  uptime: '99.98%',
  activeUsers: '1,242',
  attendanceBars: [40, 55, 45, 70, 60, 80, 65, 75, 85, 70],
  revenueBars: [60, 85, 45, 70, 95, 55, 80, 90, 65, 100],
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
}

export const employeeQuickActions = [
  { label: 'Mark Attendance', icon: 'fingerprint', to: '/my-work/attendance/mark' },
  { label: 'Apply Leave', icon: 'event_available', to: '/my-work/leave/apply' },
  { label: 'View Payslip', icon: 'receipt_long', to: '/dashboard/employee' },
  { label: 'View Tasks', icon: 'task', to: '/my-work/tasks' },
  { label: 'Update Profile', icon: 'person_edit', to: '/profile' },
]

export const employeeKpis = [
  { label: 'Attendance', value: '98%', note: '+2% this month', icon: 'trending_up', color: 'text-secondary' },
  {
    label: 'Rem. Leave',
    value: '12 Days',
    note: 'Expiring Dec 31',
    icon: 'event_note',
    color: 'text-on-surface-variant',
  },
  { label: 'Pending Leave', value: '1', note: 'Awaiting Manager', icon: 'hourglass_empty', color: 'text-error' },
  {
    label: 'Assigned Tasks',
    value: '5',
    note: '2 due this week',
    icon: 'assignment_turned_in',
    color: 'text-secondary',
  },
  {
    label: 'Notifications',
    value: '3',
    note: 'Unread priority',
    icon: 'notifications_active',
    color: 'text-secondary',
  },
]

export const employeeTasks = [
  { name: 'Mobile App Wireframe Review', priority: 'High', due: 'Oct 25, 2024', status: 'In Progress', est: '8h' },
  {
    name: 'Quarterly Design System Audit',
    priority: 'Medium',
    due: 'Oct 30, 2024',
    status: 'Pending',
    est: '24h',
  },
  {
    name: 'Client Meeting: Feedback Integration',
    priority: 'High',
    due: 'Oct 26, 2024',
    status: 'Not Started',
    est: '4h',
  },
  {
    name: 'Accessibility Guidelines Update',
    priority: 'Low',
    due: 'Nov 05, 2024',
    status: 'Pending',
    est: '12h',
  },
]

export const employeeLeaveSummary = [
  { name: 'Casual Leave', used: '4 used out of 10', left: 6, border: 'border-secondary', color: 'text-secondary' },
  { name: 'Sick Leave', used: '2 used out of 8', left: 6, border: 'border-secondary/50', color: 'text-secondary' },
  {
    name: 'Earned Leave',
    used: '6 used out of 12',
    left: 6,
    border: 'border-outline',
    color: 'text-on-surface-variant',
  },
]

export const employeeMeta = {
  firstName: 'Alex',
  employeeId: 'EMP-102',
  department: 'Design Dept',
  todayLabel: 'Oct 24, 2024',
  shift: '09:00 AM - 06:00 PM',
  checkIn: '08:55 AM',
  checkInNote: 'On time',
  totalHours: '4.5h',
  totalHoursNote: '45% of shift',
  weekBars: [60, 85, 70, 90, 45, 10, 10],
}
