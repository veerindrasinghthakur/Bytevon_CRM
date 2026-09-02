/** Canonical workforce UI seed — shared mock location (MODULE_STANDARDS §7 / my-work pattern). */

// --- Attendance dashboard seed ---
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

// --- Shifts seed ---
export interface ShiftRow {
  id: string
  name: string
  code: string
  startTime: string
  endTime: string
  breakMinutes: number
  days: string
  employeeCount: number
  status: 'Active' | 'Inactive'
  description?: string
}

export interface ShiftEmployee {
  id: string
  name: string
  title: string
  department: string
  status: 'Active' | 'On Leave'
}

export const shifts: ShiftRow[] = [
  {
    id: 'sh1',
    name: 'General Day',
    code: 'SHIFT-DAY',
    startTime: '09:00',
    endTime: '18:00',
    breakMinutes: 60,
    days: 'Mon–Fri',
    employeeCount: 86,
    status: 'Active',
    description: 'Standard office hours for HQ and hybrid staff.',
  },
  {
    id: 'sh2',
    name: 'Early Bird',
    code: 'SHIFT-EARLY',
    startTime: '07:00',
    endTime: '16:00',
    breakMinutes: 45,
    days: 'Mon–Fri',
    employeeCount: 22,
    status: 'Active',
    description: 'Early coverage for support and operations.',
  },
  {
    id: 'sh3',
    name: 'Evening Support',
    code: 'SHIFT-EVE',
    startTime: '14:00',
    endTime: '23:00',
    breakMinutes: 45,
    days: 'Mon–Sat',
    employeeCount: 18,
    status: 'Active',
    description: 'Extended coverage for customer success.',
  },
  {
    id: 'sh4',
    name: 'Weekend On-Call',
    code: 'SHIFT-WKND',
    startTime: '10:00',
    endTime: '18:00',
    breakMinutes: 30,
    days: 'Sat–Sun',
    employeeCount: 6,
    status: 'Inactive',
    description: 'Rotating weekend on-call (currently paused).',
  },
]

export const shiftEmployeesById: Record<string, ShiftEmployee[]> = {
  sh1: [
    { id: 'e1', name: 'Sarah Jenkins', title: 'Senior Lead', department: 'Product Design', status: 'Active' },
    { id: 'e4', name: 'Adrian Sterling', title: 'Solutions Architect', department: 'Engineering', status: 'Active' },
    { id: 'e5', name: 'Marcus Thorne', title: 'Lead UI Architect', department: 'Engineering', status: 'Active' },
    { id: 'e7', name: 'Elena Rodriguez', title: 'HR Specialist', department: 'Human Resources', status: 'Active' },
    { id: 'e6', name: 'David Chen', title: 'Financial Controller', department: 'Finance', status: 'On Leave' },
  ],
  sh2: [
    { id: 'e2', name: 'Rohan Gupta', title: 'Backend Dev', department: 'Engineering', status: 'Active' },
    { id: 'e8', name: 'Samuel Wright', title: 'Backend Engineer', department: 'Engineering', status: 'Active' },
  ],
  sh3: [
    { id: 'e3', name: 'Marcus Kane', title: 'Specialist', department: 'Human Resources', status: 'Active' },
  ],
  sh4: [],
}

export function employeesOnShift(shiftId: string): ShiftEmployee[] {
  return shiftEmployeesById[shiftId] ?? []
}

export const canCreateShift = true

// --- Canonical workforce data re-exports (MODULE_STANDARDS §7) ---
export const teams: Record<
  string,
  {
    id: string
    name: string
    description?: string
    departmentId: string
    department: string
    headId?: string
    headName: string
    headTitle?: string
    memberCount: number
    projectCount: number
    status: 'Active' | 'Inactive'
    velocity?: number
    allocationPct?: number
    createdOn?: string
    mission?: string
    icon?: string
  }
