import { useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { LeaveType } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'

const LEDGER = [
  {
    id: 1,
    leave_type: LeaveType.CASUAL,
    transaction_type: 'CREDIT',
    days: 12,
    reference_type: 'POLICY',
    created_at: '2026-01-01',
  },
  {
    id: 2,
    leave_type: LeaveType.CASUAL,
    transaction_type: 'DEBIT',
    days: -2,
    reference_type: 'LEAVE_REQUEST',
    created_at: '2026-03-12',
  },
  {
    id: 3,
    leave_type: LeaveType.SICK,
    transaction_type: 'CREDIT',
    days: 10,
    reference_type: 'POLICY',
    created_at: '2026-01-01',
  },
]

export function LeaveLedgerPage() {
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton
        to={employeeId ? `/workforce/employees/${employeeId}` : '/admin/leave-settings/policies'}
        label="Back"
      />
      <div>
        <h2 className="text-title-lg font-semibold text-on-background">Leave ledger</h2>
        <p className="text-body-sm text-on-surface-variant mt-0.5">
          Append-only balance history — current balance is SUM of days
        </p>
      </div>
      <div className="bv-surface overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              {['Date', 'Type', 'Txn', 'Days', 'Reference'].map((h) => (
                <th key={h} className="px-5 py-3 text-label-sm uppercase text-on-surface-variant">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LEDGER.map((r) => (
              <tr key={r.id} className="border-b border-outline-variant last:border-0 zebra-row">
                <td className="px-5 py-3 text-body-sm">{r.created_at}</td>
                <td className="px-5 py-3 text-body-sm">{r.leave_type}</td>
                <td className="px-5 py-3 text-body-sm">{r.transaction_type}</td>
                <td
                  className={cn(
                    'px-5 py-3 font-semibold',
                    r.days < 0 ? 'text-error' : 'text-secondary',
                  )}
                >
                  {r.days > 0 ? `+${r.days}` : r.days}
                </td>
                <td className="px-5 py-3 text-body-sm text-on-surface-variant">{r.reference_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
