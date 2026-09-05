/**
 * Lightweight shift mock used by Shift create/list/detail pages until
 * organization shift APIs fully replace local data.
 */

import {ShiftMock,ShiftEmployeeMock,} from '../types'

export const canCreateShift = true

export const shifts: ShiftMock[] = [
  {
    id: '1',
    name: 'General Day',
    code: 'SHIFT-DAY',
    startTime: '09:00',
    endTime: '18:00',
    breakMinutes: 60,
    days: 'Mon–Fri',
    status: 'Active',
    employeeCount: 24,
    description: 'Standard office day shift.',
  },
  {
    id: '2',
    name: 'Evening',
    code: 'SHIFT-EVE',
    startTime: '14:00',
    endTime: '22:00',
    breakMinutes: 45,
    days: 'Mon–Fri',
    status: 'Active',
    employeeCount: 12,
  },
  {
    id: '3',
    name: 'Night Support',
    code: 'SHIFT-NIGHT',
    startTime: '22:00',
    endTime: '06:00',
    breakMinutes: 30,
    days: 'Sun–Thu',
    status: 'Inactive',
    employeeCount: 6,
  },
]

const MEMBERS: ShiftEmployeeMock[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    title: 'Engineer',
    department: 'Engineering',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Jordan Lee',
    title: 'Support Lead',
    department: 'Support',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Priya Sharma',
    title: 'Analyst',
    department: 'Operations',
    status: 'On Leave',
  },
]

export function employeesOnShift(_shiftId: string): ShiftEmployeeMock[] {
  return MEMBERS
}
