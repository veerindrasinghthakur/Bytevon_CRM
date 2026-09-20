import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { myAdminRoutes } from '@/modules/admin/routes'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/shared/components/ui/Button'
import { MetricCard } from '@/shared/components/ui/MetricCard'
import { Select } from '@/shared/components/ui/Select'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { attendanceSettingsSchema, type AttendanceSettingsInput } from '../../schemas/settings'
import { useShiftFormData } from '../../hooks/settings/use-attendance-settings'
import { useAttendancePolicy } from '../../hooks/settings/use-attendance-policy'

export function AttendanceSettingsPage() {
  const navigate = useNavigate()
  const [saveError, setSaveError] = useState<string | null>(null)

  const {
    policy,
    policyLoading,
    metrics,
    shifts,
    shiftsLoading,
    savePolicy,
    isSaving,
  } = useAttendancePolicy()

  const [selectedShiftId, setSelectedShiftId] = useState<string>('')

  const { isEditing, startEditing, cancelEditing, finishEditing } = useEditMode(false)
  const { activeShift, getFormValues } = useShiftFormData(shifts, selectedShiftId, policy)

  const form = useForm<AttendanceSettingsInput>({
    resolver: zodResolver(attendanceSettingsSchema),
    defaultValues: {
      shiftStart: '09:00',
      shiftEnd: '18:00',
      graceMinutes: 15,
      earlyOutMinutes: 30,
      otMinMinutes: 60,
      allowRemoteCheckIn: true,
      correctionWindowDays: 7,
      maxCorrectionsPerMonth: null,
      reasonsMandatory: true,
      approvalSlaHours: null,
      allowMultiplePunches: true,
      requireCheckoutBeforeNewCheckin: false,
      autoCreateAttendanceDay: true,
      maxClockDriftSeconds: null,
    },
  })

  // Reset only when data sources change — never depend on `form` or unstable getFormValues
  useEffect(() => {
    if (isEditing) return
    form.reset(getFormValues())
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: form identity is unstable
  }, [isEditing, selectedShiftId, shifts, policy])

  const save = {
    isPending: isSaving,
    mutate: () => {
      setSaveError(null)
      const values = form.getValues()
      void savePolicy({ values, shiftId: selectedShiftId && activeShift ? selectedShiftId : undefined }).then(
        () => finishEditing(),
        (e: unknown) => setSaveError(getApiErrorMessage(e, 'Could not save attendance settings')),
      )
    },
  }

  if (shiftsLoading || policyLoading) {
    return (
      <div className="py-12 text-center text-on-surface-variant text-body-sm">
        Loading attendance settings…
      </div>
    )
  }

  const shiftOptions = [
    { value: '', label: 'Company policy (all shifts)' },
    ...shifts.map((s) => ({
      value: String(s.id),
      label: `${s.name} (${String(s.start_time).slice(0, 5)}–${String(s.end_time).slice(0, 5)})`,
    })),
  ]

  const formValues = form.watch()

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon="schedule"
          label="Active Shifts"
          value={String(metrics?.activeShifts ?? shifts.length)}
          hint="Configured"
        />
        <MetricCard
          icon="timer"
          label="Grace (policy)"
          value={`${metrics?.graceMinutes ?? policy?.graceMinutes ?? '—'}m`}
          hint="Late threshold"
        />
        <MetricCard
          icon="event_repeat"
          label="Correction window"
          value={`${metrics?.correctionWindowDays ?? policy?.correctionWindowDays ?? '—'}d`}
          hint="Days to correct"
        />
        <MetricCard
          icon="policy"
          label="Policy"
          value={policy?.policyId ? `#${policy.policyId}` : 'Default'}
          hint={policy?.effectiveFrom ? `From ${policy.effectiveFrom}` : 'Not versioned yet'}
        />
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[260px]">
            <Select
              value={selectedShiftId}
              onChange={(v) => {
                if (isEditing) {
                  form.reset(getFormValues())
                  cancelEditing()
                }
                setSelectedShiftId(v)
              }}
              options={shiftOptions}
              placeholder="Select shift"
              minWidthClass="min-w-[260px]"
            />
          </div>
          <p className="text-body-sm text-on-surface-variant">
            {selectedShiftId
              ? `Editing shift “${activeShift?.name ?? ''}” times + company policy`
              : 'Editing company attendance policy (shift times are read-only averages)'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            onClick={() => safeNavigate(navigate, { to: myAdminRoutes.shiftsNew })}
          >
            Create Shift
          </Button>
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  form.reset(getFormValues())
                  setSaveError(null)
                  cancelEditing()
                }}
                disabled={save.isPending}
              >
                Discard
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={save.isPending}
                onClick={() => void form.handleSubmit(() => save.mutate())()}
              >
                Save Changes
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">edit</span>}
              onClick={startEditing}
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      {saveError && (
        <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-sm text-error flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {saveError}
        </div>
      )}

      {!shifts.length && (
        <EmptyState
          title="No shifts configured"
          description="Create a shift to apply per-schedule hours. Company policy can still be edited below."
          actionLabel="Create Shift"
          onAction={() => safeNavigate(navigate, { to: myAdminRoutes.shiftsNew })}
        />
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bv-surface card-hover p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary">schedule</span>
            <h3 className="text-title-lg font-semibold text-on-surface">Working Hours</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Shift start</label>
              {isEditing && selectedShiftId ? (
                <input
                  type="time"
                  {...form.register('shiftStart')}
                  className="w-full border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white"
                />
              ) : (
                <p className="text-body-md font-medium text-on-surface">{formValues.shiftStart}</p>
              )}
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Shift end</label>
              {isEditing && selectedShiftId ? (
                <input
                  type="time"
                  {...form.register('shiftEnd')}
                  className="w-full border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white"
                />
              ) : (
                <p className="text-body-md font-medium text-on-surface">{formValues.shiftEnd}</p>
              )}
            </div>
          </div>
          {!selectedShiftId && (
            <p className="mt-4 text-body-sm text-on-surface-variant">
              Select a shift above to edit start/end times. Company policy does not store shift hours.
            </p>
          )}
          {!selectedShiftId && shifts.length > 0 && (
            <div className="mt-6 border-t border-outline-variant pt-4">
              <p className="text-label-sm text-on-surface-variant uppercase mb-2">All shifts</p>
              <ul className="space-y-1 text-body-sm">
                {shifts.map((s) => (
                  <li key={s.id} className="flex justify-between gap-2">
                    <span className="font-medium text-on-surface">{s.name}</span>
                    <span className="text-on-surface-variant">
                      {String(s.start_time).slice(0, 5)} – {String(s.end_time).slice(0, 5)} · grace{' '}
                      {s.grace_late_minutes}m
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 bv-surface card-hover p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary">gavel</span>
            <h3 className="text-title-lg font-semibold text-on-surface">Check-in rules</h3>
          </div>
          <div className="space-y-5">
            <NumberField
              label="Late grace (min)"
              editing={isEditing}
              register={form.register('graceMinutes', { valueAsNumber: true })}
              display={`${formValues.graceMinutes} min`}
            />
            <NumberField
              label="Early-out threshold (min)"
              editing={isEditing}
              register={form.register('earlyOutMinutes', { valueAsNumber: true })}
              display={`${formValues.earlyOutMinutes} min`}
              hint="UI preference — not on policy API yet"
            />
            <ToggleField
              label="Allow remote check-in"
              editing={isEditing}
              checked={!!formValues.allowRemoteCheckIn}
              onToggle={() =>
                form.setValue('allowRemoteCheckIn', !form.getValues().allowRemoteCheckIn, {
                  shouldValidate: true,
                })
              }
              hint="UI preference — geo rules live on locations"
            />
          </div>
        </div>

        <div className="col-span-12 bv-surface card-hover p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary">policy</span>
            <div>
              <h3 className="text-title-lg font-semibold text-on-surface">Attendance policy</h3>
              <p className="text-body-sm text-on-surface-variant">
                Saved via POST /attendance/policies (new effective version each save)
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <NumberField
              label="Correction window (days)"
              editing={isEditing}
              register={form.register('correctionWindowDays', { valueAsNumber: true })}
              display={`${formValues.correctionWindowDays} days`}
            />
            <NumberField
              label="Max corrections / month"
              editing={isEditing}
              register={form.register('maxCorrectionsPerMonth', {
                setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
              })}
              display={
                formValues.maxCorrectionsPerMonth == null
                  ? 'Unlimited'
                  : String(formValues.maxCorrectionsPerMonth)
              }
            />
            <NumberField
              label="Approval SLA (hours)"
              editing={isEditing}
              register={form.register('approvalSlaHours', {
                setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
              })}
              display={
                formValues.approvalSlaHours == null ? '—' : `${formValues.approvalSlaHours}h`
              }
            />
            <NumberField
              label="Max clock drift (sec)"
              editing={isEditing}
              register={form.register('maxClockDriftSeconds', {
                setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
              })}
              display={
                formValues.maxClockDriftSeconds == null
                  ? '—'
                  : `${formValues.maxClockDriftSeconds}s`
              }
            />
            <NumberField
              label="Min OT duration (min)"
              editing={isEditing}
              register={form.register('otMinMinutes', { valueAsNumber: true })}
              display={`${formValues.otMinMinutes} min`}
              hint="UI preference"
            />
            <ToggleField
              label="Reasons mandatory on correction"
              editing={isEditing}
              checked={!!formValues.reasonsMandatory}
              onToggle={() =>
                form.setValue('reasonsMandatory', !form.getValues().reasonsMandatory, {
                  shouldValidate: true,
                })
              }
            />
            <ToggleField
              label="Allow multiple punches"
              editing={isEditing}
              checked={!!formValues.allowMultiplePunches}
              onToggle={() =>
                form.setValue('allowMultiplePunches', !form.getValues().allowMultiplePunches, {
                  shouldValidate: true,
                })
              }
            />
            <ToggleField
              label="Require checkout before new check-in"
              editing={isEditing}
              checked={!!formValues.requireCheckoutBeforeNewCheckin}
              onToggle={() =>
                form.setValue(
                  'requireCheckoutBeforeNewCheckin',
                  !form.getValues().requireCheckoutBeforeNewCheckin,
                  { shouldValidate: true },
                )
              }
            />
            <ToggleField
              label="Auto-create attendance day"
              editing={isEditing}
              checked={!!formValues.autoCreateAttendanceDay}
              onToggle={() =>
                form.setValue(
                  'autoCreateAttendanceDay',
                  !form.getValues().autoCreateAttendanceDay,
                  { shouldValidate: true },
                )
              }
            />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 bv-surface card-hover p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary">account_tree</span>
            <h3 className="text-title-lg font-semibold text-on-surface">Approval workflow</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-surface-container-low rounded-lg border-l-4 border-secondary">
              <span className="text-label-md text-on-surface">Level 1: Direct Supervisor</span>
              <p className="text-body-sm text-on-surface-variant mt-1">
                Required for exceptions and manual corrections (Approvals module).
              </p>
            </div>
            <div className="p-4 bg-surface-container-low rounded-lg border-l-4 border-outline">
              <span className="text-label-md text-on-surface">Level 2: Department Head</span>
              <p className="text-body-sm text-on-surface-variant mt-1">
                Optional escalation — configured per correction request.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NumberField({
  label,
  editing,
  register,
  display,
  hint,
}: {
  label: string
  editing: boolean
  register: ReturnType<ReturnType<typeof useForm<AttendanceSettingsInput>>['register']>
  display: string
  hint?: string
}) {
  return (
    <div>
      <label className="block text-label-md text-on-surface-variant mb-2">{label}</label>
      {editing ? (
        <input
          type="number"
          {...register}
          className="w-full border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white"
        />
      ) : (
        <p className="text-body-md font-medium text-on-surface">{display}</p>
      )}
      {hint && <p className="text-[11px] text-on-surface-variant mt-1">{hint}</p>}
    </div>
  )
}

function ToggleField({
  label,
  editing,
  checked,
  onToggle,
  hint,
}: {
  label: string
  editing: boolean
  checked: boolean
  onToggle: () => void
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between p-3 bg-surface rounded-lg gap-3">
        <span className="text-label-md text-on-surface">{label}</span>
        <button
          type="button"
          disabled={!editing}
          onClick={onToggle}
          className="disabled:cursor-default cursor-pointer"
          aria-label={label}
        >
          <input type="checkbox" role="switch" checked={checked} readOnly className="pointer-events-none" />
        </button>
      </div>
      {hint && <p className="text-[11px] text-on-surface-variant">{hint}</p>}
    </div>
  )
}
