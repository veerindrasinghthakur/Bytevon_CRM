import { Select } from '@/shared/components/ui/Select'
import { DocumentUpload } from '@/shared/components/forms/DocumentUpload'
import { PAYMENT_METHOD_OPTIONS } from '../../schemas/enums'

export function RecordPaymentModal({
  employeeName,
  employeeCode,
  role,
  amount,
  paymentRef,
  setPaymentRef,
  method,
  setMethod,
  paymentDate,
  setPaymentDate,
  receiptFiles,
  setReceiptFiles,
  isPending,
  formatMoney,
  onClose,
  onConfirm,
}: {
  employeeName: string
  employeeCode: string
  role: string
  amount: number
  paymentRef: string
  setPaymentRef: (v: string) => void
  method: string
  setMethod: (v: string) => void
  paymentDate: string
  setPaymentDate: (v: string) => void
  receiptFiles: File[]
  setReceiptFiles: (f: File[]) => void
  isPending: boolean
  formatMoney: (n: number) => string
  onClose: () => void
  onConfirm: () => void
}) {


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-surface-container-lowest/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bv-surface executive-shadow w-full max-w-2xl flex flex-col overflow-hidden z-10">
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant">
          <h2 className="text-title-lg font-semibold text-on-surface">Record Payroll Payment</h2>
          <button
            type="button"
            className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-container-highest transition-colors"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-surface flex-1">
          <div className="bg-surface-container-low rounded-lg p-5 border border-outline-variant mb-6 flex flex-col md:flex-row justify-between gap-4">
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Employee</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-medium">
                  {employeeName
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="text-body-md font-medium text-on-surface">{employeeName}</p>
                  <p className="text-body-sm text-on-surface-variant">
                    {employeeCode} • {role}
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden md:block w-px bg-outline-variant h-12 self-center" />
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Payroll Month</p>
              <p className="text-body-md text-on-surface font-medium">August 2026</p>
            </div>
            <div className="hidden md:block w-px bg-outline-variant h-12 self-center" />
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Amount</p>
              <p className="text-title-lg font-semibold text-on-surface">{formatMoney(amount)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface">Payment Method</label>
              <Select
                value={method}
                onChange={setMethod}
                options={[...PAYMENT_METHOD_OPTIONS]}
                minWidthClass="min-w-0"
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface">Payment Reference</label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g. TRX-482910"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface">Payment Receipt Screenshot</label>
              <DocumentUpload
                files={receiptFiles}
                onChange={setReceiptFiles}
                accept=".jpg,.jpeg,.png,.pdf"
                maxSizeMb={10}
                hint="Upload the payment receipt (JPG/PNG/PDF, max 10 MB)"
              />
            </div>
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
            disabled={isPending}
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
            {isPending ? 'Recording…' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}
