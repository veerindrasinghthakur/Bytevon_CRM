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

/** Mock permission — set false to hide Create Shift in UI tests */
export const canCreateShift = true
