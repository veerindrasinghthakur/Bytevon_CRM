import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { WorkMode } from '@/shared/schema'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { workforceRoutes } from '../routes'
import { changeAssignmentSchema, type ChangeAssignmentForm } from '../schemas/change-assignment-form'
import { WORK_MODE_OPTIONS } from '../schemas/enums'
import { useChangeAssignment } from '../hooks/assignment/use-change-assignment'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

export function ChangeAssignmentPage() {
  const { employeeId } = useParams({ strict: false }) as { employeeId: string }
  const navigate = useNavigate()
  const {
    masters,
    saveAssignment,
    isSaving: saving,
    saveError,
  } = useChangeAssignment(Number(employeeId))
  const { departments, positions, locations, shifts } = masters

  const form = useForm<ChangeAssignmentForm>({
    resolver: zodResolver(changeAssignmentSchema),
    defaultValues: {
      department_id: '',
      position_id: '',
      location_id: '',
      shift_id: '',
      work_mode: WorkMode.OFFICE,
      effective_from: new Date().toISOString().slice(0, 10),
      change_reason: '',
    },
  })

  useEffect(() => {
    if (departments.length === 0 && positions.length === 0) return
    form.reset({
      department_id: departments[0] ? String(departments[0].id) : '',
      position_id: positions[0] ? String(positions[0].id) : '',
      location_id: locations[0] ? String(locations[0].id) : '',
      shift_id: shifts[0] ? String(shifts[0].id) : '',
      work_mode: WorkMode.OFFICE,
      effective_from: new Date().toISOString().slice(0, 10),
      change_reason: '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departments.length, positions.length, locations.length, shifts.length])

  const deptOptions = useMemo(
    () => departments.map((o) => ({ value: String(o.id), label: o.name })),
    [departments],
  )
  const posOptions = useMemo(
    () => positions.map((o) => ({ value: String(o.id), label: o.name })),
    [positions],
  )
  const locOptions = useMemo(
    () => locations.map((o) => ({ value: String(o.id), label: o.name })),
    [locations],
  )
  const shiftOptions = useMemo(
    () => shifts.map((o) => ({ value: String(o.id), label: o.name })),
    [shifts],
  )

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await saveAssignment({
        departmentId: values.department_id ? Number(values.department_id) : undefined,
        positionId: values.position_id ? Number(values.position_id) : undefined,
        locationId: values.location_id ? Number(values.location_id) : undefined,
        shiftId: values.shift_id ? Number(values.shift_id) : undefined,
        workMode: values.work_mode,
        effectiveFrom: values.effective_from,
        changeReason: values.change_reason,
      })
      safeNavigate(navigate, {
        to: workforceRoutes.employeeDetailPath,
        params: { employeeId },
      })
    } catch {
      /* error surfaces via saveError below */
    }
  })

  return (
    <div className="space-y-6 max-w-xl animate-fade-in">
      <BackButton to={workforceRoutes.employeeDetail(employeeId)} label="Back to employee" />
      <PageHeader
        title="Change assignment"
        description="Creates a new employment_assignments row and closes the previous effective_to"
      />
      <form className="bv-surface p-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <Select
            label="Department"
            value={form.watch('department_id')}
            onChange={(v) => form.setValue('department_id', v, { shouldValidate: true })}
            options={deptOptions}
            placeholder="Select department"
            aria-label="Department"
            minWidthClass="w-full"
          />
          {form.formState.errors.department_id && (
            <p className="text-xs text-error mt-1">{form.formState.errors.department_id.message}</p>
          )}
        </div>
        <div>
          <Select
            label="Position"
            value={form.watch('position_id')}
            onChange={(v) => form.setValue('position_id', v, { shouldValidate: true })}
            options={posOptions}
            placeholder="Select position"
            aria-label="Position"
            minWidthClass="w-full"
          />
        </div>
        <div>
          <Select
            label="Location"
            value={form.watch('location_id')}
            onChange={(v) => form.setValue('location_id', v, { shouldValidate: true })}
            options={locOptions}
            placeholder="Select location"
            aria-label="Location"
            minWidthClass="w-full"
          />
        </div>
        <div>
          <Select
            label="Shift"
            value={form.watch('shift_id')}
            onChange={(v) => form.setValue('shift_id', v, { shouldValidate: true })}
            options={shiftOptions}
            placeholder="Select shift"
            aria-label="Shift"
            minWidthClass="w-full"
          />
        </div>
        <div>
          <Select
            label="Work mode"
            value={form.watch('work_mode')}
            onChange={(v) => form.setValue('work_mode', v, { shouldValidate: true })}
            options={[...WORK_MODE_OPTIONS]}
            aria-label="Work mode"
            minWidthClass="w-full"
          />
        </div>
        <div>
          <label className="text-label-sm text-on-surface-variant mb-1 block" htmlFor="effective_from">
            Effective from
          </label>
          <input
            id="effective_from"
            type="date"
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition-colors"
            {...form.register('effective_from')}
          />
        </div>
        <div>
          <label className="text-label-sm text-on-surface-variant mb-1 block" htmlFor="change_reason">
            Change reason
          </label>
          <input
            id="change_reason"
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-sm focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
            placeholder="Promotion, transfer, relocation…"
            {...form.register('change_reason')}
          />
          {form.formState.errors.change_reason && (
            <p className="text-xs text-error mt-1">{form.formState.errors.change_reason.message}</p>
          )}
        </div>
        {saveError && (
          <p className="text-xs text-error" role="alert">
            {getApiErrorMessage(saveError, 'Could not save assignment')}
          </p>
        )}
        <Can action={Action.UPDATE} resource="employment">
          <Button type="submit" variant="primary" isLoading={saving}>
            Save assignment
          </Button>
        </Can>
      </form>
    </div>
  )
}
