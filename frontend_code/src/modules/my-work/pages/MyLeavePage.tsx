import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { useMyLeave } from '../hooks/use-my-leave'
import { LeaveBalanceTab } from '../components/leave/LeaveBalanceTab'
import { LeaveHistoryTab } from '../components/leave/LeaveHistoryTab'
import { LeaveCalendarTab } from '../components/leave/LeaveCalendarTab'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { myWorkRoutes } from '../routes'

type Tab = 'balance' | 'history' | 'calendar'

export function MyLeavePage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('balance')
  const [calMonth, setCalMonth] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })

  const {
    requests,
    balances,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    isLoading,
  } = useMyLeave()

  const totalRemaining = balances.reduce((s, b) => s + b.remaining, 0)
  const totalUsed = balances.reduce((s, b) => s + b.used, 0)
  const totalAllocated = balances.reduce((s, b) => s + b.total, 0)
  const pendingDays = requests
    .filter((r) => r.status === 'Pending')
    .reduce((s, r) => s + r.days, 0)

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'balance', label: 'Leave Balance', icon: 'account_balance_wallet' },
    { id: 'history', label: 'Leave History', icon: 'history' },
    { id: 'calendar', label: 'Leave Calendar', icon: 'calendar_month' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Leave"
        description="Check balances, apply for leave, track requests and view the team calendar."
        actions={
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined text-lg">event_available</span>}
            onClick={() => safeNavigate(navigate, { to: myWorkRoutes.leaveApply })}
          >
            Apply for Leave
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 border-b border-outline-variant pb-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-label-md font-medium rounded-t-lg border-b-2 transition-all ${
              tab === t.id
                ? 'border-secondary text-secondary bg-surface-container-high/60'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <span
              className="material-symbols-outlined text-lg"
              style={tab === t.id ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'balance' && (
        <LeaveBalanceTab
          totalAllocated={totalAllocated}
          totalUsed={totalUsed}
          totalRemaining={totalRemaining}
          pendingDays={pendingDays}
          balances={balances}
        />
      )}
      {tab === 'history' && (
        <LeaveHistoryTab
          filtered={requests}
          loading={isLoading}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
        />
      )}
      {tab === 'calendar' && (
        <LeaveCalendarTab
          calMonth={calMonth}
          setCalMonth={setCalMonth}
          totalRemaining={totalRemaining}
        />
      )}
    </div>
  )
}
