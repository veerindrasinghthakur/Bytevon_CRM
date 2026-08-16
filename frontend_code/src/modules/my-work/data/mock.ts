import type {
  ApprovalRequest,
  AttendanceRecord,
  LeaveBalance,
  LeaveRequest,
  MetricCard,
  MyTask,
  NotificationItem,
  UpcomingEvent,
} from '../types'

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

export const leaveRequests: LeaveRequest[] = [
  {
    id: 'LV-2041',
    type: 'Casual',
    from: '2026-08-28',
    to: '2026-08-28',
    days: 1,
    reason: 'Personal appointment',
    status: 'Pending',
    appliedOn: '2026-08-14',
    approver: 'Sarah Chen',
  },
  {
    id: 'LV-2038',
    type: 'Sick',
    from: '2026-08-05',
    to: '2026-08-06',
    days: 2,
    reason: 'Fever and rest',
    status: 'Approved',
    appliedOn: '2026-08-04',
    approver: 'Sarah Chen',
  },
  {
    id: 'LV-2030',
    type: 'Earned',
    from: '2026-07-18',
    to: '2026-07-22',
    days: 5,
    reason: 'Family trip',
    status: 'Approved',
    appliedOn: '2026-07-01',
    approver: 'Marcus Chen',
  },
  {
    id: 'LV-2022',
    type: 'Casual',
    from: '2026-06-12',
    to: '2026-06-12',
    days: 1,
    reason: 'Home maintenance',
    status: 'Rejected',
    appliedOn: '2026-06-10',
    approver: 'Sarah Chen',
  },
  {
    id: 'LV-2015',
    type: 'Unpaid',
    from: '2026-05-02',
    to: '2026-05-02',
    days: 1,
    reason: 'Personal',
    status: 'Cancelled',
    appliedOn: '2026-04-28',
    approver: 'Sarah Chen',
  },
]

export const attendanceHistory: AttendanceRecord[] = [
  {
    id: 'ATT-240',
    date: '2026-08-14',
    checkIn: '08:55 AM',
    checkOut: '—',
    totalHours: '4.5h',
    status: 'Present',
    shift: '09:00 AM - 06:00 PM',
    note: 'Live session',
  },
  {
    id: 'ATT-239',
    date: '2026-08-13',
    checkIn: '09:02 AM',
    checkOut: '06:05 PM',
    totalHours: '8.0h',
    status: 'Present',
    shift: '09:00 AM - 06:00 PM',
  },
  {
    id: 'ATT-238',
    date: '2026-08-12',
    checkIn: '09:18 AM',
    checkOut: '01:00 PM',
    totalHours: '3.7h',
    status: 'Half Day',
    shift: '09:00 AM - 06:00 PM',
    note: 'Medical appointment',
  },
  {
    id: 'ATT-237',
    date: '2026-08-11',
    checkIn: '08:50 AM',
    checkOut: '06:10 PM',
    totalHours: '8.3h',
    status: 'Present',
    shift: '09:00 AM - 06:00 PM',
  },
  {
    id: 'ATT-236',
    date: '2026-08-10',
    status: 'Weekend',
  },
  {
    id: 'ATT-235',
    date: '2026-08-09',
    status: 'Weekend',
  },
  {
    id: 'ATT-234',
    date: '2026-08-08',
    checkIn: '09:40 AM',
    checkOut: '02:00 PM',
    totalHours: '4.2h',
    status: 'Half Day',
    note: 'Missed punch — correction pending',
  },
  {
    id: 'ATT-233',
    date: '2026-08-07',
    status: 'Absent',
    note: 'Unplanned absence',
  },
]

export const myTasks: MyTask[] = [
  {
    id: 'T-101',
    name: 'Mobile App Wireframe Review',
    project: 'Nexus Mobile',
    priority: 'High',
    dueDate: 'Oct 25, 2024',
    status: 'In Progress',
    estimatedHours: '8h',
  },
  {
    id: 'T-102',
    name: 'Quarterly Design System Audit',
    project: 'Design System',
    priority: 'Medium',
    dueDate: 'Oct 30, 2024',
    status: 'Pending',
    estimatedHours: '24h',
  },
  {
    id: 'T-103',
    name: 'Client Meeting: Feedback Integration',
    project: 'Nexus Global',
    priority: 'High',
    dueDate: 'Oct 26, 2024',
    status: 'Not Started',
    estimatedHours: '4h',
  },
  {
    id: 'T-104',
    name: 'Accessibility Guidelines Update',
    project: 'Design System',
    priority: 'Low',
    dueDate: 'Nov 05, 2024',
    status: 'Pending',
    estimatedHours: '12h',
  },
]

export const myApprovals: ApprovalRequest[] = [
  {
    id: 'APR-501',
    type: 'Leave',
    title: 'Casual leave · Aug 28',
    submittedOn: '2026-08-14',
    status: 'Pending',
    summary: '1 day · Personal appointment',
  },
  {
    id: 'APR-498',
    type: 'Attendance Correction',
    title: 'Correction · Aug 8 half day',
    submittedOn: '2026-08-09',
    status: 'Pending',
    summary: 'Request full-day punches 09:15–18:00',
  },
  {
    id: 'APR-490',
    type: 'Leave',
    title: 'Sick leave · Aug 5–6',
    submittedOn: '2026-08-04',
    status: 'Approved',
    summary: '2 days · Approved by Sarah Chen',
  },
  {
    id: 'APR-480',
    type: 'Expense',
    title: 'Client travel reimbursement',
    submittedOn: '2026-07-28',
    status: 'Rejected',
    summary: 'Missing receipt attachment',
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
  { icon: 'request_page', label: 'My Requests', to: '/my-work/requests' as const },
  { icon: 'person_edit', label: 'Update Profile', to: '/profile' as const },
]
