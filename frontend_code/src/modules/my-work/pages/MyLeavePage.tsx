import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { leaveBalances, leaveRequests } from '../data/mock'
import type { LeaveStatus } from '../types'
import { HOLIDAYS_2026 } from './ApplyLeavePage'

const statusStyles: Record<LeaveStatus, string> = {
  Pending: 'bg-amber-50 text-amber-800 border border-amber-200',
  Approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Rejected: 'bg-red-50 text-red-700 border border-red-200',
  Cancelled: 'bg-surface-container text-on-surface-variant border border-outline-variant',
}

type Tab = 'balance' | 'history' | 'calendar'

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function todayISO() {
  const n = new Date()
  return toISO(n.getFullYear(), n.getMonth(), n.getDate())
}

export function MyLeavePage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('balance')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [typeFilter, setTypeFilter] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [loading] = useState(false)
  const [calMonth, setCalMonth] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })

  const filtered = useMemo(() => {
    return leaveRequests.filter((r) => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false
      if (typeFilter !== 'All' && r.type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !r.reason.toLowerCase().includes(q) &&
          !r.type.toLowerCase().includes(q) &&
          !r.id.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [statusFilter, typeFilter, search])

  const totalRemaining = leaveBalances.reduce((s, b) => s + b.remaining, 0)
  const totalUsed = leaveBalances.reduce((s, b) => s + b.used, 0)
  const totalAllocated = leaveBalances.reduce((s, b) => s + b.total, 0)
  const pendingDays = leaveRequests
    .filter((r) => r.status === 'Pending')
    .reduce((s, r) => s + r.days, 0)

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'balance', label: 'Leave Balance', icon: 'account_balance_wallet' },
    { id: 'history', label: 'Leave History', icon: 'history' },
    { id: 'calendar', label: 'Leave Calendar', icon: 'calendar_month' },
  ]

  const cy = calMonth.getFullYear()
  const cm = calMonth.getMonth()
  const firstDow = new Date(cy, cm, 1).getDay()
  const daysInMonth = new Date(cy, cm + 1, 0).getDate()
  const monthLabel = calMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
  const today = todayISO()

  const calendarCells = useMemo(() => {
    const cells: {
      day: number | null
      iso: string | null
      weekend: boolean
      holiday?: string
      leaves: typeof leaveRequests
      isToday: boolean
    }[] = []
    for (let i = 0; i < firstDow; i++) {
      cells.push({ day: null, iso: null, weekend: false, leaves: [], isToday: false })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toISO(cy, cm, d)
      const dow = new Date(cy, cm, d).getDay()
      const leaves = leaveRequests.filter(
        (r) =>
          (r.status === 'Approved' || r.status === 'Pending') &&
          iso >= r.from &&
          iso <= r.to
      )
      cells.push({
        day: d,
        iso,
        weekend: dow === 0 || dow === 6,
        holiday: HOLIDAYS_2026[iso],
        leaves,
        isToday: iso === today,
      })
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, iso: null, weekend: false, leaves: [], isToday: false })
    }
    return cells
  }, [cy, cm, firstDow, daysInMonth, today])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Leave"
        description="Check balances, apply for leave, track requests and view the team calendar."
        actions={
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined text-lg">event_available</span>}
            onClick={() => navigate({ to: '/my-work/leave/apply' })}
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
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bv-surface card-hover p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-primary/5 rounded-lg">
                  <span className="material-symbols-outlined text-primary">assignment</span>
                </div>
                <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded">
                  ANNUAL
                </span>
              </div>
              <p className="text-label-sm text-on-surface-variant mb-1">Total Entitlement</p>
              <p className="text-3xl font-bold text-on-background">
                {totalAllocated}{' '}
                <span className="text-lg font-medium text-on-surface-variant">days</span>
              </p>
            </div>
            <div className="bv-surface card-hover p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-error/5 rounded-lg">
                  <span className="material-symbols-outlined text-error">event_busy</span>
                </div>
                <span className="text-[10px] font-bold text-error bg-error/10 px-2 py-0.5 rounded">USED</span>
              </div>
              <p className="text-label-sm text-on-surface-variant mb-1">Used Leave</p>
              <p className="text-3xl font-bold text-on-background">
                {totalUsed} <span className="text-lg font-medium text-on-surface-variant">days</span>
              </p>
              <div className="mt-3 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-error rounded-full transition-all duration-1000"
                  style={{
                    width: `${totalAllocated ? (totalUsed / totalAllocated) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className="bv-surface card-hover p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-secondary/5 rounded-lg">
                  <span className="material-symbols-outlined text-secondary">pending_actions</span>
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded">
                  PENDING
                </span>
              </div>
              <p className="text-label-sm text-on-surface-variant mb-1">Pending Approval</p>
              <p className="text-3xl font-bold text-on-background">
                {pendingDays} <span className="text-lg font-medium text-on-surface-variant">days</span>
              </p>
            </div>
            <div className="bg-secondary p-5 rounded-xl border border-secondary executive-shadow text-white card-hover">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <span className="material-symbols-outlined text-white">account_balance_wallet</span>
                </div>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">AVAILABLE</span>
              </div>
              <p className="text-label-sm text-white/80 mb-1">Remaining Balance</p>
              <p className="text-3xl font-bold">
                {totalRemaining} <span className="text-lg font-medium text-white/70">days</span>
              </p>
            </div>
          </div>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-title-lg font-semibold text-on-background">Leave Type Breakdown</h2>
              <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-base">download</span>}>
                Export Report
              </Button>
            </div>
            <div className="bv-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low text-on-surface-variant text-label-sm uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Leave Type</th>
                      <th className="px-6 py-3 font-semibold">Allocated</th>
                      <th className="px-6 py-3 font-semibold">Used</th>
                      <th className="px-6 py-3 font-semibold">Remaining</th>
                      <th className="px-6 py-3 font-semibold w-1/4">Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {leaveBalances.map((lb) => {
                      const pct = lb.total ? Math.round((lb.used / lb.total) * 100) : 0
                      return (
                        <tr key={lb.type} className="zebra-row">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-secondary" />
                              <span className="text-label-md font-semibold text-on-surface">{lb.type} Leave</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-label-md text-on-surface">{lb.total} days</td>
                          <td className="px-6 py-4 text-label-md text-error">{lb.used} days</td>
                          <td className="px-6 py-4 text-label-md font-bold text-on-surface">{lb.remaining} days</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                <div className="h-full bg-secondary rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[10px] text-on-surface-variant uppercase">{pct}% utilized</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          <div className="bv-surface p-4 flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
              <label className="text-label-sm text-on-surface-variant">Search</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  search
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-colors"
                  placeholder="Request ID or reason..."
                />
              </div>
            </div>
            <div className="flex flex-col gap-1 w-40">
              <label className="text-label-sm text-on-surface-variant">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-sm outline-none focus:border-secondary transition-colors"
              >
                {['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'].map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'All Statuses' : s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 w-40">
              <label className="text-label-sm text-on-surface-variant">Leave Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-sm outline-none focus:border-secondary transition-colors"
              >
                {['All', 'Casual', 'Sick', 'Earned', 'Unpaid', 'Comp Off'].map((t) => (
                  <option key={t} value={t}>
                    {t === 'All' ? 'All Types' : t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="bv-surface p-12 flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-secondary animate-spin">progress_activity</span>
              <p className="text-body-md text-on-surface-variant">Loading leave history…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bv-surface p-12 flex flex-col items-center gap-3 text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant">event_busy</span>
              <p className="text-title-lg font-semibold text-on-background">No leave requests found</p>
              <Button variant="primary" className="mt-2" onClick={() => navigate({ to: '/my-work/leave/apply' })}>
                Apply for Leave
              </Button>
            </div>
          ) : (
            <div className="bv-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low text-on-surface-variant text-label-sm uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Type</th>
                      <th className="px-6 py-3 font-semibold">From</th>
                      <th className="px-6 py-3 font-semibold">To</th>
                      <th className="px-6 py-3 font-semibold">Days</th>
                      <th className="px-6 py-3 font-semibold">Reason</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {filtered.map((req) => (
                      <tr
                        key={req.id}
                        className="zebra-row cursor-pointer"
                        onClick={() =>
                          navigate({ to: '/my-work/leave/$leaveId', params: { leaveId: req.id } })
                        }
                      >
                        <td className="px-6 py-4 text-label-md font-semibold text-secondary">{req.type}</td>
                        <td className="px-6 py-4 text-label-md text-on-surface-variant">{req.from}</td>
                        <td className="px-6 py-4 text-label-md text-on-surface-variant">{req.to}</td>
                        <td className="px-6 py-4 text-label-md text-on-surface-variant">{req.days}</td>
                        <td className="px-6 py-4 text-label-md text-on-surface-variant max-w-[200px] truncate">
                          {req.reason}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-label-sm font-semibold ${
                              statusStyles[req.status]
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-label-md text-on-surface-variant">{req.appliedOn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'calendar' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-title-lg font-semibold text-on-background">Leave Calendar</h2>
              <p className="text-body-md text-on-surface-variant">Your availability for {monthLabel}</p>
            </div>
            <div className="flex items-center gap-1 bv-surface p-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const n = new Date()
                  setCalMonth(new Date(n.getFullYear(), n.getMonth(), 1))
                }}
              >
                Today
              </Button>
              <button
                type="button"
                className="p-1.5 rounded hover:bg-surface-container-low transition-colors"
                aria-label="Previous month"
                onClick={() => setCalMonth(new Date(cy, cm - 1, 1))}
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <span className="px-3 text-label-md font-semibold min-w-[140px] text-center">{monthLabel}</span>
              <button
                type="button"
                className="p-1.5 rounded hover:bg-surface-container-low transition-colors"
                aria-label="Next month"
                onClick={() => setCalMonth(new Date(cy, cm + 1, 1))}
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary/10 text-secondary text-label-sm font-semibold border border-secondary/20">
              <span className="w-2 h-2 rounded-full bg-secondary" /> Approved leave
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-label-sm font-semibold border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Upcoming / Pending
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-label-sm font-semibold border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-slate-400" /> Weekend
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-violet-100 text-violet-800 text-label-sm font-semibold border border-violet-200">
              <span className="w-2 h-2 rounded-full bg-violet-500" /> Holiday
            </span>
          </div>

          <div className="bv-surface overflow-hidden rounded-2xl">
            <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container-low/50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div
                  key={d}
                  className="py-3 text-center text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarCells.map((cell, i) => {
                if (cell.day === null) {
                  return (
                    <div
                      key={`e-${i}`}
                      className="min-h-[96px] p-2 border-r border-b border-outline-variant/20 bg-surface-container-low/20"
                    />
                  )
                }
                const hasPending = cell.leaves.some((l) => l.status === 'Pending')
                const hasApproved = cell.leaves.some((l) => l.status === 'Approved')
                return (
                  <div
                    key={cell.iso}
                    className={`min-h-[96px] p-2 border-r border-b border-outline-variant/20 transition-colors ${
                      cell.holiday
                        ? 'bg-violet-50'
                        : cell.weekend
                          ? 'bg-slate-50'
                          : cell.isToday
                            ? 'bg-secondary/5 ring-1 ring-inset ring-secondary/30'
                            : 'hover:bg-surface-container-low/40'
                    }`}
                  >
                    <div className="flex items-center gap-1 flex-wrap">
                      <span
                        className={`text-label-md font-semibold ${
                          cell.isToday
                            ? 'text-secondary'
                            : cell.holiday
                              ? 'text-violet-800'
                              : cell.weekend
                                ? 'text-slate-500'
                                : 'text-on-surface'
                        }`}
                      >
                        {cell.day}
                      </span>
                      {cell.isToday && (
                        <span className="text-[10px] text-secondary font-bold">Today</span>
                      )}
                      {cell.holiday && (
                        <span className="text-[10px] text-violet-700 font-medium truncate max-w-full">
                          {cell.holiday}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 space-y-1">
                      {cell.leaves.slice(0, 2).map((r) => (
                        <div
                          key={r.id}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${
                            r.status === 'Pending'
                              ? 'bg-amber-400 text-amber-950'
                              : r.type === 'Sick'
                                ? 'bg-orange-500 text-white'
                                : 'bg-secondary text-white'
                          }`}
                          title={`${r.type} · ${r.status}: ${r.reason}`}
                        >
                          {r.status === 'Pending' ? 'Pending' : r.type}
                        </div>
                      ))}
                      {(hasPending || hasApproved) && cell.leaves.length > 2 && (
                        <span className="text-[10px] text-on-surface-variant">
                          +{cell.leaves.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bv-surface p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-3xl">group</span>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant">Your pending</p>
                <p className="text-headline-md font-bold text-on-background">
                  {leaveRequests.filter((r) => r.status === 'Pending').length} request(s)
                </p>
              </div>
            </div>
            <div className="bv-surface p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <span className="material-symbols-outlined text-3xl">pending_actions</span>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant">Remaining balance</p>
                <p className="text-headline-md font-bold text-on-background">{totalRemaining} days</p>
              </div>
            </div>
            <div className="bv-surface p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                <span className="material-symbols-outlined text-3xl">celebration</span>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant">Next holiday</p>
                <p className="text-headline-md font-bold text-on-background">Aug 15, 2026</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
