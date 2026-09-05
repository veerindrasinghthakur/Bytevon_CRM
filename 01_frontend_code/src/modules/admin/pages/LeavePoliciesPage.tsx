import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { cn } from '@/shared/lib/cn'
import { queryKeys } from '@/shared/lib/query-keys'
import { listLeavePolicies } from '../api/leave'

export function LeavePoliciesPage() {
  const [showHistorical, setShowHistorical] = useState(false)
  const { data: policies = [], isLoading } = useQuery({
    queryKey: queryKeys.admin.leave.policies(),
    queryFn: () => listLeavePolicies(),
  })

  const items = useMemo(
    () => (showHistorical ? policies : policies.filter((p) => p.effective_to == null)),
    [showHistorical, policies],
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Leave policies"
        description="Versioned leave configuration (effective dating)"
        actions={
          <label className="flex items-center gap-2 text-body-sm text-on-surface-variant cursor-pointer">
            <input
              type="checkbox"
              checked={showHistorical}
              onChange={(e) => setShowHistorical(e.target.checked)}
            />
            Show historical versions
          </label>
        }
      />
      <div className="bv-surface overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-on-surface-variant text-body-sm">Loading policies…</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                {['Name', 'Type', 'Entitlement', 'Carry forward', 'Effective'].map((h) => (
                  <th key={h} className="px-5 py-3 text-label-sm uppercase text-on-surface-variant">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-outline-variant last:border-0 zebra-row">
                  <td className="px-5 py-3 font-medium">{p.name}</td>
                  <td className="px-5 py-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary/15 text-secondary">
                      {p.leave_type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-body-sm">{p.annual_entitlement} days</td>
                  <td className="px-5 py-3 text-body-sm">{p.carry_forward_limit ?? '—'}</td>
                  <td className="px-5 py-3 text-body-sm">
                    <span className={cn(p.effective_to ? 'text-on-surface-variant' : 'text-on-background')}>
                      {p.effective_from} → {p.effective_to ?? 'present'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
