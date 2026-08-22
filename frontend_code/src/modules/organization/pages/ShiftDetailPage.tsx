import { useState } from 'react'
import { useNavigate, useParams, useRouterState } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { can } from '@/shared/rbac/can'
import { Action, ResourceName, type ShiftRow } from '@/shared/schema'
import {
  useCreateShift,
  useShiftDetail,
  useShiftStaff,
  useUpdateShift,
} from '../hooks/use-shifts'

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

  const canCreate = can({ action: Action.CREATE, resource: ResourceName.SHIFT })
  const canUpdate = can({ action: Action.UPDATE, resource: ResourceName.SHIFT })

  const detailQuery = useShiftDetail(id, !isNew)
  const staffQuery = useShiftStaff(id, !isNew)
  const createMut = useCreateShift()
  const updateMut = useUpdateShift(id)
  // isNew starts in edit mode; no useEffect to seed draft from server
  const { isEditing, startEditing, cancelEditing, finishEditing } = useEditMode(isNew)

  const shift = isNew ? emptyShift : detailQuery.data ?? null
  // Client form state only — seed on beginEdit / create flow
  const [draft, setDraft] = useState<Partial<ShiftRow>>(isNew ? { ...emptyShift } : {})

  if (!isNew && detailQuery.isLoading) return <PageLoadingSkeleton />

  if (isNew && !canCreate) {
    return (
      <ErrorState
        description="You do not have permission to create shifts."
        onBack={() => navigate({ to: listTo as never })}
      />
    )
  }

  if (!isNew && (detailQuery.isError || !shift)) {
    return (
      <ErrorState
        description={(detailQuery.error as Error)?.message ?? 'Shift not found'}
        onRetry={() => void detailQuery.refetch()}
        onBack={() => navigate({ to: listTo as never })}
      />
    )
  }

  const staff = staffQuery.data ?? []

  const beginEdit = () => {
    if (!shift) return
    setDraft({ ...shift })
    startEditing()
  }

  const onCancel = () => {
    setDraft({})
    cancelEditing()
  }

  const field = (label: string, key: keyof ShiftRow, type: 'text' | 'time' | 'number' = 'text') => (
    <div>
      <p className="text-label-sm text-on-surface-variant mb-1">{label}</p>
      {isEditing ? (
        <input
          type={type}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm focus:ring-2 focus:ring-secondary/30 outline-none"
          value={String(draft[key] ?? shift?.[key] ?? '')}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              [key]: type === 'number' ? Number(e.target.value) : e.target.value,
            }))
          }
        />
      ) : (
        <p className="text-body-md font-medium text-on-background">{String(shift![key] ?? '—')}</p>
      )}
    </div>
  )

  const onSave = () => {
    if (isNew) {
      createMut.mutate(
        {
          name: String(draft.name ?? ''),
          start_time: String(draft.start_time ?? '09:00:00'),
          end_time: String(draft.end_time ?? '18:00:00'),
          is_overnight: Boolean(draft.is_overnight),
          grace_late_minutes: Number(draft.grace_late_minutes ?? 15),
          flexible_end: Boolean(draft.flexible_end),
          break_duration_minutes: Number(draft.break_duration_minutes ?? 60),
        },
        {
          onSuccess: () => navigate({ to: listTo as never }),
        },
      )
      return
    }
    updateMut.mutate(
      {
        name: draft.name,
        start_time: draft.start_time,
        end_time: draft.end_time,
        grace_late_minutes: draft.grace_late_minutes,
        break_duration_minutes: draft.break_duration_minutes,
        is_overnight: draft.is_overnight,
        flexible_end: draft.flexible_end,
      },
      {
        onSuccess: () => {
          setDraft({})
          finishEditing()
        },
      },
    )
  }

  const saving = createMut.isPending || updateMut.isPending

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to={listTo} label="Back to shifts" />
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-title-lg font-semibold text-on-background">
            {isNew ? 'Add shift' : shift?.name || 'Shift'}
          </h2>
          {!isNew && shift && (
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              {String(shift.start_time).slice(0, 5)} – {String(shift.end_time).slice(0, 5)}
              {shift.is_overnight ? ' · Overnight' : ''}
              {` · ${staff.length} employees`}
            </p>
          )}
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            {!isNew && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button variant="primary" onClick={onSave} isLoading={saving}>
              {isNew ? 'Create' : 'Save'}
            </Button>
          </div>
        ) : (
          canUpdate && <EditButton variant="primary" onClick={beginEdit} />
        )}
      </div>

      {(createMut.isError || updateMut.isError) && (
        <p className="text-body-sm text-error">
          {((createMut.error || updateMut.error) as Error).message}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bv-surface p-6 space-y-4">
          <h3 className="text-title-md font-semibold text-on-background">Schedule</h3>
          {field('Name', 'name')}
          {field('Start time', 'start_time', 'time')}
          {field('End time', 'end_time', 'time')}
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">Overnight</p>
            {isEditing ? (
              <label className="inline-flex items-center gap-2 text-body-sm">
                <input
                  type="checkbox"
                  checked={Boolean(draft.is_overnight ?? shift?.is_overnight)}
                  onChange={(e) => setDraft((d) => ({ ...d, is_overnight: e.target.checked }))}
                />
                Crosses midnight
              </label>
            ) : (
              <p className="text-body-md font-medium">{shift?.is_overnight ? 'Yes' : 'No'}</p>
            )}
          </div>
        </div>
        <div className="bv-surface p-6 space-y-4">
          <h3 className="text-title-md font-semibold text-on-background">Rules</h3>
          {field('Grace late (min)', 'grace_late_minutes', 'number')}
          {field('Break duration (min)', 'break_duration_minutes', 'number')}
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">Flexible end</p>
            {isEditing ? (
              <label className="inline-flex items-center gap-2 text-body-sm">
                <input
                  type="checkbox"
                  checked={Boolean(draft.flexible_end ?? shift?.flexible_end)}
                  onChange={(e) => setDraft((d) => ({ ...d, flexible_end: e.target.checked }))}
                />
                Allow flexible end
              </label>
            ) : (
              <p className="text-body-md font-medium">{shift?.flexible_end ? 'Yes' : 'No'}</p>
            )}
          </div>
        </div>
      </div>

      {!isNew && (
        <div className="bv-surface overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant">
            <h3 className="text-title-lg font-semibold">Employees on this shift</h3>
            <p className="text-body-sm text-on-surface-variant">From active employment assignments</p>
          </div>
          {staffQuery.isLoading ? (
            <div className="p-8 text-center text-on-surface-variant">Loading staff…</div>
          ) : staff.length === 0 ? (
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
