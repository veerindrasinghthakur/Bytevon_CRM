import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'

const MANUAL_REASONS = [
  { value: 'Client Meeting', label: 'Client Meeting' },
  { value: 'System Issue', label: 'System Issue' },
  { value: 'Forgot to Log', label: 'Forgot to Log' },
  { value: 'Travel', label: 'Travel' },
] as const

export function ManualAttendanceForm({
  manualDate,
  setManualDate,
  manualReason,
  setManualReason,
  manualIn,
  setManualIn,
  manualOut,
  setManualOut,
  manualNote,
  setManualNote,
  onReset,
  onSubmit,
}: {
  manualDate: string
  setManualDate: (v: string) => void
  manualReason: string
  setManualReason: (v: string) => void
  manualIn: string
  setManualIn: (v: string) => void
  manualOut: string
  setManualOut: (v: string) => void
  manualNote: string
  setManualNote: (v: string) => void
  onReset: () => void
  onSubmit: () => void
}) {
  const navigate = useNavigate()

  return (
    <div className="col-span-12 lg:col-span-8 bv-surface p-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-secondary">edit_note</span>
        <h3 className="text-title-lg font-semibold text-on-background">Manual Attendance Entry</h3>
      </div>
      <p className="text-body-sm text-on-surface-variant mb-6">
        Permitted for off-site client meetings or connectivity issues. Requires HR approval (same flow
        as attendance corrections).
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-label-md font-medium text-on-surface-variant" htmlFor="manual-date">
            Date
          </label>
          <input
            id="manual-date"
            type="date"
            value={manualDate}
            onChange={(e) => setManualDate(e.target.value)}
            className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-secondary outline-none transition-colors"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-label-md font-medium text-on-surface-variant">Reason Category</label>
          <Select value={manualReason} onChange={setManualReason} options={[...MANUAL_REASONS]} />
        </div>
        <div className="space-y-1">
          <label className="block text-label-md font-medium text-on-surface-variant" htmlFor="manual-in">
            Time In
          </label>
          <input
            id="manual-in"
            type="time"
            value={manualIn}
            onChange={(e) => setManualIn(e.target.value)}
            className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-secondary outline-none transition-colors"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-label-md font-medium text-on-surface-variant" htmlFor="manual-out">
            Time Out
          </label>
          <input
            id="manual-out"
            type="time"
            value={manualOut}
            onChange={(e) => setManualOut(e.target.value)}
            className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-secondary outline-none transition-colors"
          />
        </div>
        <div className="md:col-span-2 space-y-1">
          <label className="block text-label-md font-medium text-on-surface-variant" htmlFor="manual-note">
            Justification Note
          </label>
          <textarea
            id="manual-note"
            rows={3}
            value={manualNote}
            onChange={(e) => setManualNote(e.target.value)}
            placeholder="Briefly describe the reason for manual entry…"
            className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-secondary outline-none resize-none transition-colors"
          />
        </div>
        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
          <Button
            variant="outline"
            onClick={() => {
              onReset()
              navigate({ to: '/my-work/attendance' })
            }}
          >
            Discard
          </Button>
          <Button variant="primary" onClick={onSubmit}>
            Request Approval
          </Button>
        </div>
      </div>
    </div>
  )
}
