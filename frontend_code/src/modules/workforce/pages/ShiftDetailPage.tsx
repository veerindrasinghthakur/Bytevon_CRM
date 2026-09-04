import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { DynamicRouteCrumbs } from '../components/RouteCrumbs'
import {
  canCreateWorkforceShift,
  getWorkforceShift,
  listWorkforceShiftEmployees,
} from '../api/workforce'
import { looseLinkProps, safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

export function ShiftDetailPage() {
  const { shiftId } = useParams({ strict: false }) as { shiftId: string }
  const navigate = useNavigate()
  const shift = getWorkforceShift(shiftId)
  const [query, setQuery] = useState('')
  const members = listWorkforceShiftEmployees(shift.id)
  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return members.filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q),
    )
  }, [members, query])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <BackButton to="/workforce/shifts" label="Back to shifts" />
        <DynamicRouteCrumbs className="mt-2 mb-3" lastLabel={shift.name} />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-headline-lg text-on-background">{shift.name}</h1>
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-label-sm font-bold',
                  shift.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600',
                )}
              >
                {shift.status}
              </span>
            </div>
            <p className="text-body-md text-on-surface-variant">
              {shift.code} · {shift.startTime} – {shift.endTime} · {shift.days}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canCreateWorkforceShift && (
              <Button variant="outline" leftIcon={<Icon name="edit" />}>
                Edit Shift
              </Button>
            )}
            {canCreateWorkforceShift && (
              <Button
                variant="primary"
                leftIcon={<Icon name="add" />}
                onClick={() => safeNavigate(navigate, { to: '/workforce/shifts/new' })}
              >
                Add Shift
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Start', value: shift.startTime, icon: 'login' },
          { label: 'End', value: shift.endTime, icon: 'logout' },
          { label: 'Break', value: `${shift.breakMinutes} min`, icon: 'coffee' },
          { label: 'Assigned', value: `${shift.employeeCount}`, icon: 'group' },
        ].map((m) => (
          <div key={m.label} className="bv-surface card-hover p-4">
            <div className="flex items-center gap-2 text-on-surface-variant mb-1">
              <Icon name={m.icon} className="text-secondary text-lg" />
              <span className="text-label-sm">{m.label}</span>
            </div>
            <p className="text-title-lg font-bold text-on-background">{m.value}</p>
          </div>
        ))}
      </div>

      {shift.description && (
        <div className="bv-surface p-5">
          <h2 className="text-title-md font-semibold mb-2 flex items-center gap-2">
            <Icon name="info" className="text-secondary" /> About this shift
          </h2>
          <p className="text-body-md text-on-surface-variant">{shift.description}</p>
        </div>
      )}

      <div className="bv-surface overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-title-md font-semibold flex items-center gap-2">
            <Icon name="badge" className="text-secondary" /> Employees on this shift
          </h2>
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
              placeholder="Search employees…"
            />
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase">Employee</th>
              <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase hidden md:table-cell">Department</th>
              <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase">Status</th>
              <th className="px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase text-right"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {filtered.map((m) => (
              <tr key={m.id} className="zebra-row">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                      {m.name
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-body-sm">{m.name}</p>
                      <p className="text-caption text-on-surface-variant">{m.title}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-body-sm hidden md:table-cell">{m.department}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold',
                      m.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
                    )}
                  >
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    {...looseLinkProps({
                      to: '/workforce/employees/$employeeId',
                      params: { employeeId: String(m.id) },
                      className: 'text-secondary text-label-md font-semibold hover:underline',
                    })}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-on-surface-variant">
                  No employees assigned to this shift yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
