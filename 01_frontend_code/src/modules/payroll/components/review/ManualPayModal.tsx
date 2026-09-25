import { Select } from '@/shared/components/ui/Select'
import { DocumentUpload } from '@/shared/components/forms/DocumentUpload'
import { PAYMENT_METHOD_OPTIONS } from '../../schemas/enums'

export interface ManualPayForm {
  amount: string
  reason: string
  method: string
  paymentRef: string
  paymentDate: string
  receiptFiles: File[]
}

export function ManualPayModal({
  employeeName,
  employeeCode,
  role,
  systemAmount,
  form,
  setForm,
  isPending,
  formatMoney,
  onClose,
  onConfirm,
}: {
  employeeName: string
  employeeCode: string
  role: string
  systemAmount: number
  form: ManualPayForm
  setForm: (f: ManualPayForm) => void
  isPending: boolean
  formatMoney: (n: number) => string
  onClose: () => void
  onConfirm: () => void
}) {
  const set = (patch: Partial<ManualPayForm>) => setForm({ ...form, ...patch })
  const amountNum = Number(form.amount)
  const valid =
    form.amount.trim() !== '' &&
    Number.isFinite(amountNum) &&
    amountNum > 0 &&
    form.reason.trim().length >= 3
  const variance = Number.isFinite(amountNum) ? amountNum - systemAmount : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-surface-container-lowest/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bv-surface executive-shadow w-full max-w-2xl flex flex-col overflow-hidden z-10">
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant">
          <div>
            <h2 className="text-title-lg font-semibold text-on-surface">Manual Payment</h2>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Hand-entered amount with reason — tagged <span className="font-bold">Manual</span>, salary structure unchanged.
            </p>
          </div>
          <button
            type="button"
            className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-container-highest transition-colors"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-surface flex-1 space-y-6">
          <div className="bg-surface-container-low rounded-lg p-5 border border-outline-variant flex flex-col md:flex-row justify-between gap-4">
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Employee</p>
              <p className="text-body-md font-medium text-on-surface">{employeeName}</p>
              <p className="text-body-sm text-on-surface-variant">{employeeCode} • {role}</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">System Calculated</p>
              <p className="text-title-lg font-semibold text-on-surface">{formatMoney(systemAmount)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface">Manual Amount *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => set({ amount: e.target.value })}
                placeholder={String(systemAmount)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
              />
              {Number.isFinite(amountNum) && form.amount.trim() !== '' && (
                <p className="text-caption text-on-surface-variant">
                  Variance vs system: {variance >= 0 ? '+' : ''}{formatMoney(variance)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface">Payment Method</label>
              <Select
                value={form.method}
                onChange={(v) => set({ method: v })}
                options={[...PAYMENT_METHOD_OPTIONS]}
                minWidthClass="min-w-0"
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface">Payment Reference</label>
              <input
                type="text"
                value={form.paymentRef}
                onChange={(e) => set({ paymentRef: e.target.value })}
                placeholder="e.g. TRX-482910"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface">Payment Date</label>
              <input
                type="date"
                value={form.paymentDate}
                onChange={(e) => set({ paymentDate: e.target.value })}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-md text-on-surface">Reason *</label>
            <textarea
              value={form.reason}
              onChange={(e) => set({ reason: e.target.value })}
              rows={3}
              placeholder="Why is this paid manually instead of the system amount?"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm resize-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-md text-on-surface">Payment Receipt Screenshot</label>
            <DocumentUpload
              files={form.receiptFiles}
              onChange={(f) => set({ receiptFiles: f })}
              accept=".jpg,.jpeg,.png,.pdf"
              maxSizeMb={10}
              hint="Upload the payment receipt (JPG/PNG/PDF, max 10 MB)"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant bg-surface-bright flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface text-label-md hover:bg-surface-container-high transition-colors"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
            onClick={onConfirm}
            disabled={isPending || !valid}
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
            {isPending ? 'Paying…' : 'Pay Manually'}
          </button>
        </div>
      </div>
    </div>
  )
}
