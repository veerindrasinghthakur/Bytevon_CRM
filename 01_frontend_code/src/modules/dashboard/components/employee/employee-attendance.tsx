import type { ReactNode } from 'react'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

const card = 'bv-surface card-hover'

export function EmployeeAttendance({
  checkIn,
  checkInNote,
  totalHours,
  totalHoursNote,
  weekBarElements,
  onFullReport,
}: {
  checkIn: string
  checkInNote: string
  totalHours: string
  totalHoursNote: string
  weekBarElements: ReactNode
  onFullReport: () => void
}) {
  return (
    <div className={`${card} lg:col-span-2 p-6`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-title-lg text-on-background">Attendance Overview</h3>
        <Can action={Action.VIEW} resource={'attendance'}>
          <button
            type="button"
            className="text-secondary text-label-md font-bold hover:underline"
            onClick={onFullReport}
          >
            Full Report
          </button>
        </Can>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-container-low p-4 rounded-lg">
          <span className="text-label-sm text-on-surface-variant">Check-in</span>
          <p className="text-body-lg font-bold text-secondary">{checkIn}</p>
          <span className="text-[10px] text-on-surface-variant">{checkInNote}</span>
        </div>
        <div className="bg-surface-container-low p-4 rounded-lg">
          <span className="text-label-sm text-on-surface-variant">Total Hours</span>
          <p className="text-body-lg font-bold text-on-background">{totalHours}</p>
          <span className="text-[10px] text-on-surface-variant">{totalHoursNote}</span>
        </div>
        <div className="md:col-span-2">
          <div className="h-28 flex items-end gap-2">
            {weekBarElements}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-label-sm text-on-surface-variant">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-secondary/60" /> Work
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-error/90" /> Break (red)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-outline-variant/55" /> Weekend
        </span>
      </div>
    </div>
  )
}
