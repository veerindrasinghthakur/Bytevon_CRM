import { useEffect, useState } from 'react'
import { useNavigate, useParams, useRouterState } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { getShifts } from '../api/organization'
import { listEmployeesOnShift } from '@/modules/workforce/api/departments'
import type { ShiftRow } from '@/shared/schema'
import { can } from '@/shared/rbac/can'
import { Action, ResourceName } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'

const emptyShift: ShiftRow = {
  id: 0,
  name: '',
  start_time: '09:00:00',
  end_time: '18:00:00',
  is_overnight: false,
  grace_late_minutes: 15,
  flexible_end: false,
  break_duration_minutes: 60,
  is_archived: false,
  created_at: '',
  updated_at: '',
  changed_by: 1,
}

function shiftsListPath(pathname: string) {
  if (pathname.startsWith('/workforce')) return '/workforce/shifts'
  return '/admin/settings/shifts'
}

export function ShiftDetailPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isNew = pathname.endsWith('/shifts/new')
  const listTo = shiftsListPath(pathname)
  const { shiftId } = useParams({ strict: false }) as { shiftId?: string }
  const navigate = useNavigate()
  const id = Number(shiftId)
  const canCreate = can(Action.CREATE, ResourceName.SHIFT)
  const canUpdate = can(Action.UPDATE, ResourceName.SHIFT)

  const [shift, setShift] = useState<ShiftRow | null>(isNew ? emptyShift : null)
  const [staff, setStaff] = useState<
    {
      employmentId: number
      employeeCode: string
      name: string
      departmentName: string
      positionName: string
      state: string
    }[]
  >([])
  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(isNew)
  const [draft, setDraft] = useState<Partial<ShiftRow>>(isNew ? emptyShift : {})

  useEffect(() => {
    if (isNew) {
      if (!canCreate) {
        setError('You do not have permission to create shifts.')
        setShift(null)
      }
      return
    }
    setLoading(true)
    Promise.all([
      getShifts({ includeArchived: true }),
      listEmployeesOnShift(id),
    ])
      .then(([r, employees]) => {
        const row = r.items.find((s) => s.id === id) ?? null
        setShift(row)
        if (row) setDraft(row)
        setStaff(employees)
        if (!row) setError('Shift not found')
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, isNew, canCreate])

  if (loading) return <PageLoadingSkeleton />
  if (error || !shift) {
    return (
      <ErrorState
        description={error ?? 'Not found'}
        onBack={() => navigate({ to: listTo as never })}
      />
    )
  }

  const field = (label: string, key: keyof ShiftRow, type: 'text' | 'time' | 'number' = 'text') => (
    <div>
      <p className="text-label-sm text-on-surface-variant mb-1">{label}</p>
      {editing ? (
        <input
          type={type}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm focus:ring-2 focus:ring-secondary/30 outline-none"
          value={String(draft[key] ?? '')}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              [key]: type === 'number' ? Number(e.target.value) : e.target.value,
            }))
          }
        />
      ) : (
        <p className="text-body-md font-medium text-on-background">{String(shift[key] ?? '—')}</p>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <BackButton to={listTo} label="Back to shifts" />
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-title-lg font-semibold text-on-background">
            {isNew ? 'Add shift' : shift.name || 'Shift'}
          </h2>
          {!isNew && (
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              {String(shift.start_time).slice(0, 5)} – {String(shift.end_time).slice(0, 5)}
              {shift.is_overnight ? ' · Overnight' : ''}
              {!isNew && ` · ${staff.length} employees`}
            </p>
          )}
        </div>
        {editing ? (
          <div className="flex gap-2">
            {!isNew && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false)
                  setDraft(shift)
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              onClick={() => {
                if (isNew) {
                  navigate({ to: listTo as never })
                  return
                }
                setShift({ ...shift, ...draft } as ShiftRow)
                setEditing(false)
              }}
            >
              {isNew ? 'Create' : 'Save'}
            </Button>
          </div>
        ) : (
          canUpdate && (
            <Button
              variant="primary"
              leftIcon={<span className="material-symbols-outlined text-lg">edit</span>}
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
          )
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-4 card-hover">
          <h3 className="text-title-md font-semibold text-on-background">Schedule</h3>
          {field('Name', 'name')}
          {field('Start time', 'start_time', 'time')}
          {field('End time', 'end_time', 'time')}
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">Overnight</p>
            <p className="text-body-md font-medium">{shift.is_overnight ? 'Yes' : 'No'}</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-4 card-hover">
          <h3 className="text-title-md font-semibold text-on-background">Rules</h3>
          {field('Grace late (min)', 'grace_late_minutes', 'number')}
          {field('Break duration (min)', 'break_duration_minutes', 'number')}
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">Flexible end</p>
            <p className="text-body-md font-medium">{shift.flexible_end ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {!isNew && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant">
            <h3 className="text-title-lg font-semibold">Employees on this shift</h3>
            <p className="text-body-sm text-on-surface-variant">
              From active employment assignments (shift_id)
            </p>
          </div>
          {staff.length === 0 ? (
            <div className="p-10 text-center text-on-surface-variant">
              No employees currently assigned to this shift.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="px-6 py-3 text-label-sm uppercase text-on-surface-variant">Employee</th>
                    <th className="px-6 py-3 text-label-sm uppercase text-on-surface-variant">Department</th>
                    <th className="px-6 py-3 text-label-sm uppercase text-on-surface-variant">Position</th>
                    <th className="px-6 py-3 text-label-sm uppercase text-on-surface-variant">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {staff.map((e) => (
                    <tr
                      key={e.employmentId}
                      className="bv-row-hover cursor-pointer"
                      onClick={() =>
                        navigate({
                          to: '/workforce/employees/$employeeId',
                          params: { employeeId: String(e.employmentId) },
                        })
                      }
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold">{e.name}</p>
                        <p className="text-label-sm text-on-surface-variant">{e.employeeCode}</p>
                      </td>
                      <td className="px-6 py-4 text-body-sm">{e.departmentName}</td>
                      <td className="px-6 py-4 text-body-sm">{e.positionName}</td>
                      <td className="px-6 py-4 text-body-sm">{e.state.replace(/_/g, ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
