import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { currentUser, todayAttendance } from '../data/mock'
import { cn } from '@/shared/lib/cn'

type WorkStatus = 'Present' | 'WFH' | 'Leave'

export function MarkAttendancePage() {
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())
  const [status, setStatus] = useState<WorkStatus>('Present')
  const [checkedIn, setCheckedIn] = useState(Boolean(todayAttendance.checkIn && todayAttendance.checkIn !== '—'))
  const [submitting, setSubmitting] = useState(false)
  const [manualDate, setManualDate] = useState('')
  const [manualReason, setManualReason] = useState('Client Meeting')
  const [manualIn, setManualIn] = useState('')
  const [manualOut, setManualOut] = useState('')
  const [manualNote, setManualNote] = useState('')

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const hours = now.getHours()
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = String(hours % 12 || 12).padStart(2, '0')
  const timeLabel = `${displayHours}:${minutes}`

  const handleCheckIn = async () => {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 400))
    setCheckedIn(true)
    setSubmitting(false)
  }

  const handleCheckOut = async () => {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 400))
    setCheckedIn(false)
    setSubmitting(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Mark Attendance"
        description={`Good morning, ${currentUser.firstName}. Securely log your daily check-in from your verified location.`}
        showBack
        backTo="/my-work/attendance"
        actions={
          <div className="flex items-center gap-2 text-label-md font-semibold text-secondary">
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span>{currentUser.todayLabel}</span>
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 bv-surface p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-label-sm border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Verified Location
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-8">
            <div
              className="w-48 h-48 rounded-full border-8 border-surface-container-high flex flex-col items-center justify-center mb-6 executive-shadow"
              style={{
                background: 'radial-gradient(circle at center, #f8f9ff 0%, #dce9ff 100%)',
              }}
            >
              <span className="text-5xl font-bold text-secondary tracking-tighter">{timeLabel}</span>
              <span className="text-label-md text-on-surface-variant font-medium">{ampm}</span>
            </div>

            <div className="flex gap-4 w-full max-w-md mt-2">
              <button
                type="button"
                disabled={checkedIn || submitting}
                onClick={handleCheckIn}
                className={cn(
                  'flex-1 py-4 rounded-xl font-semibold flex flex-col items-center justify-center gap-1 executive-shadow',
                  checkedIn
                    ? 'bg-surface-container text-on-surface-variant opacity-50 cursor-not-allowed'
                    : 'bg-secondary text-white shadow-secondary/20 hover:opacity-95'
                )}
              >
                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  login
                </span>
                <span>Check In</span>
              </button>
              <button
                type="button"
                disabled={!checkedIn || submitting}
                onClick={handleCheckOut}
                className={cn(
                  'flex-1 py-4 rounded-xl font-semibold flex flex-col items-center justify-center gap-1 border border-outline-variant transition-colors',
                  !checkedIn
                    ? 'text-on-surface-variant opacity-50 cursor-not-allowed'
                    : 'text-on-background hover:bg-surface-container'
                )}
              >
                <span className="material-symbols-outlined text-[32px]">logout</span>
                <span>Check Out</span>
              </button>
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
              <p className="text-label-sm text-on-surface-variant uppercase">Required Hours</p>
              <p className="text-title-lg font-bold text-on-background">08:00</p>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-6">
          <div className="bv-surface p-6">
            <h3 className="text-label-sm font-bold text-on-surface-variant uppercase mb-4">Current Status</h3>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { id: 'Present' as const, icon: 'business_center', label: 'Present' },
                  { id: 'WFH' as const, icon: 'home_work', label: 'WFH' },
                  { id: 'Leave' as const, icon: 'person_off', label: 'Leave' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatus(s.id)}
                  className={cn(
                    'flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all',
                    status === s.id
                      ? 'border-secondary bg-secondary/10 text-secondary'
                      : 'border-transparent bg-surface-container text-on-surface-variant hover:border-outline-variant'
                  )}
                >
                  <span
                    className="material-symbols-outlined mb-2"
                    style={status === s.id ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {s.icon}
                  </span>
                  <span className="text-label-sm font-bold">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bv-surface overflow-hidden h-[240px] relative">
            <div className="absolute inset-0 bg-surface-container flex items-center justify-center">
              <div className="text-center px-6">
                <span className="material-symbols-outlined text-4xl text-secondary mb-2">location_on</span>
                <p className="text-body-sm font-medium text-on-background">Tech City Headquarters, Tower 1</p>
                <p className="text-[10px] text-on-surface-variant uppercase mt-1">
                  Latitude: 51.5074 · Longitude: 0.1278
                </p>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
              <div className="flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                <span className="text-body-sm">Verified office perimeter</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 bv-surface p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-title-lg font-semibold text-on-background">Working Hours Log</h3>
            <div className="text-label-md text-on-surface-variant">
              Total:{' '}
              <span className="font-bold text-secondary">{todayAttendance.totalHours} logged today</span>
            </div>
          </div>
          <div className="relative h-16 bg-surface-container rounded-full overflow-hidden mb-6 flex">
            <div className="w-[37%] bg-transparent border-r-2 border-white flex items-center justify-center text-[10px] text-on-surface-variant/40">
              00:00 – 09:00
            </div>
            <div className="w-[5%] bg-secondary/30 border-r-2 border-white flex items-center justify-center text-[10px] font-bold text-secondary">
              In
            </div>
            <div className="flex-1 bg-surface-container-highest/20" />
            <div className="absolute top-0 bottom-0 left-[42%] w-1 bg-secondary executive-shadow z-10">
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-secondary rounded-full" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-label-sm text-on-surface-variant border-b border-outline-variant uppercase">
                <tr>
                  <th className="pb-3 font-bold">Activity</th>
                  <th className="pb-3 font-bold">Time</th>
                  <th className="pb-3 font-bold">Duration</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold">Location</th>
                </tr>
              </thead>
              <tbody className="text-body-sm divide-y divide-outline-variant/30">
                <tr className="zebra-row">
                  <td className="py-4 font-medium">Punch In</td>
                  <td className="py-4">{todayAttendance.checkIn || '—'}</td>
                  <td className="py-4">—</td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold uppercase">
                      On Time
                    </span>
                  </td>
                  <td className="py-4 text-on-surface-variant">Office WiFi (HQ-GUEST)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bv-surface p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-secondary">edit_note</span>
            <h3 className="text-title-lg font-semibold text-on-background">Manual Attendance Entry</h3>
          </div>
          <p className="text-body-sm text-on-surface-variant mb-6">
            Permitted for off-site client meetings or connectivity issues. Requires HR approval.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-label-md font-medium text-on-surface-variant">Date</label>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-secondary outline-none transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-label-md font-medium text-on-surface-variant">Reason Category</label>
              <select
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-secondary outline-none transition-colors"
              >
                <option>Client Meeting</option>
                <option>System Issue</option>
                <option>Forgot to Log</option>
                <option>Travel</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-label-md font-medium text-on-surface-variant">Time In</label>
              <input
                type="time"
                value={manualIn}
                onChange={(e) => setManualIn(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-secondary outline-none transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-label-md font-medium text-on-surface-variant">Time Out</label>
              <input
                type="time"
                value={manualOut}
                onChange={(e) => setManualOut(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-secondary outline-none transition-colors"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="block text-label-md font-medium text-on-surface-variant">Justification Note</label>
              <textarea
                rows={3}
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                placeholder="Briefly describe the reason for manual entry…"
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-secondary outline-none resize-none transition-colors"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <Button variant="outline" onClick={() => navigate({ to: '/my-work/attendance' })}>
                Discard
              </Button>
              <Button variant="primary">Request Approval</Button>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-deep-navy text-white rounded-xl p-6 flex flex-col justify-between executive-shadow">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary">info</span>
              <h4 className="text-title-lg font-semibold">Policy Highlights</h4>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-secondary shrink-0">check_circle</span>
                <p className="text-body-sm opacity-90">
                  Grace period for Late marking is 15 minutes past the shift start.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-secondary shrink-0">check_circle</span>
                <p className="text-body-sm opacity-90">
                  Location must be within 500m of the office perimeter for verified punch-in.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-secondary shrink-0">check_circle</span>
                <p className="text-body-sm opacity-90">
                  Attendance corrections must be submitted within 48 hours of the missing log.
                </p>
              </li>
            </ul>
          </div>
          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-label-sm font-bold mb-2 uppercase opacity-80">Approval Status</p>
            <div className="flex justify-between items-center">
              <span className="text-body-sm">Pending Corrections</span>
              <span className="px-2 py-0.5 bg-secondary text-white rounded text-[10px] font-bold">
                2 REQUIRES ACTION
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
