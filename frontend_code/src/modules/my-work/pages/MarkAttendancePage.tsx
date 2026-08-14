import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { currentUser, todayAttendance } from '../data/mock'

export function MarkAttendancePage() {
  const navigate = useNavigate()
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleMark = async () => {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 500))
    setSubmitting(false)
    setDone(true)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader
        title="Mark Attendance"
        description="Record your check-in for today."
        showBack
      />

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-outline-variant">
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-2xl">fingerprint</span>
          </div>
          <div>
            <p className="text-label-md font-semibold text-on-background">{currentUser.name}</p>
            <p className="text-label-sm text-on-surface-variant">
              {currentUser.employeeId} · {currentUser.todayLabel}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-low p-4 rounded-lg">
            <p className="text-label-sm text-on-surface-variant">Shift</p>
            <p className="text-body-md font-semibold text-on-background mt-1">{currentUser.shift}</p>
          </div>
          <div className="bg-surface-container-low p-4 rounded-lg">
            <p className="text-label-sm text-on-surface-variant">Last check-in</p>
            <p className="text-body-md font-semibold text-secondary mt-1">{todayAttendance.checkIn}</p>
          </div>
        </div>

        <div>
          <label className="block text-label-md text-on-surface mb-1.5" htmlFor="note">
            Note (optional)
          </label>
          <textarea
            id="note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-electric-blue focus:border-2 resize-y"
            placeholder="Working from office / remote..."
          />
        </div>

        {done && (
          <p className="text-body-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
            Attendance marked successfully (mock).
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button variant="primary" isLoading={submitting} onClick={handleMark} disabled={done}>
            {done ? 'Marked' : 'Check in now'}
          </Button>
          <Button variant="ghost" onClick={() => navigate({ to: '/my-work/attendance' })}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
