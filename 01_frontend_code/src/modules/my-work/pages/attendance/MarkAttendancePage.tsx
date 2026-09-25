import { PageHeader } from '@/shared/components/layout/PageHeader'
import { BackButton } from '@/shared/components/layout/BackButton'
import { cn } from '@/shared/lib/cn'
import { WorkingHoursLog } from '../../components/attendance/WorkingHoursLog'
import { ManualAttendanceForm } from '../../components/attendance/ManualAttendanceForm'
import { useMarkAttendance } from '../../hooks/use-mark-attendance'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

export function MarkAttendancePage() {
  const m = useMarkAttendance()

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to={m.attendanceBackTo} label="Back to attendance" />
      <PageHeader
        title="Mark Attendance"
        description={
          m.todayInfo
            ? `Hello, ${m.todayInfo.todayLabel}. Log your daily check-in — time is recorded exactly when you punch.`
            : 'Log your daily check-in — time is recorded exactly when you punch.'
        }
        actions={
          <div className="flex items-center gap-2 text-label-md font-semibold text-secondary">
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span>{m.todayInfo?.todayLabel ?? 'Today'}</span>
          </div>
        }
      />

      {m.manualToast && (
        <div className="rounded-lg border border-secondary/30 bg-secondary-container/40 px-4 py-3 text-label-md text-on-secondary-container">
          {m.manualToast}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 bv-surface p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4">
            <div className="flex items-center gap-2 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-label-sm border border-outline-variant/40">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              Verified Location
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-48 h-48 rounded-full border-8 border-surface-container-high bg-surface-container-low flex flex-col items-center justify-center mb-6 executive-shadow">
              <span className="text-5xl font-bold text-secondary tracking-tighter">{m.timeLabel}</span>
              <span className="text-label-md text-on-surface-variant font-medium">{m.ampm}</span>
            </div>

            <div className="flex gap-4 w-full max-w-md mt-2">
              <Can action={Action.CREATE} resource="attendance" minScope="SELF">
              <button
                type="button"
                disabled={m.hasSession || m.submitting || m.status !== 'Present'}
                onClick={m.handleCheckIn}
                className={cn(
                  'flex-1 py-4 rounded-xl font-semibold flex flex-col items-center justify-center gap-1 executive-shadow',
                  m.hasSession || m.status !== 'Present'
                    ? 'bg-surface-container text-on-surface-variant opacity-50 cursor-not-allowed'
                    : 'bg-secondary text-on-secondary shadow-secondary/20 hover:opacity-95 cursor-pointer',
                )}
              >
                <span
                  className="material-symbols-outlined text-[32px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  login
                </span>
                <span>Check In</span>
              </button>
              </Can>
              <Can action={Action.CREATE} resource="attendance" minScope="SELF">
              <button
                type="button"
                disabled={!m.checkedIn || m.submitting}
                onClick={m.handleCheckOut}
                className={cn(
                  'flex-1 py-4 rounded-xl font-semibold flex flex-col items-center justify-center gap-1 border border-outline-variant transition-colors',
                  !m.checkedIn
                    ? 'text-on-surface-variant opacity-50 cursor-not-allowed'
                    : 'text-on-background hover:bg-surface-container cursor-pointer',
                )}
              >
                <span className="material-symbols-outlined text-[32px]">logout</span>
                <span>Check Out</span>
              </button>
              </Can>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-outline-variant flex justify-around">
            <div className="text-center">
              <p className="text-label-sm text-on-surface-variant uppercase">Shift Starts</p>
              <p className="text-title-lg font-bold text-on-background">09:00 AM</p>
            </div>
            <div className="text-center">
              <p className="text-label-sm text-on-surface-variant uppercase">Shift Ends</p>
              <p className="text-title-lg font-bold text-on-background">06:00 PM</p>
            </div>
            <div className="text-center">
              <p className="text-label-sm text-on-surface-variant uppercase">Net hours</p>
              <p className="text-title-lg font-bold text-on-background">
                {m.summary ? m.formatHoursCompact(m.summary.netMs) : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-6">
          <div className="bv-surface p-6">
            <h3 className="text-label-sm font-bold text-on-surface-variant uppercase mb-4">
              Current Status
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { id: 'Present' as const, icon: 'business_center', label: 'Present', enabled: true },
                  { id: 'WFH' as const, icon: 'home_work', label: 'WFH', enabled: false },
                  { id: 'Leave' as const, icon: 'person_off', label: 'Leave', enabled: false },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={!s.enabled}
                  onClick={() => s.enabled && m.setStatus(s.id)}
                  className={cn(
                    'flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all',
                    !s.enabled && 'opacity-40 cursor-not-allowed',
                    s.enabled && m.status === s.id
                      ? 'border-secondary bg-secondary-container/50 text-secondary cursor-pointer'
                      : s.enabled
                        ? 'border-transparent bg-surface-container text-on-surface-variant hover:border-outline-variant cursor-pointer'
                        : 'border-transparent bg-surface-container text-on-surface-variant',
                  )}
                  title={!s.enabled ? 'Not available in this release' : undefined}
                >
                  <span
                    className="material-symbols-outlined mb-2"
                    style={
                      m.status === s.id && s.enabled
                        ? { fontVariationSettings: "'FILL' 1" }
                        : undefined
                    }
                  >
                    {s.icon}
                  </span>
                  <span className="text-label-sm font-bold">{s.label}</span>
                </button>
              ))}
            </div>
            <p className="text-label-sm text-on-surface-variant mt-3">
              Only <strong className="text-on-surface">Present</strong> check-in is enabled for now.
            </p>
          </div>

          <div className="bv-surface p-6">
            <h3 className="text-label-sm font-bold text-on-surface-variant uppercase mb-3">Today</h3>
            <dl className="space-y-2 text-body-sm">
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Check-in</dt>
                <dd className="font-semibold text-on-background">
                  {m.session ? m.formatClockTime(m.session.checkInAt) : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Check-out</dt>
                <dd className="font-semibold text-on-background">
                  {m.session?.checkOutAt ? m.formatClockTime(m.session.checkOutAt) : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Break time</dt>
                <dd className="font-semibold text-on-background">
                  {m.summary ? m.formatHoursCompact(m.summary.breakMs) : '—'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <WorkingHoursLog
          logRows={m.logRows}
          markerPct={m.markerPct}
          totalLoggedLabel={m.totalLoggedLabel}
          breaks={m.breaks}
          nowMs={m.now.getTime()}
        />

        <ManualAttendanceForm
          manualDate={m.manualDate}
          setManualDate={m.setManualDate}
          manualReason={m.manualReason}
          setManualReason={m.setManualReason}
          manualIn={m.manualIn}
          setManualIn={m.setManualIn}
          manualOut={m.manualOut}
          setManualOut={m.setManualOut}
          manualNote={m.manualNote}
          setManualNote={m.setManualNote}
          manualApproverId={m.manualApproverId}
          setManualApproverId={m.setManualApproverId}
          approvers={m.approvers}
          onReset={m.resetManual}
          onSubmit={m.submitManual}
        />

        <div className="col-span-12 lg:col-span-4 bg-primary text-on-primary rounded-xl p-6 flex flex-col justify-between executive-shadow">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary-container">info</span>
              <h4 className="text-title-lg font-semibold">Policy Highlights</h4>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-secondary-container shrink-0">
                  check_circle
                </span>
                <p className="text-body-sm text-on-primary/90">
                  Grace period for Late marking is 15 minutes past the shift start.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-secondary-container shrink-0">
                  check_circle
                </span>
                <p className="text-body-sm text-on-primary/90">
                  Location must be within 500m of the office perimeter for verified punch-in.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-secondary-container shrink-0">
                  check_circle
                </span>
                <p className="text-body-sm text-on-primary/90">
                  Attendance corrections must be submitted within 48 hours of the missing log.
                </p>
              </li>
            </ul>
          </div>
          <div className="mt-6 p-4 bg-on-primary/5 rounded-lg border border-on-primary/10">
            <p className="text-label-sm font-bold mb-2 uppercase text-on-primary/80">Approval Status</p>
            <button
              type="button"
              className="w-full flex justify-between items-center text-left hover:opacity-90"
              onClick={m.goCorrections}
            >
              <span className="text-body-sm">Pending Corrections</span>
              <span className="px-2 py-0.5 bg-secondary text-on-secondary rounded text-[10px] font-bold">
                VIEW
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
