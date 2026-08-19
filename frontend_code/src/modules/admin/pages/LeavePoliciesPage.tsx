import { useMemo, useState } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { LeaveType } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'

const POLICIES = [
  {
    id: 1,
    name: 'Casual 2026',
    leave_type: LeaveType.CASUAL,
    annual_entitlement: 12,
    carry_forward_limit: 3,
    effective_from: '2026-01-01',
    effective_to: null as string | null,
  },
  {
    id: 2,
    name: 'Sick 2026',
    leave_type: LeaveType.SICK,
    annual_entitlement: 10,
    carry_forward_limit: 0,
    effective_from: '2026-01-01',
    effective_to: null as string | null,
  },
  {
    id: 3,
    name: 'Earned 2025',
    leave_type: LeaveType.EARNED,
    annual_entitlement: 15,
    carry_forward_limit: 5,
    effective_from: '2025-01-01',
    effective_to: '2025-12-31',
  },
]

export function LeavePoliciesPage() {
  const [showHistorical, setShowHistorical] = useState(false)
  const items = useMemo(
    () => (showHistorical ? POLICIES : POLICIES.filter((p) => p.effective_to == null)),
    [showHistorical],
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
      </div>
    </div>
  )
}
