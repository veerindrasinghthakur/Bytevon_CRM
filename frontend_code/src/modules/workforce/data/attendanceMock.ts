export const attendanceKpis = [
  { key: 'present', label: 'Present', value: 1248, hint: '4% vs yesterday', icon: 'check_circle' },
  { key: 'absent', label: 'Absent', value: 32, hint: 'Scheduled leave: 14', icon: 'cancel' },
  { key: 'late', label: 'Late', value: 56, hint: 'Grace period ends in 10m', icon: 'schedule' },
  { key: 'leave', label: 'On Leave', value: 12, hint: 'Sick leave: 5', icon: 'event_busy' },
  { key: 'wfh', label: 'Work From Home', value: 284, hint: 'Hybrid policy active', icon: 'home_work' },
] as const

export const weeklyAttendance = [
  { day: 'Mon', thisWeek: 88, lastWeek: 84 },
  { day: 'Tue', thisWeek: 91, lastWeek: 86 },
  { day: 'Wed', thisWeek: 87, lastWeek: 89 },
  { day: 'Thu', thisWeek: 90, lastWeek: 85 },
  { day: 'Fri', thisWeek: 82, lastWeek: 80 },
  { day: 'Sat', thisWeek: 40, lastWeek: 35 },
  { day: 'Sun', thisWeek: 12, lastWeek: 10 },
]

export const recentCheckIns = [
  { id: 'c1', name: 'Alex Rivera', team: 'Design Team', time: '08:42 AM', status: 'On Time' },
  { id: 'c2', name: 'Sarah Chen', team: 'Engineering', time: '09:15 AM', status: 'Late' },
  { id: 'c3', name: 'Marcus Thorne', team: 'HR Ops', time: '09:30 AM', status: 'Remote' },
  { id: 'c4', name: 'Jason Miller', team: 'Sales', time: '09:44 AM', status: 'On Time' },
]

export const todayAttendance = [
  { id: 'a1', name: 'Emma Larson', avatar: 'EL', department: 'Marketing', checkIn: '08:55 AM', checkOut: '—', status: 'PRESENT', hours: '—' },
  { id: 'a2', name: 'Daniel Smith', avatar: 'DS', department: 'Legal', checkIn: '09:12 AM', checkOut: '—', status: 'LATE', hours: '—' },
  { id: 'a3', name: 'Rachel Brown', avatar: 'RB', department: 'IT Support', checkIn: '—', checkOut: '—', status: 'ABSENT', hours: '—' },
  { id: 'a4', name: 'Tom Peters', avatar: 'TP', department: 'Strategy', checkIn: '08:30 AM', checkOut: '—', status: 'WFH', hours: '—' },
  { id: 'a5', name: 'Alex Rivera', avatar: 'AR', department: 'Engineering', checkIn: '08:42 AM', checkOut: '—', status: 'PRESENT', hours: '—' },
  { id: 'a6', name: 'Priya Sharma', avatar: 'PS', department: 'Design', checkIn: '09:05 AM', checkOut: '—', status: 'LATE', hours: '—' },
  { id: 'a7', name: 'Jordan Lee', avatar: 'JL', department: 'Engineering', checkIn: '08:50 AM', checkOut: '—', status: 'PRESENT', hours: '—' },
  { id: 'a8', name: 'Maya Patel', avatar: 'MP', department: 'Design', checkIn: '—', checkOut: '—', status: 'ON_LEAVE', hours: '—' },
]

export const corrections = [
  {
    id: 'cor1',
    name: 'Sophia Williams',
    ago: '10m ago',
    note: 'Forgot to clock-in while handling a priority client call at 08:30 AM.',
    status: 'Pending',
  },
  {
    id: 'cor2',
    name: 'Robert Vance',
    ago: '2h ago',
    note: 'Device glitch, double clocked at same time. Requesting cleanup.',
    status: 'Pending',
  },
]

export const attendanceLogs = [
  { time: '09:00:14 AM', action: 'Punch In', duration: '—', status: 'On Time', location: 'Office WiFi (HQ-GUEST)' },
  { time: '01:05:00 PM', action: 'Break Start', duration: '32m', status: '—', location: 'Office' },
  { time: '01:37:00 PM', action: 'Break End', duration: '—', status: '—', location: 'Office' },
  { time: '06:02:10 PM', action: 'Punch Out', duration: '8h 02m', status: 'Complete', location: 'Office WiFi (HQ-GUEST)' },
]
