import type { LeaveBalance, MetricCard, MyTask, NotificationItem, UpcomingEvent } from '../types'

export const currentUser = {
  firstName: 'Alex',
  employeeId: 'EMP-102',
  department: 'Design Dept',
  todayLabel: 'Oct 24, 2024',
  shift: '09:00 AM - 06:00 PM',
}

export const myWorkMetrics: MetricCard[] = [
  { id: 'att', label: 'Attendance', value: '98%', subtitle: '+2% this month', changeType: 'positive', icon: 'trending_up' },
  { id: 'leave', label: 'Rem. Leave', value: '12 Days', subtitle: 'Expiring Dec 31', changeType: 'neutral', icon: 'event_note' },
  { id: 'pending', label: 'Pending Leave', value: '1', subtitle: 'Awaiting Manager', changeType: 'negative', icon: 'hourglass_empty' },
  { id: 'tasks', label: 'Assigned Tasks', value: '5', subtitle: '2 due this week', changeType: 'neutral', icon: 'assignment_turned_in' },
  { id: 'notif', label: 'Notifications', value: '3', subtitle: 'Unread priority', changeType: 'neutral', icon: 'notifications_active' },
]

export const todayAttendance = {
  checkIn: '08:55 AM',
  checkInNote: 'On time',
  totalHours: '4.5h',
  totalHoursNote: '45% of shift',
}

export const weekHours = [
  { day: 'Mon', hours: 8, pct: 90, isToday: false },
  { day: 'Tue', hours: 7.5, pct: 85, isToday: false },
  { day: 'Wed', hours: 8, pct: 90, isToday: false },
  { day: 'Thu', hours: 6, pct: 70, isToday: false },
  { day: 'Fri', hours: 4.5, pct: 50, isToday: true },
  { day: 'Sat', hours: 0, pct: 0, isToday: false },
  { day: 'Sun', hours: 0, pct: 0, isToday: false },
]

export const leaveBalances: LeaveBalance[] = [
  { type: 'Casual', used: 4, total: 10, remaining: 6 },
  { type: 'Sick', used: 2, total: 8, remaining: 6 },
  { type: 'Earned', used: 6, total: 12, remaining: 6 },
]

export const myTasks: MyTask[] = [
  {
    id: 'T-101',
    name: 'Mobile App Wireframe Review',
    priority: 'High',
    dueDate: 'Oct 25, 2024',
    status: 'In Progress',
    estimatedHours: '8h',
  },
  {
    id: 'T-102',
    name: 'Quarterly Design System Audit',
    priority: 'Medium',
    dueDate: 'Oct 30, 2024',
    status: 'Pending',
    estimatedHours: '24h',
  },
  {
    id: 'T-103',
    name: 'Client Meeting: Feedback Integration',
    priority: 'High',
    dueDate: 'Oct 26, 2024',
    status: 'Not Started',
    estimatedHours: '4h',
  },
  {
    id: 'T-104',
    name: 'Accessibility Guidelines Update',
    priority: 'Low',
    dueDate: 'Nov 05, 2024',
    status: 'Pending',
    estimatedHours: '12h',
  },
]

export const recentNotifications: NotificationItem[] = [
  {
    id: 'N-1',
    title: 'Leave approved',
    body: 'Your casual leave for Oct 28 was approved.',
    time: '12m ago',
    icon: 'event_available',
    tag: 'Leave',
    unread: true,
  },
  {
    id: 'N-2',
    title: 'Task assigned',
    body: 'You were assigned Mobile App Wireframe Review.',
    time: '1h ago',
    icon: 'assignment',
    tag: 'Tasks',
    unread: true,
  },
  {
    id: 'N-3',
    title: 'Policy update',
    body: 'Remote check-in rules were updated by Admin.',
    time: 'Yesterday',
    icon: 'policy',
    unread: false,
  },
]

export const upcomingEvents: UpcomingEvent[] = [
  { id: 'E-1', month: 'OCT', day: '26', title: 'Design critique', subtitle: '10:00 AM · Studio B', icon: 'groups' },
  { id: 'E-2', month: 'OCT', day: '28', title: 'Casual leave', subtitle: 'Approved · Full day', icon: 'event_busy' },
  { id: 'E-3', month: 'NOV', day: '01', title: 'Sprint planning', subtitle: 'All hands · Virtual', icon: 'event' },
]

export const myWorkQuickActions = [
  { icon: 'fingerprint', label: 'Mark Attendance', to: '/my-work/attendance' as const },
  { icon: 'event_available', label: 'Apply Leave', to: '/my-work/leave' as const },
  { icon: 'task', label: 'View Tasks', to: '/my-work/tasks' as const },
  { icon: 'fact_check', label: 'My Approvals', to: '/my-work/approvals' as const },
  { icon: 'person_edit', label: 'Update Profile', to: '/profile' as const },
]
