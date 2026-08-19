import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { canCreateShift } from '../data/shiftsMock'
import { RouteCrumbs } from '../components/RouteCrumbs'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

export function ShiftCreatePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('18:00')
  const [breakMin, setBreakMin] = useState(60)
  const [days, setDays] = useState('Mon–Fri')

  if (!canCreateShift) {
    return (
      <div className="space-y-4 max-w-lg animate-fade-in">
        <BackButton to="/workforce/shifts" label="Back to shifts" />
        <div className="bv-surface p-8 text-center">
          <Icon name="lock" className="text-4xl text-on-surface-variant mb-3" />
          <h1 className="text-headline-md font-semibold">Permission required</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            You do not have permission to create shifts.
          </p>
          <Button className="mt-4" variant="primary" onClick={() => navigate({ to: '/workforce/shifts' })}>
            Back to shifts
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <BackButton to="/workforce/shifts" label="Back to shifts" />
        <RouteCrumbs
          className="mt-2 mb-2"
          items={[
            { label: 'Workforce', to: '/workforce/employees' },
            { label: 'Shifts', to: '/workforce/shifts' },
            { label: 'New shift' },
          ]}
        />
        <h1 className="text-headline-xl font-bold">Add Shift</h1>
        <p className="text-body-md text-on-surface-variant">Define schedule windows for workforce assignment.</p>
      </div>

      <form
        className="bv-surface p-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          navigate({ to: '/workforce/shifts' })
        }}
      >
        <label className="block text-body-sm">
          <span className="text-on-surface-variant">Shift name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition-colors"
            placeholder="General Day"
          />
        </label>
        <label className="block text-body-sm">
          <span className="text-on-surface-variant">Code</span>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition-colors"
            placeholder="SHIFT-DAY"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-body-sm">
            <span className="text-on-surface-variant">Start</span>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 focus:ring-2 focus:ring-secondary/30 outline-none transition-colors" />
          </label>
          <label className="block text-body-sm">
            <span className="text-on-surface-variant">End</span>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 focus:ring-2 focus:ring-secondary/30 outline-none transition-colors" />
          </label>
        </div>
        <label className="block text-body-sm">
          <span className="text-on-surface-variant">Break (minutes)</span>
          <input
            type="number"
            min={0}
            value={breakMin}
            onChange={(e) => setBreakMin(Number(e.target.value))}
            className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
          />
        </label>
        <label className="block text-body-sm">
          <span className="text-on-surface-variant">Working days</span>
          <input value={days} onChange={(e) => setDays(e.target.value)} className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 focus:ring-2 focus:ring-secondary/30 outline-none transition-colors" />
        </label>
        <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/workforce/shifts' })}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create shift
          </Button>
        </div>
      </form>
    </div>
  )
}
