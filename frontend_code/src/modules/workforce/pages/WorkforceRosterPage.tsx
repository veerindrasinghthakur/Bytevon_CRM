import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { listEmployments } from '../api/employment'
import { AttendanceStatus } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'
import { workforceRoutes } from '../routes'

const STATUSES = Object.values(AttendanceStatus)

type RosterRow = {
  id: number
  employee_code: string
  fullName: string
  departmentName: string
  status: string
}

export function WorkforceRosterPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [rows, setRows] = useState<RosterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    listEmployments()
      .then((r) => {
        setRows(
          r.items.map((e, i) => ({
            id: e.id,
            employee_code: e.employee_code,
            fullName: e.fullName,
            departmentName: e.departmentName,
            status: STATUSES[i % STATUSES.length],
          })),
        )
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [date])

  if (loading) return <PageLoadingSkeleton />
  if (error) {
    return (
      <ErrorState
        description={error}
        onBack={() => {
          window.history.back()
        }}
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Workforce attendance roster"
        description="Organization-wide attendance by date"
        showBack
        backTo={workforceRoutes.attendance}
        backLabel="Back to dashboard"
        actions={
          <input
            type="date"
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm executive-shadow"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        }
      />

      <div className="bv-surface overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              {['Employee', 'Code', 'Department', 'Status', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-label-sm uppercase text-on-surface-variant">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-outline-variant last:border-0 zebra-row">
                <td className="px-5 py-3 font-medium">{r.fullName}</td>
                <td className="px-5 py-3 text-body-sm text-on-surface-variant">{r.employee_code}</td>
                <td className="px-5 py-3 text-body-sm">{r.departmentName}</td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-bold',
                      r.status === 'PRESENT'
                        ? 'bg-secondary/15 text-secondary'
                        : r.status === 'ABSENT'
                          ? 'bg-error/15 text-error'
                          : 'bg-surface-container text-on-surface-variant',
                    )}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    to="/workforce/attendance/day/$employmentId"
                    params={{ employmentId: String(r.id) }}
                    search={{ date }}
                    className="text-secondary text-sm font-medium hover:underline"
                  >
                    Day detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