> = {
  t1: {
    id: 't1',
    name: 'Engineering',
    description: 'Product and platform engineering organization.',
    departmentId: 'd1',
    department: 'Engineering',
    headId: 'e1',
    headName: 'Sarah Jenkins',
    headTitle: 'Senior Lead',
    memberCount: 32,
    projectCount: 18,
    status: 'Active',
    velocity: 94,
    allocationPct: 72,
    createdOn: '2023-01-12',
    mission: 'Build resilient, user-first digital products for enterprise customers.',
    icon: 'engineering',
  },
  t2: {
    id: 't2',
    name: 'Design',
    description: 'Design systems and product experience team.',
    departmentId: 'd2',
    department: 'Design',
    headId: 'e2',
    headName: 'Michael Ross',
    headTitle: 'Design Director',
    memberCount: 14,
    projectCount: 9,
    status: 'Active',
    velocity: 88,
    allocationPct: 61,
    createdOn: '2022-11-03',
    mission: 'Deliver consistent and delightful experiences across product surfaces.',
    icon: 'palette',
  },
  t3: {
    id: 't3',
    name: 'HR',
    description: 'People operations and talent programs.',
    departmentId: 'd3',
    department: 'HR',
    headId: 'e3',
    headName: 'Emily Chen',
    headTitle: 'HR Manager',
    memberCount: 9,
    projectCount: 5,
    status: 'Active',
    velocity: 82,
    allocationPct: 54,
    createdOn: '2021-08-14',
    mission: 'Support a healthy, high-performing workforce and culture.',
    icon: 'groups',
  },
  t4: {
    id: 't4',
    name: 'Sales',
    description: 'Revenue operations and client success.',
    departmentId: 'd4',
    department: 'Sales',
    headId: 'e4',
    headName: 'Robert Chen',
    headTitle: 'Sales Director',
    memberCount: 18,
    projectCount: 12,
    status: 'Active',
    velocity: 91,
    allocationPct: 67,
    createdOn: '2020-09-22',
    mission: 'Expand strategic customer growth and improve account retention.',
    icon: 'sell',
  },
  t5: {
    id: 't5',
    name: 'Finance',
    description: 'Planning, reporting, and financial governance.',
    departmentId: 'd5',
    department: 'Finance',
    headId: 'e5',
    headName: 'David Kim',
    headTitle: 'Financial Analyst',
    memberCount: 11,
    projectCount: 7,
    status: 'Inactive',
    velocity: 76,
    allocationPct: 48,
    createdOn: '2019-12-01',
    mission: 'Maintain financial health, forecasting accuracy, and operational control.',
    icon: 'account_balance',
  },
}

export const departments: Record<string, { id: string; name: string; code?: string }> = {
  d1: { id: 'd1', name: 'Engineering', code: 'ENG' },
  d2: { id: 'd2', name: 'Design', code: 'DSN' },
  d3: { id: 'd3', name: 'HR', code: 'HR' },
  d4: { id: 'd4', name: 'Sales', code: 'SLS' },
  d5: { id: 'd5', name: 'Finance', code: 'FIN' },
}

export const employees: Record<string, { id: string; name: string; title?: string; department?: string }> = {
  e1: { id: 'e1', name: 'Sarah Jenkins', title: 'Senior Lead', department: 'Engineering' },
  e2: { id: 'e2', name: 'Michael Ross', title: 'Sales Director', department: 'Sales' },
  e3: { id: 'e3', name: 'Emily Chen', title: 'HR Manager', department: 'HR' },
  e4: { id: 'e4', name: 'Robert Chen', title: 'Senior Engineer', department: 'Engineering' },
  e5: { id: 'e5', name: 'David Kim', title: 'Financial Analyst', department: 'Finance' },
}

export const candidateMembers: Array<{ id: string; name: string; title?: string; department?: string; availability?: string }> = [
  { id: 'm1', name: 'David Chen', title: 'Senior Backend Engineer', department: 'Engineering', availability: 'Available' },
  { id: 'm2', name: 'Sarah Jenkins', title: 'Senior Lead', department: 'Engineering', availability: 'Available' },
  { id: 'm3', name: 'Michael Ross', title: 'Sales Director', department: 'Sales', availability: 'Available' },
  { id: 'm4', name: 'Emily Chen', title: 'HR Manager', department: 'HR', availability: 'Available' },
  { id: 'm5', name: 'Robert Chen', title: 'Senior Engineer', department: 'Engineering', availability: 'Available' },
]

// --- Deprecated team extras (prefer projects API) ---
export const teamMembersByTeam: Record<
  string,
  Array<{
    id: string
    name: string
    title: string
    role: string
    email: string
    status: 'Active' | 'On Leave'
    joined: string
  }>
> = {
  t1: [
    {
      id: 'm1',
      name: 'David Chen',
      title: 'Senior Backend Engineer',
      role: 'Lead',
      email: 'd.chen@bytevon.io',
      status: 'Active',
      joined: '2021-03-12',
    },
  ],
}

export const teamProjectsByTeam: Record<
  string,
  Array<{
    id: string
    name: string
    client: string
    status: 'Active' | 'Completed' | 'On Hold'
    due: string
    pct: number
    role: string
  }>
> = {
  t1: [],
}

export const assignableProjects = [
  { id: 'ap1', name: 'Customer Portal Redesign', client: 'Acme Retail', status: 'Planning' },
  { id: 'ap2', name: 'Mobile SDK v3', client: 'Internal', status: 'Active' },
]

export function membersFor(teamId: string) {
  return teamMembersByTeam[teamId] ?? teamMembersByTeam.t1 ?? []
}

export function projectsFor(teamId: string) {
  return teamProjectsByTeam[teamId] ?? teamProjectsByTeam.t1 ?? []
}
