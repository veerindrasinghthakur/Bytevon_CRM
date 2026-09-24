import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { payrollRoutes } from '../../routes'
import { getRunPayrollPreview } from '../../api/run'
import { cn } from '@/shared/lib/cn'

const STEPS = [
  { id: 1, label: 'Validating Attendance & Time Off', status: 'done' as const },
  { id: 2, label: 'Calculating Gross Salary', status: 'active' as const },
  { id: 3, label: 'Applying Deductions & Taxes', status: 'pending' as const },
]

export function GeneratingPayrollPage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { year?: number | string; month?: number | string }
  const now = new Date()
  const year = Number(search.year ?? now.getFullYear())
  const month = Number(search.month ?? now.getMonth() + 1)

  // Poll the real run preview until calculated rows for the period appear.
  const previewQuery = useQuery({
    queryKey: ['payroll', 'run', 'verify', year, month],
    queryFn: () => getRunPayrollPreview({ year, month }),
    refetchInterval: (query) =>
      query.state.data?.employees?.length ? false : 2000,
    retry: 1,
  })
  const employeeCount = previewQuery.data?.employees.length
  const done = (employeeCount ?? 0) > 0
  const failed = previewQuery.isError

  const [pct, setPct] = useState(12)
  useEffect(() => {
    if (done) {
      setPct(100)
      const t = setTimeout(
        () => safeNavigate(navigate, { to: payrollRoutes.monthly }),
        1200,
      )
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setPct(68), 400)
    return () => clearTimeout(t)
  }, [done, navigate])

  const circumference = 2 * Math.PI * 54
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="min-h-[70vh] flex items-center justify-center relative animate-fade-in">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(var(--color-on-background) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="w-full max-w-2xl bv-surface executive-shadow p-8 flex flex-col items-center text-center relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary w-full">
          <div
            className="h-full bg-secondary-container transition-all duration-1000 ease-in-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
          <svg
            className="absolute inset-0 w-full h-full animate-spin opacity-20"
            style={{ animationDuration: '8s' }}
            viewBox="0 0 100 100"
          >
            <circle
              className="text-on-background"
              cx="50"
              cy="50"
              fill="none"
              r="46"
              stroke="currentColor"
              strokeDasharray="4 8"
              strokeWidth="1"
            />
          </svg>
          <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
            <circle
              className="text-surface-container-high"
              cx="60"
              cy="60"
              fill="none"
              r="54"
              stroke="currentColor"
              strokeWidth="8"
            />
            <circle
              className="text-primary transition-[stroke-dashoffset] duration-500"
              cx="60"
              cy="60"
              fill="none"
              r="54"
              stroke="currentColor"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              strokeWidth="8"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-display-lg font-bold text-on-background">
              {pct}
              <span className="text-title-lg">%</span>
            </span>
          </div>
        </div>

        <h2 className="text-headline-lg font-semibold text-on-background mb-2 animate-pulse">
          {failed
            ? 'Payroll run needs attention'
            : done
              ? 'Payroll generated'
              : 'Generating Monthly Payroll...'}
        </h2>
        <p className="text-body-md text-on-surface-variant max-w-md mx-auto mb-8">
          {failed ? (
            <>Could not verify generated rows for this period. You can retry from Run Payroll.</>
          ) : (
            <>
              Calculating earnings, deductions, and tax contributions for{' '}
              <span className="font-bold text-on-surface">
                {employeeCount ?? '…'}
              </span>{' '}
              employees.
            </>
          )}
        </p>

        <div className="w-full bg-surface-container-low rounded-lg p-6 border border-outline-variant/50 text-left">
          <h3 className="text-title-lg font-semibold text-on-surface mb-4 border-b border-outline-variant/30 pb-2">
            Processing Stages
          </h3>
          <ul className="space-y-4">
            {STEPS.map((s) => (
              <li
                key={s.id}
                className={cn(
                  'relative flex items-center justify-between gap-4',
                  s.status === 'pending' && 'opacity-50',
                )}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center z-10',
                      s.status === 'done' &&
                        'bg-surface-container-lowest border-2 border-secondary text-secondary shadow-sm',
                      s.status === 'active' &&
                        'bg-primary text-on-primary shadow-md ring-4 ring-secondary-fixed-dim/30',
                      s.status === 'pending' &&
                        'bg-surface-container-highest border-2 border-outline-variant text-outline',
                    )}
                  >
                    <span
                      className={cn(
                        'material-symbols-outlined text-[18px]',
                        s.status === 'active' && 'animate-spin',
                      )}
                      style={s.status === 'done' ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {s.status === 'done' ? 'check' : s.status === 'active' ? 'sync' : 'pending'}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-label-md',
                      s.status === 'active' ? 'text-on-background font-bold' : 'text-on-surface',
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                <span
                  className={cn(
                    'text-label-sm',
                    s.status === 'done' && 'text-secondary bg-secondary-fixed-dim/30 px-2 py-1 rounded',
                    s.status === 'active' && 'text-primary',
                    s.status === 'pending' && 'text-outline',
                  )}
                >
                  {s.status === 'done' ? 'Complete' : s.status === 'active' ? 'Processing...' : 'Pending'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="mt-8 text-label-md text-error hover:bg-error-container/50 px-4 py-2 rounded transition-colors"
          onClick={() => safeNavigate(navigate, { to: payrollRoutes.root })}
        >
          Cancel Process
        </button>
      </div>
    </div>
  )
}
