import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/shared/lib/cn'
import { listLeaveLedger } from '../../api/leave'
import { queryKeys } from '@/shared/lib/query-keys'

export function LeaveLedgerPage() {
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }

  const { data: ledger = [], isLoading } = useQuery({
    queryKey: queryKeys.admin.leave.ledger({ employeeId: employeeId ?? 'all' }),
    queryFn: () => listLeaveLedger(employeeId),
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-title-lg font-semibold text-on-background">Leave ledger</h2>
        <p className="text-body-sm text-on-surface-variant mt-0.5">
          Append-only balance history — current balance is SUM of days
        </p>
      </div>
      <div className="bv-surface overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-on-surface-variant text-body-sm">Loading ledger…</div>
        ) : (
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
              {ledger.map((r) => (
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
        )}
      </div>
    </div>
  )
}
